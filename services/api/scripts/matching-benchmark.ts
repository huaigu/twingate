#!/usr/bin/env node
/**
 * Synthetic, pre-labelled engineering benchmark. Never accesses production data.
 * --validate uses a local lexical model. --live makes <=20 sequential hosted
 * requests through the real application discovery route and production adapter.
 * No .env loader, provider retries, messages, wallet RPCs, or chain transactions.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { z } from 'zod'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createApp } from '../src/app.js'
import { configuredHostedAgent } from '../src/agent-provider.js'
import type { AgentModel, AgentProfile, AgentRun, AgentEvidenceField } from '../src/agent-types.js'

const FIXTURE_URL = new URL('../fixtures/matching-benchmark.json', import.meta.url)
const ORIGIN = 'http://localhost:3004'
const MAX_CALLS = 20
const handle = z.string().regex(/^[a-z0-9_-]{3,32}$/)
const profileSchema = z.object({
  handle, displayName: z.string().min(1).max(80), building: z.string().min(1).max(600),
  canOffer: z.string().min(1).max(600), wantsToMeet: z.string().min(1).max(600),
  interests: z.array(z.string().min(1).max(80)).max(12),
}).strict()
const fixtureSchema = z.object({
  version: z.literal(1), label: z.string(), sourceRevision: z.string().regex(/^[a-f0-9]{40}$/), annotationPolicy: z.string(),
  baseline: z.object({
    name: z.string(), k1: z.number().positive(), b: z.number().min(0).max(1),
    minimumDistinctMatches: z.number().int().min(1), minimumQueryCoverage: z.number().min(0).max(1),
    minimumRelativeScore: z.number().min(0).max(1), maximumRecommendations: z.literal(3), description: z.string(),
  }).strict(),
  profiles: z.array(profileSchema).min(2).max(40),
  cases: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/), category: z.string(), goal: z.string().min(10).max(1200),
    candidateHandles: z.array(handle).min(1).max(40),
    expected: z.object({
      acceptableHandles: z.array(handle), unacceptableHandles: z.array(handle), mustAbstain: z.boolean(), rationale: z.string().min(20),
    }).strict(),
  }).strict()).length(MAX_CALLS),
}).strict()
type Fixture = z.infer<typeof fixtureSchema>
type Scenario = Fixture['cases'][number]
type CandidateInput = { goal: string; clarificationAnswers: string[]; senderProfile: AgentProfile | null; candidates: AgentProfile[] }
type Evidence = { field: AgentEvidenceField; quote: string }
type Proposal = { handle: string; reason: string; caveat: string; evidence: Evidence[] }
type Observation = {
  status: 'ok' | 'failed'; handles: string[]; nextQuestion: string | null; latencyMs: number;
  proposals: Proposal[]; errorCode?: string;
}
type QuoteCheck = { handle: string; field: string; quote: string; exact: boolean }
type CaseResult = {
  id: string; category: string; goal: string; expected: Scenario['expected']; candidateHandles: string[];
  baseline: Observation & { scores: Array<{ handle: string; score: number; coverage: number; matchedTerms: number }> };
  hosted: Observation | null;
  hostedAudit: null | { rawReceived: boolean; rawFormatValid: boolean; rawHandles: string[]; rawNextQuestion: string | null; rawProposals: Proposal[]; quotes: QuoteCheck[]; specificClaimFlags: Array<{ handle: string; phrase: string }>; inputTokens: number; outputTokens: number };
}

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const round = (value: number) => Math.round(value * 1000) / 1000
const stopwords = new Set(('a an and are as at be been but by can could do does for from had has have help i if in into is it its me my need no not of on or our please someone that the their them they this to want we what when where which who with would you your').split(' '))

/** No labels, synonyms, translation, goal-specific weights, or learned parameters. */
function tokens(text: string): string[] {
  return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((word) => word.length >= 3 && !stopwords.has(word))
    .map((word) => /^[a-z]+$/.test(word) && word.length > 5
      ? word.replace(/ies$/, 'y').replace(/ing$/, '').replace(/ed$/, '').replace(/s$/, '') : word)
}

export function keywordBaseline(goal: string, candidates: AgentProfile[], config: Fixture['baseline']) {
  const started = performance.now()
  const query = [...new Set(tokens(goal))]
  const documents = candidates.map((candidate) => tokens([candidate.building, candidate.canOffer, candidate.wantsToMeet, candidate.interests.join(' ')].join(' ')))
  const averageLength = documents.reduce((sum, document) => sum + document.length, 0) / Math.max(1, documents.length)
  const documentFrequency = new Map(query.map((term) => [term, documents.filter((document) => document.includes(term)).length]))
  const scores = candidates.map((candidate, index) => {
    const document = documents[index]!
    let score = 0
    let matchedTerms = 0
    for (const term of query) {
      const frequency = document.filter((word) => word === term).length
      if (!frequency) continue
      matchedTerms++
      const df = documentFrequency.get(term) ?? 0
      const idf = Math.log(1 + (candidates.length - df + 0.5) / (df + 0.5))
      score += idf * (frequency * (config.k1 + 1)) / (frequency + config.k1 * (1 - config.b + config.b * document.length / Math.max(1, averageLength)))
    }
    return { handle: candidate.handle, score, coverage: matchedTerms / Math.max(1, query.length), matchedTerms }
  }).sort((a, b) => b.score - a.score || a.handle.localeCompare(b.handle))
  const bestScore = scores[0]?.score ?? 0
  const selected = scores.filter((item) => item.matchedTerms >= config.minimumDistinctMatches &&
    item.coverage >= config.minimumQueryCoverage && item.score > 0 && item.score >= bestScore * config.minimumRelativeScore)
    .slice(0, config.maximumRecommendations)
  const proposals: Proposal[] = selected.map((item) => {
    const candidate = candidates.find((person) => person.handle === item.handle)!
    return { handle: item.handle, reason: 'Lexical overlap with public profile text; semantic fit and hard constraints are not verified.', caveat: 'A keyword score is not proof of expertise or availability.', evidence: [{ field: 'canOffer', quote: candidate.canOffer }] }
  })
  return { status: 'ok' as const, handles: selected.map((item) => item.handle), nextQuestion: null, latencyMs: round(performance.now() - started), proposals,
    scores: scores.map((item) => ({ ...item, score: round(item.score), coverage: round(item.coverage) })) }
}

function validateFixture(value: unknown): Fixture {
  const fixture = fixtureSchema.parse(value)
  const ids = fixture.cases.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length, 'Duplicate case IDs')
  const handles = new Set(fixture.profiles.map((profile) => profile.handle))
  assert.equal(handles.size, fixture.profiles.length, 'Duplicate profile handles')
  for (const scenario of fixture.cases) {
    assert.equal(new Set(scenario.candidateHandles).size, scenario.candidateHandles.length, 'Duplicate candidate handles')
    assert(scenario.candidateHandles.every((candidate) => handles.has(candidate)), 'Unknown candidate handle')
    const labelled = [...scenario.expected.acceptableHandles, ...scenario.expected.unacceptableHandles]
    assert.equal(new Set(labelled).size, labelled.length, 'Overlapping or duplicate expected labels')
    assert.deepEqual([...labelled].sort(), [...scenario.candidateHandles].sort(), 'Expected labels must partition the exact candidate pool')
    assert.equal(scenario.expected.mustAbstain, scenario.expected.acceptableHandles.length === 0, 'Inconsistent abstention label')
  }
  assert(fixture.cases.some((item) => item.expected.mustAbstain), 'No abstention cases')
  assert(fixture.cases.some((item) => item.expected.acceptableHandles.length > 1), 'No multiple-plausible case')
  return fixture
}

const proposalSchema = z.object({
  handle, reason: z.string().min(1).max(600), caveat: z.string().min(1).max(400),
  evidence: z.array(z.object({ field: z.enum(['building', 'canOffer', 'wantsToMeet', 'interests']), quote: z.string().min(3).max(600) }).strict()).min(1).max(4),
}).strict()
const rawSchema = z.object({ matches: z.array(proposalSchema).max(3), nextQuestion: z.string().min(1).max(300).nullable() }).strict()

/** Narrow, reviewable indicators; deliberately not called a hallucination score. */
function auditProposal(data: unknown, candidates: AgentProfile[]) {
  const parsed = rawSchema.safeParse(data)
  if (!parsed.success) return { rawReceived: data !== undefined, rawFormatValid: false, rawHandles: [], rawNextQuestion: null, rawProposals: [], quotes: [], specificClaimFlags: [] }
  const quotes: QuoteCheck[] = []
  const specificClaimFlags: Array<{ handle: string; phrase: string }> = []
  for (const proposal of parsed.data.matches) {
    const profile = candidates.find((person) => person.handle === proposal.handle)
    for (const evidence of proposal.evidence) {
      const source = profile ? evidence.field === 'interests' ? profile.interests.join(', ') : profile[evidence.field] : ''
      quotes.push({ handle: proposal.handle, ...evidence, exact: source.includes(evidence.quote) })
    }
    const source = profile ? [profile.building, profile.canOffer, profile.wantsToMeet, profile.interests.join(', ')].join(' ').toLowerCase() : ''
    // Only reason text is checked. Caveats often properly deny these claims.
    for (const clause of proposal.reason.toLowerCase().split(/[.!?;\n]/)) {
      if (/\b(?:no|not|never|unconfirmed|unknown|cannot|unclear|doesn't|don't|hasn't|without)\b/.test(clause)) continue
      const phrases = clause.match(/\b(?:certified|licensed|guaranteed|available tomorrow|based in [a-z]+|\d+ years(?: of experience)?)\b/g) ?? []
      for (const phrase of phrases) if (!source.includes(phrase)) specificClaimFlags.push({ handle: proposal.handle, phrase })
    }
  }
  return { rawReceived: true, rawFormatValid: true, rawHandles: parsed.data.matches.map((match) => match.handle), rawNextQuestion: parsed.data.nextQuestion, rawProposals: parsed.data.matches, quotes, specificClaimFlags }
}

function casePass(observation: Observation, expected: Scenario['expected']) {
  if (observation.status !== 'ok') return false
  if (expected.mustAbstain) return observation.handles.length === 0 && observation.nextQuestion === null
  return observation.handles.length > 0 && observation.handles.every((candidate) => expected.acceptableHandles.includes(candidate))
}

function fraction(numerator: number, denominator: number) {
  return { numerator, denominator, rate: denominator ? round(numerator / denominator) : null }
}

function summarize(cases: CaseResult[], method: 'hosted' | 'baseline') {
  const available = cases.filter((item) => item[method] !== null)
  const relevantCases = available.filter((item) => !item.expected.mustAbstain)
  const abstentionCases = available.filter((item) => item.expected.mustAbstain)
  const recommendations = available.flatMap((item) => item[method]!.handles.map((candidate) => ({ candidate, expected: item.expected })))
  const latencies = available.map((item) => item[method]!.latencyMs).sort((a, b) => a - b)
  return {
    evaluatedCases: available.length,
    strictCaseSuccess: fraction(available.filter((item) => casePass(item[method]!, item.expected)).length, available.length),
    recommendationRelevance: fraction(recommendations.filter((item) => item.expected.acceptableHandles.includes(item.candidate)).length, recommendations.length),
    firstRecommendationRelevant: fraction(relevantCases.filter((item) => item[method]!.status === 'ok' && item.expected.acceptableHandles.includes(item[method]!.handles[0] ?? '')).length, relevantCases.length),
    atLeastOneRelevantRecommendation: fraction(relevantCases.filter((item) => item[method]!.status === 'ok' && item[method]!.handles.some((candidate) => item.expected.acceptableHandles.includes(candidate))).length, relevantCases.length),
    correctAbstention: fraction(abstentionCases.filter((item) => casePass(item[method]!, item.expected)).length, abstentionCases.length),
    unsupportedCandidateSelections: recommendations.filter((item) => !item.expected.acceptableHandles.includes(item.candidate)).length,
    failures: available.filter((item) => item[method]!.status === 'failed').length,
    latencyMs: { median: latencies.length ? round((latencies[Math.floor((latencies.length - 1) / 2)]! + latencies[Math.ceil((latencies.length - 1) / 2)]!) / 2) : null, p95: latencies.length ? latencies[Math.ceil(latencies.length * 0.95) - 1]! : null },
  }
}

const metricText = (value: ReturnType<typeof fraction>) => `${value.numerator}/${value.denominator}${value.rate === null ? ' (not measured)' : ` (${round(value.rate * 100)}%)`}`
const escapeCell = (text: string) => text.replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|')
function markdownReport(result: ReturnType<typeof assembleReport>) {
  const lines = ['# SignalPass synthetic matching evaluation', '', result.label, '',
    `Mode: **${result.mode}**. Fixture SHA-256: \`${result.fixtureSha256}\`.`, '',
    result.mode === 'validate' ? '**The hosted model was not run. These are baseline and local route-validation results only.**' : `Hosted provider: ${result.provider}; model: ${result.model}. ${result.providerCalls} calls; concurrency 1; no retries.`, '',
    '| Metric | Keyword baseline | Hosted model |', '|---|---:|---:|']
  for (const key of ['strictCaseSuccess', 'recommendationRelevance', 'firstRecommendationRelevant', 'atLeastOneRelevantRecommendation', 'correctAbstention'] as const) {
    lines.push(`| ${key} | ${metricText(result.baseline[key])} | ${result.hosted ? metricText(result.hosted[key]) : 'Not run'} |`)
  }
  lines.push(`| failures | ${result.baseline.failures} | ${result.hosted?.failures ?? 'Not run'} |`, '',
    'Hosted latency includes the in-process discovery route and remote inference; baseline latency covers only local lexical scoring. They are not equal-compute measurements.', '',
    'Recommendation relevance uses returned recommendations as its denominator. Empty/failed results do not improve strict-case, positive-case, or abstention scores; those denominators include every evaluated case of that type.', '',
    `Raw exact-quote mismatches: ${result.hostedAudit ? metricText(result.hostedAudit.quoteMismatches) : 'Not measured'}. Narrow specific-claim flags: ${result.hostedAudit?.specificClaimFlagCount ?? 'Not measured'}.`, '',
    'Exact quotes do not establish entailment, qualifications, availability, or usefulness. Unacceptable candidate selections are a constraint-support proxy, not a factuality score. Specific-claim flags are a small lexical heuristic with false positives and false negatives. Read the case-level reasons, quotes, caveats, and expected-label rationale in results.json before making claims.', '',
    '| Case | Expected acceptable | Keyword result | Hosted result |', '|---|---|---|---|')
  for (const item of result.cases) {
    const format = (observation: Observation | null) => observation === null ? 'Not run' : observation.status === 'failed' ? `FAILED: ${observation.errorCode}` : `${observation.handles.join(', ') || 'Abstain'} — ${casePass(observation, item.expected) ? 'PASS' : 'MISS'}`
    lines.push(`| ${escapeCell(item.id)} | ${item.expected.acceptableHandles.join(', ') || 'Must abstain'} | ${format(item.baseline)} | ${format(item.hosted)} |`)
  }
  lines.push('', 'Limitations: 20 hand-authored cases, 15 fictional profiles, one fixed candidate pool per case, one hosted sample per case, no independent human grading, no deployment/session/phone test, no statistically validated population estimate, and no evidence of adoption. English-heavy labels and a non-translating baseline matter for the multilingual case. The 40-candidate retrieval cap is not exercised. Baseline thresholds were frozen heuristics; this is not a claim to beat every lexical or embedding retrieval system.', '',
    'Expected labels, baseline settings, production source hashes, timestamp, call count, individual failures, and token usage are included in results.json. Fixture and source hashes make later changes detectable; they do not substitute for independent preregistration.', '')
  return lines.join('\n')
}

function assembleReport(metadata: { mode: 'validate' | 'live'; fixtureSha256: string; label: string; startedAt: string; sourceRevision: string; sourceHashes: Record<string, string>; provider: string | null; model: string | null; baselineConfig: Fixture['baseline'] }, cases: CaseResult[], providerCalls: number, complete: boolean) {
  const audits = cases.flatMap((item) => item.hostedAudit ? [item.hostedAudit] : [])
  const quotes = audits.flatMap((item) => item.quotes)
  return { ...metadata, complete, finishedAt: complete ? new Date().toISOString() : null, providerCalls, maxProviderCalls: MAX_CALLS, concurrency: 1,
    baseline: summarize(cases, 'baseline'), hosted: metadata.mode === 'live' ? summarize(cases, 'hosted') : null,
    hostedAudit: metadata.mode === 'live' ? {
      quoteMismatches: fraction(quotes.filter((item) => !item.exact).length, quotes.length),
      specificClaimFlagCount: audits.reduce((sum, item) => sum + item.specificClaimFlags.length, 0),
      noRawResponse: audits.filter((item) => !item.rawReceived).length,
      invalidRawFormats: audits.filter((item) => item.rawReceived && !item.rawFormatValid).length,
      inputTokens: audits.reduce((sum, item) => sum + item.inputTokens, 0), outputTokens: audits.reduce((sum, item) => sum + item.outputTokens, 0),
    } : null, cases }
}

export async function runBenchmark(options: { mode: 'validate' | 'live'; fixture: Fixture; fixtureText: string; out?: string; hostedModel?: AgentModel }) {
  const { fixture } = options
  const fixtureSha256 = sha256(options.fixtureText)
  let calls = 0
  const sourceHashes = Object.fromEntries(['agent-routes.ts', 'agent-provider.ts', 'agent-evidence.ts'].map((file) => [file, sha256(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'))]))
  const modelLabel = options.hostedModel?.model ?? null
  assert(modelLabel === null || /^[A-Za-z0-9_./:@+ -]{1,160}$/.test(modelLabel), 'Model name must be a simple identifier')
  const metadata = { mode: options.mode, fixtureSha256, label: fixture.label, startedAt: new Date().toISOString(), sourceRevision: fixture.sourceRevision, sourceHashes,
    provider: options.hostedModel?.provider ?? null, model: modelLabel, baselineConfig: fixture.baseline }
  const results: CaseResult[] = []
  if (options.out) {
    const out = resolve(options.out)
    assert(!existsSync(out), 'Output directory must be new; existing evidence is never overwritten')
    mkdirSync(out, { recursive: true, mode: 0o700 })
    writeFileSync(resolve(out, 'fixture.json'), options.fixtureText, { flag: 'wx', mode: 0o600 })
    writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  }
  for (const scenario of fixture.cases) {
    let suppliedCandidates: AgentProfile[] = []
    let rawData: unknown = undefined
    let inputTokens = 0
    let outputTokens = 0
    let localCalls = 0
    const configuredCandidates = scenario.candidateHandles.map((candidate) => fixture.profiles.find((profile) => profile.handle === candidate)!)
    const observedModel: AgentModel = {
      provider: options.hostedModel?.provider ?? 'synthetic-benchmark-local', model: options.hostedModel?.model ?? 'bm25-no-network',
      async generate(request) {
        assert.equal(request.operation, 'discover', 'Only discovery is allowed')
        assert.equal(localCalls++, 0, 'One request per case; retries are forbidden')
        const input = request.input as CandidateInput
        assert.equal(input.goal, scenario.goal)
        assert.deepEqual(input.clarificationAnswers, [])
        assert.equal(input.senderProfile, null)
        suppliedCandidates = input.candidates
        assert.deepEqual(suppliedCandidates.map((profile) => profile.handle).sort(), [...scenario.candidateHandles].sort(), 'Both methods require the same complete candidate pool')
        for (const candidate of suppliedCandidates) assert.deepEqual(candidate, configuredCandidates.find((profile) => profile.handle === candidate.handle), 'Profile fields changed in the route')
        if (options.mode === 'live') {
          assert(options.hostedModel, 'Live mode requires an explicit hosted provider')
          assert(calls < MAX_CALLS, 'Hosted-call budget exhausted')
          calls++
          const generated = await options.hostedModel.generate(request)
          rawData = generated.data
          inputTokens = generated.inputTokens
          outputTokens = generated.outputTokens
          return generated
        }
        const baseline = keywordBaseline(scenario.goal, suppliedCandidates, fixture.baseline)
        rawData = { matches: baseline.proposals, nextQuestion: null }
        return { data: rawData, inputTokens: 0, outputTokens: 0 }
      },
    }
    const api = createApp({ origin: ORIGIN, databasePath: ':memory:', agent: { model: observedModel, dailyUserLimit: 1, dailyGlobalLimit: 1, maxConcurrent: 1 } })
    type Identity = { cookie: string; csrf: string }
    const request = async (identity: Identity | null, path: string, body: unknown) => {
      const response = await api.app.request(path, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json', ...(identity ? { cookie: identity.cookie, 'x-signalpass-csrf': identity.csrf } : {}) }, body: JSON.stringify(body) })
      return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '', data: await response.json() as Record<string, any> }
    }
    const login = async (): Promise<Identity> => {
      const account = privateKeyToAccount(generatePrivateKey())
      const challenge = await request(null, '/auth/challenge', { address: account.address, chainId: 10143 })
      assert.equal(challenge.status, 200, 'Local authentication challenge failed')
      const verified = await request(null, '/auth/verify', { nonce: challenge.data.nonce, signature: await account.signMessage({ message: challenge.data.message }) })
      assert.equal(verified.status, 200, 'Local authentication failed')
      return { cookie: verified.cookie, csrf: verified.data.session.csrf as string }
    }
    try {
      for (const profile of configuredCandidates) {
        const identity = await login()
        const saved = await request(identity, '/me/profile', { handle: profile.handle,
          profile: { name: profile.displayName, bio: profile.building, offer: profile.canOffer, meet: profile.wantsToMeet, interests: profile.interests.join(', ') },
          agent: { visibility: 'public', matching: true, sources: [], interests: profile.interests }, sourceLinks: {}, avatar: 'none' })
        assert.equal(saved.status, 200, 'Local fixture profile was rejected')
      }
      const sender = await login()
      const started = performance.now()
      const response = await request(sender, '/agent/discover', { goal: scenario.goal, useProfile: false })
      const latencyMs = round(performance.now() - started)
      assert.equal(localCalls, 1, 'Exactly one generation attempt must occur per case')
      const baseline = keywordBaseline(scenario.goal, suppliedCandidates, fixture.baseline)
      const run = response.status === 200 ? response.data.run as AgentRun : null
      const observation: Observation = run ? { status: 'ok', handles: run.matches.map((match) => match.handle), nextQuestion: run.nextQuestion, latencyMs,
        proposals: run.matches.map(({ handle, reason, caveat, evidence }) => ({ handle, reason, caveat, evidence })) }
        : { status: 'failed', handles: [], nextQuestion: null, latencyMs, proposals: [], errorCode: typeof response.data.error === 'string' && /^agent_[a-z_]+$/.test(response.data.error) ? response.data.error : `http_${response.status}` }
      if (options.mode === 'validate') {
        assert.equal(response.status, 200, 'Baseline fixture output failed the production route')
        assert.deepEqual(observation.handles, baseline.handles, 'Baseline ranking changed through the production route')
        assert(auditProposal(rawData, suppliedCandidates).quotes.every((quote) => quote.exact), 'Invalid baseline quote')
      }
      results.push({ id: scenario.id, category: scenario.category, goal: scenario.goal, expected: scenario.expected,
        candidateHandles: suppliedCandidates.map((candidate) => candidate.handle), baseline, hosted: options.mode === 'live' ? observation : null,
        hostedAudit: options.mode === 'live' ? { ...auditProposal(rawData, suppliedCandidates), inputTokens, outputTokens } : null })
      console.log(`${String(results.length).padStart(2, '0')}/${MAX_CALLS} ${scenario.id}: baseline=${casePass(baseline, scenario.expected) ? 'pass' : 'miss'} ${options.mode === 'live' ? `hosted=${observation.status === 'failed' ? 'failed' : casePass(observation, scenario.expected) ? 'pass' : 'miss'}` : 'hosted=not-run'}`)
      if (options.out) writeFileSync(resolve(options.out, 'results.partial.json'), JSON.stringify(assembleReport(metadata, results, calls, false), null, 2) + '\n', { mode: 0o600 })
      assert.equal(api.store.introductions.size, 0, 'Benchmark must never create introductions')
    } finally { api.close() }
  }
  const result = assembleReport(metadata, results, calls, true)
  if (options.out) {
    writeFileSync(resolve(options.out, 'results.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
    writeFileSync(resolve(options.out, 'report.md'), markdownReport(result), { flag: 'wx', mode: 0o600 })
  }
  console.log(JSON.stringify({ complete: true, mode: options.mode, fixtureSha256, providerCalls: calls, baseline: result.baseline, hosted: result.hosted, hostedAudit: result.hostedAudit }, null, 2))
  return result
}

function selfCheckScoring(fixture: Fixture) {
  const positive = fixture.cases.find((item) => !item.expected.mustAbstain)!
  const negative = fixture.cases.find((item) => item.expected.mustAbstain)!
  const abstention: Observation = { status: 'ok', handles: [], nextQuestion: null, latencyMs: 0, proposals: [] }
  assert(!casePass(abstention, positive.expected), 'Always abstaining must fail positive cases')
  assert(casePass(abstention, negative.expected), 'Correct abstention must pass')
  assert(!casePass({ ...abstention, status: 'failed' }, negative.expected), 'A failed request is not correct abstention')
  assert(!casePass({ ...abstention, handles: [...positive.expected.acceptableHandles, positive.expected.unacceptableHandles[0]!] }, positive.expected), 'Adding an irrelevant candidate must fail a case')
  const person = fixture.profiles[0]!
  const malformed = auditProposal({ matches: [{ handle: person.handle, reason: 'They are certified.', caveat: 'Check details.', evidence: [{ field: 'canOffer', quote: 'This fabricated quote does not occur in the profile.' }] }], nextQuestion: null }, [person])
  assert.equal(malformed.quotes[0]?.exact, false)
  assert.equal(malformed.specificClaimFlags.length, 1)
  const first = keywordBaseline(positive.goal, fixture.profiles, fixture.baseline)
  const second = keywordBaseline(positive.goal, [...fixture.profiles].reverse(), fixture.baseline)
  assert.deepEqual(first.handles, second.handles, 'Baseline ties must be deterministic')
}

async function main() {
  const args = process.argv.slice(2)
  const value = (name: string) => { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1] }
  const hasLive = args.includes('--live')
  assert(hasLive !== args.includes('--validate'), 'Choose exactly one mode: --validate or --live')
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (['--out', '--fixture-sha'].includes(arg)) { assert(args[index + 1] && !args[index + 1]!.startsWith('--'), 'Flag requires a value'); index++ }
    else assert(['--live', '--validate'].includes(arg), 'Unknown option')
  }
  const fixtureText = readFileSync(FIXTURE_URL, 'utf8')
  const fixture = validateFixture(JSON.parse(fixtureText))
  selfCheckScoring(fixture)
  if (hasLive) {
    assert(value('--out'), 'Live mode requires --out pointing to a new directory')
    assert.equal(value('--fixture-sha'), sha256(fixtureText), 'Live mode requires --fixture-sha matching the reviewed frozen fixture')
  }
  // Constructing the provider happens only after every fixture/preflight check.
  const hostedModel = hasLive ? configuredHostedAgent({ ...process.env, SIGNALPASS_AGENT_DAILY_USER_LIMIT: '20', SIGNALPASS_AGENT_DAILY_GLOBAL_LIMIT: '20' }).model : undefined
  assert(!hasLive || hostedModel, 'Live mode requires explicit SIGNALPASS_AGENT_PROVIDER, MODEL and API_KEY or API_KEY_FILE')
  const result = await runBenchmark({ mode: hasLive ? 'live' : 'validate', fixture, fixtureText, out: value('--out'), hostedModel })
  if (result.hosted?.failures) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    // Provider/config/parse errors may contain sensitive strings. Keep stdout and
    // stderr bounded; partial case evidence is already in the chosen output dir.
    console.error('Matching benchmark stopped. Check mode flags, the frozen fixture hash, a new output directory, Node >=22.13, installed workspace dependencies, and server-only provider configuration. No automatic retry was made. Partial results, if any, remain in the output directory.')
    process.exitCode = 1
  })
}

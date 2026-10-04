#!/usr/bin/env node
/** Run the production assistant IIFE with an offline API and small DOM fake.
 * No browser, network, wallet, model, or third-party dependencies are used.
 * Run: node --test scripts/agent-refinement-test.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../apps/web/public/v4/', import.meta.url);
const [html, script] = await Promise.all(['assistant.html', 'assistant.js'].map(name => readFile(new URL(name, root), 'utf8')));
const address = '0x' + 'a'.repeat(40);
const goal = 'Find someone to review the onboarding flow for my prototype.';
const runId = 'b58bde8a-dd11-44a7-9239-6bd5b8375edb';
const childId = '1492b8c9-6368-4c19-af34-34e2bb987b2c';
const match = { handle: 'maya-qa', displayName: 'Maya', building: 'Building wallets', canOffer: 'General product feedback', reason: 'A possible person to ask.', caveat: 'Specific onboarding experience is not confirmed.', evidence: [{ field: 'canOffer', quote: 'General product feedback' }] };
const makeRun = (overrides = {}) => ({ id: runId, goal, createdAt: 1791072000, usedProfile: false, parentRunId: null, clarifications: [], matches: [], nextQuestion: null, modelCalled: true, eligibleCandidates: 2, consideredCandidates: 2, ...overrides });
const decode = value => value.replace(/&(?:amp|lt|gt|quot|apos|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'" })[entity]);

// Only the DOM operations used by assistant.js are implemented. In particular,
// HTML writes fail rather than silently treating untrusted markup as safe text.
class Element {
  constructor(tag, document) {
    this.tagName = tag.toUpperCase(); this.document = document;
    this.children = []; this.attributes = {}; this.dataset = {}; this.listeners = new Map();
    this.value = ''; this.checked = false; this.hidden = false; this.disabled = false; this.className = '';
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, force) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        const enabled = force ?? !names.has(name);
        if (enabled) names.add(name); else names.delete(name);
        this.className = [...names].join(' '); return enabled;
      },
      add: name => this.classList.toggle(name, true),
      remove: name => this.classList.toggle(name, false),
    };
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
    else if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    else if (['hidden', 'disabled', 'checked'].includes(name)) this[name] = true;
    else if (['id', 'type', 'href', 'value'].includes(name)) this[name] = String(value);
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  set textContent(value) { this.children = [String(value)]; }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set innerHTML(_) { throw new Error('Unexpected HTML write: use textContent for model output'); }
  append(...children) { for (const child of children) { if (child instanceof Element) child.parentElement = this; this.children.push(child); } }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  dispatch(type) { const event = { type, target: this, preventDefault() {} }; return Promise.all((this.listeners.get(type) ?? []).map(listener => listener(event))); }
  focus() { this.document.activeElement = this; }
  scrollIntoView() {}
  setCustomValidity(message) { this.validationMessage = message; }
  reportValidity() { return !this.validationMessage; }
  matches(selector) {
    const tag = selector.match(/^[a-z][\w-]*/i)?.[0];
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    const id = selector.match(/#([\w-]+)/)?.[1];
    if (id && this.id !== id) return false;
    if ([...selector.matchAll(/\.([\w-]+)/g)].some(([, name]) => !this.classList.contains(name))) return false;
    return [...selector.matchAll(/\[([\w-]+)\]/g)].every(([, name]) => name.startsWith('data-') ? name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()) in this.dataset : this.getAttribute(name) !== null);
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  querySelectorAll(selector) {
    const selectors = selector.split(',').map(part => part.trim().split(/\s+/));
    const result = [];
    const visit = element => {
      for (const child of element.children) {
        if (!(child instanceof Element)) continue;
        if (selectors.some(parts => child.matches(parts.at(-1)) && (parts.length === 1 || child.parentElement?.closest(parts.slice(0, -1).join(' '))))) result.push(child);
        visit(child);
      }
    };
    visit(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
}

function documentFromHtml() {
  const document = new Element('document', null); document.document = document;
  document.createElement = tag => new Element(tag, document);
  const stack = [document], voidTags = new Set(['area', 'base', 'br', 'hr', 'img', 'input', 'link', 'meta', 'source', 'wbr']);
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>|[^<]+/gi)) {
    const value = token[0];
    if (value.startsWith('<!')) continue;
    if (value.startsWith('</')) { stack.pop(); continue; }
    if (value.startsWith('<')) {
      const tag = value.match(/^<([\w-]+)/)[1].toLowerCase(), element = document.createElement(tag);
      for (const [, name, double, single, bare] of value.slice(tag.length + 1, -1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) element.setAttribute(name, decode(double ?? single ?? bare ?? ''));
      stack.at(-1).append(element);
      if (!voidTags.has(tag) && !value.endsWith('/>')) stack.push(element);
    } else stack.at(-1).append(decode(value));
  }
  return document;
}

async function harness(run, { guest = false } = {}) {
  const document = documentFromHtml(), calls = [], stored = new Map();
  let connects = 0;
  if (run) stored.set('signalpass-assistant-return', JSON.stringify({ owner: address, goal: run.goal, runId: run.id, handle: null, createdAt: Date.now() }));
  const api = {
    ready: Promise.resolve(), demo: false, error: null,
    me: guest ? null : { session: { address }, profile: { handle: 'alex-qa' }, settings: {} },
    connect: async () => { connects++; throw new Error('No wallet calls are allowed'); },
    request: async (path, body) => {
      calls.push({ path, body: body && JSON.parse(JSON.stringify(body)) });
      if (path === '/agent/status') return { enabled: true, remainingToday: 20, limit: 20 };
      if (path === '/agent/workspace') return { runs: run ? [run] : [], drafts: [] };
      if (path === '/agent/discover') return { run: { ...run, id: childId, parentRunId: body.parentRunId, usedProfile: body.useProfile, clarifications: [...run.clarifications, { question: run.nextQuestion, answer: body.answer }] }, usage: { remainingToday: 19 } };
      throw new Error('Unexpected API path: ' + path);
    },
  };
  const storage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
  const context = { window: { SignalPass: api }, document, sessionStorage: storage, localStorage: storage, location: { search: '', reload() { throw new Error('No navigation expected'); } }, matchMedia: () => ({ matches: true }), URLSearchParams, console, setInterval: () => 1, clearInterval() {}, fetch() { throw new Error('Network access is forbidden'); } };
  await vm.runInNewContext(script, context, { filename: 'assistant.js', timeout: 1000 });
  const get = id => { const element = document.querySelector('#' + id); assert(element, `Missing static HTML element #${id}`); return element; };
  const fire = async (id, type) => { await get(id).dispatch(type); await new Promise(resolve => setImmediate(resolve)); };
  return { document, calls, get, fire, connects: () => connects, discoveries: () => calls.filter(call => call.path === '/agent/discover') };
}

function assertRefinementVisible(h) {
  assert.equal(h.get('agent-refine-form').hidden, false);
  assert.equal(h.get('agent-refine-form').getAttribute('aria-labelledby'), 'agent-next-question');
  assert.equal(h.get('agent-next-question').tagName, 'H3');
  assert(h.get('agent-next-question').textContent.trim().length > 10, 'A visible, understandable prompt is required');
  assert.deepEqual(h.calls.map(call => call.path), ['/agent/status', '/agent/workspace'], 'Rendering must only load status and saved work');
}

test('a completed search with no matches and no model question offers an accessible refinement', async () => {
  const h = await harness(makeRun());
  assertRefinementVisible(h);
  assert.match(h.get('agent-matches').textContent, /No clear match among the profiles reviewed/i);
  assert.equal(h.get('results-goal').textContent, goal);
});

test('existing suggestions with no model question still let the person explain a poor fit', async () => {
  const h = await harness(makeRun({ matches: [match] }));
  assertRefinementVisible(h);
  assert.match(h.get('agent-matches').textContent, /Specific onboarding experience is not confirmed/);
  assert.equal(h.get('agent-selection').hidden, false);
});

for (const consent of [false, true]) test(`explicit refinement sends one answer and preserves history, goal and profile consent (${consent})`, async () => {
  const previous = { question: 'Which part?', answer: 'The first wallet connection.' };
  const h = await harness(makeRun({ clarifications: [previous], usedProfile: !consent }));
  h.get('agent-use-profile').checked = !consent;
  await h.fire('agent-use-profile', 'change');
  assert.equal(h.get('agent-draft-consent').checked, !consent);
  h.get('agent-use-profile').checked = consent;
  await h.fire('agent-use-profile', 'change');
  h.get('agent-refine-answer').value = '  I need a mobile accessibility review, not general feedback.  ';
  assert.equal(h.discoveries().length, 0);
  await h.fire('agent-refine-form', 'submit');
  assert.deepEqual(h.discoveries(), [{ path: '/agent/discover', body: { parentRunId: runId, answer: 'I need a mobile accessibility review, not general feedback.', useProfile: consent } }]);
  assert.equal(h.get('agent-goal').value, goal);
  assert.equal(h.get('results-goal').textContent, goal);
  assert.match(h.get('agent-clarifications').textContent, /The first wallet connection/);
  assert.match(h.get('agent-clarifications').textContent, /mobile accessibility review/);
  assert.equal(h.get('agent-history').querySelectorAll('button').length, 2, 'Both original and refined runs remain available');
  assert.equal(h.get('agent-use-profile').checked, consent);
  assert.equal(h.get('agent-draft-consent').checked, consent);
  assert(h.calls.every(call => ['/agent/status', '/agent/workspace', '/agent/discover'].includes(call.path)), 'Refinement must not draft, send, clear history or connect');
});

test('an empty eligible pool is honestly described and does not offer AI refinement', async () => {
  const h = await harness(makeRun({ modelCalled: false, eligibleCandidates: 0, consideredCandidates: 0 }));
  assert.equal(h.get('agent-refine-form').hidden, true);
  assert.match(h.get('results-context').textContent, /no eligible public profiles/i);
  assert.match(h.get('results-context').textContent, /No AI request was used/);
  h.get('agent-refine-answer').value = 'This cannot add people to an empty directory.';
  await h.fire('agent-refine-form', 'submit');
  assert.equal(h.discoveries().length, 0);
});

test('after three answers, editing the goal only focuses it and forced submit cannot send a fourth request', async () => {
  const clarifications = [1, 2, 3].map(i => ({ question: null, answer: `Useful detail ${i}` }));
  const h = await harness(makeRun({ clarifications }));
  assert.equal(h.get('agent-refine-form').hidden, true);
  const limit = h.get('agent-refine-limit');
  assert.equal(limit.hidden, false);
  assert(h.get(limit.getAttribute('aria-labelledby')).textContent.trim(), 'The limit region needs an accessible name');
  assert.match(limit.textContent, /three|3/i);
  assert.equal(h.get('agent-edit-goal').type, 'button');
  await h.fire('agent-edit-goal', 'click');
  assert.equal(h.document.activeElement, h.get('agent-goal'));
  assert.equal(h.get('agent-goal').value, goal);
  h.get('agent-refine-answer').value = 'A fourth answer should never be sent.';
  await h.fire('agent-refine-form', 'submit');
  assert.equal(h.discoveries().length, 0);
  assert.equal(h.get('agent-history').querySelectorAll('button').length, 1);
});

test('model-supplied questions for matched profiles remain literal text, never interpreted markup', async () => {
  const question = '<img src=x onerror="window.untrustedQuestionRan=true"> Which flow matters?';
  const h = await harness(makeRun({ matches: [match], nextQuestion: question }));
  assertRefinementVisible(h);
  assert.equal(h.get('agent-next-question').textContent, question);
  assert.equal(h.get('agent-next-question').querySelector('img'), null);
});

test('signed-out people can discover clearly disclosed offline samples without any API or wallet call', async () => {
  const h = await harness(null, { guest: true });
  const sample = h.get('agent-notice-actions').querySelectorAll('a').find(link => /Try sample people/i.test(link.textContent));
  assert(sample, 'Signed-out notice should offer Try sample people');
  assert.equal(sample.href, '/discover?demo=1');
  const disclosure = h.get('agent-notice').textContent;
  assert.match(disclosure, /offline|locally|local demo/i);
  assert.match(disclosure, /fictional/i);
  assert.match(disclosure, /no\b[^.]*\bAI requests|without AI|AI (?:is |stays )?off/i);
  assert.match(disclosure, /no\b[^.]*\bexternal messages|nothing (?:is |gets )?sent|without sending/i);
  await sample.dispatch('click');
  assert.deepEqual(h.calls, []);
  assert.equal(h.connects(), 0);
  assert.match(h.get('goal-hint').textContent, /Searches only people who have made their profiles available on SignalPass/);
});

function leadingConnectionFact(h) {
  const section = h.get('agent-matches').querySelector('.assistant-connection');
  assert(section, 'A match needs its source-backed connection explanation');
  return { section, fact: section.querySelectorAll('.assistant-connection-cell')[0] };
}

test('the chosen offer quote leads Why you two instead of an unrelated full offer', async () => {
  const quote = 'Wallet accessibility reviews for first-time users.';
  const recipientEvidence = { field: 'canOffer', quote };
  const h = await harness(makeRun({ matches: [{ ...match,
    canOffer: 'Career introductions. ' + quote,
    evidence: [recipientEvidence, { field: 'building', quote: 'Building wallets' }],
    connection: { recipientEvidence, basis: 'profile_evidence', senderEvidence: null },
  }] }));
  const { section, fact } = leadingConnectionFact(h);
  assert.equal(fact.querySelector('dt').textContent, 'What they offer');
  assert.equal(fact.querySelector('dd').textContent, `“${quote}”Their public profile · Can offer`);
  assert.equal(section.textContent.includes('Career introductions.'), false, 'Unrelated offer text must not displace the selected evidence');
  assert.match(section.textContent, /No personal contribution inferred/);
  assert.equal(h.discoveries().length, 0, 'Showing evidence must not trigger inference');
});

for (const [field, label, quote] of [
  ['building', 'Working on', 'Testing first-time wallet onboarding.'],
  ['wantsToMeet', 'Wants to meet', 'Builders who want wallet accessibility feedback.'],
  ['interests', 'Interests', 'Wallet accessibility'],
]) test(`chosen ${field} evidence is labeled as profile context, never as an offer`, async () => {
  const recipientEvidence = { field, quote };
  const h = await harness(makeRun({ matches: [{ ...match,
    canOffer: 'Career introductions.', evidence: [recipientEvidence],
    connection: { recipientEvidence, basis: field === 'interests' ? 'shared_interest_only' : 'profile_evidence' },
  }] }));
  const { section, fact } = leadingConnectionFact(h);
  assert.equal(fact.querySelector('dt').textContent, 'Relevant profile context');
  assert.equal(fact.querySelector('dd').textContent, `“${quote}”Their public profile · ${label}`);
  assert.equal(section.textContent.includes('Career introductions.'), false);
  if (field === 'interests') {
    assert.match(section.querySelector('.assistant-shared-interest').textContent, /do not establish experience with your specific need/i);
  } else assert.equal(section.querySelector('.assistant-shared-interest'), null);
});

test('legacy saved matches without chosen evidence keep the existing offer fallback', async () => {
  const h = await harness(makeRun({ matches: [match] }));
  const { fact } = leadingConnectionFact(h);
  assert.equal(fact.querySelector('dt').textContent, 'What they offer');
  assert.equal(fact.querySelector('dd').textContent, match.canOffer + 'Their public profile · Can offer');
  assert.equal(h.get('agent-selection').hidden, false);
});

test('an interest-led highlight does not claim other profile evidence is absent', async () => {
  const recipientEvidence = { field: 'interests', quote: 'Wallet accessibility' };
  const h = await harness(makeRun({ matches: [{ ...match,
    evidence: [recipientEvidence, { field: 'building', quote: 'Building wallets' }],
    connection: { recipientEvidence, basis: 'shared_interest_only' },
  }] }));
  const warning = leadingConnectionFact(h).section.querySelector('.assistant-shared-interest').textContent;
  assert.equal(warning, 'Shared interests do not establish experience with your specific need.');
  assert.equal(/only/i.test(warning), false);
  assert.equal(h.get('agent-matches').querySelectorAll('blockquote').length, 2, 'Both source quotes remain available to review');
});

test('chosen profile quote markup stays literal in the lead fact and evidence panel', async () => {
  const quote = '<img src=x onerror="window.untrustedProfileRan=true"> Wallet review.';
  const recipientEvidence = { field: 'canOffer', quote };
  const h = await harness(makeRun({ matches: [{ ...match, canOffer: quote, evidence: [recipientEvidence], connection: { recipientEvidence } }] }));
  const { fact } = leadingConnectionFact(h);
  assert.equal(fact.querySelector('dd').textContent, `“${quote}”Their public profile · Can offer`);
  assert(h.get('agent-matches').querySelector('blockquote').textContent.includes(quote));
  assert.equal(h.get('agent-matches').querySelector('img'), null);
});

test('saved no-fit results stay directory-scoped without replaying an old outside-search question', async () => {
  const saved = makeRun({ consideredCandidates: 3, eligibleCandidates: 22, nextQuestion: 'Should I search the whole web for an external expert? <img src=x>' });
  const original = JSON.stringify(saved);
  const h = await harness(saved);
  assertRefinementVisible(h);
  assert.equal(h.get('agent-matches').querySelector('h3').textContent, 'No clear match among the profiles reviewed');
  assert.match(h.get('results-context').textContent, /Reviewed 3 of 22 eligible public profiles in the current directory/);
  assert.match(h.get('agent-matches').textContent, /Your goal is saved/);
  assert.match(h.get('agent-matches').textContent, /limited to the current directory profiles reviewed/);
  assert.match(h.get('agent-matches').textContent, /may still find no suitable match/);
  assert.match(h.get('agent-next-question').textContent, /within this directory/);
  assert.equal(h.get('agent-next-question').textContent.includes('whole web'), false);
  assert.equal(h.get('agent-next-question').querySelector('img'), null);
  assert.equal(JSON.stringify(saved), original, 'Presentation must not rewrite stored model questions or history');
  assert.equal(h.discoveries().length, 0);
});

import Link from 'next/link'

type Tone = 'bond' | 'accent' | 'fee' | 'danger'

interface Row {
  readonly area: string
  readonly what: string
  readonly status: string
  readonly tone: Tone
}

const ROWS: readonly Row[] = [
  {
    area: 'Contracts',
    what: 'ProfileRegistry, IntroductionEscrow, IntroductionReceipt (Solidity 0.8.24, Foundry)',
    status: 'Built and tested — 34 tests, including a fuzz run over every terminal path',
    tone: 'bond',
  },
  {
    area: 'Domain model',
    what: 'Introduction state machine, pricing curve, EIP-712 payloads (@signalpass/core)',
    status: 'Built — one copy shared by the contracts’ off-chain twin, API, evaluator, indexer and UI',
    tone: 'bond',
  },
  {
    area: 'API',
    what: 'Hono service: profiles, quote, submit, evaluate, transition, queue',
    status: 'Built — in-memory store; onchain writes are not wired in this build',
    tone: 'accent',
  },
  {
    area: 'Evaluator',
    what: 'Bilateral evaluation + recommendation guardrail',
    status: 'Built — mock provider is the default; the Hunyuan provider is implemented behind the same interface and needs credentials',
    tone: 'accent',
  },
  {
    area: 'Indexer',
    what: 'Derived queue health, sender standing, pressure index (pure functions)',
    status: 'Aggregation built and tested; Envio config and schema written but the runtime is not started',
    tone: 'accent',
  },
  {
    area: 'Web',
    what: 'This application — directory, composer, live quote, protected inbox, receipt',
    status: 'Built',
    tone: 'bond',
  },
  {
    area: 'Deployment',
    what: 'Deploy script for Monad testnet (chain 10143)',
    status: 'Verified by dry run against the live testnet RPC: 3 contracts, ~3.54M gas, ~0.72 MON at the current gas price. Needs a funded key to broadcast',
    tone: 'fee',
  },
  {
    area: 'Wallet login',
    what: 'Dynamic',
    status: 'Not wired — this build uses seeded demo identities and simulates the escrow split',
    tone: 'fee',
  },
  {
    area: '3D presence',
    what: 'Hunyuan 3D agent persona',
    status: 'Slot is real and asynchronous; the provider is implemented, waiting on credentials',
    tone: 'fee',
  },
  {
    area: 'Verified context',
    what: 'Opt-in disclosed signals',
    status: 'Consent record is real and part of the hashed payload; third-party verification is not wired',
    tone: 'fee',
  },
]

const COMMANDS = [
  { label: 'Install', command: 'pnpm install' },
  { label: 'Typecheck everything', command: 'pnpm -r typecheck' },
  { label: 'Contract tests', command: 'pnpm contracts:test' },
  { label: 'Indexer aggregation tests', command: 'pnpm --filter @signalpass/indexer test' },
  { label: 'Run the API', command: 'pnpm api:dev' },
  { label: 'Run this UI', command: 'pnpm --filter @signalpass/web dev' },
] as const

export default function StatusPage() {
  return (
    <div className="wrap">
      <div className="eyebrow">Build status</div>
      <h1 className="h2" style={{ marginTop: 12, maxWidth: '30ch' }}>
        What is real today, and what is deliberately honest about being a stub.
      </h1>
      <p className="lede" style={{ marginTop: 14 }}>
        A mechanism that protects people’s attention is only worth anything if you can say exactly which
        parts of it are running. This page is that statement. Nothing here is described as working unless it
        runs.
      </p>

      <div className="card section">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Area</th>
              <th style={{ width: '38%' }}>What it does</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.area}>
                <td className="strong nowrap">{row.area}</td>
                <td className="muted">{row.what}</td>
                <td>
                  <span className="pill" data-tone={row.tone}>
                    <span className="pill-dot" />
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="section split">
        <div>
          <div className="eyebrow">The invariants that are actually tested</div>
          <h2 className="h3" style={{ marginTop: 10 }}>
            Four claims, each backed by a failing-if-broken test.
          </h2>
          <ul className="bullets" style={{ marginTop: 16 }}>
            <li>
              <strong>No path ever seizes the bond.</strong> A fuzz test walks every terminal state, accept
              and decline included, and asserts the sender’s balance is exactly restored.
            </li>
            <li>
              <strong>Only the recipient can decide.</strong> Accept and decline revert for anyone else — a
              test calls them from the sender’s address and from a stranger’s.
            </li>
            <li>
              <strong>An agent can never approve access.</strong> The evaluator role is asserted to be unable
              to move an introduction past review.
            </li>
            <li>
              <strong>Unanswered introductions always expire.</strong> Anyone can trigger expiry, and the
              pre-evaluation case refunds fee and bond in full.
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="eyebrow">Run it yourself</div>
          <dl className="kv" style={{ marginTop: 14 }}>
            {COMMANDS.map((item) => (
              <div key={item.command} style={{ display: 'contents' }}>
                <dt>{item.label}</dt>
                <dd className="mono tiny" style={{ wordBreak: 'break-all' }}>
                  {item.command}
                </dd>
              </div>
            ))}
          </dl>
          <hr className="divider" style={{ margin: '18px 0' }} />
          <p className="tiny dim">
            The web app talks to the API at <span className="mono">NEXT_PUBLIC_API_URL</span>, defaulting to{' '}
            <span className="mono">http://localhost:8787</span>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="notice" data-tone="accent">
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '56ch' }}>
              <div className="strong">The one thing worth arguing about.</div>
              <p className="small muted" style={{ marginTop: 6 }}>
                Most “gated inbox” designs answer a bad question: how do we charge for attention? That turns
                a person into a toll booth. SignalPass charges for the evaluation and for occupying a slot in
                a queue — never for the reply — and makes the expensive part refundable precisely so the
                cheap, honest introduction stays cheap.
              </p>
            </div>
            <Link href="/builders" className="btn">
              Go try it
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

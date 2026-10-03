import Link from 'next/link'

type Tone = 'bond' | 'accent' | 'fee' | 'danger'

interface Row {
  readonly area: string
  readonly what: string
  readonly label: string
  readonly status: string
  readonly tone: Tone
}

const ROWS: readonly Row[] = [
  {
    area: 'Personal Agent',
    label: 'Live',
    what: 'Goal-based discovery, follow-up questions and private introduction drafts',
    status: 'Live with TokenRhythm deepseek-v4-flash. Up to 20 inference attempts per account and 200 across the site per UTC day; failed attempts count. No automatic retries or fallback.',
    tone: 'bond',
  },
  {
    area: 'Wallet sign-in',
    label: 'Live',
    what: 'Server-verified Sign-In with Ethereum using an injected Ethereum wallet',
    status: 'Live signed sessions with HttpOnly cookies. Signing in requests a message signature, not a payment. Dynamic embedded wallets are not connected.',
    tone: 'bond',
  },
  {
    area: 'Persistence',
    label: 'Live',
    what: 'Profiles, introductions, signed sessions, private agent history and usage limits',
    status: 'Persistent SQLite. Public acceptance verified sessions, drafts, history and consumed quota across an actual API service restart. Private records use account and participant access controls.',
    tone: 'bond',
  },
  {
    area: 'Introductions',
    label: 'Live',
    what: 'Edit a draft, review delivery, receive a decision and optionally exchange contact details',
    status: 'Live with explicit sender confirmation and recipient acceptance, decline or context requests. Contact sharing requires acceptance and each participant’s own approval. Agents cannot send messages, decide for a recipient or move funds.',
    tone: 'bond',
  },
  {
    area: 'Monad Mainnet',
    label: 'Live',
    what: 'ProfileRegistry, IntroductionEscrow and IntroductionReceipt on chain 143',
    status: 'Deployed. The optional wallet-bond pilot uses real MON and requires explicit wallet transactions. A no-bond introduction is also available. Manual evaluation charges zero AI evaluation fee; transaction gas still applies.',
    tone: 'bond',
  },
  {
    area: 'Settlement evidence',
    label: 'Verified with limits',
    what: 'Bond locking, recipient decisions and refunds',
    status: 'Mainnet acceptance and decline returned the full bond principal, with transaction evidence. Gas is not refunded. Expiry was tested on a local EVM and requires a resolution transaction; mainnet expiry was not exercised.',
    tone: 'accent',
  },
  {
    area: 'Profile context',
    label: 'Explicit consent',
    what: 'Approved profiles, visibility settings and consent for AI requests',
    status: 'Matching considers eligible public profiles that opted into suggestions. Your goal, follow-up answers and candidate profile details go to the configured AI provider; your approved profile is included only with explicit permission. Self-reported facts are not independently verified.',
    tone: 'accent',
  },
  {
    area: 'Sample tour',
    label: 'Sample mode',
    what: 'A separate, labeled example community and introduction editor',
    status: 'Available without a wallet. Sample mode does not invoke AI, deliver messages or make payments. Live recommendations need real participants with approved public profiles and matching enabled.',
    tone: 'fee',
  },
  {
    area: 'Other integrations',
    label: 'Not enabled',
    what: 'Sponsor integrations and external verification',
    status: 'Hunyuan, Dynamic embedded wallets, the Envio runtime and third-party profile verification are not enabled on the public site. Repository scaffolding is not evidence of a working integration.',
    tone: 'fee',
  },
]

const REPORTS = 'https://github.com/huaigu/twingate/blob/main/docs/reports/'

const COMMANDS = [
  { label: 'Install', command: 'pnpm install --frozen-lockfile' },
  { label: 'Typecheck everything', command: 'pnpm -r typecheck' },
  { label: 'Contract tests', command: 'pnpm contracts:test' },
  { label: 'API tests', command: 'pnpm --filter @signalpass/api test' },
  { label: 'Run the API', command: 'pnpm api:dev' },
  { label: 'Run this UI', command: 'pnpm --filter @signalpass/web dev' },
] as const

export default function StatusPage() {
  return (
    <div className="wrap">
      <div className="eyebrow">Public pilot · checked October 3, 2026</div>
      <h1 className="h2" style={{ marginTop: 12, maxWidth: '30ch' }}>
        What is live, what was tested, and what still needs people.
      </h1>
      <p className="lede" style={{ marginTop: 14 }}>
        SignalPass runs hosted AI discovery and drafting, persistent accounts and introductions, and an
        optional Monad Mainnet bond. People approve every message, contact disclosure and wallet action.
        This is a dated deployment record, not a real-time availability monitor or a claim that every
        recommendation is useful or correct.
      </p>

      <div className="card section" style={{ minWidth: 0 }}>
        {ROWS.map((row, index) => (
          <section key={row.area} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px', padding: '20px 0', borderTop: index ? '1px solid var(--line)' : undefined }}>
            <div style={{ flex: '1 1 16rem', minWidth: 0, overflowWrap: 'anywhere' }}>
              <h2 className="h3">{row.area}</h2>
              <p className="muted" style={{ marginTop: 8 }}>{row.what}</p>
            </div>
            <div style={{ flex: '2 1 24rem', minWidth: 0 }}>
              <span className="pill" data-tone={row.tone} style={{ maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                <span className="pill-dot" aria-hidden="true" />
                {row.label}
              </span>
              <p style={{ marginTop: 10, lineHeight: 1.65, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                {row.status}
              </p>
            </div>
          </section>
        ))}
      </div>

      <section className="section split">
        <div>
          <div className="eyebrow">Separate evidence for separate claims</div>
          <h2 className="h3" style={{ marginTop: 10 }}>
            Public AI, the product journey and mainnet settlement.
          </h2>
          <p className="small muted" style={{ marginTop: 12 }}>
            The reports below require access to the private project repository. The mainnet transaction
            links are public.
          </p>
          <ul className="bullets" style={{ marginTop: 16 }}>
            <li>
              <a href={REPORTS + 'signalpass-tokenrhythm-2026-10-03.md'}>Hosted AI acceptance</a>{' '}
              exercised discovery, clarification, private drafting, account isolation and persistence
              through the public HTTPS application. The limits are inference attempts, not a monetary
              budget or a guarantee of provider availability.
            </li>
            <li>
              <a href={REPORTS + 'signalpass-public-journey-2026-10-03.md'}>Two-person product rehearsal</a>{' '}
              followed fictional participants from a live AI suggestion through an edited introduction,
              recipient acceptance and mutual contact sharing. It used the no-bond option and made no
              wallet transactions.
            </li>
            <li>
              <a href={REPORTS + 'signalpass-mainnet-deployment-2026-10-03.md'}>Mainnet settlement evidence</a>{' '}
              records the deployed contracts, bond locks, acceptance, decline and full principal refunds.
              This is separate from the AI rehearsal; it does not claim a mainnet expiry test or explorer
              source-code verification. Public two-wallet test: {' '}
              <a href="https://monadvision.com/tx/0x3f64e633da6c0bff6880703bf8e228419b39125f3fd14747bd048031c45850f6">accepted introduction lock</a>,{' '}
              <a href="https://monadvision.com/tx/0xe7c23bc70532bafe2bc2d9ef14b465a73214358a129626a0a40e1b6bb05ab00a">acceptance refund</a>,{' '}
              <a href="https://monadvision.com/tx/0xb4b86d8c62b3611d897fb7908cb50ac06e6ba0617e75b7a17b52d967f6103190">decline refund</a>.
            </li>
            <li>
              <strong>Human review remains necessary.</strong> Source quotes and recipient eligibility
              are checked, but generated interpretations and personal claims can still be wrong.
              Synthetic acceptance tests do not establish recommendation quality across a real community.
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
            The live V4 UI uses same-origin <span className="mono">/api/*</span> routes, proxied through{' '}
            <span className="mono">SIGNALPASS_API_ORIGIN</span> (local default:{' '}
            <span className="mono">http://127.0.0.1:8789</span>). See the{' '}
            <a href="https://github.com/huaigu/twingate/blob/main/docs/DEPLOYMENT.md">deployment guide (repository access required)</a>{' '}
            for configuration and persistent storage. Private records are access-controlled, not
            application-level encrypted at rest.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="notice" data-tone="accent">
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '56ch' }}>
              <div className="strong">Try the flow at your own pace.</div>
              <p className="small muted" style={{ marginTop: 6 }}>
                Explore the labeled sample tour without a wallet, or connect a wallet to use the live
                agent. If the public directory is empty, create a profile and invite another person to
                opt into suggestions. A bond is optional and never buys a reply.
              </p>
            </div>
            <Link href="/discover?demo=1" className="btn">
              Explore sample profiles
            </Link>
            <Link href="/assistant?demo=0" className="btn">
              Open live agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

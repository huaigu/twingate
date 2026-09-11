import Link from 'next/link'

const HANDSHAKE = [
  {
    step: '01',
    title: 'The sender writes and locks',
    body: 'Four questions instead of a cold paragraph: who you are, why this person, what you offer, what you want next. A non-refundable evaluation fee and a refundable attention bond are split onchain in the same transaction.',
  },
  {
    step: '02',
    title: 'Two agents read it, one per side',
    body: 'Your Intro Coach tightens the card. Their Gatekeeper reads it against the policy they published. Neither agent can approve access, rank anyone by wealth, or touch a single wei.',
  },
  {
    step: '03',
    title: 'Only the recipient can open it',
    body: 'The introduction waits in their private queue with a short summary. They accept or decline. Either way the bond is refunded — a rule the escrow contract enforces, not a promise we make.',
  },
] as const

const METRICS = [
  { value: '0 MON', label: 'ever seized by an agent. The bond has exactly one destination.' },
  { value: '4', label: 'questions. An introduction is a card, not an essay.' },
  { value: '2', label: 'agents, one per person. Neither sees the other’s reasoning.' },
  { value: '1', label: 'person who can open it — the one it was addressed to.' },
] as const

export default function HomePage() {
  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-grid">
          <div className="fade-in">
            <div className="eyebrow">Monad Metropolis · Track 03 — Social, Attention &amp; Culture</div>
            <h1 className="display" style={{ marginTop: 18 }}>
              Nobody wants another inbox.
              <br />
              Everybody wants a good introduction.
            </h1>
            <p className="lede" style={{ marginTop: 22 }}>
              Every builder network eventually becomes the same problem: the people worth reaching are
              reachable, so they get buried. Filters do not fix this, because the cost of sending is
              zero. SignalPass changes the unit of contact. An <strong>introduction</strong> is a small,
              deliberate, paid-for object that only one person can open — and both sides have to want it.
            </p>

            <div className="hero-actions">
              <Link href="/builders" className="btn">
                Open the directory
              </Link>
              <Link href="/inbox/bob" className="btn btn-ghost">
                See a recipient’s inbox
              </Link>
            </div>

            <p className="tiny dim" style={{ marginTop: 18 }}>
              This build runs on seeded demo identities. Read what is real today on the{' '}
              <Link href="/status" className="btn-link">
                build status
              </Link>{' '}
              page.
            </p>
          </div>

          <div className="intro-card fade-in" aria-hidden="true">
            <div className="intro-card-head">
              <div>
                <div className="eyebrow">Introduction</div>
                <div className="strong" style={{ marginTop: 2 }}>
                  to @bob
                </div>
              </div>
              <span className="pill" data-tone="accent">
                <span className="pill-dot" />
                in review queue
              </span>
            </div>
            <div className="intro-card-body">
              {[
                ['01', 'Who I am', 'I build a deterministic simulation harness for Monad contracts.'],
                ['02', 'Why you', 'You designed the event pipeline I keep reading about.'],
                ['03', 'What I offer', 'Simulation tooling, and honest feedback on protocol design.'],
                ['04', 'Next step', 'A 20-minute call, or a written exchange.'],
              ].map(([num, label, text]) => (
                <div className="intro-q" key={num}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="intro-q-num">{num}</span>
                    <span className="tiny strong">{label}</span>
                  </div>
                  <p className="intro-q-text">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="metric-row">
          {METRICS.map((metric) => (
            <div className="metric" key={metric.value}>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="how">
        <div className="eyebrow">How it moves</div>
        <h2 className="h2" style={{ marginTop: 12, maxWidth: '24ch' }}>
          Three steps, and the middle one is where we earn our keep.
        </h2>

        <div className="handshake section-tight">
          {HANDSHAKE.map((item) => (
            <div className="handshake-step" key={item.step}>
              <span className="handshake-step-num">{item.step}</span>
              <div className="h3" style={{ fontSize: 16 }}>
                {item.title}
              </div>
              <p className="small muted" style={{ marginTop: 10 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <div className="eyebrow">The money is shaped like the incentive</div>
          <h2 className="h2" style={{ marginTop: 12 }}>
            A fee that is spent, a bond that comes back.
          </h2>
          <p className="lede" style={{ marginTop: 16 }}>
            Two numbers, and they do different jobs. The evaluation fee is small and never refunded — it
            pays for reading the request, nothing else. The attention bond is larger, fully refundable, and
            exists purely to make sending in bulk expensive while leaving one honest introduction cheap.
          </p>

          <div className="grid-2 section-tight">
            <div className="notice" data-tone="fee">
              <span className="pill" data-tone="fee">
                spent
              </span>
              <p className="small" style={{ marginTop: 10 }}>
                Covers one bilateral evaluation. It is not a price on attention and it does not buy a reply.
              </p>
            </div>
            <div className="notice" data-tone="bond">
              <span className="pill" data-tone="bond">
                refundable
              </span>
              <p className="small" style={{ marginTop: 10 }}>
                Locked while the introduction is open. Refunded on accept, on decline, on withdrawal, and
                on expiry. There is no path where it is seized — that is a tested invariant, not a policy.
              </p>
            </div>
          </div>

          <p className="small muted" style={{ marginTop: 18 }}>
            The bond still has to be <em>worth</em> something, or it filters nobody. It scales with
            published availability, live queue congestion and how often this sender has been declined
            before — all recomputed from public data, so anyone can check the number they were quoted.
          </p>
        </div>

        <div className="card">
          <div className="eyebrow">What the bond is not</div>
          <ul className="bullets" style={{ marginTop: 14 }}>
            <li>Not a bid for attention.</li>
            <li>Not a deposit that can be forfeited by an AI verdict.</li>
            <li>Not a score attached to a person.</li>
            <li>Not a subscription, and not a tip.</li>
          </ul>
          <hr className="divider" style={{ margin: '18px 0' }} />
          <p className="small muted">
            Verified context is opt-in and per-introduction. If you disclose onchain activity or a deployed
            contract, it is explained to the recipient — never turned into a wealth score, and never used
            on its own to decide access.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="row-between">
          <div>
            <div className="eyebrow">Scope discipline</div>
            <h2 className="h2" style={{ marginTop: 12 }}>
              What SignalPass deliberately is not.
            </h2>
          </div>
          <Link href="/status" className="btn btn-ghost btn-sm">
            What is built
          </Link>
        </div>

        <div className="grid-2 section-tight">
          <div className="card-quiet">
            <div className="strong small">Not a public feed</div>
            <p className="small muted" style={{ marginTop: 6 }}>
              There is no wall of open requests to browse. An introduction has one addressee.
            </p>
          </div>
          <div className="card-quiet">
            <div className="strong small">Not a chat platform</div>
            <p className="small muted" style={{ marginTop: 6 }}>
              SignalPass ends where a conversation begins. Once two people agree, they leave.
            </p>
          </div>
          <div className="card-quiet">
            <div className="strong small">Not pay-to-DM</div>
            <p className="small muted" style={{ marginTop: 6 }}>
              Money never buys a reply. Accept and decline are equally free, and the bond returns either way.
            </p>
          </div>
          <div className="card-quiet">
            <div className="strong small">Not an AI gatekeeper</div>
            <p className="small muted" style={{ marginTop: 6 }}>
              The agents describe fit and coach the sender. They cannot grant access or move funds.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card-raised">
          <div className="row-between" style={{ flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '52ch' }}>
              <h2 className="h2">Try the whole loop.</h2>
              <p className="small muted" style={{ marginTop: 10 }}>
                Write an introduction as one builder, watch both halves of the evaluation, then switch to the
                recipient’s inbox and decide. The quote recomputes as you type.
              </p>
            </div>
            <div className="row">
              <Link href="/builders" className="btn">
                Start an introduction
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import '@fontsource-variable/manrope'
import styles from './home.module.css'

const PersonaScene = dynamic(() => import('@/components/PersonaScene'), {
  ssr: false,
  loading: () => <div className={styles.sceneLoading}>Getting the introductions ready…</div>,
})

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SignalMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
    >
      <path d="M13 5 4 14v6l9 9V5Zm8 0 9 9v6l-9 9V5Z" fill="currentColor" />
      <circle cx="17" cy="17" r="2" fill="currentColor" />
    </svg>
  )
}

function Spark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m20 2 4.3 13.7L38 20l-13.7 4.3L20 38l-4.3-13.7L2 20l13.7-4.3L20 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

const PREVIEW = [
  {
    label: 'The spark',
    title: 'A good reason to say hello.',
    text: 'Alice builds simulation tools. Bob designs event pipelines. There might be something here.',
    note: 'A shared interest in Monad tooling',
    action: 'Meet Bob',
    href: '/builders/bob',
  },
  {
    label: 'The summary',
    title: 'Common ground, found.',
    text: 'Alice can help test Bob’s indexing pipeline. Bob brings the event expertise her simulator needs.',
    note: 'Your agent brings you the useful part',
    action: 'Try this introduction',
    href: '/introduce/bob',
  },
  {
    label: 'Your call',
    title: 'Worth a conversation?',
    text: 'The introduction is ready for a decision. Bob can accept or decline. A little context goes a long way.',
    note: 'People make the final decision',
    action: 'Explore the demo inbox',
    href: '/inbox/bob',
  },
] as const

const STEPS = [
  {
    title: 'Find someone who gets it.',
    text: 'Discover what people are building, what they can offer, and who they’d love to meet.',
  },
  {
    title: 'Let your agents connect the dots.',
    text: 'You cover the evaluation. Your agents help prepare the introduction and bring back a clear summary.',
  },
  {
    title: 'Make the human connection.',
    text: 'See why it might matter. Choose whether to say hello. Your attention stays yours.',
  },
] as const

export default function HomePage() {
  const [phase, setPhase] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const preview = PREVIEW[phase] ?? PREVIEW[1]

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % PREVIEW.length
    else if (event.key === 'ArrowLeft') next = (index + PREVIEW.length - 1) % PREVIEW.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = PREVIEW.length - 1
    else return
    event.preventDefault()
    setPhase(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={styles.landing}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="SignalPass home">
          <SignalMark />
          SignalPass
          <span className={styles.brandDot} />
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <a href="#how-it-works">The idea</a>
          <Link href="/builders">Meet builders</Link>
          <Link href="/inbox/bob">Your introductions</Link>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/builders" className={styles.navCta}>
            Try the demo <Arrow diagonal />
          </Link>
          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d={menuOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 8h16M4 16h16'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav
          className={styles.mobileNav}
          id="mobile-menu"
          hidden={!menuOpen}
          aria-label="Mobile navigation"
        >
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            The idea
          </a>
          <Link href="/builders">Meet builders</Link>
          <Link href="/inbox/bob">Your introductions</Link>
          <Link href="/status">Demo status</Link>
        </nav>
      </header>
      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <h1 id="hero-title">
              Your people.
              <br />
              Closer than
              <br />
              <span>you think.</span>
              <Spark className={styles.titleSpark} />
            </h1>
            <p className={styles.heroDescription}>
              A social space for Monad builders.
              <br />
              Let your agents find the common ground.
              <br />
              You take it from there.
            </p>
            <div className={styles.heroActions}>
              <Link href="/builders" className={styles.primaryButton}>
                Find your people <Arrow diagonal />
              </Link>
              <a href="#introduction-preview" className={styles.playLink}>
                <span className={styles.playIcon}>
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="m4 2 6 4-6 4V2Z" fill="currentColor" />
                  </svg>
                </span>
                See an introduction
              </a>
            </div>
            <div className={styles.demoNote}>
              <span />
              An early look. Try it with Alice &amp; Bob.
              <Link href="/status" aria-label="See what works in this demo">
                <Arrow />
              </Link>
            </div>
          </div>
          <div className={styles.heroStage} id="introduction-preview">
            <div className={styles.stageTop}>
              <span>
                <span className={styles.networkDiamond} />
                Made for a more human internet
              </span>
              <Spark />
            </div>
            <div className={styles.sceneWrap}>
              <PersonaScene phase={phase} />
            </div>
            <span className={`${styles.agentName} ${styles.aliceLabel}`}>
              <span />
              Alice’s agent
            </span>
            <span className={`${styles.agentName} ${styles.bobLabel}`}>
              <span />
              Bob’s agent
            </span>
            <div
              className={styles.resultCard}
              role="tabpanel"
              id="intro-panel"
              aria-labelledby={`intro-tab-${phase}`}
            >
              <div className={styles.resultMeta}>
                <span className={styles.matchIcon}>
                  <SignalMark />
                </span>
                <span>Alice &amp; Bob</span>
                <span className={styles.exampleLabel}>Illustrated example</span>
              </div>
              <div className={styles.resultContent} aria-live="polite">
                <h2>{preview.title}</h2>
                <p>{preview.text}</p>
              </div>
              <div className={styles.resultBottom}>
                <span>{preview.note}</span>
                <Link href={preview.href} aria-label={preview.action}>
                  <Arrow diagonal />
                </Link>
              </div>
            </div>
            <div className={styles.previewTabs} role="tablist" aria-label="Explore an introduction">
              {PREVIEW.map((item, index) => (
                <button
                  key={item.label}
                  id={`intro-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={phase === index}
                  aria-controls="intro-panel"
                  tabIndex={phase === index ? 0 : -1}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  onClick={() => setPhase(index)}
                  onKeyDown={(event) => moveTab(event, index)}
                >
                  <span>{index + 1}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>
        <div className={styles.beliefStrip}>
          <span>Less cold outreach.</span>
          <Spark />
          <span>More common ground.</span>
          <Spark />
          <span>Always your call.</span>
        </div>
        <section className={styles.howSection} id="how-it-works" aria-labelledby="how-title">
          <div className={styles.sectionLead}>
            <h2 id="how-title">
              A little help with
              <br />
              the first hello.
            </h2>
            <p>
              The best connections start with something in common. SignalPass helps you find it,
              before you give someone your time.
            </p>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className={styles.peopleSection} aria-labelledby="people-title">
          <div className={styles.peopleHeading}>
            <h2 id="people-title">
              Different talents.
              <br />
              <span>Something in common.</span>
            </h2>
            <Link href="/builders" className={styles.textLink}>
              Explore the demo builders <Arrow diagonal />
            </Link>
          </div>
          <div className={styles.peopleGrid}>
            <Link href="/builders/alice" className={`${styles.personCard} ${styles.aliceCard}`}>
              <div className={styles.personTop}>
                <span className={styles.initial}>a.</span>
                <span>Open to introductions</span>
                <Arrow diagonal />
              </div>
              <h3>Alice</h3>
              <p className={styles.personRole}>Making contracts easier to test.</p>
              <p className={styles.personDetail}>
                Building a deterministic simulation harness for Monad contracts. Looking for
                protocol engineers who have shipped.
              </p>
              <div className={styles.personTags}>
                <span>Simulation</span>
                <span>Protocol design</span>
                <span>Monad</span>
              </div>
              <span className={styles.sampleProfile}>Demo profile · @alice</span>
            </Link>
            <Link href="/builders/bob" className={`${styles.personCard} ${styles.bobCard}`}>
              <div className={styles.personTop}>
                <span className={styles.initial}>b.</span>
                <span>Making room for the right idea</span>
                <Arrow diagonal />
              </div>
              <h3>Bob</h3>
              <p className={styles.personRole}>Connecting the onchain dots.</p>
              <p className={styles.personDetail}>
                Building indexing infrastructure for social graphs. Looking for builders solving
                discovery and attention.
              </p>
              <div className={styles.personTags}>
                <span>Social graphs</span>
                <span>Indexing</span>
                <span>Monad</span>
              </div>
              <span className={styles.sampleProfile}>Demo profile · @bob</span>
            </Link>
          </div>
          <p className={styles.peopleFootnote}>
            Two sample profiles. A small glimpse of the connections we’re building for.
          </p>
        </section>
        <section className={styles.termsSection} aria-labelledby="terms-title">
          <div>
            <SignalMark className={styles.termsMark} />
            <h2 id="terms-title">
              A thoughtful hello.
              <br />
              On your terms.
            </h2>
            <p>
              A little intention goes a long way.
              <br />
              Here’s what happens when you reach out.
            </p>
          </div>
          <div className={styles.termsList}>
            <article>
              <span>01</span>
              <div>
                <h3>You cover the evaluation.</h3>
                <p>
                  The sender pays for the agents’ work, including the recipient’s evaluation. The
                  quote is shown before you submit.
                </p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Your bond comes back.</h3>
                <p>
                  A separate, refundable bond stays with the introduction until it resolves. The
                  evaluation fee is spent.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>They choose to connect.</h3>
                <p>
                  Agents find context and suggest a next step. A person decides whether the
                  introduction feels right.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className={styles.closing} aria-labelledby="closing-title">
          <Spark />
          <h2 id="closing-title">
            Your next good conversation
            <br />
            starts with a little signal.
          </h2>
          <Link href="/builders" className={styles.primaryButton}>
            Find your people <Arrow diagonal />
          </Link>
          <p>Explore the working introduction demo.</p>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link href="/" className={styles.brand}>
          <SignalMark />
          SignalPass
        </Link>
        <span>Built for people building on Monad.</span>
        <div>
          <Link href="/status">Demo status</Link>
          <Link href="/builders">
            Meet the builders <Arrow diagonal />
          </Link>
        </div>
      </footer>
    </div>
  )
}

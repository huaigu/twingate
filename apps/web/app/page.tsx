'use client'

import { useState } from 'react'
import Link from 'next/link'
import '@fontsource-variable/manrope'
import styles from './home.module.css'

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

const STEPS = [
  {
    title: 'Ask your agent to find a fit.',
    text: 'Start with what you are building and who you hope to meet. Your agent surfaces public profiles with a reason.',
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function handleNotNow() {
    setToastMessage('Introduction with Bob snoozed for now. Alice & Bob can reconnect anytime.')
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  return (
    <div className={styles.landing}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>

      {/* Desktop 1:1 Hero Stage (Screens >= 1024px) */}
      <section className={styles.desktopHeroStage} aria-label="SignalPass introduction overview">
        <div className={styles.stageFrame}>
          <img
            src="/design/signalpass-home-reference.png"
            className={styles.stageBackdrop}
            alt="SignalPass — Builders find builders on Monad. Make the first hello count. Agents prepare. People decide."
            width={1672}
            height={941}
          />

          {/* Accessible content for screen readers & search engines */}
          <div className={styles.srOnly}>
            <header>
              <h2>SignalPass — Builders find builders on Monad</h2>
              <p>A more thoughtful internet starts with better introductions.</p>
            </header>
            <h1>Make the first hello count</h1>
            <p>Agents prepare. People decide.</p>
            <p>Same builders. A more human internet.</p>
            <section>
              <h3>Shared context, real conversations</h3>
              <p>Alice: Building dev tools, Monad ecosystem, Open to collaboration, Values long-term builders</p>
              <p>Bob: Building infrastructure, Monad ecosystem, Exploring partnerships, Values practical impact</p>
              <p>Common Ground: Monad builders, Infrastructure x tools, Long-term mindset, Open to explore</p>
            </section>
            <aside>
              <h3>Behind the scenes</h3>
              <ol>
                <li>Agents find genuine common ground privately.</li>
                <li>They prepare relevant context (on both sides).</li>
                <li>You decide whether to meet.</li>
              </ol>
              <p>Higher signal brighter builders on Monad.</p>
            </aside>
          </div>

          {/* Top Nav Interactive Hotspots */}
          <Link href="/" className={styles.stageNavBrand} aria-label="SignalPass home" />
          <a href="#how-it-works" className={styles.stageNavLinkHow} aria-label="How it works" />
          <Link href="/builders" className={styles.stageNavLinkBuilders} aria-label="For builders" />
          <a href="#terms-title" className={styles.stageNavLinkApproach} aria-label="Our approach" />
          <Link href="/builders" className={styles.stageNavCta} aria-label="Explore introductions" />

          {/* Hero Left CTA Button */}
          <Link href="/builders" className={styles.stageHeroCta} aria-label="Explore introductions" />

          {/* Center Card Interactive Action Buttons */}
          <button
            type="button"
            className={styles.stageCardNotNow}
            onClick={handleNotNow}
            aria-label="Not for now"
            title="Snooze this introduction"
          />
          <Link
            href="/introduce/bob"
            className={styles.stageCardYourCall}
            aria-label="Your call"
            title="Review introduction with Bob"
          />

          {/* Venn Diagram Hotspots with Tooltips */}
          <div className={styles.stageVennAlice} title="Alice: Building simulation harness & dev tools" />
          <div className={styles.stageVennCommon} title="Common Ground: 4 shared alignment factors found by agents" />
          <div className={styles.stageVennBob} title="Bob: Building indexing infrastructure & social graphs" />

          {/* Right Behind the Scenes Steps */}
          <a href="#how-it-works" className={styles.stageStep1} title="Step 1: Agents find genuine common ground privately." />
          <a href="#how-it-works" className={styles.stageStep2} title="Step 2: They prepare relevant context (on both sides)." />
          <a href="#terms-title" className={styles.stageStep3} title="Step 3: You decide whether to meet." />
        </div>
      </section>

      {/* Mobile & Tablet Responsive Hero (Screens < 1024px) */}
      <div className={styles.mobileHeroSection}>
        <header className={styles.mobileHeader}>
          <Link href="/" className={styles.mobileBrand} aria-label="SignalPass home">
            <SignalMark />
            <span className={styles.mobileBrandText}>SignalPass</span>
            <span className={styles.mobileBrandSubtitle}>BUILDERS ON MONAD</span>
          </Link>
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d={menuOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 8h16M4 16h16'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {menuOpen && (
            <nav className={styles.mobileNavDrawer} aria-label="Mobile navigation">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
              <Link href="/builders" onClick={() => setMenuOpen(false)}>For builders</Link>
              <a href="#terms-title" onClick={() => setMenuOpen(false)}>Our approach</a>
              <Link href="/builders" className={styles.mobileDrawerCta} onClick={() => setMenuOpen(false)}>
                Explore introductions →
              </Link>
            </nav>
          )}
        </header>

        <div className={styles.mobileHeroCopy}>
          <p className={styles.mobileEyebrow}>BUILDERS FIND BUILDERS ON MONAD</p>
          <h1 className={styles.mobileHeadline}>
            Make the<br />
            first hello<br />
            <span className={styles.mobileCountWrap}>
              count
              <img src="/design/layers/brush-stroke-orange.png" className={styles.mobileBrushImg} alt="" />
            </span>
          </h1>
          <p className={styles.mobileSubtitle}>Agents prepare. People decide.</p>
          <Link href="/builders" className={styles.mobilePrimaryBtn}>
            Explore introductions <span>→</span>
          </Link>
          <p className={styles.mobileHandwrittenNote}>Same builders.<br />A more human internet.</p>
        </div>

        <div className={styles.mobileStageCardWrap}>
          <img
            src="/design/layers/card-full-tablet.png"
            className={styles.mobileCardImg}
            alt="Shared context introduction between Alice and Bob"
          />
          <div className={styles.mobileCardBtnRow}>
            <button
              type="button"
              className={styles.mobileBtnNotNow}
              onClick={handleNotNow}
              aria-label="Not for now"
              title="Not for now"
            />
            <Link
              href="/introduce/bob"
              className={styles.mobileBtnYourCall}
              aria-label="Your call"
              title="Your call"
            />
          </div>
        </div>

        <div className={styles.mobileBehindScenes}>
          <p className={styles.mobileScenesKicker}>BEHIND THE SCENES</p>
          <ol className={styles.mobileScenesList}>
            <li>
              <img
                src="/design/layers/icon-step-lock.png"
                className={styles.mobileSceneBadge}
                alt=""
              />
              <div>
                <strong>1. Agents find</strong>
                <p>genuine common ground privately.</p>
              </div>
            </li>
            <li>
              <img
                src="/design/layers/icon-step-doc.png"
                className={styles.mobileSceneBadge}
                alt=""
              />
              <div>
                <strong>2. They prepare</strong>
                <p>relevant context (on both sides).</p>
              </div>
            </li>
            <li>
              <img
                src="/design/layers/icon-step-star.png"
                className={styles.mobileSceneBadge}
                alt=""
              />
              <div>
                <strong>3. You decide</strong>
                <p>whether to meet.</p>
              </div>
            </li>
          </ol>
          <p className={styles.mobileScenesNote}>Higher signal brighter builders on Monad.</p>
        </div>
      </div>

      {toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          <span className={styles.toastIcon}>🔒</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main id="main">
        <div className={styles.beliefStrip}>
          <span>Less cold outreach.</span>
          <Spark />
          <span>More common ground.</span>
          <Spark />
          <span>Always your call.</span>
        </div>
        <section className={styles.signalLoopSection} aria-labelledby="loop-title">
          <div className={styles.signalLoopIntro}>
            <div>
              <span className={styles.sectionKicker}>THE SIGNAL LOOP</span>
              <h2 id="loop-title">
                From “who are they?”
                <br />
                to “should we meet?”
              </h2>
            </div>
            <p>
              SignalPass gives a first hello enough context to be useful, while keeping the
              private work and the final decision in the right hands.
            </p>
          </div>
          <div className={styles.signalLoopStage}>
            <img
              src="/design/lower/signal-loop.png"
              alt="A builder profile flows through private agent evaluation to a recipient choice"
              width={1942}
              height={809}
            />
          </div>
          <ol className={styles.signalLoopSteps}>
            <li>
              <span>01</span>
              <div>
                <h3>Show what you’re building.</h3>
                <p>Your profile makes your work, interests and availability legible.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Let agents find the overlap.</h3>
                <p>Two private agents prepare a short, relevant summary for both sides.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Choose what happens next.</h3>
                <p>Accept, ask for context or pass. The human decision stays yours.</p>
              </div>
            </li>
          </ol>
        </section>
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
            Your next good conversation{" "}
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

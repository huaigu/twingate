'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useV3Demo } from '@/lib/v3-context'
import { CANDIDATES_CATALOG, type DiscoveryGoal } from '@/lib/v3-data'
import { SignalPassHeader } from '@/components/v3/header'
import {
  ChatBubbleIcon,
  HandshakeIcon,
  BookIcon,
  PencilIcon,
  CheckmarkIcon,
  InfoIcon,
} from '@/components/v3/icons'

export default function NewIntroductionPage({
  params,
}: {
  params: Promise<{ candidateId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { profile, createOrUpdateDraft, addToast } = useV3Demo()

  const candidate =
    CANDIDATES_CATALOG.find((c) => c.id === resolvedParams.candidateId) ??
    CANDIDATES_CATALOG[0]!

  const [selectedGoal, setSelectedGoal] = useState<DiscoveryGoal>('chat')
  const [personalNote, setPersonalNote] = useState(
    `Hi ${candidate.name}, I've been following your work and really appreciate your perspective on open infrastructure.`
  )
  const [exploreTopic, setExploreTopic] = useState(
    `I'd love to hear more about your experience building on Monad and where you see the ecosystem going.`
  )
  const [canOffer, setCanOffer] = useState(
    `I work on developer tools and can share some lessons from our recent build.`
  )
  const [openingQuestion, setOpeningQuestion] = useState(
    `Would you be open to a 20 minute chat about community tools and onboarding?`
  )
  const [showVerifiedContext, setShowVerifiedContext] = useState(true)

  function handleProceedToConfirm() {
    const newId = createOrUpdateDraft(
      candidate.id,
      {
        personalNote,
        exploreTopics: exploreTopic,
        whatIOffer: canOffer,
        specificQuestions: openingQuestion,
      },
      selectedGoal
    )

    addToast('Introduction draft created. Proceeding to confirmation.', 'info')
    router.push(`/introductions/${newId}/confirm`)
  }

  // Choose candidate avatar image
  const candidateAvatarImg =
    candidate.id === 'rohan'
      ? '/design/slices/avatar_rohan_circle.png'
      : candidate.id === 'leo'
      ? '/design/slices/avatar_leo_circle.png'
      : '/design/slices/avatar_maya_circle.png'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4efe6',
        color: '#1a1816',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Global Navigation Header */}
      <SignalPassHeader activeNav="our-approach" />

      {/* Main 1672 Master Canvas Container */}
      <main
        style={{
          maxWidth: 1672,
          margin: '0 auto',
          padding: '1.25rem 2.5rem 4rem',
        }}
      >
        {/* 2. Top Title & Stepper Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Left Title & Subtitle */}
          <div>
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: '3.25rem',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 0.4rem 0',
                lineHeight: 1.1,
              }}
            >
              A better{' '}
              <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
                first hello
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/05_brush_first_hello.png"
                  alt="Orange brushstroke underline"
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -8,
                    width: '100%',
                    height: '14px',
                    pointerEvents: 'none',
                    objectFit: 'fill',
                  }}
                />
              </span>
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                color: '#4b5563',
                margin: 0,
                fontWeight: 400,
              }}
            >
              Thoughtful introductions for conversation, collaboration and learning.
            </p>
          </div>

          {/* Stepper: (1) Choose -> (2) Draft -> (3) Confirm */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              background: '#fcfaf6',
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              border: '1px solid #e5dfd5',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            {/* Step 1: Choose (Complete) */}
            <Link
              href="/discover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1e1b4b',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 9999,
                  background: '#2528ab',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                1
              </span>
              <span>Choose</span>
            </Link>

            <span style={{ color: '#cbd5e1', fontWeight: 300 }}>&mdash;</span>

            {/* Step 2: Draft (Current) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#2528ab',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 9999,
                  border: '2px solid #2528ab',
                  background: '#ede9fe',
                  color: '#2528ab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                2
              </span>
              <span
                style={{
                  background: '#ede9fe',
                  padding: '0.2rem 0.65rem',
                  borderRadius: 9999,
                }}
              >
                Draft
              </span>
            </div>

            <span style={{ color: '#cbd5e1', fontWeight: 300 }}>&mdash;</span>

            {/* Step 3: Confirm */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#94a3b8',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 9999,
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                }}
              >
                3
              </span>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* 3. Main 4-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px minmax(460px, 1fr) minmax(520px, 1.15fr) 240px',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          {/* Column 1: Left Character Art (Alex Standing with Notebook & Scraps) */}
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/p5_alex_with_note.png"
              alt="My Personal Agent - Alex standing with notebook"
              style={{
                width: '100%',
                maxWidth: 260,
                objectFit: 'contain',
                filter: 'drop-shadow(0 14px 28px rgba(35, 26, 12, 0.12))',
              }}
            />
          </div>

          {/* Column 2: Center-Left Card - "My Personal Agent" Form */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1px solid #e8e2d5',
              padding: '1.75rem',
              boxShadow: '0 12px 36px rgba(35, 26, 12, 0.08)',
              position: 'relative',
            }}
          >
            {/* Card Header: Icon + Title + Suggested Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* Monad Violet Beans Logo */}
                <div style={{ width: 26, height: 22, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 11, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #3b28cc, #6346eb)', transform: 'rotate(-20deg)' }} />
                  <div style={{ width: 11, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', transform: 'rotate(-20deg)', marginLeft: -3 }} />
                </div>
                <h2
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    margin: 0,
                    color: '#111827',
                  }}
                >
                  My Personal Agent
                </h2>
              </div>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>✦</span> Suggested, not sent
              </span>
            </div>

            <p
              style={{
                margin: '0 0 1.35rem',
                fontSize: '0.875rem',
                color: '#4b5563',
                lineHeight: 1.5,
              }}
            >
              I&apos;ve drafted a thoughtful introduction based on your goal and what we know about both of you. Feel free to edit anything before sending.
            </p>

            {/* Goal Selector (Chat, Collaborate, Learn) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  display: 'block',
                  marginBottom: '0.6rem',
                }}
              >
                What&apos;s your goal for this introduction?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                {/* Chat Button */}
                <button
                  type="button"
                  onClick={() => setSelectedGoal('chat')}
                  style={{
                    padding: '0.85rem 0.5rem',
                    borderRadius: 12,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: selectedGoal === 'chat' ? '#ede9fe' : '#faf8f5',
                    border: selectedGoal === 'chat' ? '2px solid #6366f1' : '1px solid #e5dfd5',
                    transition: 'all 0.15s ease',
                    boxShadow: selectedGoal === 'chat' ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <ChatBubbleIcon size={16} color={selectedGoal === 'chat' ? '#4338ca' : '#64748b'} />
                    <strong style={{ fontSize: '0.875rem', color: selectedGoal === 'chat' ? '#312e81' : '#1e293b' }}>
                      Chat
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.25, display: 'block' }}>
                    Have a thoughtful conversation
                  </span>
                </button>

                {/* Collaborate Button */}
                <button
                  type="button"
                  onClick={() => setSelectedGoal('collaborate')}
                  style={{
                    padding: '0.85rem 0.5rem',
                    borderRadius: 12,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: selectedGoal === 'collaborate' ? '#ede9fe' : '#faf8f5',
                    border: selectedGoal === 'collaborate' ? '2px solid #6366f1' : '1px solid #e5dfd5',
                    transition: 'all 0.15s ease',
                    boxShadow: selectedGoal === 'collaborate' ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <HandshakeIcon size={16} color={selectedGoal === 'collaborate' ? '#4338ca' : '#64748b'} />
                    <strong style={{ fontSize: '0.875rem', color: selectedGoal === 'collaborate' ? '#312e81' : '#1e293b' }}>
                      Collaborate
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.25, display: 'block' }}>
                    Explore working together
                  </span>
                </button>

                {/* Learn Button */}
                <button
                  type="button"
                  onClick={() => setSelectedGoal('learn')}
                  style={{
                    padding: '0.85rem 0.5rem',
                    borderRadius: 12,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: selectedGoal === 'learn' ? '#ede9fe' : '#faf8f5',
                    border: selectedGoal === 'learn' ? '2px solid #6366f1' : '1px solid #e5dfd5',
                    transition: 'all 0.15s ease',
                    boxShadow: selectedGoal === 'learn' ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <BookIcon size={16} color={selectedGoal === 'learn' ? '#4338ca' : '#64748b'} />
                    <strong style={{ fontSize: '0.875rem', color: selectedGoal === 'learn' ? '#312e81' : '#1e293b' }}>
                      Learn
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.25, display: 'block' }}>
                    Ask questions and learn from them
                  </span>
                </button>
              </div>
            </div>

            {/* 4 Numbered Editable Rows styled as 2-column cards matching 05-introduction-composer.png */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Row 1: Add a personal note */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.85rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>
                  1. Add a personal note
                </span>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '0.6rem 0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <textarea
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    rows={2}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.825rem',
                      color: '#334155',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                    }}
                  />
                  <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }}>
                    <PencilIcon size={14} color="#94a3b8" />
                  </span>
                </div>
              </div>

              {/* Row 2: What do you want to explore? */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.85rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>
                  2. What do you want to explore?
                </span>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '0.6rem 0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <textarea
                    value={exploreTopic}
                    onChange={(e) => setExploreTopic(e.target.value)}
                    rows={2}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.825rem',
                      color: '#334155',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                    }}
                  />
                  <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }}>
                    <PencilIcon size={14} color="#94a3b8" />
                  </span>
                </div>
              </div>

              {/* Row 3: What can you bring to the conversation? */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.85rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>
                  3. What can you bring to the conversation?
                </span>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '0.6rem 0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <textarea
                    value={canOffer}
                    onChange={(e) => setCanOffer(e.target.value)}
                    rows={2}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.825rem',
                      color: '#334155',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                    }}
                  />
                  <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }}>
                    <PencilIcon size={14} color="#94a3b8" />
                  </span>
                </div>
              </div>

              {/* Row 4: Any specific questions or topics? */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.85rem', alignItems: 'start' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem' }}>
                  4. Any specific questions or topics?
                </span>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '0.6rem 0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <textarea
                    value={openingQuestion}
                    onChange={(e) => setOpeningQuestion(e.target.value)}
                    rows={2}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.825rem',
                      color: '#334155',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.4,
                    }}
                  />
                  <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }}>
                    <PencilIcon size={14} color="#94a3b8" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Center-Right Card - "INTRODUCTION CARD" Preview */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1px solid #e8e2d5',
              padding: '1.75rem',
              boxShadow: '0 12px 36px rgba(35, 26, 12, 0.08)',
              position: 'relative',
            }}
          >
            {/* Tablet Header: SignalPass Brand + Introduction Card Monospace Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 24, height: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 10, height: 18, borderRadius: 9, background: 'linear-gradient(135deg, #3b28cc, #6346eb)', transform: 'rotate(-20deg)' }} />
                  <div style={{ width: 10, height: 18, borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', transform: 'rotate(-20deg)', marginLeft: -3 }} />
                </div>
                <span
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: '#111827',
                  }}
                >
                  SignalPass
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                INTRODUCTION CARD
              </span>
            </div>

            {/* Title: Two curious people. A thoughtful starting point. */}
            <h3
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: '1.45rem',
                fontWeight: 700,
                margin: '0 0 1.25rem',
                textAlign: 'center',
                color: '#111827',
                lineHeight: 1.25,
              }}
            >
              Two curious people.{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                A thoughtful starting point.
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -3,
                    width: '100%',
                    height: '3px',
                    background: '#f59e0b',
                    borderRadius: 2,
                  }}
                />
              </span>
            </h3>

            {/* Venn Diagram / Avatars Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '1.5rem 0',
                position: 'relative',
              }}
            >
              {/* Left Persona: You (Alex Chen) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/design/slices/persona_alex_round.png"
                  alt="You (Alex Chen)"
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 9999,
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    objectFit: 'cover',
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b4b', marginTop: '0.4rem' }}>
                  You
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  BUILDER ON MONAD
                </span>
              </div>

              {/* Venn Center Lens: Sliced center graphic or styled pill */}
              <div
                style={{
                  margin: '0 -16px',
                  zIndex: 2,
                  background: '#f5f3ff',
                  border: '1.5px dashed #818cf8',
                  borderRadius: 18,
                  padding: '0.6rem 1rem',
                  textAlign: 'center',
                  maxWidth: 175,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.12)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#4f46e5',
                    textTransform: 'uppercase',
                    display: 'block',
                    letterSpacing: '0.05em',
                  }}
                >
                  ✦ SHARED CURIOSITY
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#1e1b4b',
                    lineHeight: 1.3,
                    display: 'block',
                    marginTop: '0.25rem',
                  }}
                >
                  Open infrastructure for more people
                </span>
              </div>

              {/* Right Persona: Candidate (Maya, Rohan, or Leo) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidateAvatarImg}
                  alt={candidate.name}
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 9999,
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    objectFit: 'cover',
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b4b', marginTop: '0.4rem' }}>
                  {candidate.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  BUILDER ON MONAD
                </span>
              </div>
            </div>

            {/* Comparison Table: YOU CAN OFFER vs THEY CAN OFFER */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1.1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '0.55rem',
                  }}
                >
                  YOU CAN OFFER
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>📦</span> <span>Developer tools experience</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>👥</span> <span>Community perspective</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>📄</span> <span>Lessons from recent builds</span>
                  </div>
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '0.55rem',
                  }}
                >
                  THEY CAN OFFER
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>💡</span> <span>Deep experience with Monad</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>📖</span> <span>Insights on ecosystem growth</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>👥</span> <span>Introductions to relevant builders</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Verified Context Green Banner */}
            {showVerifiedContext && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 9999,
                      background: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckmarkIcon size={13} color="#ffffff" />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: '#166534',
                        textTransform: 'uppercase',
                        display: 'block',
                        letterSpacing: '0.04em',
                      }}
                    >
                      OPTIONAL VERIFIED CONTEXT
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.3 }}>
                      You both have publicly available work on Monad. This helps build trust.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerifiedContext(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#166534',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Hide context
                </button>
              </div>
            )}

            {/* Action Button: Approve and send */}
            <button
              type="button"
              onClick={handleProceedToConfirm}
              style={{
                width: '100%',
                padding: '0.95rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
                background: '#1e22aa',
                border: 'none',
                borderRadius: 9999,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(30, 34, 170, 0.3)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '0.45rem',
              }}
            >
              <span>Approve and send</span>
              <span style={{ fontSize: '1.15rem' }}>&rarr;</span>
            </button>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                textAlign: 'center',
                display: 'block',
                marginBottom: '1.15rem',
              }}
            >
              You approve before anything is shared
            </span>

            {/* Fees Bottom Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '0.75rem',
                fontSize: '0.78rem',
                color: '#64748b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>💳</span>
                <span>Evaluation fee (0.005 MON)</span>
                <InfoIcon size={12} color="#94a3b8" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🛡️</span>
                <span>Refundable attention bond (0.05 MON)</span>
                <InfoIcon size={12} color="#94a3b8" />
              </div>
            </div>
          </div>

          {/* Column 4: Right Collage Scraps & Notes matching 05-introduction-composer.png */}
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/05_right_column_full.png"
              alt="You approve before anything is shared. Real people, real progress. Purple arch scrap."
              style={{
                width: '100%',
                maxWidth: 240,
                objectFit: 'contain',
                filter: 'drop-shadow(0 14px 28px rgba(35, 26, 12, 0.12))',
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useV3Demo } from '@/lib/v3-context'
import { SignalPassHeader } from '@/components/v3/header'

export default function WidgetCreatePage() {
  const { profile, addToast } = useV3Demo()

  const [widgetPersona, setWidgetPersona] = useState<'alex' | 'rohan' | 'beanie' | 'none'>('alex')
  const [widgetName, setWidgetName] = useState('Alex Chen')
  const [widgetHeadline, setWidgetHeadline] = useState('Building a more open internet with builders.')
  const [widgetTags, setWidgetTags] = useState(['Builders', 'Open Source', 'Monad', 'Product', 'Community'])
  const [newTag, setNewTag] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [widgetCta, setWidgetCta] = useState('Meet me on SignalPass')
  const [copied, setCopied] = useState(false)

  const personaAvatarMap = {
    alex: '/design/slices/persona_alex_round.png',
    rohan: '/design/slices/persona_rohan_round.png',
    beanie: '/design/slices/persona_beanie_round.png',
    none: '',
  }

  const embedCode = `<div id="signalpass-widget" data-username="${widgetName.toLowerCase().replace(/\s+/g, '-')}"></div>
<script src="https://widget.signalpass.xyz/v1/widget.js" async></script>`

  function handleAddTag() {
    if (!newTag.trim()) return
    if (widgetTags.includes(newTag.trim())) return
    setWidgetTags([...widgetTags, newTag.trim()])
    setNewTag('')
    setShowAddTag(false)
    addToast('Interest tag added to widget', 'info')
  }

  function handleRemoveTag(tag: string) {
    setWidgetTags(widgetTags.filter((t) => t !== tag))
  }

  function handleCopy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    addToast('Embed code copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  const tagColors = [
    { bg: '#ede9fe', text: '#4329b5' }, // purple
    { bg: '#dcfce7', text: '#166534' }, // green
    { bg: '#ede9fe', text: '#4329b5' }, // purple
    { bg: '#e0f2fe', text: '#0369a1' }, // sky
    { bg: '#ffedd5', text: '#9a3412' }, // peach
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f6f3ed',
        backgroundImage: 'radial-gradient(rgba(18, 16, 22, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        color: '#14121a',
        paddingBottom: '4rem',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header */}
      <SignalPassHeader activeNav="for-builders" />

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1672px',
          margin: '0 auto',
          padding: '1rem 2.5rem',
          position: 'relative',
        }}
      >
        {/* Title Block */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '3.4rem',
              fontWeight: 700,
              margin: '0 0 0.4rem',
              color: '#14121a',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            Your{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              Profile Widget
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: -6,
                  width: '100%',
                  height: 8,
                  background: 'url(/design/slices/04_brush_profile_widget.png) no-repeat center',
                  backgroundSize: '100% 100%',
                  pointerEvents: 'none',
                }}
              />
            </span>
          </h1>
          <p style={{ margin: '0.6rem 0 0', fontSize: '1.25rem', color: '#555048' }}>
            A little card for your corner of the internet.
          </p>

          {/* Handwriting: Small introductions Big opportunities. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/04_note_small_intros.png"
            alt="Small introductions Big opportunities."
            style={{ position: 'absolute', left: 880, top: 20, width: 170, height: 'auto', pointerEvents: 'none' }}
          />

          {/* Mountain Photo Scrap top right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/04_scrap_mountain_arch.png"
            alt="Brighter together."
            style={{ position: 'absolute', right: 0, top: -10, width: 230, height: 'auto', pointerEvents: 'none' }}
          />
        </div>

        {/* 2-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(480px, 580px) 1fr',
            gap: '3.5rem',
            alignItems: 'start',
            position: 'relative',
          }}
        >
          {/* Handwriting: Your people can find you here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/04_note_people_can_find.png"
            alt="Your people can find you here."
            style={{ position: 'absolute', left: -75, top: 80, width: 75, height: 'auto', pointerEvents: 'none' }}
          />

          {/* Plant corner on bottom left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/04_plant_corner_left.png"
            alt="Plant decoration"
            style={{ position: 'absolute', left: -90, bottom: -40, width: 100, height: 'auto', pointerEvents: 'none' }}
          />

          {/* Scrap bottom left: Same builders */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/04_scrap_same_builders.png"
            alt="Same builders. A more human internet."
            style={{ position: 'absolute', left: -85, bottom: -120, width: 120, height: 'auto', pointerEvents: 'none' }}
          />

          {/* Left Column: Customization Controls Card */}
          <div
            style={{
              background: '#fdfbf7',
              border: '1px solid #d9d2c4',
              borderRadius: 20,
              padding: '2.25rem 2rem',
              boxShadow: '0 10px 30px rgba(45, 30, 20, 0.07)',
            }}
          >
            {/* Choose a Persona (optional) */}
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '1rem' }}>
                Choose a Persona <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.9375rem' }}>(optional)</span>
              </span>

              {/* 4 Avatar Pickers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Alex */}
                <div
                  onClick={() => setWidgetPersona('alex')}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    width: 72,
                    height: 72,
                    borderRadius: 9999,
                    border: widgetPersona === 'alex' ? '3px solid #2563eb' : '2px solid transparent',
                    boxShadow: widgetPersona === 'alex' ? '0 0 0 2px #fff, 0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/design/slices/persona_alex_round.png" alt="Alex" style={{ width: '100%', height: '100%', borderRadius: 9999, objectFit: 'cover' }} />
                  {widgetPersona === 'alex' && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 9999, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, border: '2px solid #fff' }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Rohan */}
                <div
                  onClick={() => setWidgetPersona('rohan')}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    width: 72,
                    height: 72,
                    borderRadius: 9999,
                    border: widgetPersona === 'rohan' ? '3px solid #2563eb' : '2px solid transparent',
                    boxShadow: widgetPersona === 'rohan' ? '0 0 0 2px #fff, 0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/design/slices/persona_rohan_round.png" alt="Rohan" style={{ width: '100%', height: '100%', borderRadius: 9999, objectFit: 'cover' }} />
                  {widgetPersona === 'rohan' && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 9999, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, border: '2px solid #fff' }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Beanie Girl */}
                <div
                  onClick={() => setWidgetPersona('beanie')}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    width: 72,
                    height: 72,
                    borderRadius: 9999,
                    border: widgetPersona === 'beanie' ? '3px solid #2563eb' : '2px solid transparent',
                    boxShadow: widgetPersona === 'beanie' ? '0 0 0 2px #fff, 0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/design/slices/persona_beanie_round.png" alt="Beanie" style={{ width: '100%', height: '100%', borderRadius: 9999, objectFit: 'cover' }} />
                  {widgetPersona === 'beanie' && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 9999, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, border: '2px solid #fff' }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* No persona */}
                <div
                  onClick={() => setWidgetPersona('none')}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 9999,
                      background: '#e2ddd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: widgetPersona === 'none' ? '3px solid #2563eb' : '2px solid transparent',
                      boxShadow: widgetPersona === 'none' ? '0 0 0 2px #fff, 0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.75rem', color: '#475569' }}>👤</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>No persona</span>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.5rem' }}>
                Name
              </label>
              <input
                type="text"
                value={widgetName}
                onChange={(e) => setWidgetName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.1rem',
                  fontSize: '1rem',
                  background: '#f8f6f0',
                  border: '1px solid #d5cebf',
                  borderRadius: 10,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* One-line introduction Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.5rem' }}>
                One-line introduction
              </label>
              <input
                type="text"
                value={widgetHeadline}
                onChange={(e) => setWidgetHeadline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.1rem',
                  fontSize: '1rem',
                  background: '#f8f6f0',
                  border: '1px solid #d5cebf',
                  borderRadius: 10,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Public interests */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a' }}>
                  Public interests
                </label>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Add 3–5 interests
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {widgetTags.map((tag, idx) => {
                  const color = tagColors[idx % tagColors.length] ?? { bg: '#ede9fe', text: '#4329b5' }
                  return (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.95rem',
                        background: color.bg,
                        color: color.text,
                        borderRadius: 9999,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ border: 'none', background: 'transparent', color: color.text, cursor: 'pointer', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}

                {showAddTag ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Tag..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      style={{ padding: '0.4rem 0.75rem', borderRadius: 9999, border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      style={{ padding: '0.4rem 0.85rem', borderRadius: 9999, background: '#1e22aa', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8125rem' }}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddTag(true)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: 9999,
                      border: '1px dashed #94a3b8',
                      background: 'transparent',
                      color: '#475569',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Add interest
                  </button>
                )}
              </div>
            </div>

            {/* Call to action dropdown */}
            <div>
              <label style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.5rem' }}>
                Call to action
              </label>
              <select
                value={widgetCta}
                onChange={(e) => setWidgetCta(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.1rem',
                  fontSize: '1rem',
                  background: '#f8f6f0',
                  border: '1px solid #d5cebf',
                  borderRadius: 10,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Meet me on SignalPass">Meet me on SignalPass</option>
                <option value="Connect via Agent">Connect via Agent</option>
                <option value="Explore mutual context">Explore mutual context</option>
              </select>
            </div>
          </div>

          {/* Right Column: Live Preview & Embed */}
          <div style={{ position: 'relative' }}>
            {/* Note: A card that brings the right conversations your way */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/04_note_card_brings.png"
              alt="A card that brings the right conversations your way. :)"
              style={{ position: 'absolute', right: -60, top: 80, width: 140, height: 'auto', pointerEvents: 'none' }}
            />

            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '1rem' }}>
              Live preview
            </span>

            {/* 3D Raised Physical Card Container */}
            <div
              style={{
                background: '#fcfaf6',
                border: '1px solid #d9d2c4',
                borderRadius: 24,
                padding: '2.5rem 2.5rem 2rem',
                boxShadow: '0 20px 50px rgba(45, 30, 20, 0.12), 0 4px 14px rgba(45, 30, 20, 0.06)',
                marginBottom: '2rem',
                position: 'relative',
              }}
            >
              {/* Card Top Brand & Snapshot Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 28, height: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 11, height: 18, borderRadius: 9, background: '#3b28cc', transform: 'rotate(-20deg)' }} />
                    <div style={{ width: 11, height: 18, borderRadius: 9, background: '#2563eb', transform: 'rotate(-20deg)', marginLeft: -3 }} />
                  </div>
                  <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.45rem', fontWeight: 700 }}>
                    SignalPass
                  </span>
                </div>

                <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6b7280', textTransform: 'uppercase' }}>
                  PUBLIC SNAPSHOT v1 \ | /
                </span>
              </div>

              {/* Card Main Body */}
              <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '2rem', alignItems: 'center' }}>
                {/* 3D Persona Frame */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {widgetPersona !== 'none' ? (
                    <div
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: 9999,
                        background: 'linear-gradient(135deg, #e9e3f7, #d8ccf5)',
                        padding: 6,
                        boxShadow: '0 8px 24px rgba(99, 70, 235, 0.15)',
                        position: 'relative',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={personaAvatarMap[widgetPersona]}
                        alt={widgetName}
                        style={{ width: '100%', height: '100%', borderRadius: 9999, objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: 9999,
                        background: '#e2ddd3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: '3.5rem', color: '#475569' }}>👤</span>
                    </div>
                  )}
                </div>

                {/* Identity & Tags */}
                <div>
                  <h3 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '2.35rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#14121a' }}>
                    {widgetName}
                  </h3>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', color: '#475569', lineHeight: 1.45 }}>
                    {widgetHeadline}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.75rem' }}>
                    {widgetTags.map((tag, idx) => {
                      const color = tagColors[idx % tagColors.length] ?? { bg: '#ede9fe', text: '#4329b5' }
                      return (
                        <span
                          key={tag}
                          style={{
                            padding: '0.4rem 1rem',
                            background: color.bg,
                            color: color.text,
                            borderRadius: 9999,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          {tag}
                        </span>
                      )
                    })}
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.9rem 2.25rem',
                      background: '#1b1f9b',
                      color: '#ffffff',
                      borderRadius: 9999,
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(27, 31, 155, 0.35)',
                    }}
                  >
                    {widgetCta} &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Embed On Your Site Section */}
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14121a', display: 'block', marginBottom: '0.75rem' }}>
                Embed on your site
              </span>

              {/* Code Box */}
              <div
                style={{
                  background: '#f8f6f0',
                  border: '1px solid #d5cebf',
                  borderRadius: 14,
                  padding: '1.1rem 1.25rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
                  fontSize: '0.85rem',
                  color: '#334155',
                  lineHeight: 1.6,
                  position: 'relative',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{embedCode}</div>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#64748b',
                  }}
                  title="Copy code"
                >
                  📋
                </button>
              </div>

              {/* Buttons Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 2.25rem',
                    background: '#1b1f9b',
                    color: '#ffffff',
                    borderRadius: 9999,
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(27, 31, 155, 0.3)',
                  }}
                >
                  <span>📋</span> {copied ? 'Copied!' : 'Copy embed'}
                </button>

                <button
                  type="button"
                  onClick={() => addToast('Opening widget preview demo...', 'info')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 2.25rem',
                    background: '#ffffff',
                    color: '#38342f',
                    borderRadius: 9999,
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: '1px solid #c9c2b4',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(45, 30, 20, 0.05)',
                  }}
                >
                  <span>↗</span> Preview on my site
                </button>
              </div>
            </div>

            {/* Purple Monad Scrap bottom right */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/04_scrap_purple_monad.png"
              alt="People Ideas A Brighter Monad"
              style={{ position: 'absolute', right: -30, bottom: -60, width: 220, height: 'auto', pointerEvents: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

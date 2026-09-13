'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useV3Demo } from '@/lib/v3-context'
import styles from '@/app/v3.module.css'

export default function WidgetCreatePage() {
  const { profile, addToast } = useV3Demo()

  const [widgetPersona, setWidgetPersona] = useState<'alex' | 'rohan' | 'taylor' | 'none'>('alex')
  const [widgetName, setWidgetName] = useState(profile.name)
  const [widgetHeadline, setWidgetHeadline] = useState('Building a more open internet with builders.')
  const [widgetTags, setWidgetTags] = useState(['Builders', 'Open Source', 'Monad', 'Product', 'Community'])
  const [newTag, setNewTag] = useState('')
  const [widgetCta, setWidgetCta] = useState('Meet me on SignalPass')
  const [copied, setCopied] = useState(false)
  const [showSimulatedModal, setShowSimulatedModal] = useState(false)

  const personaAvatarMap = {
    alex: '/design/slices/avatar_alex_3d.png',
    rohan: '/design/slices/avatar_rohan_candidate.png',
    taylor: '/design/slices/persona_picker_beanie.png',
    none: '',
  }

  const embedCode = `<div id="signalpass-widget" data-username="${widgetName.toLowerCase().replace(/\s+/g, '-')}"></div>
<script src="https://widget.signalpass.xyz/v1/widget.js" async></script>`

  function handleAddTag() {
    if (!newTag.trim()) return
    if (widgetTags.includes(newTag.trim())) return
    setWidgetTags([...widgetTags, newTag.trim()])
    setNewTag('')
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
    { bg: '#e0e7ff', text: '#3730a3' }, // blue
    { bg: '#dcfce7', text: '#166534' }, // green
    { bg: '#ede9fe', text: '#5b21b6' }, // purple
    { bg: '#e0f2fe', text: '#0369a1' }, // sky
    { bg: '#ffedd5', text: '#9a3412' }, // orange
  ]

  return (
    <div className={styles.v3Page}>
      <div className={styles.v3Container1672}>
        {/* Title */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <h1 className={styles.serifTitle} style={{ fontSize: '3.25rem', marginBottom: '0.25rem' }}>
            Your{' '}
            <span className={styles.orangeBrushWrapper}>
              Profile Widget
            </span>
          </h1>
          <p className={styles.leadText} style={{ fontSize: '1.25rem' }}>
            A little card for your corner of the internet.
          </p>

          {/* Floating note top right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/note_small_intros.png"
            alt="Small introductions. Big opportunities."
            style={{ position: 'absolute', right: 380, top: 10, width: 170 }}
          />
          {/* Mountain scrap top right */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/scrap_mountain_arch.png"
            alt="Brighter together"
            style={{ position: 'absolute', right: 0, top: -20, width: 220 }}
          />
        </div>

        {/* 2-Column Grid */}
        <div className={styles.widgetGrid1672} style={{ position: 'relative' }}>
          {/* Note to the left of the card */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/design/slices/note_your_people_can_find.png"
            alt="Your people can find you here."
            style={{ position: 'absolute', left: -90, top: 120, width: 85 }}
          />

          {/* Left Column: Customization Controls */}
          <div className={styles.paperTablet} style={{ position: 'relative' }}>
            {/* Plant scrap bottom left */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/design/slices/scrap_same_builders.png"
              alt="Same builders. A more human internet."
              style={{ position: 'absolute', left: -70, bottom: -40, width: 130 }}
            />

            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '0.75rem' }}>
                Choose a Persona <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {/* Alex */}
                <div
                  onClick={() => setWidgetPersona('alex')}
                  style={{ cursor: 'pointer', opacity: widgetPersona === 'alex' ? 1 : 0.7 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/persona_picker_alex.png"
                    alt="Alex"
                    style={{ width: 72, height: 72, objectFit: 'contain' }}
                  />
                </div>

                {/* Rohan */}
                <div
                  onClick={() => setWidgetPersona('rohan')}
                  style={{ cursor: 'pointer', opacity: widgetPersona === 'rohan' ? 1 : 0.7 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/persona_picker_rohan.png"
                    alt="Rohan"
                    style={{ width: 72, height: 72, objectFit: 'contain' }}
                  />
                </div>

                {/* Taylor / Beanie */}
                <div
                  onClick={() => setWidgetPersona('taylor')}
                  style={{ cursor: 'pointer', opacity: widgetPersona === 'taylor' ? 1 : 0.7 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/persona_picker_beanie.png"
                    alt="Taylor"
                    style={{ width: 72, height: 72, objectFit: 'contain' }}
                  />
                </div>

                {/* None */}
                <div
                  onClick={() => setWidgetPersona('none')}
                  style={{ cursor: 'pointer', opacity: widgetPersona === 'none' ? 1 : 0.65, transition: 'opacity 0.15s' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/design/slices/persona_picker_none.png"
                    alt="No persona"
                    style={{ width: 76, height: 76, objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>Name</label>
              <input
                type="text"
                value={widgetName}
                onChange={(e) => setWidgetName(e.target.value)}
                className={styles.inputField}
                style={{ width: '100%' }}
              />
            </div>

            {/* One-line Introduction */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>One-line introduction</label>
              <input
                type="text"
                value={widgetHeadline}
                onChange={(e) => setWidgetHeadline(e.target.value)}
                className={styles.inputField}
                style={{ width: '100%' }}
              />
            </div>

            {/* Public Interests */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Public interests</label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Add 3&ndash;5 interests</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {widgetTags.map((tag, idx) => {
                  const color = tagColors[idx % tagColors.length] ?? { bg: '#e0e7ff', text: '#3730a3' }
                  return (
                    <span
                      key={tag}
                      style={{
                        background: color.bg,
                        color: color.text,
                        padding: '0.35rem 0.75rem',
                        borderRadius: 9999,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                      >
                        &times;
                      </button>
                    </span>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="+ Add interest"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className={styles.inputField}
                  style={{ flex: 1, borderStyle: 'dashed' }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className={styles.btnSecondaryCream}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Call to action dropdown */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>Call to action</label>
              <select
                value={widgetCta}
                onChange={(e) => setWidgetCta(e.target.value)}
                className={styles.inputField}
                style={{ width: '100%', background: '#fff' }}
              >
                <option value="Meet me on SignalPass">Meet me on SignalPass</option>
                <option value="Say hello via SignalPass">Say hello via SignalPass</option>
                <option value="Connect with my Agent">Connect with my Agent</option>
              </select>
            </div>
          </div>

          {/* Right Column: Live Preview Card & Embed Code */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Live preview</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/note_card_brings_conversations.png"
                alt="A card that brings the right conversations your way. :)"
                style={{ width: 170 }}
              />
            </div>

            {/* Thick Beveled Live Preview Card */}
            <div
              className={styles.widgetPreviewTablet}
              style={{
                marginBottom: '2rem',
                border: '1px solid #cbd5e1',
                borderRadius: 24,
                boxShadow: '0 25px 60px rgba(30, 20, 10, 0.12), 0 3px 10px rgba(30, 20, 10, 0.04)',
                background: '#fdfbf7',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="7.5" cy="12" r="5.5" fill="#4338ca" />
                    <circle cx="16.5" cy="12" r="5.5" fill="#6e5bf0" fillOpacity="0.9" />
                  </svg>
                  <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.2rem', color: '#1e1b4b' }}>SignalPass</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  <span>PUBLIC SNAPSHOT v1</span>
                  <span>\|/</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                {widgetPersona !== 'none' && (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={personaAvatarMap[widgetPersona]}
                      alt={widgetName}
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 9999,
                        background: '#ddd6fe',
                        objectFit: 'cover',
                        boxShadow: '0 8px 24px rgba(109, 40, 217, 0.2)',
                      }}
                    />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#0f172a' }}>
                    {widgetName}
                  </h3>
                  <p style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#475569', lineHeight: 1.4 }}>
                    {widgetHeadline}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.5rem' }}>
                    {widgetTags.map((tag, idx) => {
                      const color = tagColors[idx % tagColors.length] ?? { bg: '#e0e7ff', text: '#3730a3' }
                      return (
                        <span
                          key={tag}
                          style={{
                            background: color.bg,
                            color: color.text,
                            padding: '0.25rem 0.65rem',
                            borderRadius: 9999,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          {tag}
                        </span>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className={styles.btnPrimaryBlue}
                    style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem' }}
                  >
                    {widgetCta} &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Embed on your site */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                Embed on your site
              </h3>
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '1rem 3.5rem 1rem 1.25rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                    color: '#334155',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {embedCode}
                </pre>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                  }}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={styles.btnPrimaryBlue}
                  style={{ flex: 1 }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy embed'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimulatedModal(true)}
                  className={styles.btnSecondaryCream}
                  style={{ flex: 1 }}
                >
                  ↗ Preview on my site
                </button>
              </div>
            </div>

            {/* Purple scrap bottom right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/design/slices/scrap_purple_monad.png"
                alt="People Ideas A Brighter Monad"
                style={{ width: 140 }}
              />
            </div>
          </div>
        </div>

        {/* Modal for Simulated Site */}
        {showSimulatedModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                maxWidth: 600,
                width: '100%',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Simulated Site Preview</h3>
                <button
                  type="button"
                  onClick={() => setShowSimulatedModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Here is how your card looks embedded in a personal portfolio or documentation website:
              </p>
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: '1.5rem' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {widgetPersona !== 'none' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={personaAvatarMap[widgetPersona]}
                      alt={widgetName}
                      style={{ width: 64, height: 64, borderRadius: 9999, background: '#ede9fe' }}
                    />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700 }}>{widgetName}</h4>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{widgetHeadline}</p>
                    <span style={{ display: 'inline-block', background: '#2528ab', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.85rem', borderRadius: 9999 }}>
                      {widgetCta} &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

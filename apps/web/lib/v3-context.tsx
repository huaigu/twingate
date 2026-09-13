'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type {
  UserProfile,
  WidgetConfig,
  Candidate,
  DiscoveryGoal,
  ProfileVisibility,
  ProfileSource,
  IntroductionRecord,
  IntroductionIntent,
  OutcomeReceipt,
} from './v3-data'
import {
  INITIAL_USER_PROFILE,
  INITIAL_WIDGET_CONFIG,
  CANDIDATES_CATALOG,
  SEEDED_INBOX_INTRODUCTIONS,
} from './v3-data'

export interface ToastItem {
  id: string
  text: string
  type: 'info' | 'success' | 'warning'
}

export interface V3ContextType {
  profile: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => void
  updateSource: (id: ProfileSource['id'], updates: Partial<ProfileSource>) => void
  setProfileVisibility: (visibility: ProfileVisibility) => void
  setAllowAgentMatching: (allow: boolean) => void
  toggleAllowedSource: (key: keyof UserProfile['allowedSources'], value: boolean) => void
  addInterest: (interest: string) => void
  removeInterest: (interest: string) => void
  
  widgetConfig: WidgetConfig
  updateWidgetConfig: (updates: Partial<WidgetConfig>) => void
  
  candidates: Candidate[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedGoal: DiscoveryGoal
  setSelectedGoal: (goal: DiscoveryGoal) => void
  isSearching: boolean
  filteredCandidates: Candidate[]
  runDiscoverySearch: (query?: string, goal?: DiscoveryGoal) => Promise<Candidate[]>
  
  introductions: IntroductionRecord[]
  getIntroById: (id: string) => IntroductionRecord | undefined
  createOrUpdateDraft: (candidateId: string, intent: Partial<IntroductionIntent>, goal?: DiscoveryGoal) => string
  confirmAndSendIntroduction: (id: string) => IntroductionRecord
  decideIntroduction: (id: string, decision: 'accepted' | 'context_requested' | 'declined', note?: string) => IntroductionRecord
  
  toasts: ToastItem[]
  addToast: (text: string, type?: 'info' | 'success' | 'warning') => void
  removeToast: (id: string) => void
}

const V3Context = createContext<V3ContextType | null>(null)

const STORAGE_KEYS = {
  PROFILE: 'signalpass_v3_profile',
  WIDGET: 'signalpass_v3_widget',
  INTROS: 'signalpass_v3_intros',
  SETTINGS: 'signalpass_v3_settings',
}

export function V3DemoProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE)
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(INITIAL_WIDGET_CONFIG)
  const [introductions, setIntroductions] = useState<IntroductionRecord[]>(SEEDED_INBOX_INTRODUCTIONS)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<DiscoveryGoal>('collaborate')
  const [isSearching, setIsSearching] = useState(false)
  const [activeFilterGoal, setActiveFilterGoal] = useState<DiscoveryGoal | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Hydrate from localStorage safely on client
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE)
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile))
      }
      const storedWidget = localStorage.getItem(STORAGE_KEYS.WIDGET)
      if (storedWidget) {
        setWidgetConfig(JSON.parse(storedWidget))
      }
      const storedIntros = localStorage.getItem(STORAGE_KEYS.INTROS)
      if (storedIntros) {
        setIntroductions(JSON.parse(storedIntros))
      }
    } catch {
      // Ignore parse/storage errors
    }
  }, [])

  const persistProfile = useCallback((p: UserProfile) => {
    setProfile(p)
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p))
    } catch {}
  }, [])

  const persistWidget = useCallback((w: WidgetConfig) => {
    setWidgetConfig(w)
    try {
      localStorage.setItem(STORAGE_KEYS.WIDGET, JSON.stringify(w))
    } catch {}
  }, [])

  const persistIntros = useCallback((intros: IntroductionRecord[]) => {
    setIntroductions(intros)
    try {
      localStorage.setItem(STORAGE_KEYS.INTROS, JSON.stringify(intros))
    } catch {}
  }, [])

  const addToast = useCallback((text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const updateSource = useCallback((id: ProfileSource['id'], updates: Partial<ProfileSource>) => {
    setProfile((prev) => {
      const nextSources = prev.sources.map((s) => (s.id === id ? { ...s, ...updates } : s))
      const next = { ...prev, sources: nextSources }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const setProfileVisibility = useCallback((visibility: ProfileVisibility) => {
    setProfile((prev) => {
      const next = { ...prev, visibility }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const setAllowAgentMatching = useCallback((allowAgentMatching: boolean) => {
    setProfile((prev) => {
      const next = { ...prev, allowAgentMatching }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const toggleAllowedSource = useCallback((key: keyof UserProfile['allowedSources'], value: boolean) => {
    setProfile((prev) => {
      const nextAllowed = { ...prev.allowedSources, [key]: value }
      const next = { ...prev, allowedSources: nextAllowed }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const addInterest = useCallback((interest: string) => {
    const trimmed = interest.trim()
    if (!trimmed) return
    setProfile((prev) => {
      if (prev.interests.includes(trimmed)) return prev
      const next = { ...prev, interests: [...prev.interests, trimmed] }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const removeInterest = useCallback((interest: string) => {
    setProfile((prev) => {
      const next = { ...prev, interests: prev.interests.filter((i) => i !== interest) }
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const updateWidgetConfig = useCallback((updates: Partial<WidgetConfig>) => {
    setWidgetConfig((prev) => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEYS.WIDGET, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const runDiscoverySearch = useCallback(
    async (query?: string, goal?: DiscoveryGoal): Promise<Candidate[]> => {
      setIsSearching(true)
      const q = query !== undefined ? query : searchQuery
      const g = goal !== undefined ? goal : selectedGoal
      setActiveFilterGoal(g)
      await new Promise((resolve) => setTimeout(resolve, 450))
      setIsSearching(false)
      return CANDIDATES_CATALOG
    },
    [searchQuery, selectedGoal]
  )

  const filteredCandidates = useMemo(() => {
    return CANDIDATES_CATALOG.filter((c) => {
      if (!searchQuery.trim()) return true
      const terms = searchQuery.toLowerCase().split(/\s+/)
      const haystack = `${c.name} ${c.role} ${c.tags.join(' ')} ${c.sharedCuriosity} ${c.building}`.toLowerCase()
      return terms.some((t) => haystack.includes(t))
    })
  }, [searchQuery])

  const getIntroById = useCallback(
    (id: string) => {
      return introductions.find((item) => item.id === id)
    },
    [introductions]
  )

  const createOrUpdateDraft = useCallback(
    (candidateId: string, intentUpdates: Partial<IntroductionIntent>, goal: DiscoveryGoal = 'collaborate'): string => {
      const candidate: Candidate =
        CANDIDATES_CATALOG.find((c) => c.id === candidateId) ?? (CANDIDATES_CATALOG[0] as Candidate)
      const existingDraft = introductions.find(
        (i) => i.recipientId === candidate.id && (i.state === 'draft' || i.state === 'awaiting_confirmation')
      )

      const introId = existingDraft?.id ?? `intro-${candidate.id}-${Date.now().toString().slice(-4)}`
      const baseIntent: IntroductionIntent = existingDraft?.intent ?? {
        personalNote: `Hi ${candidate.name}, I've been following your work and really appreciate your perspective on open infrastructure.`,
        exploreTopics: `I'd love to hear your thoughts on how smaller, more open teams can build human-centered social tools without noisy algorithmic feeds.`,
        whatIOffer: profile.canOffer || 'I work on frontend and product design and can share lessons from our recent builds.',
        specificQuestions: `Would you be open to a 20-minute chat about community tools, onboarding workflows, and design patterns?`,
      }

      const mergedIntent: IntroductionIntent = { ...baseIntent, ...intentUpdates }

      const draftRecord: IntroductionRecord = {
        id: introId,
        senderId: profile.id,
        senderName: profile.name,
        senderAvatar: profile.avatarUrl,
        senderRole: profile.headline,
        recipientId: candidate.id,
        recipientName: candidate.name,
        recipientAvatar: candidate.avatarUrl,
        recipientRole: candidate.role,
        goal,
        intent: mergedIntent,
        sharedCuriosity: candidate.sharedCuriosity,
        complementaryPractice: candidate.complementaryPractice,
        youCanOffer: [
          'Product design experience',
          'Community perspective',
          'Lessons from recent builds',
        ],
        theyCanOffer: candidate.canOfferList,
        disclosedSignals: candidate.verifiedContext
          ? [
              {
                label: candidate.verifiedContext,
                kind: 'monad_activity',
                verified: true,
              },
            ]
          : [],
        quote: {
          evaluationFee: '0.005 MON',
          attentionBond: '0.05 MON',
        },
        state: 'awaiting_confirmation',
        category: 'waiting_sender',
        createdAt: 'Just now',
        updatedAt: 'Just now',
      }

      const next = [draftRecord, ...introductions.filter((i) => i.id !== introId)]
      persistIntros(next)
      return introId
    },
    [introductions, profile, persistIntros]
  )

  const confirmAndSendIntroduction = useCallback(
    (id: string): IntroductionRecord => {
      let target: IntroductionRecord | undefined
      const next = introductions.map((item) => {
        if (item.id === id) {
          target = {
            ...item,
            state: 'needs_look' as const,
            category: 'needs_look' as const,
            updatedAt: 'Just now',
          }
          return target
        }
        return item
      })
      const result = target ?? introductions[0] ?? (SEEDED_INBOX_INTRODUCTIONS[0] as IntroductionRecord)
      persistIntros(next)
      addToast('Introduction confirmed & sent to recipient Gatekeeper!', 'success')
      return result
    },
    [introductions, persistIntros, addToast]
  )

  const decideIntroduction = useCallback(
    (id: string, decision: 'accepted' | 'context_requested' | 'declined', note?: string): IntroductionRecord => {
      let target: IntroductionRecord | undefined
      const next = introductions.map((item) => {
        if (item.id === id) {
          const receipt: OutcomeReceipt = {
            receiptHash: `0x7f${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            bondAmount: item.quote.attentionBond,
            bondRefunded: true,
            evaluationFee: item.quote.evaluationFee,
            evaluationSettled: true,
            decision,
            decisionNote: note,
            contactChannel:
              decision === 'accepted' ? '@alexchen on Telegram & Farcaster (@alexchen.eth)' : undefined,
            suggestedOpeningQuestion:
              decision === 'accepted' ? item.intent.specificQuestions : undefined,
          }

          const newState =
            decision === 'accepted'
              ? ('accepted' as const)
              : decision === 'context_requested'
              ? ('context_requested' as const)
              : ('declined' as const)

          target = {
            ...item,
            state: newState,
            receipt,
            updatedAt: 'Just now',
          }
          return target
        }
        return item
      })

      const result = target ?? introductions[0] ?? (SEEDED_INBOX_INTRODUCTIONS[0] as IntroductionRecord)
      persistIntros(next)

      const toastMessage =
        decision === 'accepted'
          ? 'Introduction accepted! Private contact handoff created.'
          : decision === 'context_requested'
          ? 'Clarification question sent back to sender.'
          : 'Introduction politely declined. Attention bond fully refunded to sender.'

      addToast(toastMessage, decision === 'accepted' ? 'success' : 'info')
      return result
    },
    [introductions, persistIntros, addToast]
  )

  return (
    <V3Context.Provider
      value={{
        profile,
        updateProfile,
        updateSource,
        setProfileVisibility,
        setAllowAgentMatching,
        toggleAllowedSource,
        addInterest,
        removeInterest,
        widgetConfig,
        updateWidgetConfig,
        candidates: CANDIDATES_CATALOG,
        searchQuery,
        setSearchQuery,
        selectedGoal,
        setSelectedGoal,
        isSearching,
        filteredCandidates,
        runDiscoverySearch,
        introductions,
        getIntroById,
        createOrUpdateDraft,
        confirmAndSendIntroduction,
        decideIntroduction,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </V3Context.Provider>
  )
}

export function useV3Demo() {
  const ctx = useContext(V3Context)
  if (!ctx) {
    throw new Error('useV3Demo must be used within a V3DemoProvider')
  }
  return ctx
}

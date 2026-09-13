'use client'

import React from 'react'
import { useV3Demo } from '@/lib/v3-context'
import styles from './V3Toast.module.css'

export function V3Toast() {
  const { toasts, removeToast } = useV3Demo()

  if (toasts.length === 0) return null

  return (
    <div className={styles.toastContainer} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toastItem} ${styles[toast.type ?? 'info']}`}
          role="status"
        >
          <span className={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className={styles.toastText}>{toast.text}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

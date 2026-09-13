'use client'

import React from 'react'
import styles from './V3StepProgress.module.css'

export interface StepItem {
  number: number
  label: string
}

export function V3StepProgress({
  steps,
  currentStep,
  completedStep = 1,
}: {
  steps: StepItem[]
  currentStep: number
  completedStep?: number
}) {
  return (
    <div className={styles.progressContainer} aria-label="Step progress">
      {steps.map((step, idx) => {
        const isCompleted = step.number < currentStep || (step.number === 1 && completedStep >= 1 && currentStep > 1)
        const isCurrent = step.number === currentStep

        return (
          <React.Fragment key={step.number}>
            {idx > 0 && <div className={`${styles.line} ${isCompleted ? styles.lineCompleted : ''}`} />}
            <div
              className={`${styles.stepNode} ${isCurrent ? styles.stepCurrent : ''} ${
                isCompleted ? styles.stepCompleted : ''
              }`}
            >
              <span className={styles.circle}>
                {isCompleted ? '✓' : step.number}
              </span>
              <span className={styles.label}>{step.label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

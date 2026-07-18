import { useState } from 'react'
import './PipelineStepper.css'

const STAGES = [
  {
    key: 'email',
    label: 'Incoming Email',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 5.5 10 10.5l6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'triage',
    label: 'Triage Agent',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12.3 12.3 16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'draft',
    label: 'Draft Agent',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 15l0.4-2.6L13 4.8a1.4 1.4 0 0 1 2 0l0.2.2a1.4 1.4 0 0 1 0 2L7.6 14.6 5 15Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'review',
    label: 'Review Agent',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 9.8 7.5 13.2 16 4.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'decision',
    label: 'Final Decision',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M5 3v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M5 4h9l-2.3 2.8L14 9.6H5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
]

/**
 * PipelineStepper
 * Enterprise workflow banner communicating the end-to-end story in one
 * glance: Incoming Email → Triage Agent → Draft Agent → Review Agent →
 * Final Decision.
 *
 * Two additions over the original: a collapse toggle (a returning user
 * doesn't need the full explainer taking up space every visit — pure
 * local UI state, no data implication), and an `isProcessing` prop that
 * gives the connector arrows a subtle traveling pulse while a ticket is
 * actively being revealed in the Trace Panel (driven by the same
 * `revealingId` state App.jsx already tracks — no new state needed).
 *
 * Props:
 *  - isProcessing: boolean
 */
export default function PipelineStepper({ isProcessing = false }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav className="pipeline-stepper" aria-label="Ticket processing workflow">
      <div className="pipeline-stepper__eyebrow-row">
        <span className="pipeline-stepper__eyebrow">How it works</span>
        <button
          type="button"
          className="pipeline-stepper__toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          {collapsed ? 'Show' : 'Hide'}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease-standard)' }}
          >
            <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className={`pipeline-stepper__track${isProcessing ? ' pipeline-stepper__track--processing' : ''}`}>
          {STAGES.map((stage, index) => (
            <div className="pipeline-stepper__item" key={stage.key}>
              <div className="pipeline-stepper__node">
                <span className="pipeline-stepper__icon" aria-hidden="true">
                  {stage.icon}
                </span>
                <span className="pipeline-stepper__label">{stage.label}</span>
              </div>
              {index < STAGES.length - 1 && (
                <span className="pipeline-stepper__arrow" aria-hidden="true">
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                    <path d="M0 7h16M11 1.5 17.5 7 11 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}

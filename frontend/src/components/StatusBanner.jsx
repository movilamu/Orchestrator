import './StatusBanner.css'

/**
 * StatusBanner
 * Visible-but-non-alarming indicator for the contract's non-success
 * statuses ("error" | "fallback"). Deliberately styled with the same
 * neutral/tint tokens as the rest of the app — no red, no alarm
 * iconography — since the demo must keep looking calm even when a
 * stage didn't complete live.
 *
 * Props:
 *  - status: "error" | "fallback" (reviewer/orchestrator status field, unchanged)
 */
export default function StatusBanner({ status }) {
  if (status !== 'error' && status !== 'fallback') return null

  const copy =
    status === 'error'
      ? 'Something went wrong — showing example data instead.'
      : 'Live agent call didn\u2019t finish in time — showing a pre-written fallback result.'

  return (
    <div className={`status-banner status-banner--${status}`} role="status">
      <span className="status-banner__icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 5.2v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="10.7" r="0.9" fill="currentColor" />
        </svg>
      </span>
      <span className="status-banner__text">{copy}</span>
    </div>
  )
}

import './EmptyState.css'

/**
 * EmptyState
 * Generic empty-state block reused wherever the app has nothing to
 * show yet — Account 9 polish requirement. Purely presentational.
 *
 * Props:
 *  - title: short headline, e.g. "No tickets yet"
 *  - hint:  one line of supporting copy
 */
export default function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="7" width="20" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 8.5 14 15l8.5-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="empty-state__title">{title}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
    </div>
  )
}

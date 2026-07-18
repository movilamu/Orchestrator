import './TopBar.css'

/**
 * TopBar
 * Slim persistent header that sits above the main content column
 * (beside the Sidebar, not replacing it). Shows the current page
 * title, a search affordance, a notification indicator (wired later
 * to real system alerts), and the signed-in user.
 *
 * Props:
 *  - needsAttentionCount: number — used to badge the notification bell
 */
export default function TopBar({ needsAttentionCount = 0 }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__left">
          <span className="topbar__brand" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="1" y="1" width="22" height="22" rx="6" fill="#0F4C81" />
              <path d="M5.5 8.5 12 13l6.5-4.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="5.5" y="7.5" width="13" height="9.5" rx="1.4" stroke="#FFFFFF" strokeWidth="1.4" fill="none" />
            </svg>
          </span>
          <h1 className="topbar__title">Orchestrator</h1>
        </div>

        <div className="topbar__right">
          <div className="topbar__search">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Search tickets…" aria-label="Search tickets" />
          </div>

          <button type="button" className="topbar__icon-btn" aria-label={`Notifications, ${needsAttentionCount} needing attention`}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 8a5 5 0 0 1 10 0c0 3 1 4 1.5 4.5H3.5C4 12 5 11 5 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {needsAttentionCount > 0 && <span className="topbar__badge">{needsAttentionCount}</span>}
          </button>

          <div className="topbar__profile">
            <span className="topbar__avatar" aria-hidden="true">JD</span>
            <span className="topbar__profile-name">Jane Doe</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}

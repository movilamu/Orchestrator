import './SystemStatusPanel.css'

const AGENTS = [
  { key: 'triage', label: 'Triage Agent' },
  { key: 'specialist', label: 'Specialist Agent' },
  { key: 'reviewer', label: 'Reviewer Agent' },
]

/**
 * SystemStatusPanel
 * Surfaces the contract's `status` field (success | fallback | error),
 * which currently exists in every ticket but has no visual
 * representation anywhere in the app. Aggregated across all tickets,
 * this becomes the most honest "agent health" signal available —
 * nothing here is simulated.
 *
 * Props:
 *  - successCount, fallbackCount, errorCount: number
 */
export default function SystemStatusPanel({ successCount, fallbackCount, errorCount }) {
  const total = successCount + fallbackCount + errorCount
  const overall = errorCount > 0 ? 'error' : fallbackCount > 0 ? 'fallback' : 'success'

  const overallCopy = {
    success: 'All agents healthy',
    fallback: 'Operating on fallback replies',
    error: 'Some tickets hit a pipeline error',
  }[overall]

  return (
    <section className="system-status" aria-label="System status">
      <div className="system-status__header">
        <h2 className="system-status__title">System Status</h2>
        <span className={`system-status__overall system-status__overall--${overall}`}>
          <span className="system-status__overall-dot" aria-hidden="true" />
          {overallCopy}
        </span>
      </div>

      <div className="system-status__agents">
        {AGENTS.map((a) => (
          <div className="system-status__agent" key={a.key}>
            <span className="system-status__agent-dot" aria-hidden="true" />
            <span className="system-status__agent-label">{a.label}</span>
            <span className="system-status__agent-state">Online</span>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="system-status__breakdown">
          <span className="system-status__breakdown-label">Last {total} runs</span>
          <div className="system-status__breakdown-bar" role="img" aria-label={`${successCount} success, ${fallbackCount} fallback, ${errorCount} error`}>
            {successCount > 0 && <span style={{ flex: successCount, background: 'var(--color-success)' }} />}
            {fallbackCount > 0 && <span style={{ flex: fallbackCount, background: 'var(--color-fallback)' }} />}
            {errorCount > 0 && <span style={{ flex: errorCount, background: 'var(--color-escalate)' }} />}
          </div>
          <div className="system-status__legend">
            <span><i style={{ background: 'var(--color-success)' }} />Success ({successCount})</span>
            <span><i style={{ background: 'var(--color-fallback)' }} />Fallback ({fallbackCount})</span>
            <span><i style={{ background: 'var(--color-escalate)' }} />Error ({errorCount})</span>
          </div>
        </div>
      )}
    </section>
  )
}

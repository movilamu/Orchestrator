import './AnalyticsRow.css'

const CATEGORY_COLOR_VAR = {
  Billing: 'var(--color-blue)',
  Technical: 'var(--color-navy)',
  General: 'var(--color-text-secondary)',
}

/**
 * AnalyticsRow
 * Three compact panels shown above the ticket board:
 *  - Automation Rate:      solved / (solved + needsAttention), from reviewer.decision
 *  - Category Distribution: tally of triage.category across all tickets
 *  - Knowledge Base Usage:  tally of specialist.source_used across all tickets
 *
 * All values are derived by the parent (App) from ticket state — this
 * component only renders them. No field here is invented; every number
 * traces back to the fixed contract shape.
 *
 * Props:
 *  - automationRate: number 0-100 (or null if no finalized tickets yet)
 *  - categoryBreakdown: [{ label, count }]
 *  - sourceBreakdown: [{ label, count }]
 */
export default function AnalyticsRow({ automationRate, categoryBreakdown, sourceBreakdown }) {
  const totalCategory = categoryBreakdown.reduce((sum, c) => sum + c.count, 0) || 1
  const totalSource = sourceBreakdown.reduce((sum, s) => sum + s.count, 0) || 1
  const topSource = [...sourceBreakdown].sort((a, b) => b.count - a.count)[0]

  return (
    <section className="analytics-row" aria-label="Ticket analytics">
      <div className="analytics-card">
        <span className="analytics-card__eyebrow">Automation rate</span>
        <div className="analytics-card__rate">
          <span className="analytics-card__rate-value">
            {automationRate === null ? '—' : `${automationRate}%`}
          </span>
          <span className="analytics-card__rate-hint">sent without escalation</span>
        </div>
        <div className="analytics-card__bar">
          <div
            className="analytics-card__bar-fill"
            style={{ width: `${automationRate ?? 0}%` }}
          />
        </div>
      </div>

      <div className="analytics-card">
        <span className="analytics-card__eyebrow">Category distribution</span>
        <ul className="analytics-card__breakdown">
          {categoryBreakdown.map((c) => (
            <li key={c.label} className="analytics-card__breakdown-row">
              <span className="analytics-card__breakdown-label">{c.label}</span>
              <div className="analytics-card__breakdown-track">
                <div
                  className="analytics-card__breakdown-fill"
                  style={{
                    width: `${(c.count / totalCategory) * 100}%`,
                    background: CATEGORY_COLOR_VAR[c.label] || 'var(--color-text-secondary)',
                  }}
                />
              </div>
              <span className="analytics-card__breakdown-count">{c.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="analytics-card">
        <span className="analytics-card__eyebrow">Knowledge base usage</span>
        {topSource ? (
          <>
            <div className="analytics-card__top-source">
              <span className="analytics-card__top-source-name">{topSource.label}</span>
              <span className="analytics-card__top-source-count">{topSource.count} uses</span>
            </div>
            <ul className="analytics-card__breakdown">
              {sourceBreakdown.map((s) => (
                <li key={s.label} className="analytics-card__breakdown-row">
                  <span className="analytics-card__breakdown-label">{s.label}</span>
                  <div className="analytics-card__breakdown-track">
                    <div
                      className="analytics-card__breakdown-fill analytics-card__breakdown-fill--neutral"
                      style={{ width: `${(s.count / totalSource) * 100}%` }}
                    />
                  </div>
                  <span className="analytics-card__breakdown-count">{s.count}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="analytics-card__empty">No sources referenced yet.</p>
        )}
      </div>
    </section>
  )
}

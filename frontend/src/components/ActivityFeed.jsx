import EmptyState from './EmptyState'
import './ActivityFeed.css'

/**
 * ActivityFeed
 * A running log of pipeline events, newest first. Built entirely from
 * ticket state already tracked in App.jsx (ticket id, sender, category,
 * decision, status) — no new backend field required.
 *
 * Props:
 *  - events: [{ id, ticketId, sender, category, decision, status, isLatest }]
 */
export default function ActivityFeed({ events }) {
  return (
    <section className="activity-feed" aria-label="Live agent activity">
      <div className="activity-feed__header">
        <h2 className="activity-feed__title">Live Activity</h2>
        <span className="activity-feed__live-dot" aria-hidden="true" />
      </div>

      {events.length === 0 ? (
        <EmptyState title="No activity yet" hint="Processed tickets will appear here as they move through the pipeline." />
      ) : (
        <ol className="activity-feed__list">
          {events.map((e) => (
            <li key={e.id} className="activity-feed__item activity-feed__item--enter">
              <span className={`activity-feed__dot activity-feed__dot--${e.status}`} aria-hidden="true" />
              <div className="activity-feed__text">
                <p className="activity-feed__line">
                  <strong>Ticket #{e.ticketId}</strong>{' '}
                  {e.decision === 'send' ? 'sent to customer' : 'escalated to a human'}
                  {' — '}
                  <span className="activity-feed__category">{e.category}</span>
                </p>
                <p className="activity-feed__meta">{e.sender} &middot; {e.timeLabel}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

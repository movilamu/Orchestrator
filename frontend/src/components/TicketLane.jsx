import StageNode from './StageNode'
import DecisionPill from './DecisionPill'
import StatusBanner from './StatusBanner'
import './TicketLane.css'

/**
 * TicketLane
 * Renders one ticket's full journey — Triage → Draft → Review — as a
 * connected horizontal lane. Reads only from the fixed contract shape:
 *
 * {
 *   id, ticket: { text, sender },
 *   triage: { category, urgency },
 *   specialist: { draft, source_used },
 *   reviewer: { score, decision, reason },
 *   status: "success" | "error" | "fallback"
 * }
 *
 * Props:
 *  - ticket: object matching the shape above (see src/data/mockData.js)
 *  - onSelect: called with the ticket when the card is clicked/activated
 *    (opens the Account 7 trace panel for this ticket)
 *  - isActive: whether this is the currently selected ticket
 */
export default function TicketLane({ ticket, onSelect, isActive }) {
  const { ticket: ticketInfo, triage, specialist, reviewer } = ticket

  return (
    <article
      className={`ticket-lane ticket-lane--decision-${reviewer.decision}${isActive ? ' ticket-lane--active' : ''}`}
      onClick={() => onSelect && onSelect(ticket)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
          e.preventDefault()
          onSelect(ticket)
        }
      }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? isActive : undefined}
    >
      <div className="ticket-lane__meta">
        <span className="ticket-lane__id">Ticket #{ticket.id}</span>
        <span className="ticket-lane__sender">{ticketInfo.sender}</span>
        {ticketInfo.email && <span className="ticket-lane__email">{ticketInfo.email}</span>}
      </div>

      <StatusBanner status={ticket.status} />

      <div className="ticket-lane__track">
        <StageNode stageType="triage">
          <p className="ticket-lane__quote">&ldquo;{ticketInfo.text}&rdquo;</p>
          <div className="ticket-lane__chips">
            <span className="chip chip--category">{triage.category}</span>
            <span className={`chip chip--urgency chip--urgency-${triage.urgency.toLowerCase()}`}>
              {triage.urgency} urgency
            </span>
          </div>
        </StageNode>

        <span className="ticket-lane__connector" aria-hidden="true" />

        <StageNode stageType="draft">
          <span className="ticket-lane__source-label">Message to customer</span>
          <p className="ticket-lane__quote">&ldquo;{specialist.draft}&rdquo;</p>
          <div className="ticket-lane__source">
            <span className="ticket-lane__source-label">Source</span>
            <span className="chip chip--source">{specialist.source_used}</span>
          </div>
        </StageNode>

        <span className="ticket-lane__connector" aria-hidden="true" />

        <StageNode stageType="review">
          <DecisionPill decision={reviewer.decision} score={reviewer.score} />
          <span className="ticket-lane__source-label">
            {reviewer.decision === 'escalate' ? 'Escalation report' : 'Review report'}
          </span>
          <p className="ticket-lane__reason">{reviewer.reason}</p>
        </StageNode>
      </div>
    </article>
  )
}

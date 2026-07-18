import { useEffect, useState } from 'react'
import EmptyState from './EmptyState'
import StatusBanner from './StatusBanner'
import DecisionPill from './DecisionPill'
import './TracePanel.css'

const REVEAL_DELAYS = { triage: 1100, specialist: 1400, reviewer: 1200 }

/**
 * TracePanel
 * Account 7 — Live Reasoning Trace Panel.
 *
 * Given a full contract-shaped ticket object, reveals each agent's
 * stage one at a time (Triage -> Specialist -> Reviewer) with a short
 * delay + pulse indicator between them, styled as a vertical timeline.
 *
 * Integration note: the reveal sequence is driven entirely by the
 * `runLocalTimers` effect below, keyed on `revealToken`. To swap this
 * for a real async pipeline later (Account 8), replace the body of
 * that effect with code that calls setStage('triage','thinking'), then
 * setStage('triage','done', data) as each real response arrives — the
 * render logic and stageState shape do not need to change.
 *
 * Props:
 *  - ticket: full orchestrator contract object, or null (empty state)
 *  - revealToken: any value that changes to force the reveal to replay
 *    (e.g. incremented each time a ticket is (re)selected)
 *  - onClose: optional handler for a close/dismiss control
 *  - onStart: optional callback fired when a reveal sequence begins
 *  - onComplete: optional callback fired when the reveal sequence finishes
 */
export default function TracePanel({ ticket, revealToken, onClose, onStart, onComplete }) {
  const [stageState, setStageState] = useState({
    triage: 'pending',
    specialist: 'pending',
    reviewer: 'pending',
  })

  useEffect(() => {
    if (!ticket) return undefined

    if (onStart) onStart(ticket.id)
    setStageState({ triage: 'thinking', specialist: 'pending', reviewer: 'pending' })

    const t1 = setTimeout(() => {
      setStageState((s) => ({ ...s, triage: 'done', specialist: 'thinking' }))
    }, REVEAL_DELAYS.triage)

    const t2 = setTimeout(() => {
      setStageState((s) => ({ ...s, specialist: 'done', reviewer: 'thinking' }))
    }, REVEAL_DELAYS.triage + REVEAL_DELAYS.specialist)

    const t3 = setTimeout(() => {
      setStageState((s) => ({ ...s, reviewer: 'done' }))
      if (onComplete) onComplete(ticket.id)
    }, REVEAL_DELAYS.triage + REVEAL_DELAYS.specialist + REVEAL_DELAYS.reviewer)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id, revealToken])

  return (
    <aside className="trace-panel" aria-label="Live reasoning trace">
      <div className="trace-panel__header">
        <div className="trace-panel__heading">
          <h2 className="trace-panel__title">Live Reasoning Trace</h2>
          {ticket && (
            <p className="trace-panel__subtitle">
              Ticket #{ticket.id} &middot; {ticket.ticket.sender}
              {ticket.ticket.email ? ` \u00b7 ${ticket.ticket.email}` : ''}
            </p>
          )}
        </div>
        {ticket && onClose && (
          <button type="button" className="trace-panel__close" onClick={onClose} aria-label="Close trace panel">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {!ticket && (
        <EmptyState
          title="Select a ticket to see it processed"
          hint="Click any ticket card, or process a new one above, to watch each agent reason step by step."
        />
      )}

      {ticket && (
        <div className="trace-panel__body">
          <StatusBanner status={ticket.status} />

          <ol className="trace-timeline">
            <TraceStep
              stageType="triage"
              label="Triage Agent"
              state={stageState.triage}
              thinkingText="Triage Agent analyzing..."
            >
              <div className="ticket-lane__chips">
                <span className="chip chip--category">{ticket.triage.category}</span>
                <span className={`chip chip--urgency-${ticket.triage.urgency.toLowerCase()}`}>
                  {ticket.triage.urgency} urgency
                </span>
              </div>
            </TraceStep>

            <TraceStep
              stageType="draft"
              label="Specialist Agent"
              state={stageState.specialist}
              thinkingText={`Specialist Agent drafting reply using ${ticket.specialist.source_used}...`}
            >
              <span className="ticket-lane__source-label">Message that will be sent to the customer</span>
              <p className="ticket-lane__quote">&ldquo;{ticket.specialist.draft}&rdquo;</p>
              <div className="ticket-lane__source">
                <span className="ticket-lane__source-label">Source</span>
                <span className="chip chip--source">{ticket.specialist.source_used}</span>
              </div>
            </TraceStep>

            <TraceStep
              stageType="review"
              label="Reviewer Agent"
              state={stageState.reviewer}
              thinkingText="Reviewer Agent checking draft..."
            >
              <DecisionPill decision={ticket.reviewer.decision} score={ticket.reviewer.score} />
              <span className="ticket-lane__source-label">
                {ticket.reviewer.decision === 'escalate'
                  ? 'Full escalation explanation'
                  : 'Full review explanation'}
              </span>
              <p className="ticket-lane__reason">{ticket.reviewer.reason}</p>
            </TraceStep>
          </ol>
        </div>
      )}
    </aside>
  )
}

const STEP_ICONS = {
  triage: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.3 10.3 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  draft: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 12.5 4.3 10.4 10.6 4.1a1.2 1.2 0 0 1 1.7 0l.2.2a1.2 1.2 0 0 1 0 1.7L6.2 12.3 4 12.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
  review: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.2 6.3 11 12.5 4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

/**
 * TraceStep
 * One row in the vertical trace timeline. Three visual states:
 *  - pending:  dimmed, not reached yet
 *  - thinking: pulse indicator + "...analyzing" style label
 *  - done:     resolved content, reusing stage-node/chip/pill styles
 */
function TraceStep({ stageType, label, state, thinkingText, children }) {
  return (
    <li className={`trace-step trace-step--${stageType} trace-step--${state}`}>
      <div className="trace-step__rail" aria-hidden="true">
        <span className="trace-step__dot" />
        <span className="trace-step__line" />
      </div>

      <div className={`trace-step__card stage-node stage-node--${stageType}`}>
        <div className="stage-node__header">
          <span className="stage-node__icon" aria-hidden="true">
            {STEP_ICONS[stageType]}
          </span>
          <span className="stage-node__eyebrow">{label}</span>
        </div>

        <div className="stage-node__body">
          {state === 'pending' && <p className="trace-step__waiting">Waiting&hellip;</p>}

          {state === 'thinking' && (
            <div className="trace-step__thinking">
              <span className="trace-pulse" aria-hidden="true">
                <span className="trace-pulse__dot" />
                <span className="trace-pulse__dot" />
                <span className="trace-pulse__dot" />
              </span>
              <span className="trace-step__thinking-text">{thinkingText}</span>
            </div>
          )}

          {state === 'done' && children}
        </div>
      </div>
    </li>
  )
}

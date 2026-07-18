import './DecisionPill.css'

/**
 * DecisionPill
 * Visual terminus of a ticket lane — renders the reviewer's decision
 * from the fixed contract: reviewer.decision ("send" | "escalate").
 *
 * Props:
 *  - decision: "send" | "escalate"   (reviewer.decision, unchanged)
 *  - score:    number 0-10           (reviewer.score, unchanged)
 */
export default function DecisionPill({ decision, score }) {
  const isSend = decision === 'send'

  return (
    <div className={`decision-pill decision-pill--${isSend ? 'send' : 'escalate'}`}>
      <span className="decision-pill__dot" aria-hidden="true" />
      <span className="decision-pill__label">{isSend ? 'Send' : 'Escalate'}</span>
      <span className="decision-pill__score">{score}/10</span>
    </div>
  )
}

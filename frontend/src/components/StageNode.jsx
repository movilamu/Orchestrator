import './StageNode.css'

const STAGE_META = {
  triage: {
    label: 'Triage',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10.3 10.3 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  draft: {
    label: 'Draft',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 12.5 4.3 10.4 10.6 4.1a1.2 1.2 0 0 1 1.7 0l.2.2a1.2 1.2 0 0 1 0 1.7L6.2 12.3 4 12.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  review: {
    label: 'Review',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 8.2 6.3 11 12.5 4.7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
}

/**
 * StageNode
 * Reusable card representing one stage in a ticket's pipeline lane.
 *
 * Props:
 *  - stageType: "triage" | "draft" | "review" — controls icon, label, accent tint
 *  - children:  stage-specific content (fields), passed in by TicketLane
 *
 * Extension point (not implemented here — reserved for Account 7):
 * a reasoning-trace overlay could later be rendered as a sibling to
 * `children` inside this same node without altering TicketLane.
 */
export default function StageNode({ stageType, children }) {
  const meta = STAGE_META[stageType]

  return (
    <div className={`stage-node stage-node--${stageType}`}>
      <div className="stage-node__header">
        <span className="stage-node__icon" aria-hidden="true">
          {meta.icon}
        </span>
        <span className="stage-node__eyebrow">{meta.label}</span>
      </div>
      <div className="stage-node__body">{children}</div>
    </div>
  )
}

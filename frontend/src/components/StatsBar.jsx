import { useEffect, useRef, useState } from 'react'
import './StatsBar.css'

/**
 * useCountUp
 * Animates a displayed integer toward `value` over ~500ms whenever it
 * changes, instead of snapping — the KPI strip should visibly react
 * when a ticket is added or resolved, not just re-render silently.
 * Respects prefers-reduced-motion by jumping straight to the value.
 */
function useCountUp(value, duration = 500) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setDisplay(value)
      fromRef.current = value
      return undefined
    }

    const from = fromRef.current
    const to = value
    if (from === to) return undefined

    const start = performance.now()
    let raf
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}

/**
 * StatsBar
 * At-a-glance ticket counts shown below the pipeline stepper:
 *  - Received:        every ticket that has entered the board
 *  - In Progress:     the ticket currently being revealed in the trace panel
 *  - Pending:         tickets not yet opened/reviewed by the user
 *  - Solved:          reviewer.decision === "send" (fully revealed)
 *  - Needs Attention: reviewer.decision === "escalate" (fully revealed)
 *
 * These are derived counts computed by the parent (App) from ticket +
 * selection state — this component only renders them.
 *
 * Props: { received, inProgress, pending, solved, needsAttention }
 */
export default function StatsBar({ received, inProgress, pending, solved, needsAttention }) {
  const receivedDisplay = useCountUp(received)
  const inProgressDisplay = useCountUp(inProgress)
  const pendingDisplay = useCountUp(pending)
  const solvedDisplay = useCountUp(solved)
  const needsAttentionDisplay = useCountUp(needsAttention)

  const stats = [
    {
      key: 'received',
      label: 'Received',
      value: receivedDisplay,
      tone: 'neutral',
      icon: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3.5 5.5 10 10.5l6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'inProgress',
      label: 'In Progress',
      value: inProgressDisplay,
      tone: 'blue',
      icon: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 5.8V10l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'pending',
      label: 'Pending',
      value: pendingDisplay,
      tone: 'neutral',
      icon: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 6.5v3.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'solved',
      label: 'Solved',
      value: solvedDisplay,
      tone: 'success',
      icon: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M4 10.3 8 14l8-8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'needsAttention',
      label: 'Needs Attention',
      value: needsAttentionDisplay,
      tone: 'escalate',
      icon: (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 3.5 18 16.5H2L10 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M10 8.3v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="13.8" r="0.9" fill="currentColor" />
        </svg>
      ),
    },
  ]

  return (
    <section className="stats-bar" aria-label="Ticket counts">
      {stats.map((s) => (
        <div className={`stats-bar__card stats-bar__card--${s.tone}`} key={s.key}>
          <span className="stats-bar__icon" aria-hidden="true">
            {s.icon}
          </span>
          <div className="stats-bar__text">
            <span className="stats-bar__value">{s.value}</span>
            <span className="stats-bar__label">{s.label}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

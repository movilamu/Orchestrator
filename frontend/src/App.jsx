import { useEffect, useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import StatsBar from './components/StatsBar'
import AnalyticsRow from './components/AnalyticsRow'
import SubmissionBar from './components/SubmissionBar'
import PipelineStepper from './components/PipelineStepper'
import TicketLane from './components/TicketLane'
import TracePanel from './components/TracePanel'
import ActivityFeed from './components/ActivityFeed'
import SystemStatusPanel from './components/SystemStatusPanel'
import EmptyState from './components/EmptyState'
import { mockTickets } from './data/mockData'
import { processTicket, ApiError } from './api'
import './App.css'

const DECISION_RANK = { escalate: 0, send: 1 }

function formatRelativeTime(timestamp, now) {
  const diffSeconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  return `${diffHours}h ago`
}

/**
 * App
 * Enterprise operations-center shell around the existing ticket
 * pipeline. Everything added here (Sidebar, TopBar, AnalyticsRow,
 * ActivityFeed, SystemStatusPanel) is presentational and derived from
 * the same `tickets` state the original app already tracked — no
 * change to the contract shape, the workflow, or `handleSubmit`'s
 * demo-queue logic.
 *
 * Data source: `tickets` state, seeded from mockTickets and matching the
 * fixed orchestrator response contract exactly. Account 8 will later
 * replace the seed + `handleSubmit`'s local demo-queue logic with a real
 * POST /api/process-ticket call — no child component needs to change
 * shape for that swap, since every component receives contract-shaped
 * props only.
 */
export default function App() {
  const [tickets, setTickets] = useState(mockTickets)
  const [ticketMeta, setTicketMeta] = useState(() => {
    const now = Date.now()
    const meta = {}
    mockTickets.forEach((t, i) => {
      // Stagger seed timestamps so the activity feed reads as a real
      // history on first load, rather than every item saying "just now".
      meta[t.id] = { addedAt: now - (mockTickets.length - i) * 9 * 60 * 1000 }
    })
    return meta
  })
  const [selected, setSelected] = useState(null) // { ticket, token }
  const [viewedIds, setViewedIds] = useState(() => new Set())
  const [revealingId, setRevealingId] = useState(null)
  const [clockTick, setClockTick] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null) // network/HTTP failure, distinct from a ticket's own status field

  // Keeps relative timestamps in the activity feed ("2m ago") honest
  // without needing a timestamp field anywhere in the contract itself.
  useEffect(() => {
    const interval = setInterval(() => setClockTick(Date.now()), 15000)
    return () => clearInterval(interval)
  }, [])

  const handleSelectTicket = (ticket) => {
    setSelected((prev) => ({
      ticket,
      token: prev && prev.ticket.id === ticket.id ? prev.token + 1 : 0,
    }))
    setViewedIds((prev) => new Set(prev).add(ticket.id))
  }

  const handleSubmit = async (senderName, senderEmail, ticketText) => {
    setFetchError(null)
    setSubmitting(true)

    const outgoing = {
      id: crypto.randomUUID(),
      sender: senderName || 'Unknown Sender',
      email: senderEmail || '',
      text: ticketText || 'No ticket text provided.',
    }

    try {
      const result = await processTicket(outgoing)
      setTickets((prev) => [...prev, result])
      setTicketMeta((prev) => ({ ...prev, [result.id]: { addedAt: Date.now() } }))
      handleSelectTicket(result)
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.message : 'Unexpected error contacting the backend.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClosePanel = () => setSelected(null)

  const received = tickets.length
  const inProgress = revealingId ? 1 : 0
  const pending = tickets.filter((t) => !viewedIds.has(t.id)).length
  const finalized = tickets.filter((t) => viewedIds.has(t.id) && t.id !== revealingId)
  const solved = finalized.filter((t) => t.reviewer.decision === 'send').length
  const needsAttention = finalized.filter((t) => t.reviewer.decision === 'escalate').length

  const automationRate =
    solved + needsAttention === 0 ? null : Math.round((solved / (solved + needsAttention)) * 100)

  const categoryBreakdown = useMemo(() => {
    const tally = {}
    tickets.forEach((t) => {
      tally[t.triage.category] = (tally[t.triage.category] || 0) + 1
    })
    return Object.entries(tally)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [tickets])

  const sourceBreakdown = useMemo(() => {
    const tally = {}
    tickets.forEach((t) => {
      const source = t.specialist.source_used
      tally[source] = (tally[source] || 0) + 1
    })
    return Object.entries(tally)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [tickets])

  const statusTally = useMemo(() => {
    const tally = { success: 0, fallback: 0, error: 0 }
    tickets.forEach((t) => {
      tally[t.status] = (tally[t.status] || 0) + 1
    })
    return tally
  }, [tickets])

  const activityEvents = useMemo(() => {
    return [...tickets]
      .sort((a, b) => (ticketMeta[b.id]?.addedAt ?? 0) - (ticketMeta[a.id]?.addedAt ?? 0))
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        ticketId: t.id,
        sender: t.ticket.sender,
        category: t.triage.category,
        decision: t.reviewer.decision,
        status: t.status,
        timeLabel: formatRelativeTime(ticketMeta[t.id]?.addedAt ?? clockTick, clockTick),
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, ticketMeta, clockTick])

  // Escalated tickets surface first — a real operator scans for what
  // needs a human before what's already resolved. Presentation-only
  // reorder; nothing about reviewer.decision or the contract changes.
  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => DECISION_RANK[a.reviewer.decision] - DECISION_RANK[b.reviewer.decision]),
    [tickets],
  )

  return (
    <div className="app-shell">
      <div className="app-shell__main">
        <TopBar needsAttentionCount={needsAttention} />

        <div className="app-shell__content">
          <StatsBar
            received={received}
            inProgress={inProgress}
            pending={pending}
            solved={solved}
            needsAttention={needsAttention}
          />

          <AnalyticsRow
            automationRate={automationRate}
            categoryBreakdown={categoryBreakdown}
            sourceBreakdown={sourceBreakdown}
          />

          <SubmissionBar onSubmit={handleSubmit} submitting={submitting} />

          {fetchError && (
            <div className="app-shell__fetch-error" role="alert">
              Couldn&rsquo;t reach the backend: {fetchError}
            </div>
          )}

          <PipelineStepper isProcessing={Boolean(revealingId) || submitting} />

          <main className="app-shell__board" aria-label="Ticket pipeline">
            <h2 className="app-shell__board-heading">Active Tickets</h2>

            <div className="app-shell__layout">
              <div className="app-shell__board-column">
                {sortedTickets.length === 0 ? (
                  <div className="app-shell__empty-wrap">
                    <EmptyState
                      title="No tickets yet"
                      hint="Process a ticket above to see it move through Triage, Draft, and Review."
                    />
                  </div>
                ) : (
                  sortedTickets.map((ticket) => (
                    <TicketLane
                      key={ticket.id}
                      ticket={ticket}
                      onSelect={handleSelectTicket}
                      isActive={selected?.ticket.id === ticket.id}
                    />
                  ))
                )}
              </div>

              {selected && <div className="app-shell__panel-scrim" onClick={handleClosePanel} aria-hidden="true" />}
              <div className={`app-shell__panel-column${selected ? ' app-shell__panel-column--open' : ''}`}>
                <TracePanel
                  ticket={selected?.ticket ?? null}
                  revealToken={selected?.token ?? 0}
                  onClose={handleClosePanel}
                  onStart={(id) => setRevealingId(id)}
                  onComplete={(id) => setRevealingId((cur) => (cur === id ? null : cur))}
                />
              </div>
            </div>
          </main>

          <section className="app-shell__below-board" aria-label="System activity and health">
            <ActivityFeed events={activityEvents} />
            <SystemStatusPanel
              successCount={statusTally.success}
              fallbackCount={statusTally.fallback}
              errorCount={statusTally.error}
            />
          </section>

          <footer className="app-shell__footer">
            <span>The Inbox That Runs Itself</span>
            <span>v1.0 &middot; demo environment</span>
          </footer>
        </div>
      </div>
    </div>
  )
}

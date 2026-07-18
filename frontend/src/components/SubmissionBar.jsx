import { useState } from 'react'
import './SubmissionBar.css'

/**
 * SubmissionBar
 * Compose bar for submitting a new ticket, styled after an enterprise
 * inbox compose experience.
 *
 * No real backend yet: onSubmit is called with whatever sender/text the
 * user typed (or placeholders if left blank) purely so the parent can
 * trigger the next item in a local demo queue and open the trace panel.
 * Account 8 will later replace the parent's onSubmit handler with a
 * real POST /api/process-ticket call — this component itself needs no
 * changes for that swap.
 *
 * Props:
 *  - onSubmit(senderName, senderEmail, ticketText): called when "Process Ticket" is clicked
 *  - submitting: optional bool, disables the form while a request is in flight
 */
export default function SubmissionBar({ onSubmit, submitting = false }) {
  const [sender, setSender] = useState('')
  const [email, setEmail] = useState('')
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (submitting) return
    if (onSubmit) {
      onSubmit(sender.trim(), email.trim(), text.trim())
    }
    setSender('')
    setEmail('')
    setText('')
  }

  return (
    <section className="submission-bar" aria-label="Submit a new ticket">
      <div className="submission-bar__heading">
        <h2 className="submission-bar__title">New Ticket</h2>
        <p className="submission-bar__hint">Simulate an incoming support email entering the pipeline.</p>
      </div>

      <div className="submission-bar__row">
        <div className="submission-bar__field submission-bar__field--sender">
          <label className="submission-bar__label" htmlFor="sender-input">
            Sender
          </label>
          <input
            id="sender-input"
            type="text"
            className="submission-bar__input"
            placeholder="e.g. Jane Doe"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="submission-bar__field submission-bar__field--sender">
          <label className="submission-bar__label" htmlFor="email-input">
            Email
          </label>
          <input
            id="email-input"
            type="email"
            className="submission-bar__input"
            placeholder="e.g. jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="submission-bar__field submission-bar__field--text">
          <label className="submission-bar__label" htmlFor="ticket-input">
            Ticket
          </label>
          <input
            id="ticket-input"
            type="text"
            className="submission-bar__input"
            placeholder="Describe the issue…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            disabled={submitting}
          />
        </div>

        <button type="button" className="submission-bar__button" onClick={handleSubmit} disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Processing…' : 'Process Ticket'}
          {!submitting && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h9M8 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </section>
  )
}

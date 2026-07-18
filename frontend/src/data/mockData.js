// mockData.js
//
// Static placeholder data for Account 6 (Frontend Layout).
// Shape matches the FIXED orchestrator response contract exactly —
// do not rename or restructure these fields. Account 8 will later
// replace this file's export with data fetched from
// POST /api/process-ticket, without changing any component code.

export const mockTickets = [
  {
    id: '1',
    ticket: {
      text: "Hi, I was charged twice for my subscription this month. Can you refund the duplicate charge? My order number is #48213.",
      sender: 'Jane Doe',
    },
    triage: {
      category: 'Billing',
      urgency: 'Medium',
    },
    specialist: {
      draft:
        "Hi Jane, thanks for flagging this. I can see the duplicate charge on order #48213 — I've issued a refund for the extra transaction, which should appear in 3-5 business days. Let me know if you don't see it by then.",
      source_used: 'Refund Policy',
    },
    reviewer: {
      score: 8,
      decision: 'send',
      reason: 'Draft correctly applies the refund policy and directly resolves the stated issue without overpromising.',
    },
    status: 'success',
  },
  {
    id: '2',
    ticket: {
      text: "I've asked three times now for a refund outside the 30-day window because of a medical emergency. Nobody has given me a straight answer and I'm getting frustrated.",
      sender: 'Marcus Nwosu',
    },
    triage: {
      category: 'Billing',
      urgency: 'High',
    },
    specialist: {
      draft:
        "Hi Marcus, I understand this has been frustrating. Our standard policy covers refunds within 30 days, and I don't have enough information here to make an exception on your behalf.",
      source_used: 'Refund Policy',
    },
    reviewer: {
      score: 4,
      decision: 'escalate',
      reason: "Request falls outside documented policy scope and involves a sensitive exception case — needs human judgment rather than an automated reply.",
    },
    status: 'success',
  },
  {
    id: '3',
    ticket: {
      text: "I can't log into my account since this morning — it says my password is incorrect even after I reset it twice.",
      sender: 'Priya Shah',
    },
    triage: {
      category: 'Technical',
      urgency: 'Medium',
    },
    specialist: {
      draft:
        "Hi Priya, sorry for the trouble. Please try clearing your browser cache and requesting a new reset link, as cached sessions can sometimes block a fresh password from taking effect. Let us know if it persists.",
      source_used: 'Login Troubleshooting',
    },
    reviewer: {
      score: 9,
      decision: 'send',
      reason: 'Matches known troubleshooting steps for this exact symptom and gives a clear, actionable next step.',
    },
    status: 'success',
  },
]

// demoQueue
//
// Extra example tickets used only to demo the SubmissionBar "Process
// Ticket" action locally (no backend yet — Account 8 wires the real
// call later). Cycled through one at a time so a single demo run can
// show every status the contract defines, including the non-success
// ones Account 9 needs a visible-but-non-alarming state for.
export const demoQueue = [
  {
    id: '4',
    ticket: {
      text: "Do you ship to APO/FPO addresses? I couldn't find this in your shipping FAQ.",
      sender: 'Alicia Ferreira',
    },
    triage: { category: 'General', urgency: 'Low' },
    specialist: {
      draft:
        "Hi Alicia, thanks for asking! Based on our shipping policy, we currently ship to most domestic and international addresses, but I don't have confirmation on APO/FPO specifically in our knowledge base — I'll flag this so a teammate can confirm before you place the order.",
      source_used: 'Shipping Times',
    },
    reviewer: {
      score: 7,
      decision: 'send',
      reason: 'Draft is honest about the knowledge gap instead of guessing, and sets a clear expectation.',
    },
    status: 'success',
  },
  {
    id: '5',
    ticket: {
      text: "This is the fourth time I'm writing. I want a full refund AND compensation for the time I've wasted, or I'm disputing the charge with my bank.",
      sender: 'Devon Okafor',
    },
    triage: { category: 'Billing', urgency: 'High' },
    specialist: {
      draft:
        "Hi Devon, I hear how frustrating this has been. I can process a standard refund, but I'm not able to approve additional compensation without a manager's review.",
      source_used: 'Refund Policy',
    },
    reviewer: {
      score: 3,
      decision: 'escalate',
      reason: 'Compensation request and dispute threat fall outside automated authority — needs a human on the account before any reply goes out.',
    },
    status: 'success',
  },
  {
    id: '6',
    ticket: {
      text: 'My invoice PDF from last month shows the wrong billing address — can you correct it on file?',
      sender: 'Sana Malik',
    },
    triage: { category: 'Billing', urgency: 'Medium' },
    specialist: {
      draft:
        "Hi Sana, I've updated the billing address on your account. Note: this example result is a pre-written fallback, since the live agent call didn't complete in time.",
      source_used: 'Billing Cycle Policy',
    },
    reviewer: {
      score: 6,
      decision: 'send',
      reason: 'Fallback reply matches the ticket topic closely enough to send while the live pipeline recovers.',
    },
    status: 'fallback',
  },
  {
    id: '7',
    ticket: {
      text: 'None of my payment methods are being accepted at checkout, even a brand new card.',
      sender: 'Tomás Rivera',
    },
    triage: { category: 'Technical', urgency: 'High' },
    specialist: {
      draft:
        'Example draft shown because the live agent pipeline hit an error — a teammate should review this ticket directly rather than relying on this placeholder reply.',
      source_used: 'Example data',
    },
    reviewer: {
      score: 5,
      decision: 'escalate',
      reason: 'Shown as example data after a pipeline error — routed to a human rather than guessing at a checkout/payment failure.',
    },
    status: 'error',
  },
]

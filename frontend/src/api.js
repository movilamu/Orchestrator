// api.js
//
// REQUEST  POST {API_BASE}/api/process-ticket
//          { "id", "text", "sender", "email" }
//
// RESPONSE { id, ticket: { text, sender, email }, triage: { category, urgency },
//            specialist: { draft, source_used },
//            reviewer: { score, decision, reason },
//            status: "success" | "error" | "fallback" }
//
// API_BASE comes from VITE_API_URL so the same build works locally
// (http://localhost:5000) and once deployed (your backend's Vercel/
// Render/Railway URL) — set VITE_API_URL in Vercel's project env vars.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export class ApiError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'ApiError'
    this.cause = cause
  }
}

export async function processTicket(ticket) {
  let response
  try {
    response = await fetch(`${API_BASE}/api/process-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    })
  } catch (err) {
    throw new ApiError(`Could not reach the backend at ${API_BASE}`, err)
  }

  if (!response.ok) {
    throw new ApiError(`Backend responded with HTTP ${response.status}`)
  }

  try {
    return await response.json()
  } catch (err) {
    throw new ApiError('Backend response was not valid JSON', err)
  }
}

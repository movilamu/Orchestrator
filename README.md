# The Inbox That Runs Itself

## Structure
```
frontend/   Vite + React UI (enterprise ops-center layout)
backend/    Flask API + Groq-powered agents (similarity, triage, specialist, reviewer)
```

## What changed in this integration
- Backend now uses the **real** agent modules (Groq calls), not stubs.
- Ticket contract gained an additive `email` field, kept separate from `sender`
  (name) everywhere in the UI: `{ id, text, sender, email }` in, and
  `ticket: { text, sender, email }` in every response.
- The specialist's draft is now labeled **"Message to customer"** in both the
  ticket lane and the trace panel — this is the exact text that would be sent.
- The reviewer's `reason` is now labeled **"Full escalation explanation"** (when
  `decision === "escalate"`) or **"Full review explanation"** (when `send`) —
  the complete, un-truncated text is always shown, nothing is summarized further.
- `SubmissionBar` now collects Sender, Email, and Ticket text separately, shows
  a "Processing…" loading state, and disables itself while a request is in flight.
- All three backend statuses (`success`, `error`, `fallback`) are shown via the
  existing `StatusBanner` — unchanged.

## Local development

**Backend**
```bash
cd backend
pip install -r requirements.txt
export GROQ_API_KEY="your-key-here"
python app.py          # runs on http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000
npm run dev              # opens on http://localhost:5173
```

## Deploying to Vercel

You'll deploy **two separate Vercel projects** from this one repo (a Flask API
and a static Vite app are different runtimes — this is normal, not a compromise):

### 1. Backend → Vercel project #1
- Root directory: `backend/`
- Vercel auto-detects `vercel.json` (Python runtime via `@vercel/python`,
  entry point `api/index.py`, which imports your unmodified `app.py`).
- In Project Settings → Environment Variables, add:
  - `GROQ_API_KEY` = your Groq key
- Deploy. Note the resulting URL, e.g. `https://your-backend.vercel.app`.

> Note: Vercel serverless functions are stateless and have execution time
> limits (10s on the free plan). Groq calls have a 5s timeout set in the
> agent code, so this fits — but if you see timeouts under load, consider
> Render or Railway for the backend instead, which run Flask persistently.
> No code changes are needed either way — same `app.py`, same `requirements.txt`.

### 2. Frontend → Vercel project #2
- Root directory: `frontend/`
- Vercel auto-detects `vercel.json` (Vite framework preset).
- In Project Settings → Environment Variables, add:
  - `VITE_API_URL` = the backend URL from step 1 (e.g. `https://your-backend.vercel.app`)
- Deploy.

That's it — open the frontend URL and submit a ticket.

import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Real agent implementations (previously stubbed inline). Each module's
# public run_* function signature/return shape is unchanged from the
# stub contract, so nothing below this import block needed to change.
from similarity_agent import run_similarity
from triage_agent import run_triage as _run_triage_raw
from specialist_agent import run_specialist as _run_specialist_raw
from reviewer_agent import run_reviewer as _run_reviewer_raw

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "Inbox That Runs Itself — backend is running",
        "try": "/api/health"
    })
# triage_agent / specialist_agent / reviewer_agent raise their own
# *Error exceptions on failure (TriageError, RuntimeError, ReviewerError)
# rather than returning a value. app.py's try/except blocks below already
# catch any Exception and fall back to FALLBACK_*, so we just need to
# adapt the specialist/reviewer argument+return shapes to what those
# real modules expect.

def run_triage(ticket):
    return _run_triage_raw(ticket)


def run_specialist(ticket, triage_result):
    # specialist_agent.run_specialist expects (ticket, triage_result) and
    # falls back to offline/mock mode automatically if GROQ_API_KEY isn't
    # set, so a missing key degrades gracefully instead of crashing.
    return _run_specialist_raw(ticket, triage_result, fallback_on_error=False)


def run_reviewer(ticket, draft_text):
    # reviewer_agent.run_reviewer expects (ticket, draft) where draft is
    # the {"draft", "source_used"} dict, not just the draft string.
    draft_dict = {"draft": draft_text, "source_used": ""}
    return _run_reviewer_raw(ticket, draft_dict)


# ---------------------------------------------------------------------------
# FALLBACK DATA
# Used to fill in a stage's result if that stage's function throws.
# ---------------------------------------------------------------------------

FALLBACK_SIMILARITY = {
    "action": "continue",
    "match": None,
    "confidence": 0.0
}

FALLBACK_TRIAGE = {
    "category": "general",
    "urgency": "low"
}

FALLBACK_SPECIALIST = {
    "draft": "Thanks for contacting us. A member of our support team will follow up with you shortly.",
    "source_used": "fallback_template"
}

FALLBACK_REVIEWER = {
    "score": 5,
    "decision": "escalate",
    "reason": "Automated pipeline encountered an error; routed to a human for manual review."
}


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/process-ticket", methods=["POST"])
def process_ticket():
    body = request.get_json(force=True, silent=True) or {}

    ticket_id = body.get("id", "")
    ticket_text = body.get("text", "")
    ticket_sender = body.get("sender", "")
    ticket_email = body.get("email", "")

    # NOTE: "email" is an additive field on top of the original contract
    # (id/text/sender). Agents below only read text/sender/id, exactly as
    # before — email is carried through purely for display (kept
    # separate from the "sender" display name in the UI, per request).
    ticket = {
        "id": ticket_id,
        "text": ticket_text,
        "sender": ticket_sender,
        "email": ticket_email
    }

    overall_status = "success"

    # --- Stage 0: Similarity check ---
    known_spam = []
    resolved_clusters = []

    try:
        similarity_result = run_similarity(ticket, known_spam, resolved_clusters)
    except Exception:
        similarity_result = FALLBACK_SIMILARITY
        overall_status = "fallback"

    if similarity_result.get("action") in ("spam", "auto_close"):
        return jsonify({
            "id": ticket_id,
            "ticket": {
                "text": ticket_text,
                "sender": ticket_sender,
                "email": ticket_email
            },
            "similarity": similarity_result,
            "status": overall_status
        })

    # --- Stage 1: Triage ---
    try:
        triage_result = run_triage(ticket)
    except Exception:
        triage_result = FALLBACK_TRIAGE
        overall_status = "fallback"

    # --- Stage 2: Specialist ---
    try:
        specialist_result = run_specialist(ticket, triage_result)
    except Exception:
        specialist_result = FALLBACK_SPECIALIST
        overall_status = "fallback"

    # --- Stage 3: Reviewer ---
    try:
        reviewer_result = run_reviewer(ticket, specialist_result.get("draft", ""))
    except Exception:
        reviewer_result = FALLBACK_REVIEWER
        overall_status = "fallback"

    response = {
        "id": ticket_id,
        "ticket": {
            "text": ticket_text,
            "sender": ticket_sender,
            "email": ticket_email
        },
        "triage": triage_result,
        "specialist": specialist_result,
        "reviewer": reviewer_result,
        "status": overall_status
    }

    return jsonify(response)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

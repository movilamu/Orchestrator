"""
Reviewer Agent — "The Inbox That Runs Itself"

Grades a draft support-ticket reply using Groq's llama-3.1-8b-instant model
and returns a strict JSON verdict: {score, decision, reason}.
"""

import os
import json
import re
from groq import Groq


class ReviewerError(Exception):
    """Raised when the reviewer call fails or returns unparseable output."""
    pass


# Built lazily (not at import time) — see triage_agent.py for why.
_client = None


def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _client


REVIEWER_SYSTEM_PROMPT = """You are a strict QA reviewer for customer support replies.
You will be given a customer's ticket and a support agent's draft reply.

Grade the draft on three dimensions:
1. Accuracy — does the draft correctly address what the customer actually asked, with no factual errors or unsupported claims?
2. Tone — is it professional, empathetic, and appropriate for a customer support context?
3. Completeness — does it fully resolve or address every part of the customer's request, with no missing steps or information?

Respond with ONLY a JSON object, no markdown, no commentary, in exactly this shape:
{"score": <integer 0-10>, "decision": "send" or "escalate", "reason": "<specific explanation>"}

Rules:
- decision must be "send" if score >= 7, otherwise "escalate".
- If escalating, "reason" MUST name the SPECIFIC problem (e.g. "draft promises a refund timeline not mentioned in any policy" or "ticket asks about order #4521 but draft discusses a general return policy without confirming the order"). Do NOT give generic reasons like "needs improvement" or "could be better".
- If sending, "reason" should briefly confirm why it's accurate, on-tone, and complete.
- Output raw JSON only.
"""


def _build_user_prompt(ticket: dict, draft: dict) -> str:
    return f"""CUSTOMER TICKET:
ID: {ticket.get('id')}
Sender: {ticket.get('sender')}
Text: {ticket.get('text')}

DRAFT REPLY:
Source used: {draft.get('source_used')}
Draft: {draft.get('draft')}

Grade this draft now and respond with the JSON object only."""


def _extract_json(raw_text: str) -> dict:
    """Best-effort extraction of a JSON object from model output."""
    raw_text = raw_text.strip()
    # Strip markdown code fences if present
    raw_text = re.sub(r"^```(json)?", "", raw_text.strip(), flags=re.IGNORECASE).strip()
    raw_text = re.sub(r"```$", "", raw_text.strip()).strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    # Fallback: find the first {...} block
    match = re.search(r"\{.*\}", raw_text, flags=re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ReviewerError(f"Could not parse JSON from model output: {raw_text!r}")


def run_reviewer(ticket: dict, draft: dict) -> dict:
    """
    Grade a draft reply against its ticket using Groq (llama-3.1-8b-instant).

    Args:
        ticket: {"id": str, "text": str, "sender": str}
        draft:  {"draft": str, "source_used": str}

    Returns:
        {"score": int (0-10), "decision": "send" | "escalate", "reason": str}

    Raises:
        ReviewerError: if the API call fails, times out, or output is
                       unparseable / malformed.
    """
    if not ticket or not draft:
        raise ReviewerError("Both 'ticket' and 'draft' are required.")

    user_prompt = _build_user_prompt(ticket, draft)

    try:
        response = _get_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": REVIEWER_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=400,
            timeout=5,  # 5 second timeout
        )
    except Exception as e:
        raise ReviewerError(f"Groq API call failed: {e}") from e

    try:
        raw_text = response.choices[0].message.content
    except (AttributeError, IndexError) as e:
        raise ReviewerError(f"Unexpected Groq response shape: {e}") from e

    if not raw_text:
        raise ReviewerError("Groq returned an empty response.")

    result = _extract_json(raw_text)

    # Validate structure
    required_keys = {"score", "decision", "reason"}
    if not required_keys.issubset(result.keys()):
        raise ReviewerError(f"Missing keys in reviewer output: {result}")

    score = result["score"]
    decision = result["decision"]
    reason = result["reason"]

    if not isinstance(score, (int, float)) or not (0 <= score <= 10):
        raise ReviewerError(f"Invalid score in reviewer output: {score!r}")

    score = int(round(score))
    expected_decision = "send" if score >= 7 else "escalate"

    if decision not in ("send", "escalate"):
        raise ReviewerError(f"Invalid decision value: {decision!r}")

    # Enforce consistency between score and decision (model can drift)
    if decision != expected_decision:
        decision = expected_decision

    if not isinstance(reason, str) or not reason.strip():
        raise ReviewerError("Reason must be a non-empty string.")

    return {"score": score, "decision": decision, "reason": reason.strip()}


# ---------------------------------------------------------------------------
# Hardcoded fallback examples (for demo use if the API is unavailable,
# rate-limited, or for offline testing of downstream logic).
# ---------------------------------------------------------------------------

FALLBACK_EXAMPLES = [
    {
        "ticket": {
            "id": "T-1001",
            "text": "Hi, I ordered a pair of running shoes (order #4521) two weeks "
                    "ago and they still haven't arrived. Can you tell me what's "
                    "going on?",
            "sender": "customer_jane@example.com",
        },
        "draft": {
            "draft": "Hi Jane, thanks for reaching out! I checked order #4521 and "
                     "I can see it shipped on the 5th via standard shipping, which "
                     "typically takes 7-10 business days. Since it's now been 14 "
                     "days, I've escalated a trace request with our carrier and "
                     "will follow up within 24 hours with an update. In the "
                     "meantime, here's your tracking link: [tracking]. Sorry for "
                     "the delay!",
            "source_used": "order_lookup_tool",
        },
        "output": {
            "score": 9,
            "decision": "send",
            "reason": "Draft accurately references the correct order number, "
                      "explains the delay with specific shipping details, sets "
                      "clear next steps and a timeframe, and maintains an "
                      "empathetic, professional tone throughout.",
        },
    },
    {
        "ticket": {
            "id": "T-1002",
            "text": "I was charged twice for my subscription this month. Order "
                    "#7788. Please refund the duplicate charge.",
            "sender": "customer_mark@example.com",
        },
        "draft": {
            "draft": "Hi Mark, thanks for contacting us. We're happy to help with "
                     "any billing questions you may have. Please let us know if "
                     "there's anything else we can do for you!",
            "source_used": "generic_template",
        },
        "output": {
            "score": 2,
            "decision": "escalate",
            "reason": "Draft never acknowledges the duplicate charge on order "
                      "#7788, does not confirm or process the requested refund, "
                      "and does not reference any account or billing lookup — it "
                      "is a generic template reply that fails to address the "
                      "customer's actual request at all.",
        },
    },
    {
        "ticket": {
            "id": "T-1003",
            "text": "Do you offer international shipping to Canada? If so, how "
                    "long does it take and what's the cost?",
            "sender": "customer_lee@example.com",
        },
        "draft": {
            "draft": "Hi Lee, yes we ship to Canada! Delivery typically takes "
                     "5-8 business days. Shipping cost is calculated at checkout "
                     "based on your order weight and destination, so I'd recommend "
                     "adding items to your cart to see the exact rate before you "
                     "check out. Let me know if you have any other questions!",
            "source_used": "shipping_policy_doc",
        },
        "output": {
            "score": 8,
            "decision": "send",
            "reason": "Draft directly answers all three parts of the question "
                      "(availability, timeframe, cost) accurately based on the "
                      "shipping policy doc, with a friendly and clear tone and no "
                      "missing information.",
        },
    },
]


if __name__ == "__main__":
    # Quick manual sanity check using the fallback examples (no API calls).
    for i, example in enumerate(FALLBACK_EXAMPLES, 1):
        print(f"--- Fallback Example {i} ---")
        print(json.dumps(example["output"], indent=2))

# pip install groq

import json
from groq import Groq
from groq import APIError, APITimeoutError, APIConnectionError

VALID_CATEGORIES = {"Billing", "Technical", "General"}
VALID_URGENCIES = {"Low", "Medium", "High"}


class TriageError(Exception):
    """Raised when triage classification fails for any reason."""
    pass


# Groq client picks up GROQ_API_KEY from the environment automatically.
# Built lazily (not at import time) so a cold-start/env issue raises
# inside run_triage — which app.py already wraps in try/except — instead
# of crashing the import of the whole Flask app.
_client = None


def _get_client():
    global _client
    if _client is None:
        _client = Groq()
    return _client


def run_triage(ticket: dict) -> dict:
    """
    Classify a support ticket into category and urgency using Groq.

    Args:
        ticket: {"id": str, "text": str, "sender": str}

    Returns:
        {"category": "Billing"|"Technical"|"General",
         "urgency": "Low"|"Medium"|"High"}

    Raises:
        TriageError: if the API call fails, times out, or the response
                     can't be parsed into the expected strict JSON shape.
    """
    text = ticket.get("text", "")

    system_prompt = (
        "You are a support ticket triage classifier. "
        "Given a ticket's text, classify it into exactly one category "
        "and one urgency level.\n\n"
        "category must be exactly one of: Billing, Technical, General\n"
        "urgency must be exactly one of: Low, Medium, High\n\n"
        "Respond with ONLY a strict JSON object, no markdown, no code "
        "fences, no explanation. Example:\n"
        '{"category": "Technical", "urgency": "High"}'
    )

    try:
        response = _get_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0,
            max_tokens=50,
            timeout=5.0,
        )
    except APITimeoutError as e:
        raise TriageError(f"Groq API call timed out for ticket {ticket.get('id')}") from e
    except APIConnectionError as e:
        raise TriageError(f"Groq API connection failed for ticket {ticket.get('id')}") from e
    except APIError as e:
        raise TriageError(f"Groq API error for ticket {ticket.get('id')}: {e}") from e
    except Exception as e:
        raise TriageError(f"Unexpected error calling Groq for ticket {ticket.get('id')}: {e}") from e

    try:
        raw_content = response.choices[0].message.content.strip()
    except (AttributeError, IndexError, TypeError) as e:
        raise TriageError(f"Malformed Groq response object for ticket {ticket.get('id')}") from e

    # Strip accidental markdown code fences, just in case
    if raw_content.startswith("```"):
        raw_content = raw_content.strip("`")
        if raw_content.startswith("json"):
            raw_content = raw_content[4:].strip()

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError as e:
        raise TriageError(
            f"Could not parse Groq output as JSON for ticket {ticket.get('id')}: {raw_content!r}"
        ) from e

    if not isinstance(parsed, dict):
        raise TriageError(f"Groq output was not a JSON object for ticket {ticket.get('id')}: {parsed!r}")

    category = parsed.get("category")
    urgency = parsed.get("urgency")

    if category not in VALID_CATEGORIES:
        raise TriageError(f"Invalid category '{category}' for ticket {ticket.get('id')}")
    if urgency not in VALID_URGENCIES:
        raise TriageError(f"Invalid urgency '{urgency}' for ticket {ticket.get('id')}")

    return {"category": category, "urgency": urgency}


# -----------------------------------------------------------------
# Hardcoded fallback dataset: 3 example ticket/output pairs
# -----------------------------------------------------------------

FALLBACK_EXAMPLES = [
    (
        {
            "id": "T-1001",
            "text": "I was charged twice for my subscription this month. Please refund the duplicate charge.",
            "sender": "alice@example.com",
        },
        {"category": "Billing", "urgency": "Medium"},
    ),
    (
        {
            "id": "T-1002",
            "text": "The app crashes every time I try to upload a file larger than 10MB. This is blocking my entire team.",
            "sender": "bob@example.com",
        },
        {"category": "Technical", "urgency": "High"},
    ),
    (
        {
            "id": "T-1003",
            "text": "Just wondering if you offer a student discount or any plans for nonprofits.",
            "sender": "carol@example.com",
        },
        {"category": "General", "urgency": "Low"},
    ),
]


if __name__ == "__main__":
    # Quick manual test using the first fallback example
    example_ticket, expected_output = FALLBACK_EXAMPLES[0]
    try:
        result = run_triage(example_ticket)
        print("Result:", result)
    except TriageError as e:
        print("Triage failed:", e)

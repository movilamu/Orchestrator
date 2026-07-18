"""
Specialist Agent — "The Inbox That Runs Itself"

Drafts a grounded support reply using ONLY a hardcoded knowledge base,
via the Groq API (llama-3.1-8b-instant). Returns strict JSON.
"""

import json
import os
from groq import Groq


# ---------------------------------------------------------------------------
# Knowledge base — generic support FAQ / policy entries
# ---------------------------------------------------------------------------
KNOWLEDGE_BASE = [
    {
        "title": "Refund Policy",
        "content": (
            "Customers may request a full refund within 30 days of purchase "
            "if the product is unused and in original condition. Refunds are "
            "processed within 5-7 business days to the original payment method. "
            "Digital/downloadable products are non-refundable once accessed."
        ),
    },
    {
        "title": "Shipping Times",
        "content": (
            "Standard shipping takes 5-8 business days within the continental US. "
            "Expedited shipping (2-3 business days) is available for an additional fee. "
            "International orders typically take 10-20 business days depending on customs."
        ),
    },
    {
        "title": "Login Problems",
        "content": (
            "If a user cannot log in, they should first try the 'Forgot Password' "
            "link on the login page to reset their credentials. If the issue persists, "
            "they should clear browser cookies/cache or try a different browser. "
            "Accounts are locked for 15 minutes after 5 failed login attempts."
        ),
    },
    {
        "title": "Account Issues",
        "content": (
            "Users can update their email, password, and profile info from Account "
            "Settings. To change the email on file, the user must verify the new "
            "email address via a confirmation link before the change takes effect. "
            "Account deletion requests are processed within 10 business days."
        ),
    },
    {
        "title": "Billing Cycle Explanation",
        "content": (
            "Subscriptions renew automatically on the same calendar day each month "
            "as the original signup date. Customers are charged 3 days before renewal "
            "and notified by email. Billing cycles can be switched from monthly to "
            "annual at any time, with the change applying at the next renewal date."
        ),
    },
    {
        "title": "Order Cancellation",
        "content": (
            "Orders can be cancelled free of charge within 1 hour of purchase, "
            "before they enter fulfillment. Once an order has shipped, it cannot "
            "be cancelled and must instead go through the standard return process."
        ),
    },
    {
        "title": "Damaged or Defective Items",
        "content": (
            "If an item arrives damaged or defective, the customer should submit "
            "photos within 7 days of delivery. Verified claims receive a free "
            "replacement or full refund, customer's choice, with no return shipping "
            "cost required."
        ),
    },
    {
        "title": "Payment Methods",
        "content": (
            "Accepted payment methods are major credit/debit cards, PayPal, and "
            "Apple Pay. Payment plans are not currently offered. Failed payments "
            "are retried automatically once after 24 hours before the subscription "
            "is paused."
        ),
    },
]


# ---------------------------------------------------------------------------
# Core function
# ---------------------------------------------------------------------------
def _mock_response_for(ticket: dict) -> dict | None:
    """
    Look up a canned response from EXAMPLE_TICKETS by matching ticket id.
    Falls back to a generic 'need more info' draft if the id isn't a known
    example. Used for offline/demo mode.
    """
    for example in EXAMPLE_TICKETS:
        if example["ticket"]["id"] == ticket.get("id"):
            return dict(example["expected_output"])
    return {
        "draft": (
            "Thanks for reaching out. I don't have enough information in "
            "front of me to answer this confidently yet — a specialist "
            "will follow up shortly with more details."
        ),
        "source_used": "none",
    }


def run_specialist(
    ticket: dict,
    triage_result: dict,
    offline: bool = False,
    fallback_on_error: bool = False,
) -> dict:
    """
    Draft a grounded reply to a support ticket using only the hardcoded
    knowledge base above.

    Args:
        ticket: {"id": str, "text": str, "sender": str}
        triage_result: {"category": str, "urgency": str}
        offline: if True, skip the Groq API entirely and return mock data
            from EXAMPLE_TICKETS (or a generic fallback draft). Useful for
            demos without network access or an API key.
        fallback_on_error: if True, a live API failure (timeout, network
            error, bad/unparseable output) falls back to mock data instead
            of raising. Live errors are printed as warnings either way.

    Returns:
        {"draft": str, "source_used": str}

    Raises:
        RuntimeError: on API failure, timeout, or unparseable/invalid
            output, UNLESS fallback_on_error=True.
    """
    if offline or not os.environ.get("GROQ_API_KEY"):
        return _mock_response_for(ticket)

    kb_text = "\n\n".join(
        f"[{entry['title']}]\n{entry['content']}" for entry in KNOWLEDGE_BASE
    )

    system_prompt = (
        "You are a support ticket specialist. You must draft a reply to the "
        "customer's ticket using ONLY the information in the knowledge base "
        "provided below. Do not invent, assume, or infer any policy details, "
        "numbers, timeframes, or procedures that are not explicitly present "
        "in the knowledge base.\n\n"
        "If the ticket does not clearly match any knowledge base entry, do "
        "NOT guess. Instead, write a draft that politely tells the customer "
        "the agent needs more information to help them, and set "
        "\"source_used\" to \"none\".\n\n"
        "Respond with STRICT JSON ONLY, no markdown fences, no commentary, "
        "matching exactly this shape:\n"
        '{"draft": "string", "source_used": "string"}\n\n'
        "\"source_used\" must be either the exact title of the single "
        "knowledge base entry you relied on, or \"none\" if no entry applied.\n\n"
        f"KNOWLEDGE BASE:\n{kb_text}"
    )

    user_prompt = (
        f"Ticket ID: {ticket.get('id')}\n"
        f"Sender: {ticket.get('sender')}\n"
        f"Category: {triage_result.get('category')}\n"
        f"Urgency: {triage_result.get('urgency')}\n"
        f"Ticket text: {ticket.get('text')}\n\n"
        "Draft the reply now, following the JSON output format exactly."
    )

    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=500,
            timeout=5,
        )

        raw_content = response.choices[0].message.content.strip()

        # Strip common markdown code-fence wrappers before parsing.
        cleaned = raw_content
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        parsed = json.loads(cleaned)

        if not isinstance(parsed, dict) or "draft" not in parsed or "source_used" not in parsed:
            raise ValueError(f"Missing required fields: {parsed}")

        if not isinstance(parsed["draft"], str) or not isinstance(parsed["source_used"], str):
            raise ValueError(f"Fields have wrong types: {parsed}")

        return {"draft": parsed["draft"], "source_used": parsed["source_used"]}

    except Exception as e:
        error_msg = f"Groq call/parsing failed for ticket {ticket.get('id')}: {e}"
        if fallback_on_error:
            print(f"[WARNING] {error_msg} — falling back to mock data.")
            return _mock_response_for(ticket)
        raise RuntimeError(error_msg) from e


def run_specialist_batch(
    tickets_with_triage: list[tuple[dict, dict]],
    offline: bool = False,
    fallback_on_error: bool = False,
) -> list[dict]:
    """
    Process multiple tickets through run_specialist sequentially.

    Args:
        tickets_with_triage: list of (ticket, triage_result) tuples.
        offline: passed through to run_specialist.
        fallback_on_error: passed through to run_specialist.

    Returns:
        A list of result dicts, one per input ticket, each of the form:
        {
            "ticket_id": str,
            "success": bool,
            "output": {"draft": str, "source_used": str} | None,
            "error": str | None,
        }
        Processing continues even if individual tickets fail (when
        fallback_on_error=False, a failure is captured here rather than
        raised, so one bad ticket doesn't stop the batch).
    """
    results = []
    for ticket, triage_result in tickets_with_triage:
        try:
            output = run_specialist(
                ticket, triage_result, offline=offline, fallback_on_error=fallback_on_error
            )
            results.append(
                {"ticket_id": ticket.get("id"), "success": True, "output": output, "error": None}
            )
        except RuntimeError as e:
            results.append(
                {"ticket_id": ticket.get("id"), "success": False, "output": None, "error": str(e)}
            )
    return results


# ---------------------------------------------------------------------------
# Hardcoded example ticket/output pairs (fallback / test / demo data)
# ---------------------------------------------------------------------------
EXAMPLE_TICKETS = [
    {
        "ticket": {
            "id": "T-1001",
            "text": "I bought a jacket 2 weeks ago but it doesn't fit. Can I get my money back?",
            "sender": "customer1@example.com",
        },
        "triage_result": {"category": "refund", "urgency": "low"},
        "expected_output": {
            "draft": (
                "Thanks for reaching out! Since your jacket was purchased within "
                "the last 30 days and is unused/in original condition, you're "
                "eligible for a full refund. Please initiate the return and once "
                "we receive it, your refund will be processed within 5-7 business "
                "days to your original payment method."
            ),
            "source_used": "Refund Policy",
        },
    },
    {
        "ticket": {
            "id": "T-1002",
            "text": "I keep getting 'incorrect password' even though I know it's right. It's locked me out now.",
            "sender": "customer2@example.com",
        },
        "triage_result": {"category": "account_access", "urgency": "medium"},
        "expected_output": {
            "draft": (
                "Sorry for the trouble! It looks like your account may have been "
                "temporarily locked after multiple failed login attempts — this "
                "lock lasts 15 minutes. In the meantime, please try the 'Forgot "
                "Password' link on the login page to reset your credentials, or "
                "clear your browser cookies/cache and try again."
            ),
            "source_used": "Login Problems",
        },
    },
    {
        "ticket": {
            "id": "T-1003",
            "text": "Do you offer any kind of student discount or loyalty program?",
            "sender": "customer3@example.com",
        },
        "triage_result": {"category": "general_inquiry", "urgency": "low"},
        "expected_output": {
            "draft": (
                "Thanks for your interest! I don't have information on a student "
                "discount or loyalty program in front of me, so I don't want to "
                "give you incorrect details. Let me flag this with the right team "
                "and get back to you with an accurate answer shortly."
            ),
            "source_used": "none",
        },
    },
]


if __name__ == "__main__":
    # Single-ticket smoke test. If GROQ_API_KEY isn't set, this automatically
    # falls back to offline mock data (see run_specialist's offline check).
    sample_ticket = EXAMPLE_TICKETS[0]["ticket"]
    sample_triage = EXAMPLE_TICKETS[0]["triage_result"]
    try:
        result = run_specialist(sample_ticket, sample_triage)
        print("Single ticket result:")
        print(json.dumps(result, indent=2))
    except RuntimeError as err:
        print(f"Specialist agent failed: {err}")

    # Batch smoke test across all example tickets, forcing offline mode
    # so this runs the same with or without an API key / network.
    batch_input = [(ex["ticket"], ex["triage_result"]) for ex in EXAMPLE_TICKETS]
    batch_results = run_specialist_batch(batch_input, offline=True)
    print("\nBatch results (offline mode):")
    print(json.dumps(batch_results, indent=2))

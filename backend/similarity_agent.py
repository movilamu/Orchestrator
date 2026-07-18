"""
Similarity Agent - runs first in the pipeline.
Does spam-cluster detection and resolved-issue cascading using
plain Python string comparison (difflib). No external deps, no API calls.
"""

from difflib import SequenceMatcher

SPAM_THRESHOLD = 0.6
RESOLVED_THRESHOLD = 0.6


def text_similarity(a: str, b: str) -> float:
    """Simple ratio-based similarity between two strings, 0.0-1.0."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def run_similarity(ticket, known_spam, resolved_clusters):
    """
    ticket: {"id": str, "text": str, "sender": str}
    known_spam: list of strings
    resolved_clusters: list of {"resolved_ticket_id", "resolved_text", "resolution_summary"}
    """
    ticket_text = ticket.get("text", "")

    # 1. Check against known spam
    best_spam_score = 0.0
    for spam_text in known_spam:
        score = text_similarity(ticket_text, spam_text)
        if score > best_spam_score:
            best_spam_score = score

    if best_spam_score >= SPAM_THRESHOLD:
        return {
            "action": "spam",
            "matched_id": None,
            "reason": f"Text is {best_spam_score:.0%} similar to a known spam message."
        }

    # 2. Check against resolved clusters
    best_match = None
    best_resolved_score = 0.0
    for cluster in resolved_clusters:
        score = text_similarity(ticket_text, cluster.get("resolved_text", ""))
        if score > best_resolved_score:
            best_resolved_score = score
            best_match = cluster

    if best_resolved_score >= RESOLVED_THRESHOLD and best_match is not None:
        return {
            "action": "auto_close",
            "matched_id": best_match["resolved_ticket_id"],
            "reason": f"Text is {best_resolved_score:.0%} similar to previously resolved ticket "
                      f"{best_match['resolved_ticket_id']}.",
            "resolution_summary": best_match["resolution_summary"]
        }

    # 3. No match - continue pipeline
    return {
        "action": "continue",
        "matched_id": None,
        "reason": ""
    }


# ---- In-memory helpers to grow the lists after processing ----

def add_to_spam(known_spam, text):
    """Append a new spam text to the known_spam list (mutates and returns it)."""
    known_spam.append(text)
    return known_spam


def add_to_resolved(resolved_clusters, ticket_id, text, summary):
    """Append a new resolved cluster entry (mutates and returns it)."""
    resolved_clusters.append({
        "resolved_ticket_id": ticket_id,
        "resolved_text": text,
        "resolution_summary": summary
    })
    return resolved_clusters


# ---- Quick manual test ----
if __name__ == "__main__":
    known_spam = [
        "Congratulations! You've won a free prize, click here to claim now!!!",
        "Buy cheap watches now, limited time offer, click this link"
    ]

    resolved_clusters = [
        {
            "resolved_ticket_id": "T-101",
            "resolved_text": "My login page keeps returning a 500 error when I try to sign in",
            "resolution_summary": "Fixed by clearing browser cache and resetting session cookie."
        }
    ]

    test_tickets = [
        {"id": "T-201", "text": "Congratulations!! You have won a free prize, click here now to claim!", "sender": "a@x.com"},
        {"id": "T-202", "text": "My login page keeps giving me a 500 error when signing in", "sender": "b@x.com"},
        {"id": "T-203", "text": "I need help exporting my invoice history to CSV", "sender": "c@x.com"},
    ]

    for t in test_tickets:
        result = run_similarity(t, known_spam, resolved_clusters)
        print(t["id"], "->", result)

    # Example of adding new entries after processing
    add_to_spam(known_spam, "You are a winner! Claim your free gift card now")
    add_to_resolved(resolved_clusters, "T-202", "My login page keeps giving me a 500 error when signing in",
                     "Same root cause as T-101, applied same fix.")

    print("\nUpdated known_spam:", known_spam)
    print("Updated resolved_clusters:", resolved_clusters)

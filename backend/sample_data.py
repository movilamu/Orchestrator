"""
Sample data for "The Inbox That Runs Itself" hackathon demo.

Contains:
- KB: knowledge base of FAQ/policy entries for a generic SaaS product
- TICKETS: sample support tickets for the triage/draft/review demo
"""

KB = {
    "refund_policy": {
        "title": "Refund Policy",
        "answer": (
            "We offer full refunds within 14 days of purchase if you're not satisfied. "
            "After 14 days, refunds are only granted for verified billing errors or service outages. "
            "To request a refund, contact support with your order ID."
        ),
    },
    "shipping_delivery": {
        "title": "Shipping & Delivery Timelines",
        "answer": (
            "As a digital-only product, there is no physical shipping — access is granted instantly upon payment confirmation. "
            "Occasionally, activation emails may take up to 30 minutes to arrive due to email provider delays. "
            "If access isn't granted after an hour, contact support."
        ),
    },
    "password_reset": {
        "title": "Login & Password Reset",
        "answer": (
            "Click 'Forgot Password' on the login page and enter your registered email to receive a reset link. "
            "The link expires after 60 minutes for security reasons. "
            "If you don't receive the email, check your spam folder before contacting support."
        ),
    },
    "billing_cycle": {
        "title": "Billing Cycle Explanation",
        "answer": (
            "Subscriptions renew automatically every 30 days from your original signup date, not the calendar month. "
            "You can view your next billing date anytime under Account > Billing. "
            "Charges are processed using the payment method on file."
        ),
    },
    "cancel_subscription": {
        "title": "How to Cancel a Subscription",
        "answer": (
            "Go to Account > Billing > Cancel Subscription to cancel at any time. "
            "Cancellation stops future billing but does not refund the current billing period. "
            "You'll retain access until the end of your current paid cycle."
        ),
    },
    "data_privacy": {
        "title": "Data Privacy Basics",
        "answer": (
            "We never sell your personal data to third parties. "
            "Your data is encrypted at rest and in transit, and you can request full account deletion at any time. "
            "See our Privacy Policy page for full details on data handling."
        ),
    },
    "contact_human_support": {
        "title": "How to Contact Human Support",
        "answer": (
            "For issues our automated help can't resolve, email support@company.com or use the in-app chat widget. "
            "Our team typically responds within 24 hours on business days. "
            "Priority support is available for annual plan subscribers."
        ),
    },
    "feature_requests": {
        "title": "Feature Request Process",
        "answer": (
            "Submit feature ideas through the in-app 'Feedback' tab, where the community can upvote them. "
            "Our product team reviews top-voted requests quarterly during roadmap planning. "
            "We don't guarantee implementation timelines for individual requests."
        ),
    },
}

TICKETS = [
    {
        "id": "T-1001",
        "text": "Hi, I forgot my password and the reset link isn't showing up in my inbox. Can you help?",
        "sender": "jordan.miles@example.com",
    },
    {
        "id": "T-1002",
        "text": "How do I cancel my subscription? I don't want to be charged next month.",
        "sender": "priya.k@example.com",
    },
    {
        "id": "T-1003",
        "text": "Is my data sold to advertisers? Also, how can I request my account be fully deleted?",
        "sender": "devon.chen@example.com",
    },
    {
        "id": "T-1004",
        "text": "I was charged twice this month for the same subscription — once on the 3rd and once on the 15th. Can you check my billing history and fix this?",
        "sender": "amara.osei@example.com",
    },
    {
        "id": "T-1005",
        "text": (
            "This is honestly ridiculous. I was charged for a renewal 40 days ago, way past your "
            "'14 day' window, but I lost my job last month and completely forgot to cancel. I've "
            "been a customer for 3 years — I need a full refund or I'm disputing this with my bank "
            "and leaving a public review. Can someone please just make an exception here?"
        ),
        "sender": "frustrated_longtime_user@example.com",
    },
]

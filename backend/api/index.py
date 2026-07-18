import sys
import os

# Make the backend/ root (one level up) importable so `app.py` and the
# agent modules resolve normally when this file runs as a Vercel
# serverless function.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app  # noqa: E402  (Flask WSGI app, unchanged)

# Vercel's Python runtime detects a WSGI-compatible `app` object in this
# file and serves it directly — no extra wrapping needed.

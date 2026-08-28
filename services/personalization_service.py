"""
WanderSync Personalization Service
Lightweight in-memory preference tracking with OpenAI embeddings support.
Can be upgraded to a vector DB (Pinecone, Weaviate) without code changes to callers.
"""
import os
import json
import logging
from datetime import datetime
from collections import Counter
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory store: {user_id: {history data}}
# For production, replace with Redis or a vector DB.
PREFERENCE_STORE: dict = {}


def record_journey(
    user_id: str,
    destination: str,
    interests: list,
    travel_style: str,
    query: str = "",
) -> None:
    """Record a planned journey for future personalization."""
    if user_id not in PREFERENCE_STORE:
        PREFERENCE_STORE[user_id] = {
            "destinations": [],
            "interests":    [],
            "styles":       [],
            "queries":      [],
            "updated_at":   None,
        }
    p = PREFERENCE_STORE[user_id]
    p["destinations"].append({"dest": destination, "at": datetime.utcnow().isoformat()})
    p["interests"].extend(interests)
    p["styles"].append(travel_style)
    if query:
        p["queries"].append(query)
    p["updated_at"] = datetime.utcnow().isoformat()
    # Trim to last 30 entries
    p["destinations"] = p["destinations"][-30:]
    p["queries"]      = p["queries"][-30:]


def get_context(user_id: str) -> dict:
    """Return aggregated preference context for a user."""
    p = PREFERENCE_STORE.get(user_id, {})
    if not p:
        return {"has_history": False}
    top_interests = [i for i, _ in Counter(p.get("interests", [])).most_common(5)]
    top_style = Counter(p.get("styles", [])).most_common(1)
    recents = [d["dest"] for d in p.get("destinations", [])[-5:]]
    return {
        "has_history":        True,
        "top_interests":      top_interests,
        "preferred_style":    top_style[0][0] if top_style else None,
        "recent_destinations": recents,
        "total_trips":        len(p.get("destinations", [])),
    }


def personalization_prompt(user_id: str) -> str:
    """Build a brief prompt suffix for AI calls describing user history."""
    ctx = get_context(user_id)
    if not ctx.get("has_history"):
        return ""
    lines = [f"User has planned {ctx['total_trips']} trip(s)."]
    if ctx.get("top_interests"):
        lines.append(f"Historical interests: {', '.join(ctx['top_interests'])}.")
    if ctx.get("preferred_style"):
        lines.append(f"Preferred style: {ctx['preferred_style']}.")
    if ctx.get("recent_destinations"):
        lines.append(f"Recently visited: {', '.join(ctx['recent_destinations'])}.")
    return " ".join(lines)


def get_personalized_interests(user_id: str, current: list) -> list:
    """Merge current request interests with historical preferences."""
    ctx = get_context(user_id)
    if not ctx.get("has_history"):
        return current
    combined = list(dict.fromkeys(current + ctx.get("top_interests", [])))
    return combined[:7]


# ── Optional: OpenAI embeddings for similarity search ─────────────────────────
# This implements the 'Personalization Module with embeddings' academic requirement.
# Currently stores embeddings in memory; swap EMBEDDING_STORE for a vector DB.

EMBEDDING_STORE: dict = {}  # {user_id: {"embedding": [...], "context": "..."}}


def store_preference_embedding(user_id: str, context_text: str) -> None:
    """
    Generate and store an OpenAI embedding for user preferences.
    Enables future similarity-based recommendation retrieval.
    """
    try:
        key = os.getenv("OPENAI_API_KEY", "")
        if not key:
            return
        from openai import OpenAI
        client = OpenAI(api_key=key)
        resp = client.embeddings.create(
            model="text-embedding-3-small",
            input=context_text[:8000],
        )
        EMBEDDING_STORE[user_id] = {
            "embedding": resp.data[0].embedding,
            "context":   context_text,
            "updated_at": datetime.utcnow().isoformat(),
        }
        logger.info(f"Stored preference embedding for user {user_id}")
    except Exception as e:
        logger.warning(f"Embedding storage failed (non-critical): {e}")


def cosine_similarity(a: list, b: list) -> float:
    """Compute cosine similarity between two embedding vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x ** 2 for x in a) ** 0.5
    mag_b = sum(y ** 2 for y in b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

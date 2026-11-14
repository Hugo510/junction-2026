"""Preparation for a future auth repository; existing routes are unchanged."""
from hashlib import sha256


def hash_session_token(token: str) -> bytes:
    """Digest only high-entropy opaque tokens. Never use this for passwords."""
    return sha256(token.encode("utf-8")).digest()

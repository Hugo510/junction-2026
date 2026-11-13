import secrets
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

# Fixed synthetic users for the hackathon (replace with real auth later)
DEMO_USERS = [
    {"id": "11111111-1111-4111-8111-111111111111", "role": "patient"},
    {"id": "22222222-2222-4222-8222-222222222222", "role": "doctor"},
]

# token -> user, kept in memory for now
TOKENS: dict[str, dict] = {}


class DemoLoginRequest(BaseModel):
    role: Literal["patient", "doctor"]
    userId: UUID | None = None


@router.post("/demo-login")
def demo_login(body: DemoLoginRequest):
    candidates = [u for u in DEMO_USERS if u["role"] == body.role]
    if body.userId:
        candidates = [u for u in candidates if u["id"] == str(body.userId)]
    if not candidates:
        raise HTTPException(status_code=404, detail="No demo user for that role")

    user = candidates[0]
    token = secrets.token_urlsafe(32)
    TOKENS[token] = user
    return {"token": token, "role": user["role"], "userId": user["id"]}


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """FastAPI dependency: use it on any route that needs a logged-in user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user = TOKENS.get(authorization.removeprefix("Bearer ").strip())
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
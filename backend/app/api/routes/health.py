from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["system"])


@router.get("/health")
def health():
    return {"status": "ok", "version": settings.app_version}
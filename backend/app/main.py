from fastapi import FastAPI

from app.api.routes import auth, checkins, crisis, health, patient
from app.config import settings
from app.errors import register_error_handlers

app = FastAPI(
    title="Junction 2026 · Beyond the Clinic API",
    version=settings.app_version,
)

register_error_handlers(app)

API_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(patient.router, prefix=API_PREFIX)
app.include_router(checkins.router, prefix=API_PREFIX)
app.include_router(crisis.router, prefix=API_PREFIX)
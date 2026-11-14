from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, checkins, companion, crisis, health, patient
from app.config import settings
from app.errors import register_error_handlers

app = FastAPI(
    title="Junction 2026 · Beyond the Clinic API",
    version=settings.app_version,
)

# Browsers (Expo web preview, a web clinician page) need CORS; the phone app does not.
# Tokens travel in the Authorization header, so credentials (cookies) stay disabled.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

register_error_handlers(app)

API_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(patient.router, prefix=API_PREFIX)
app.include_router(checkins.router, prefix=API_PREFIX)
app.include_router(crisis.router, prefix=API_PREFIX)
app.include_router(companion.router, prefix=API_PREFIX)

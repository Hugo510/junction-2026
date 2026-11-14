from fastapi import APIRouter, Depends, HTTPException

from datetime import datetime, timezone

from app.api.routes.auth import get_current_user
from app.schemas.patient import Consents, ConsentsUpdate, Patient, PatientUpdate
from app.store import PATIENTS

router = APIRouter(tags=["patient"])


def get_patient_for_user(user: dict):
    """Return the caller's patient profile, or raise 403/404."""
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients have a patient profile")
    patient = PATIENTS.get(user["id"])
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


@router.get("/me", response_model=Patient)
def get_me(user: dict = Depends(get_current_user)):
    return get_patient_for_user(user)


@router.patch("/me", response_model=Patient)
def update_me(body: PatientUpdate, user: dict = Depends(get_current_user)):
    patient = get_patient_for_user(user)

    # Only fields the client actually sent, and not null
    changes = {
        name: getattr(body, name)
        for name in body.model_fields_set
        if getattr(body, name) is not None
    }
    updated = patient.model_copy(update=changes)
    PATIENTS[user["id"]] = updated
    return updated


@router.put("/me/consents", response_model=Consents)
def replace_consents(body: ConsentsUpdate, user: dict = Depends(get_current_user)):
    patient = get_patient_for_user(user)

    consents = Consents(**body.model_dump(), updated_at=datetime.now(timezone.utc))
    PATIENTS[user["id"]] = patient.model_copy(update={"consents": consents})
    return consents
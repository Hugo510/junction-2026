from fastapi import APIRouter, Depends, HTTPException


from app.api.routes.auth import get_current_user
from app.schemas.patient import Patient, PatientUpdate
from app.store import PATIENTS

router = APIRouter(tags=["patient"])


@router.get("/me", response_model=Patient)
def get_me(user: dict = Depends(get_current_user)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients have a patient profile")

    patient = PATIENTS.get(user["id"])
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient

@router.patch("/me", response_model=Patient)
def update_me(body: PatientUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients have a patient profile")

    patient = PATIENTS.get(user["id"])
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Only fields the client actually sent, and not null
    changes = {
        name: getattr(body, name)
        for name in body.model_fields_set
        if getattr(body, name) is not None
    }
    updated = patient.model_copy(update=changes)
    PATIENTS[user["id"]] = updated
    return updated
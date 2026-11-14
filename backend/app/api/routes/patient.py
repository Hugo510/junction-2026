from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.auth import get_current_user
from app.schemas.patient import Patient
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
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.auth import get_current_user
from app.schemas.care import Alert
from app.store import ALERTS, PATIENTS

router = APIRouter(tags=["care"])


@router.get("/alerts", response_model=list[Alert])
def list_alerts(user: dict = Depends(get_current_user)):
    """Urgent alerts for the care team, newest first.

    Only the doctor role can read them, and only for patients whose care team includes
    that doctor. Without this endpoint the self-harm rule wrote alerts nobody could see.
    """
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only the care team can read alerts")

    doctor_id = UUID(user["id"])
    own_patients = {
        patient_id for patient_id, patient in PATIENTS.items() if doctor_id in patient.care_team_ids
    }
    alerts = [a for a in ALERTS if a.patient_id in own_patients]
    return sorted(alerts, key=lambda a: a.created_at, reverse=True)

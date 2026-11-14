from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.auth import get_current_user
from app.api.routes.patient import get_patient_for_user
from app.schemas.sensors import SensorBatch
from app.services.sensors import find_unconsented_types
from app.store import SENSOR_AGGREGATES

router = APIRouter(tags=["sensors"])


@router.post("/sensors/aggregates", status_code=202)
def upload_aggregates(body: SensorBatch, user: dict = Depends(get_current_user)):
    patient = get_patient_for_user(user)

    # All-or-nothing: if any item lacks consent, nothing in the batch is saved
    missing = find_unconsented_types(body.items, patient.consents)
    if missing:
        raise HTTPException(
            status_code=403,
            detail=f"No consent for: {', '.join(missing)}. Nothing was saved.",
        )

    store = SENSOR_AGGREGATES.setdefault(user["id"], {})
    for item in body.items:
        store[(item.type, item.period_start)] = item  # upsert by (type, periodStart)

    return {"accepted": len(body.items)}
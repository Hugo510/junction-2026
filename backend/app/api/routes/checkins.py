from datetime import date as CalendarDate, datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.routes.auth import get_current_user
from app.api.routes.patient import get_patient_for_user
from app.schemas.care import Alert
from app.schemas.checkin import CheckIn, CheckInCreate, CheckInResult, Risk, RiskLevel
from app.schemas.common import Reason
from app.services.checkins import compute_priority, evaluate_risk
from app.services.crisis import crisis_resources_for
from app.store import ALERTS, CHECKINS, PATIENTS

router = APIRouter(tags=["checkins"])


def _history(user_id: str, ref: CalendarDate) -> list[CheckIn]:
    """Check-ins from the 7 days up to and including ref, newest first."""
    days = CHECKINS.get(user_id, {})
    recent = [c for d, c in days.items() if 0 <= (ref - d).days < 7]
    return sorted(recent, key=lambda c: c.date, reverse=True)


def _build_result(user_id: str, check_in: CheckIn) -> CheckInResult:
    level = evaluate_risk(check_in)
    priority, worsening = compute_priority(_history(user_id, check_in.date))

    alert_id = None
    crisis = None
    if level == RiskLevel.urgent:
        # Urgent: alert the care team now and never enter the normal queue
        alert = Alert(
            id=uuid4(),
            patient_id=user_id,
            patient_display_name=PATIENTS[user_id].display_name,
            type="urgent_risk",
            severity="urgent",
            reasons=[Reason(
                key="reason.self_harm_thoughts",
                text="Check-in reported thoughts of self-harm",
            )],
            created_at=datetime.now(timezone.utc),
        )
        ALERTS.append(alert)
        alert_id = alert.id
        crisis = crisis_resources_for("FI")

    return CheckInResult(
        check_in=check_in,
        priority=priority,
        risk=Risk(level=level, alert_id=alert_id),
        crisis_resources=crisis,
        suggest_consultation=worsening,
    )


@router.post("/checkins", status_code=201, response_model=CheckInResult)
def create_checkin(body: CheckInCreate, user: dict = Depends(get_current_user)):
    get_patient_for_user(user)
    days = CHECKINS.setdefault(user["id"], {})

    if body.date in days:
        raise HTTPException(
            status_code=409,
            detail="A check-in already exists for this day. Use PUT /checkins/{date} instead.",
        )

    check_in = CheckIn(**body.model_dump(), id=uuid4(), created_at=datetime.now(timezone.utc))
    days[body.date] = check_in
    return _build_result(user["id"], check_in)


@router.put("/checkins/{day}", response_model=CheckInResult)
def replace_checkin(day: CalendarDate, body: CheckInCreate, user: dict = Depends(get_current_user)):
    get_patient_for_user(user)
    days = CHECKINS.get(user["id"], {})
    existing = days.get(day)
    if existing is None:
        raise HTTPException(status_code=404, detail="No check-in for that day")
    if body.date != day:
        raise HTTPException(status_code=422, detail="The date in the body must match the path")

    # Keep the original id and created_at, replace everything else
    check_in = CheckIn(**body.model_dump(), id=existing.id, created_at=existing.created_at)
    days[day] = check_in
    return _build_result(user["id"], check_in)


@router.get("/checkins", response_model=list[CheckIn])
def list_checkins(
    from_: CalendarDate | None = Query(default=None, alias="from"),
    to: CalendarDate | None = None,
    user: dict = Depends(get_current_user),
):
    get_patient_for_user(user)
    to = to or datetime.now(timezone.utc).date()
    from_ = from_ or (to - timedelta(days=14))

    days = CHECKINS.get(user["id"], {})
    items = [c for d, c in days.items() if from_ <= d <= to]
    return sorted(items, key=lambda c: c.date, reverse=True)
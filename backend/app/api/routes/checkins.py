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
    items = CHECKINS.get(user_id, [])
    recent = [c for c in items if 0 <= (ref - c.date).days < 7]
    return sorted(recent, key=lambda c: (c.date, c.created_at), reverse=True)


def _build_result(user_id: str, check_in: CheckIn) -> CheckInResult:
    level = evaluate_risk(check_in)
    priority, worsening = compute_priority(_history(user_id, check_in.date))

    alert_id = None
    crisis = None
    if level == RiskLevel.urgent:
        # Urgent: alert the care team now. Never enters the normal queue.
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
    entries = CHECKINS.setdefault(user["id"], [])

    # One ORDINARY check-in per day. A self-harm report is always accepted, and it does not
    # count as the day's check-in (so an ordinary one can still be sent after it).
    ordinary_same_day = [
        c for c in entries if c.date == body.date and not c.safety.self_harm_thoughts
    ]
    if ordinary_same_day and not body.safety.self_harm_thoughts:
        raise HTTPException(
            status_code=409,
            detail="A check-in already exists for this day. Use PUT /checkins/{date} instead.",
        )

    check_in = CheckIn(**body.model_dump(), id=uuid4(), created_at=datetime.now(timezone.utc))
    entries.append(check_in)
    return _build_result(user["id"], check_in)


@router.put("/checkins/{day}", response_model=CheckInResult)
def replace_checkin(day: CalendarDate, body: CheckInCreate, user: dict = Depends(get_current_user)):
    get_patient_for_user(user)
    entries = CHECKINS.get(user["id"], [])

    same_day = [c for c in entries if c.date == day]
    if not same_day:
        raise HTTPException(status_code=404, detail="No check-in for that day")
    if body.date != day:
        raise HTTPException(status_code=422, detail="The date in the body must match the path")

    # A self-harm report is a record for the care team: it is NEVER overwritten.
    # Only the day's ordinary check-in can be replaced.
    replaceable = [c for c in same_day if not c.safety.self_harm_thoughts]
    if not replaceable:
        raise HTTPException(
            status_code=409,
            detail="This day only has safety reports, which cannot be replaced. Use POST /checkins.",
        )

    # Replace the most recent ordinary entry for that day, keeping its id and created_at
    existing = max(replaceable, key=lambda c: c.created_at)
    check_in = CheckIn(**body.model_dump(), id=existing.id, created_at=existing.created_at)
    index = next(i for i, c in enumerate(entries) if c.id == existing.id)
    entries[index] = check_in
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

    items = [c for c in CHECKINS.get(user["id"], []) if from_ <= c.date <= to]
    return sorted(items, key=lambda c: (c.date, c.created_at), reverse=True)
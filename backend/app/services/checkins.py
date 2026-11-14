from datetime import datetime, timezone
from statistics import mean

from app.schemas.checkin import (
    CheckIn,
    CheckInCreate,
    Priority,
    PriorityLevel,
    RiskLevel,
)
from app.schemas.common import Reason


def evaluate_risk(body: CheckInCreate) -> RiskLevel:
    # Hard rule from the contract: self-harm thoughts are always urgent
    if body.safety.self_harm_thoughts:
        return RiskLevel.urgent
    if body.mood <= 2 or (body.anxiety is not None and body.anxiety >= 4):
        return RiskLevel.watch
    return RiskLevel.none


def compute_priority(history: list[CheckIn]) -> tuple[Priority, bool]:
    """
    history: check-ins from the last 7 days, newest first.
    Returns (priority, worsening). The score is simple and explainable on purpose.
    """
    now = datetime.now(timezone.utc)
    if not history:
        return Priority(score=0, level=PriorityLevel.low, reasons=[], computed_at=now), False

    reasons: list[Reason] = []
    score = 0.0

    avg_mood = mean(c.mood for c in history)
    anxieties = [c.anxiety for c in history if c.anxiety is not None]
    sleeps = [c.sleep_hours for c in history if c.sleep_hours is not None]

    # Low mood: up to 40 points
    mood_points = (5 - avg_mood) / 4 * 40
    if mood_points >= 5:
        score += mood_points
        reasons.append(Reason(
            key="reason.low_mood_avg",
            text=f"Average mood over the last week is {avg_mood:.1f} out of 5",
            weight=round(mood_points),
        ))

    # High anxiety: up to 30 points (only if anxiety was reported)
    if anxieties:
        avg_anxiety = mean(anxieties)
        anxiety_points = (avg_anxiety - 1) / 4 * 30
        if anxiety_points >= 5:
            score += anxiety_points
            reasons.append(Reason(
                key="reason.high_anxiety_avg",
                text=f"Average anxiety over the last week is {avg_anxiety:.1f} out of 5",
                weight=round(anxiety_points),
            ))

    # Short sleep: 15 points
    if sleeps and mean(sleeps) < 6:
        score += 15
        reasons.append(Reason(
            key="reason.short_sleep",
            text=f"Average sleep is {mean(sleeps):.1f} hours",
            weight=15,
        ))

    # Recent mood drop: last 3 days versus earlier in the window
    ref = history[0].date
    recent = [c.mood for c in history if (ref - c.date).days < 3]
    earlier = [c.mood for c in history if (ref - c.date).days >= 3]
    worsening = bool(recent and earlier and mean(earlier) - mean(recent) >= 1)
    if worsening:
        score += 15
        reasons.append(Reason(
            key="reason.mood_drop_3d",
            text="Mood is lower in the last 3 days than earlier this week",
            weight=15,
        ))

    score = min(100, round(score))
    if score >= 60:
        level = PriorityLevel.high
    elif score >= 30:
        level = PriorityLevel.medium
    else:
        level = PriorityLevel.low

    return Priority(score=score, level=level, reasons=reasons, computed_at=now), worsening
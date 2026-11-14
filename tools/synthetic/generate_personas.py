#!/usr/bin/env python3
"""
Hiillos — synthetic persona generator (Junction 2026, SISU Lab).

ALL DATA IS SYNTHETIC. Effect sizes are illustrative, not calibrated to real patients.

Writes, for each of 5 personas x 90 days:
  <out>/<id>/core.json            -> read by the app (schema: apps/mobile/assets/personas/core.schema.json)
  <truth>/<id>.json               -> ground truth for tests and the pitch (NOT read by the app)

Dates are local calendar days (Europe/Helsinki). The last day is --end (default 2026-11-14),
i.e. the day BEFORE the demo day (Sun 15 Nov), as the schema asks.

Usage:
  python3 tools/synthetic/generate_personas.py --out tools/synthetic/personas --truth tools/synthetic/ground_truth
  (then copy tools/synthetic/personas/* to apps/mobile/assets/personas/)
  python3 generate_personas.py --end 2026-11-13   # shift everything if the demo day changes
"""
from __future__ import annotations

import argparse
import json
import random
from datetime import date, datetime, timedelta
from pathlib import Path

GENERATOR_VERSION = "0.5"
SEED = 2026
DAYS = 90

# ---------- v0.4: smart-ring layer (written to <out>/<id>/ring.json; core.json is unchanged) ----------
# One record per night, field names/units follow the Junction sleep-summary shape (which mirrors Oura):
# seconds for durations, efficiency 0-1, average_hrv = RMSSD in ms, hr_lowest/hr_average in bpm,
# temperature_delta in °C from the person's long-term average, respiratory_rate in breaths/min.
# Calibration (see ABOUT.md):
#  * within-person night-to-night SD: lowest HR ~2-3 bpm (strongly autocorrelated, lag-1 ~0.8),
#    sleep efficiency ~2.6 points, asleep time ~1 h in an active cohort  -> PMData-derived stats
#  * HRV declines with age, RMSSD lower in depression (group effect g ~ -0.46, Koch 2019)
#  * flu -> skin temperature up, respiratory rate up, lowest HR up, HRV down (lets the app tell flu from mood)
# HRV night-to-night CV (~15 %) and every drift size below are ILLUSTRATIVE, not calibrated.

RING_BASE = {  # per-person "normal" (illustrative), age in brackets
    "aino":  {"hrv": 38, "hr_low": 54, "resp": 14.2, "steps_per_active_min": 105, "base_steps": 3200},   # 42
    "leena": {"hrv": 45, "hr_low": 52, "resp": 13.8, "steps_per_active_min": 100, "base_steps": 3800},   # 30s
    "juho":  {"hrv": 31, "hr_low": 58, "resp": 15.0, "steps_per_active_min": 100, "base_steps": 2800},   # 50s
    "sara":  {"hrv": 40, "hr_low": 55, "resp": 14.5, "steps_per_active_min": 100, "base_steps": 3000},
    "elias": {"hrv": 56, "hr_low": 48, "resp": 13.5, "steps_per_active_min": 110, "base_steps": 4200},   # active
}


def ring_drift(pid: str, i: int) -> dict:
    """Night-level shifts from the person's normal (illustrative). Keys: hrv (fraction), hr (bpm),
    temp (°C), resp (breaths/min), timing_sd (h, bedtime irregularity), latency (min), eff (points)."""
    z = {"hrv": 0.0, "hr": 0.0, "temp": 0.0, "resp": 0.0, "timing_sd": 0.35, "latency": 0.0, "eff": 0.0, "wear": 0.95}
    if pid == "aino" and i >= 60:          # atypical pattern: sleeps longer, later, more irregular; HRV drifts down
        sev = 0.6 if 70 <= i < 78 else 1.0  # walks help in days 70-77
        z.update(hrv=-0.15 * sev, hr=3 * sev, timing_sd=0.35 + 0.6 * sev, latency=10 * sev, eff=-3 * sev)
    if pid == "juho" and 52 <= i < 78:     # anxious pattern: short, late, broken sleep; HRV lower, HR higher
        sev = 1.0 if i < 70 else 0.4
        z.update(hrv=-0.2 * sev, hr=4 * sev, timing_sd=0.35 + 0.7 * sev, latency=25 * sev, eff=-6 * sev)
    if pid == "sara":                      # ring worn less and less (charging forgotten)
        z["wear"] = 0.9 if i < 55 else (0.5 if i < 84 else 0.3)
    if pid == "elias" and 72 <= i < 79:    # flu: fever signature, unlike a mood drift
        peak = 1.0 - abs(i - 74) / 4
        z.update(hrv=-0.3 * peak, hr=8 * peak, temp=1.1 * peak, resp=2.5 * peak, eff=-5 * peak, latency=10 * peak)
    return z


# v0.5: the night after a step that truly helps this person (walks for Aino, sound/fireplace for Juho) has
# higher recovery: average_hrv x1.15 and hr_lowest -1.5 bpm. ILLUSTRATIVE, not calibrated: it exists so the demo can
# show the loop measuring a step's effect on the body. Not a claim that one walk raises HRV that night.
STEP_BOOST = 0.15


def ring_nights(pid: str, start: date, days_fn, step_nights: dict | None = None) -> list[dict]:
    step_nights = step_nights or {}
    rng = random.Random(f"{SEED}-{pid}-ring")  # own stream: core.json is identical with or without the ring layer
    b = RING_BASE[pid]
    hrv_ar, hr_ar = 0.0, 0.0  # AR(1) noise, lag-1 ~0.8 like resting HR in PMData
    nights = []
    for i in range(DAYS):
        day: Day = days_fn(i)
        z = ring_drift(pid, i)
        hrv_ar = 0.8 * hrv_ar + rng.gauss(0, 0.09)
        hr_ar = 0.8 * hr_ar + rng.gauss(0, 1.4)
        if rng.random() > z["wear"]:
            continue  # ring not worn / charging -> no record (real gaps)
        d = start + timedelta(days=i)
        bed = clamp(rng.gauss(day.screen_off + 0.3, z["timing_sd"]), 20.5, 28.5)  # hours, 24.5 = 00:30
        latency_min = clamp(rng.gauss(9 + z["latency"], 5), 1, 90)
        asleep_h = clamp(rng.gauss(day.sleep, 0.45), 3.0, 13.5)
        eff = clamp(rng.gauss(0.92 + z["eff"] / 100, 0.026), 0.6, 0.99)
        in_bed_h = asleep_h / eff + latency_min / 60 * 0.3
        total = int(asleep_h * 3600)
        deep = int(total * clamp(rng.gauss(0.18, 0.03), 0.05, 0.3))
        rem = int(total * clamp(rng.gauss(0.21, 0.035), 0.08, 0.32))
        light = total - deep - rem
        duration = int(in_bed_h * 3600)
        boost = step_nights.get(i, 0.0)  # v0.5: night after a step that helps this person
        hrv = max(8.0, b["hrv"] * (1 + z["hrv"]) * (1 + hrv_ar) * (1 + boost))
        hr_low = b["hr_low"] + z["hr"] + hr_ar - 10 * boost
        bed_dt = datetime(d.year, d.month, d.day) + timedelta(hours=bed)
        nights.append({
            "date": iso(d),                      # the evening the night started (local day)
            "bedtime_start": bed_dt.strftime("%Y-%m-%dT%H:%M:00+02:00"),
            "bedtime_end": (bed_dt + timedelta(seconds=duration)).strftime("%Y-%m-%dT%H:%M:00+02:00"),
            "duration": duration, "total": total, "awake": max(0, duration - total),
            "light": light, "deep": deep, "rem": rem,
            "latency": int(latency_min * 60),
            "efficiency": round(eff, 2),
            "hr_lowest": round(hr_low),
            "hr_average": round(hr_low + clamp(rng.gauss(6, 1.5), 2, 12)),
            "average_hrv": round(hrv, 1),
            "respiratory_rate": round(b["resp"] + z["resp"] + rng.gauss(0, 0.3), 1),
            "temperature_delta": round(z["temp"] + rng.gauss(0, 0.08), 2),
            "steps": int(clamp(rng.gauss(b["base_steps"] + day.activity * b["steps_per_active_min"],
                                         (b["base_steps"] + day.activity * b["steps_per_active_min"]) * 0.25), 0, 40000)),
            "source": {"provider": "synthetic-ring", "shape": "junction-sleep-summary-like"},
        })
    return nights


# ---------- helpers ----------------------------------------------------------

def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def iso(d: date) -> str:
    return d.isoformat()


class Day:
    """What one persona 'is like' on one day. The generator turns this into rows."""

    def __init__(self, mood=4.0, energy=3.5, anxiety=2.0, sleep=7.3, activity=40.0, daylight=40.0,
                 checkin_p=0.92, sensor_p=1.0, emotions=None, note=None, home=900.0, screen_off=23.0):
        self.mood, self.energy, self.anxiety, self.sleep = mood, energy, anxiety, sleep
        self.home, self.screen_off = home, screen_off  # minutes at home per day; screen-off hour (24.5 = 00:30)
        self.activity, self.daylight = activity, daylight
        self.checkin_p, self.sensor_p = checkin_p, sensor_p
        self.emotions = emotions or ["calm", "content"]
        self.note = note


def seasonal_daylight(i: int, start: float = 70, end: float = 35) -> float:
    """Outdoor daylight shrinks from mid-August to mid-November in Finland (illustrative)."""
    return start + (end - start) * i / (DAYS - 1)


# ---------- persona stories --------------------------------------------------
# Each story returns a Day for day index i (0 = first day, 89 = last day).

def aino(i: int) -> Day:
    """Drift caught early, walks help for a while, then mood keeps sliding -> clinician 'call' list."""
    base = Day(mood=4.1, energy=3.6, anxiety=2.0, sleep=7.4, activity=42, daylight=seasonal_daylight(i, 75, 40))
    if i < 60:
        return base
    if i < 70:  # week 9-10: first drift (her early signs: sleeps longer, stays in, irritable)
        return Day(mood=3.2, energy=2.8, anxiety=2.6, sleep=8.6, activity=27, daylight=12,
                   emotions=["tired", "irritable"], home=1180, screen_off=24.1)
    if i < 78:  # walks help: Hiillos reached out, she walks, mood lifts
        return Day(mood=3.8, energy=3.3, anxiety=2.3, sleep=7.8, activity=38, daylight=30,
                   emotions=["calm", "tired"], home=1000, screen_off=23.4)
    if i < 83:  # sliding again
        return Day(mood=3.0, energy=2.6, anxiety=2.8, sleep=9.0, activity=25, daylight=10,
                   emotions=["tired", "sad", "irritable"], home=1220, screen_off=24.3)
    # last week: clearly below her own baseline
    return Day(mood=2.0, energy=2.0, anxiety=3.2, sleep=10.4, activity=14, daylight=4, checkin_p=0.85,
               emotions=["sad", "tired", "lonely"], home=1290, screen_off=24.7)


def leena(i: int) -> Day:
    """Stays well: inside her own range all 90 days. Hiillos stays quiet; the embers glow bright."""
    return Day(mood=4.3, energy=3.8, anxiety=1.8, sleep=7.5, activity=48, daylight=seasonal_daylight(i, 80, 45),
               checkin_p=0.9, emotions=["calm", "content", "grateful"])


def juho(i: int) -> Day:
    """Drift where walks don't help but sound/music (fireplace) does; recovers -> the learning loop."""
    base = Day(mood=3.9, energy=3.4, anxiety=2.2, sleep=7.0, activity=35, daylight=seasonal_daylight(i, 60, 30))
    if i < 52:
        return base
    if i < 70:
        return Day(mood=2.5, energy=2.4, anxiety=3.3, sleep=5.6, activity=20, daylight=10,
                   emotions=["anxious", "tired"], home=1150, screen_off=25.2)
    if i < 78:
        return Day(mood=3.5, energy=3.0, anxiety=2.5, sleep=6.8, activity=28, daylight=18,
                   emotions=["calm", "tired"])
    return Day(mood=3.9, energy=3.4, anxiety=2.1, sleep=7.0, activity=33, daylight=seasonal_daylight(i, 60, 30))


def sara(i: int) -> Day:
    """Patchy data: check-ins and wear thin out, then stop. Silence ladder, not 'relapse'."""
    if i < 55:
        return Day(mood=3.9, energy=3.4, anxiety=2.2, sleep=7.2, activity=38,
                   daylight=seasonal_daylight(i, 65, 30), checkin_p=0.85, sensor_p=0.9)
    if i < 84:
        return Day(mood=3.8, energy=3.3, anxiety=2.3, sleep=7.1, activity=36,
                   daylight=seasonal_daylight(i, 65, 30), checkin_p=0.4, sensor_p=0.5,
                   emotions=["calm", "tired"])
    # silent from day 84: no check-ins, but the phone keeps logging (so the app's date rebasing keeps the silence)
    return Day(mood=3.6, activity=22, daylight=seasonal_daylight(i, 65, 30) * 0.6, checkin_p=0.0, sensor_p=1.0,
               home=1050, screen_off=23.8)


def elias(i: int) -> Day:
    """False alarm: a week of flu moves his signals out of range, then everything returns to normal."""
    base = Day(mood=4.0, energy=3.7, anxiety=2.0, sleep=7.2, activity=50, daylight=seasonal_daylight(i, 70, 35))
    if 72 <= i < 79:
        return Day(mood=3.2, energy=1.8, anxiety=2.2, sleep=10.6, activity=6, daylight=0,
                   emotions=["tired"], note="Flu, staying in bed." if i == 72 else None, home=1430, screen_off=22.3)
    return base


# interventions each persona tries, and how much each truly helps (illustrative)
# value = (probability of 👍, probability of 👎, next-day mood lift)
RESPONSES = {
    "aino":  {"daylightWalk": (0.85, 0.05, 0.6), "fireplace": (0.25, 0.25, 0.0), "breathing": (0.4, 0.15, 0.1)},
    "leena": {"gratitude": (0.75, 0.05, 0.1), "daylightWalk": (0.7, 0.05, 0.1), "breathing": (0.5, 0.1, 0.0)},
    "juho":  {"fireplace": (0.85, 0.05, 0.6), "daylightWalk": (0.15, 0.5, -0.2), "breathing": (0.35, 0.2, 0.0)},
    "sara":  {"breathing": (0.5, 0.1, 0.1), "daylightWalk": (0.45, 0.15, 0.1)},
    "elias": {"move": (0.7, 0.05, 0.2), "daylightWalk": (0.65, 0.1, 0.2), "fireplace": (0.4, 0.1, 0.1)},
}

PHQ9_DAYS = {"aino": [0, 14, 28, 42, 56, 66, 76, 82, 89], "leena": [0, 14, 28, 42, 56, 70, 84],
             "juho": [0, 14, 28, 42, 56, 60, 70, 84], "sara": [0, 14, 28, 42], "elias": [0, 14, 28, 42, 56, 70, 76, 84]}
PHQ9_FIXED = {"aino": {0: 6, 14: 5, 28: 4, 42: 5, 56: 5, 66: 9, 76: 7, 82: 11, 89: 12},
              "juho": {0: 5, 14: 4, 28: 5, 42: 4, 56: 6, 60: 11, 70: 8, 84: 4},
              "leena": {0: 4, 14: 3, 28: 2, 42: 3, 56: 2, 70: 3, 84: 2}}


def phq9_items(total: int, rng: random.Random) -> list[int]:
    """Spread a total over items 1-8 (0-3 each). Item 9 (self-harm) is always 0 in demo data."""
    items = [0] * 9
    for _ in range(total):
        free = [k for k in range(8) if items[k] < 3]
        if not free:
            break
        items[rng.choice(free)] += 1
    return items


PERSONAS = [
    {
        "fn": aino,
        "meta": {"id": "aino", "label": "Aino, 42, post-TMS (synthetic)", "path": "B", "state": "B5", "story": "Drift caught early, walks help -> call list",
                 "language": "fi", "companion": {"species": "cat", "name": "Kuu"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Mika (synthetic)", "phone": "+358 40 000 0001"}},
        "feedback_from": 60, "feedback_every": 2,
        "truth": {"driftStartDay": 60, "helps": ["daylightWalk"], "doesNotHelp": ["fireplace"],
                  "expectedAtDemoDay": "priority HIGH (call list): mood well below her own baseline, long sleep, activity drop",
                  "showsInDemo": "Main story: reach out on drift, walk helps for a while, clinic gets a one-line reason"},
    },
    {
        "fn": leena,
        "meta": {"id": "leena", "label": "Leena (synthetic)", "path": "B", "state": "B5", "story": "Stays well, Hiillos stays quiet",
                 "language": "sv", "companion": {"species": "bird", "name": "Sol"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Anna (synthetic)", "phone": "+358 40 000 0002"}},
        "feedback_from": 5, "feedback_every": 4,
        "truth": {"driftStartDay": None, "helps": ["gratitude", "daylightWalk"], "doesNotHelp": [],
                  "expectedAtDemoDay": "priority LOW, embers bright, no outreach",
                  "showsInDemo": "Quiet when you're well; the fire grows with self-care"},
    },
    {
        "fn": juho,
        "meta": {"id": "juho", "label": "Juho (synthetic)", "path": "B", "state": "B5", "story": "Sound helps, walks don't",
                 "language": "fi", "companion": {"species": "dog", "name": "Repe"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Sanna (synthetic)", "phone": "+358 40 000 0003"}},
        "feedback_from": 52, "feedback_every": 2,
        "truth": {"driftStartDay": 52, "helps": ["fireplace"], "doesNotHelp": ["daylightWalk"],
                  "expectedAtDemoDay": "priority LOW (recovered); 'learned' ranking: fireplace first, daylightWalk last",
                  "showsInDemo": "Learning per person: the opposite of Aino. 'fireplace' stands in for sound/music until a music id exists"},
    },
    {
        "fn": sara,
        "meta": {"id": "sara", "label": "Sara (synthetic)", "path": "B", "state": "B5", "story": "Goes quiet: silence ladder",
                 "language": "sv", "companion": {"species": "bee", "name": "Humla"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Johan (synthetic)", "phone": "+358 40 000 0004"}},
        "feedback_from": 10, "feedback_every": 6,
        "truth": {"driftStartDay": None, "lastCheckInDay": 83,
                  "helps": ["breathing"], "doesNotHelp": [],
                  "expectedAtDemoDay": "silent >= 7 days -> outreach 'reconnect' (care team only with consent); priority LOW-MEDIUM from missed check-ins only, no mood alarm",
                  "showsInDemo": "Silence is not relapse: warm -> friend -> reconnect"},
    },
    {
        "fn": elias,
        "meta": {"id": "elias", "label": "Elias (synthetic)", "path": "B", "state": "B5", "story": "Flu week: false alarm, no clinic alert",
                 "language": "en", "companion": {"species": "dog", "name": "Otso"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Leo (synthetic)", "phone": "+358 40 000 0005"}},
        "feedback_from": 8, "feedback_every": 4,
        "truth": {"driftStartDay": 72, "driftEndDay": 78, "cause": "flu (not mood)",
                  "helps": ["move", "daylightWalk"], "doesNotHelp": [],
                  "expectedAtDemoDay": "priority LOW (signals back to normal)",
                  "showsInDemo": "Set the demo date to day 79 to see Hiillos reach out during the flu week; mood stays near normal, so no call list"},
    },
]


# ---------- generation -------------------------------------------------------

def generate(p: dict, end: date, rng: random.Random, extended: bool = False) -> tuple[dict, dict]:
    pid = p["meta"]["id"]
    start = end - timedelta(days=DAYS - 1)
    check_ins, sensors, feedback = [], [], []
    moods: dict[int, int] = {}

    xrng = random.Random(f"{SEED}-{pid}-extended")
    last_checkin_cap = p["truth"].get("lastCheckInDay")
    for i in range(DAYS):
        d = start + timedelta(days=i)
        day: Day = p["fn"](i)

        if rng.random() < day.sensor_p:
            sensors.append({
                "date": iso(d),
                "activityMinutes": round(clamp(rng.gauss(day.activity, day.activity * 0.18 + 2), 0, 300)),
                "daylightMinutes": round(clamp(rng.gauss(day.daylight, day.daylight * 0.2 + 2), 0, 600)),
            })
            if extended:  # separate random stream, so base data is identical with or without --extended
                h = clamp(xrng.gauss(day.screen_off, 0.35), 20.0, 27.5) % 24
                sensors[-1]["homeMinutes"] = round(clamp(xrng.gauss(day.home, 45), 0, 1440))
                sensors[-1]["screenOffTime"] = f"{int(h):02d}:{int((h % 1) * 60):02d}"

        force_last = last_checkin_cap is not None and i == last_checkin_cap
        if force_last or rng.random() < day.checkin_p:
            if last_checkin_cap is not None and i > last_checkin_cap:
                continue
            mood = int(clamp(round(rng.gauss(day.mood, 0.45)), 1, 5))
            moods[i] = mood
            hour, minute = rng.randint(17, 19), rng.randint(0, 59)  # 19:00-21:59 Helsinki (UTC+2)
            ci = {
                "id": f"{pid}-{iso(d)}",
                "date": iso(d),
                "createdAt": f"{iso(d)}T{hour:02d}:{minute:02d}:00.000Z",
                "kind": "full",
                "mood": mood,
                "emotions": rng.sample(day.emotions, k=min(len(day.emotions), rng.randint(1, 2))),
                "energy": int(clamp(round(rng.gauss(day.energy, 0.5)), 1, 5)),
                "anxiety": int(clamp(round(rng.gauss(day.anxiety, 0.5)), 1, 5)),
                "sleepHours": round(clamp(rng.gauss(day.sleep, 0.35), 3, 14), 1),
                "safetyConcern": False,
            }
            if day.note:
                ci["note"] = day.note
            check_ins.append(ci)

    # "Did this help?" feedback, consistent with next-day mood (the bandit also reads the mood change)
    responses = RESPONSES[pid]
    arms = list(responses)
    for i in range(p["feedback_from"], DAYS, p["feedback_every"]):
        if i not in moods:
            continue
        arm = arms[(i // p["feedback_every"]) % len(arms)]
        p_up, p_down, lift = responses[arm]
        r = rng.random()
        rating = 1 if r < p_up else (-1 if r < p_up + p_down else 0)
        feedback.append({"id": f"{pid}-fb-{iso(start + timedelta(days=i))}-{arm}",
                         "interventionId": arm, "date": iso(start + timedelta(days=i)), "rating": rating})
        # make the next day's mood reflect the true effect, so rating and mood change agree
        nxt = i + 1
        if nxt in moods and lift != 0:
            new = int(clamp(round(moods[i] + lift + rng.gauss(0, 0.3)), 1, 5))
            moods[nxt] = new
            for c in check_ins:
                if c["date"] == iso(start + timedelta(days=nxt)):
                    c["mood"] = new

    core = {"synthetic": True, "generatorVersion": GENERATOR_VERSION, "seed": SEED,
            "persona": p["meta"], "checkIns": check_ins, "sensors": sensors, "feedback": feedback}
    if extended:
        phq = []
        for i in PHQ9_DAYS[pid]:
            if pid in PHQ9_FIXED:
                total = PHQ9_FIXED[pid][i]
            else:
                recent = [m for k, m in moods.items() if i - 6 <= k <= i] or [4]
                total = int(clamp(round((4.4 - sum(recent) / len(recent)) * 5 + 3 + xrng.gauss(0, 1)), 0, 24))
            items = phq9_items(total, xrng)
            phq.append({"date": iso(start + timedelta(days=i)), "items": items, "total": sum(items)})
        core["phq9"] = phq
    truth = {
        "synthetic": True, "generatorVersion": GENERATOR_VERSION, "seed": SEED,
        "personaId": pid, "firstDay": iso(start), "lastDay": iso(end), "demoDay": iso(end + timedelta(days=1)),
        "dayIndexToDate": "day i = firstDay + i days (0..89)",
        **{k: v for k, v in p["truth"].items()},
        "trueEffects": {k: {"pThumbsUp": v[0], "pThumbsDown": v[1], "nextDayMoodLift": v[2]} for k, v in responses.items()},
    }
    for key in ("driftStartDay", "driftEndDay", "lastCheckInDay"):
        if truth.get(key) is not None:
            truth[key.replace("Day", "Date")] = iso(start + timedelta(days=truth[key]))
    truth["ring"] = RING_TRUTH[pid]
    return core, truth


RING_TRUTH = {
    "aino": "From day 60: average_hrv about -15 % (about -9 % in the walk-helps days 70-77), hr_lowest +3, later and more irregular bedtimes, efficiency -3 points. No temperature change. v0.5: nights after her walks (days 60, 66, 72, 78, 84) average_hrv x1.15, hr_lowest -1.5 (illustrative).",
    "leena": "Stays inside her normal range; only gaps when the ring charges.",
    "juho": "Days 52-69: short, late, broken sleep (latency +25 min, efficiency -6), average_hrv -20 %, hr_lowest +4; partial recovery 70-77. v0.5: nights after fireplace/sound (days 54, 60, 66, 72, 78, 84) average_hrv x1.15, hr_lowest -1.5 (illustrative); walks: no effect.",
    "sara": "Wear drops (90 % -> 50 % -> 30 % of nights). Missing ring data is not a mood signal.",
    "elias": "Flu days 72-78, peak day 74: temperature_delta up to +1.1 °C, respiratory_rate +2.5, hr_lowest +8, average_hrv -30 %. Fever signature = illness, not relapse.",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--end", default="2026-11-14", help="last data day = day before the demo (YYYY-MM-DD)")
    ap.add_argument("--out", default="out/personas")
    ap.add_argument("--truth", default="out/ground_truth")
    ap.add_argument("--minimal", action="store_true",
                    help="leave out homeMinutes, screenOffTime and phq9 (older app format)")
    ap.add_argument("--no-ring", action="store_true", help="do not write ring.json (smart-ring layer, v0.4)")
    a = ap.parse_args()
    end = date.fromisoformat(a.end)
    out, truth_dir = Path(a.out), Path(a.truth)
    out.mkdir(parents=True, exist_ok=True)
    truth_dir.mkdir(parents=True, exist_ok=True)
    for n, p in enumerate(PERSONAS):
        rng = random.Random(SEED + n)
        core, truth = generate(p, end, rng, not a.minimal)
        pid = p['meta']['id']
        (out / pid).mkdir(parents=True, exist_ok=True)
        (out / pid / "core.json").write_text(json.dumps(core, ensure_ascii=False, indent=1) + "\n")
        (truth_dir / f"{pid}.json").write_text(json.dumps(truth, ensure_ascii=False, indent=2) + "\n")
        msg = f"{pid:6s} check-ins {len(core['checkIns']):3d}  sensors {len(core['sensors']):3d}  feedback {len(core['feedback']):3d}"
        if not a.no_ring:
            start = end - timedelta(days=DAYS - 1)
            helps = {k for k, v in RESPONSES[pid].items() if v[2] >= 0.5}  # steps with a real next-day mood lift
            step_nights = {(date.fromisoformat(f["date"]) - start).days: STEP_BOOST
                           for f in core["feedback"] if f["interventionId"] in helps}
            nights = ring_nights(pid, start, p["fn"], step_nights)
            ring = {"synthetic": True, "generatorVersion": GENERATOR_VERSION, "seed": SEED, "personaId": pid,
                    "device": "smart ring (Oura-like), SYNTHETIC",
                    "units": {"duration/total/awake/light/deep/rem/latency": "seconds", "efficiency": "0-1",
                              "average_hrv": "RMSSD ms", "hr_lowest/hr_average": "bpm",
                              "temperature_delta": "°C vs own long-term average", "respiratory_rate": "breaths/min",
                              "steps": "per day", "date": "local evening the night started; missing date = ring not worn"},
                    "nights": nights}
            (out / pid / "ring.json").write_text(json.dumps(ring, ensure_ascii=False, indent=1) + "\n")
            msg += f"  ring nights {len(nights):3d}"
        print(msg)


if __name__ == "__main__":
    main()

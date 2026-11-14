#!/usr/bin/env python3
"""
Hiillos — synthetic persona generator (Junction 2026, SISU Lab).

ALL DATA IS SYNTHETIC. Effect sizes are illustrative, not calibrated to real patients.

Writes, for each of 5 personas x 90 days:
  <out>/<id>.json                 -> read by the app (schema: apps/mobile/src/data/personas/core.schema.json)
  <truth>/<id>.json               -> ground truth for tests and the pitch (NOT read by the app)

Dates are local calendar days (Europe/Helsinki). The last day is --end (default 2026-11-14),
i.e. the day BEFORE the demo day (Sun 15 Nov), as the schema asks.

Usage:
  python3 generate_personas.py --out apps/mobile/src/data/personas --truth tools/synthetic/ground_truth
  python3 generate_personas.py --end 2026-11-13   # shift everything if the demo day changes
"""
from __future__ import annotations

import argparse
import json
import random
from datetime import date, timedelta
from pathlib import Path

GENERATOR_VERSION = "0.2"
SEED = 2026
DAYS = 90


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
    return Day(checkin_p=0.0, sensor_p=0.0)  # silent from day 84 (last check-in is day 83 at the latest)


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
        "meta": {"id": "aino", "displayName": "Aino (synthetic)", "story": "Drift caught early, walks help -> call list",
                 "language": "fi", "companion": {"species": "cat", "name": "Kuu"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Mika (synthetic)", "phone": "+358 40 000 0001"}},
        "feedback_from": 60, "feedback_every": 2,
        "truth": {"driftStartDay": 60, "helps": ["daylightWalk"], "doesNotHelp": ["fireplace"],
                  "expectedAtDemoDay": "priority HIGH (call list): mood well below her own baseline, long sleep, activity drop",
                  "showsInDemo": "Main story: reach out on drift, walk helps for a while, clinic gets a one-line reason"},
    },
    {
        "fn": leena,
        "meta": {"id": "leena", "displayName": "Leena (synthetic)", "story": "Stays well, Hiillos stays quiet",
                 "language": "sv", "companion": {"species": "bird", "name": "Sol"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Anna (synthetic)", "phone": "+358 40 000 0002"}},
        "feedback_from": 5, "feedback_every": 4,
        "truth": {"driftStartDay": None, "helps": ["gratitude", "daylightWalk"], "doesNotHelp": [],
                  "expectedAtDemoDay": "priority LOW, embers bright, no outreach",
                  "showsInDemo": "Quiet when you're well; the fire grows with self-care"},
    },
    {
        "fn": juho,
        "meta": {"id": "juho", "displayName": "Juho (synthetic)", "story": "Sound helps, walks don't",
                 "language": "fi", "companion": {"species": "dog", "name": "Repe"}, "bipolarFlag": False,
                 "trustedContact": {"name": "Sanna (synthetic)", "phone": "+358 40 000 0003"}},
        "feedback_from": 52, "feedback_every": 2,
        "truth": {"driftStartDay": 52, "helps": ["fireplace"], "doesNotHelp": ["daylightWalk"],
                  "expectedAtDemoDay": "priority LOW (recovered); 'learned' ranking: fireplace first, daylightWalk last",
                  "showsInDemo": "Learning per person: the opposite of Aino. 'fireplace' stands in for sound/music until a music id exists"},
    },
    {
        "fn": sara,
        "meta": {"id": "sara", "displayName": "Sara (synthetic)", "story": "Goes quiet: silence ladder",
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
        "meta": {"id": "elias", "displayName": "Elias (synthetic)", "story": "Flu week: false alarm, no clinic alert",
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

    core = {"persona": p["meta"], "checkIns": check_ins, "sensors": sensors, "feedback": feedback}
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
    return core, truth


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--end", default="2026-11-14", help="last data day = day before the demo (YYYY-MM-DD)")
    ap.add_argument("--out", default="out/personas")
    ap.add_argument("--truth", default="out/ground_truth")
    ap.add_argument("--extended", action="store_true",
                    help="also write homeMinutes, screenOffTime (sensors) and phq9 (needs the schema/entities change)")
    a = ap.parse_args()
    end = date.fromisoformat(a.end)
    out, truth_dir = Path(a.out), Path(a.truth)
    out.mkdir(parents=True, exist_ok=True)
    truth_dir.mkdir(parents=True, exist_ok=True)
    for n, p in enumerate(PERSONAS):
        rng = random.Random(SEED + n)
        core, truth = generate(p, end, rng, a.extended)
        (out / f"{p['meta']['id']}.json").write_text(json.dumps(core, ensure_ascii=False, indent=1) + "\n")
        (truth_dir / f"{p['meta']['id']}.json").write_text(json.dumps(truth, ensure_ascii=False, indent=2) + "\n")
        print(f"{p['meta']['id']:6s} check-ins {len(core['checkIns']):3d}  sensors {len(core['sensors']):3d}  feedback {len(core['feedback']):3d}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Bootstrap 90-day smart-ring nights for each Hiillos persona from a ~30-night TEMPLATE
(e.g. Junction sandbox demo data from fetch_demo.py, or any nights.json in ring.json format).

How:
  1. Block bootstrap: resample 7-night blocks from the template (keeps weekday rhythm and
     night-to-night correlation), until 90 nights.
  2. Rescale to the persona's own normal: HRV multiplicatively, HR / respiration / temperature
     additively, sleep durations by the persona's sleep target (from its story).
  3. Overlay the same persona drift as generator v0.4 (ring_drift): mood drift, flu fever, wear gaps.
Everything stays SYNTHETIC. Output replaces personas/<id>/ring.json only with --write.

  python3 tools/junction_sandbox/bootstrap_ring.py --template tools/junction_sandbox/data/oura_2026-11-14/nights.json
  python3 tools/junction_sandbox/bootstrap_ring.py --template ... --write   # overwrite ring.json files
"""
from __future__ import annotations

import argparse
import json
import random
import statistics as st
import sys
from datetime import datetime, timedelta, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "synthetic"))
import generate_personas as g  # noqa: E402


def num(x):
    return x if isinstance(x, (int, float)) else None


def bootstrap(template: list[dict], pid: str, fn, start: date, seed: int) -> list[dict]:
    rng = random.Random(f"{seed}-{pid}-bootstrap")
    t = [n for n in template if num(n.get("total")) and num(n.get("average_hrv"))]
    if len(t) < 7:
        sys.exit(f"template has only {len(t)} usable nights (need >= 7 with total + average_hrv)")
    mean = {k: st.mean([n[k] for n in t if num(n.get(k)) is not None]) for k in
            ["total", "average_hrv", "hr_lowest", "respiratory_rate"] if any(num(n.get(k)) for n in t)}
    seq = []
    if len(t) >= 14:  # enough nights: 7-night blocks keep weekly rhythm
        while len(seq) < g.DAYS:
            s = rng.randrange(0, len(t) - 6)
            seq.extend(t[s:s + 7])
        seq = seq[:g.DAYS]
    else:  # short template (e.g. 9 demo nights): resample single nights + jitter within the template's spread
        sd = {k: (st.pstdev([n[k] for n in t if num(n.get(k)) is not None]) if sum(num(n.get(k)) is not None for n in t) > 1 else 0)
              for k in ["duration", "total", "awake", "light", "deep", "rem", "latency", "efficiency",
                        "hr_lowest", "hr_average", "average_hrv", "respiratory_rate", "temperature_delta"]}
        for _ in range(g.DAYS):
            src = dict(rng.choice(t))
            for k, s_k in sd.items():
                if num(src.get(k)) is not None and s_k:
                    src[k] = src[k] + rng.gauss(0, 0.5 * s_k)
            src["average_hrv"] = max(5.0, src["average_hrv"])
            src["total"] = max(3 * 3600, src["total"])
            seq.append(src)
    b = g.RING_BASE[pid]
    out = []
    for i, src in enumerate(seq):
        day, z = fn(i), g.ring_drift(pid, i)
        if rng.random() > z["wear"]:
            continue
        d = start + timedelta(days=i)
        scale = day.sleep * 3600 / mean["total"]
        rec = {"date": d.isoformat()}
        for k in ["duration", "total", "awake", "light", "deep", "rem"]:
            if num(src.get(k)) is not None:
                rec[k] = int(src[k] * scale)
        if num(src.get("latency")) is not None:
            rec["latency"] = int(src["latency"] + z["latency"] * 60)
        if num(src.get("efficiency")) is not None:
            rec["efficiency"] = round(g.clamp(src["efficiency"] + z["eff"] / 100, 0.5, 0.99), 2)
        rec["average_hrv"] = round(b["hrv"] * (src["average_hrv"] / mean["average_hrv"]) * (1 + z["hrv"]), 1)
        if "hr_lowest" in mean and num(src.get("hr_lowest")) is not None:
            rec["hr_lowest"] = round(b["hr_low"] + (src["hr_lowest"] - mean["hr_lowest"]) + z["hr"])
            if num(src.get("hr_average")) is not None:
                rec["hr_average"] = round(rec["hr_lowest"] + (src["hr_average"] - src["hr_lowest"]))
        if "respiratory_rate" in mean and num(src.get("respiratory_rate")) is not None:
            rec["respiratory_rate"] = round(b["resp"] + (src["respiratory_rate"] - mean["respiratory_rate"]) + z["resp"], 1)
        td = num(src.get("temperature_delta"))
        rec["temperature_delta"] = round((td or 0.0) + z["temp"], 2)
        bed = g.clamp(rng.gauss(day.screen_off + 0.3, z["timing_sd"]), 20.5, 28.5)
        bed_dt = datetime(d.year, d.month, d.day) + timedelta(hours=bed)
        rec["bedtime_start"] = bed_dt.strftime("%Y-%m-%dT%H:%M:00+02:00")
        rec["bedtime_end"] = (bed_dt + timedelta(seconds=rec.get("duration", rec["total"]))).strftime("%Y-%m-%dT%H:%M:00+02:00")
        rec["steps"] = int(g.clamp(rng.gauss(b["base_steps"] + day.activity * b["steps_per_active_min"],
                                             (b["base_steps"] + day.activity * b["steps_per_active_min"]) * 0.25), 0, 40000))
        rec["source"] = {"provider": "bootstrap-from-template", "template": "junction sandbox demo (synthetic)"}
        out.append(rec)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True)
    ap.add_argument("--end", default="2026-11-14")
    ap.add_argument("--personas", default=str(Path(__file__).resolve().parents[1] / "synthetic" / "personas"))
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    template = json.loads(Path(a.template).read_text())["nights"]
    end = date.fromisoformat(a.end)
    start = end - timedelta(days=g.DAYS - 1)
    for p in g.PERSONAS:
        pid = p["meta"]["id"]
        nights = bootstrap(template, pid, p["fn"], start, g.SEED)
        hrv = [n["average_hrv"] for n in nights]
        print(f"{pid:6s} nights {len(nights):3d}  HRV mean {st.mean(hrv):5.1f}  first/last week "
              f"{st.mean(hrv[:7]):5.1f}/{st.mean(hrv[-7:]):5.1f}")
        if a.write:
            ring = {"synthetic": True, "generatorVersion": g.GENERATOR_VERSION + "+bootstrap", "seed": g.SEED,
                    "personaId": pid, "device": "smart ring (Oura-like), SYNTHETIC, bootstrapped from a template",
                    "template": a.template, "nights": nights}
            Path(a.personas, pid, "ring.json").write_text(json.dumps(ring, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()

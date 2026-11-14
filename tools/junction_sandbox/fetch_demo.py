#!/usr/bin/env python3
"""
Fetch SYNTHETIC "demo connection" data from the Junction (junction.com, ex-Vital) SANDBOX.

Junction demo users emit synthetic data that mimics a provider (Oura, Fitbit, Apple HealthKit,
Freestyle Libre). Sandbox only; ~30 days are backfilled; demo users are deleted after 7 days;
summary format only. This is NOT real user data and NOT the Oura API.

Setup (once):
  1. Create a Junction account, open the SANDBOX team, copy the sandbox API key (sk_eu_... or sk_us_...).
  2. export JUNCTION_API_KEY=sk_eu_...        # never commit it; .env is git-ignored
     export JUNCTION_REGION=eu                # or us (must match the key)
Run:
  python3 tools/junction_sandbox/fetch_demo.py --provider oura
Output (git-ignored until we have checked Junction's terms for sharing sandbox data):
  tools/junction_sandbox/data/<provider>_<date>/{user.json, sleep.json, activity.json, nights.json}
nights.json is converted to the same field names as tools/synthetic/personas/<id>/ring.json,
so tools/junction_sandbox/bootstrap_ring.py can use it as a template.
Standard library only.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path

BASE = {"eu": "https://api.sandbox.eu.junction.com", "us": "https://api.sandbox.us.junction.com"}
RING_FIELDS = ["duration", "total", "awake", "light", "deep", "rem", "latency", "efficiency",
               "hr_lowest", "hr_average", "average_hrv", "respiratory_rate", "temperature_delta"]


def call(method: str, url: str, key: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "x-vital-api-key": key, "Accept": "application/json", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url} -> HTTP {e.code}: {e.read().decode()[:500]}")


def to_nights(sleep: dict, activity: dict) -> list[dict]:
    steps = {a.get("calendar_date") or str(a.get("date", ""))[:10]: a.get("steps")
             for a in activity.get("activity", [])}
    nights = []
    for s in sleep.get("sleep", []):
        d = s.get("calendar_date") or str(s.get("date", ""))[:10]
        n = {"date": d, "bedtime_start": s.get("bedtime_start"), "bedtime_end": s.get("bedtime_end")}
        n.update({k: s.get(k) for k in RING_FIELDS})
        n["steps"] = steps.get(d)
        n["source"] = {"provider": f"junction-sandbox-demo-{(s.get('source') or {}).get('provider', 'unknown')}",
                       "synthetic": True}
        nights.append(n)
    return sorted(nights, key=lambda x: x["date"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--provider", default="oura", help="oura | fitbit | apple_health_kit | freestyle_libre")
    ap.add_argument("--wait", type=int, default=90, help="seconds to wait for the 30-day backfill")
    ap.add_argument("--user-id", help="reuse an existing sandbox demo user instead of creating one")
    a = ap.parse_args()
    key = os.environ.get("JUNCTION_API_KEY")
    if not key:
        sys.exit("Set JUNCTION_API_KEY (sandbox key). See the docstring.")
    base = BASE[os.environ.get("JUNCTION_REGION", "eu")]

    out = Path(__file__).parent / "data" / f"{a.provider}_{date.today().isoformat()}"
    out.mkdir(parents=True, exist_ok=True)

    if a.user_id:
        user = {"user_id": a.user_id}
    else:
        user = call("POST", f"{base}/v2/user/", key, {"client_user_id": f"hiillos-demo-{int(time.time())}"})
        print("user", user.get("user_id"))
        print(call("POST", f"{base}/v2/link/connect/demo", key, {"user_id": user["user_id"], "provider": a.provider}))
        print(f"waiting {a.wait}s for the backfill ...")
        time.sleep(a.wait)
    (out / "user.json").write_text(json.dumps(user, indent=1))

    end, start = date.today(), date.today() - timedelta(days=35)
    q = f"?start_date={start}&end_date={end}"
    sleep = call("GET", f"{base}/v2/summary/sleep/{user['user_id']}{q}", key)
    activity = call("GET", f"{base}/v2/summary/activity/{user['user_id']}{q}", key)
    (out / "sleep.json").write_text(json.dumps(sleep, indent=1))
    (out / "activity.json").write_text(json.dumps(activity, indent=1))
    nights = to_nights(sleep, activity)
    (out / "nights.json").write_text(json.dumps({"synthetic": True, "source": "junction sandbox demo connection",
                                                 "provider": a.provider, "nights": nights}, indent=1))
    print(f"{len(nights)} nights -> {out/'nights.json'}  (if 0: wait a bit and rerun with --user-id {user['user_id']})")


if __name__ == "__main__":
    main()

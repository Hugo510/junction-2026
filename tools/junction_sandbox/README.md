# Junction sandbox → ring template → bootstrap (optional)

Everything here is **synthetic**. Junction's sandbox "demo connections" create fake data in the shape of real devices (Oura, Fitbit, Apple HealthKit, Freestyle Libre). It is **not** real user data, and we do **not** call the Oura API.

1. **Key (Meg, once):** create a Junction account and copy the **sandbox** API key.
   ```sh
   export JUNCTION_API_KEY=sk_eu_...   # never commit (.env is git-ignored)
   export JUNCTION_REGION=eu
   ```
2. **Fetch about 30 demo nights:** `python3 tools/junction_sandbox/fetch_demo.py --provider oura`
   - This creates a sandbox user, connects the demo Oura, waits for the backfill, and saves `data/oura_<date>/nights.json` (git-ignored).
   - If it saves 0 nights, rerun later with `--user-id <id>`.
   - Demo users are deleted after 7 days.
3. **Bootstrap 90 days per persona:**
   ```sh
   python3 tools/junction_sandbox/bootstrap_ring.py --template tools/junction_sandbox/data/oura_<date>/nights.json          # preview
   python3 tools/junction_sandbox/bootstrap_ring.py --template tools/junction_sandbox/data/oura_<date>/nights.json --write  # overwrite personas/<id>/ring.json
   ```
   The script resamples 7-night blocks from the template, rescales them to each persona's own normal, and adds the same stories as generator v0.4 (mood drift, flu fever, wear gaps).
4. **Why bother:** night-to-night patterns and field shapes come from a device-like source, and the stories stay ours. Without a key, generator v0.4 alone is fine for the demo.

**Before committing anything from `data/`:** check Junction's terms for sharing sandbox output. Until then, `data/` stays out of git. See also `docs/research/wearable_data_terms.md` (Oura's terms for real data via aggregators).

## Result of the first run (14 Nov, 21:14): not used for the demo

The demo Oura user gave only **9 nights** (17 Oct – 13 Nov), and the values are not physiologically realistic:
- total sleep 2.6–3.4 h every night
- `awake` often larger than `total`
- `respiratory_rate` 6–37 at random
- `temperature_delta` always +0.2 to +1.0 °C, which would look like a fever every night
- `average_hrv` flat at 81–88 ms
- `steps` missing on 7 of 9 nights

**Decision:** keep generator v0.4 `ring.json` for the demo, and do not bootstrap from this.

**Useful finding for a real integration:** in this output `efficiency` comes as a **percentage** (89.0), while our files use 0–1. Normalise it on import.

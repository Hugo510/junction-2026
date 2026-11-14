## Development Stage

uvicorn app.main:app --reload --port 8000

## 1. Get a patient Token (Need to be done whenever we reload uvicorn)

TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"role": "patient"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")


## 2. Call /me as GET request

curl -s http://localhost:8000/api/v1/me -H "Authorization: Bearer $TOKEN"


Expected Output: 
```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "displayName": "Aino (synthetic)",
  "language": "en",
  "timeZone": "Europe/Helsinki",
  "companion": { "species": "cat", "name": "Pip" },
  "consents": {
    "motion": false,
    "touchPattern": false,
    "approximateLocation": false,
    "vibration": false,
    "updatedAt": null
  },
  "settings": { "theme": "system", "largeText": false, "reduceMotion": false, "haptics": true },
  "careTeamIds": ["22222222-2222-4222-8222-222222222222"],
  "createdAt": "2026-11-01T09:00:00Z"
}

```

## 3. Call /me as PATCH request

curl -s -X PATCH http://localhost:8000/api/v1/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Aino", "language": "fi", "companion": {"species": "dog", "name": "Mika"}}'

## 4. Grant motion and vibration only
curl -s -X PUT http://localhost:8000/api/v1/me/consents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"motion": true, "touchPattern": false, "approximateLocation": false, "vibration": true}'


# Error Testing

## 403: doctor token on a patient route
DOCTOR=$(curl -s -X POST http://localhost:8000/api/v1/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"role": "doctor"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
curl -i http://localhost:8000/api/v1/me -H "Authorization: Bearer $DOCTOR"


## 422: missing consent field. Expect an "errors" array with a field name
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"role": "patient"}' | python -c "import sys, json; print(json.load(sys.stdin)['token'])")
curl -i -X PUT http://localhost:8000/api/v1/me/consents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"motion": true}'

## 404: unknown route
curl -i http://localhost:8000/api/v1/nope


# CHECK IN Testing
A normal check-in should return 201, with risk.level set to none and a priority score:

```bash
curl -s -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-13", "mood": 4, "energy": 3, "anxiety": 2, "sleepHours": 7.5,
       "safety": {"selfHarmThoughts": false}}'
```
The same day again should return 409 as a Problem response:

```bash
curl -i -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-13", "mood": 4, "energy": 3, "anxiety": 2,
       "safety": {"selfHarmThoughts": false}}'
```
The safety rule: this should return 201 with risk.level set to urgent, an alertId, and crisisResources:

```bash
curl -s -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-14", "mood": 5, "energy": 5, "anxiety": 1,
       "safety": {"selfHarmThoughts": true}}'
```


## New Updates After Recommended Changes

Consents with the new field (should return careTeamAfterSilence: true):

```bash
curl -s -X PUT http://localhost:8000/api/v1/me/consents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"motion": true, "touchPattern": false, "approximateLocation": false, "vibration": true, "careTeamAfterSilence": true}'
```

Minimal check-in with only the required fields (should return 201):
```bash
curl -s -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-13", "mood": 4, "safety": {"selfHarmThoughts": false}}'
```


Full check-in with the new fields (should return 201):

```bash
curl -s -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-12", "mood": 2, "energy": 2, "anxiety": 4, "sleepHours": 5,
       "note": "Long day", "emotions": ["tired", "worried"], "kind": "journal",
       "bodyMap": {"chest": 3, "stomach": 2},
       "safety": {"selfHarmThoughts": false}}'
```

Second normal check-in on the same day (should return 409):

```bash
curl -i -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-13", "mood": 3, "safety": {"selfHarmThoughts": false}}'
```

Self-harm report on that same day (should return 201, with risk.level = urgent and an alertId):

```bash
curl -s -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-13", "mood": 5, "safety": {"selfHarmThoughts": true}}'
```

List check-ins (should show all entries, including two for 2026-11-13):

```bash
curl -s "http://localhost:8000/api/v1/checkins?from=2026-11-01&to=2026-11-14" \
  -H "Authorization: Bearer $TOKEN"
```


## Safety reports are never overwritten (added by Hugo, NOT RUN YET)

These checks follow the ones above (2026-11-13 already has one ordinary check-in and one
self-harm report).

Replace the ordinary check-in of that day (should return 200). The list must still show the
self-harm report for 2026-11-13 with selfHarmThoughts: true:

```bash
curl -s -X PUT http://localhost:8000/api/v1/checkins/2026-11-13 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-13", "mood": 3, "safety": {"selfHarmThoughts": false}}'
```

A day that only has a self-harm report: PUT must be refused (409), and an ordinary POST must
be accepted (201), because the report does not count as the day's check-in:

```bash
curl -s -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-10", "mood": 2, "safety": {"selfHarmThoughts": true}}'

curl -i -X PUT http://localhost:8000/api/v1/checkins/2026-11-10 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-10", "mood": 4, "safety": {"selfHarmThoughts": false}}'

curl -i -X POST http://localhost:8000/api/v1/checkins \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2026-11-10", "mood": 4, "safety": {"selfHarmThoughts": false}}'
```

## Alerts for the care team (added by Hugo, NOT RUN YET)

Log in as the doctor and list the urgent alerts (should show one per self-harm report above).
The patient token must get 403:

```bash
DOCTOR=$(curl -s -X POST http://localhost:8000/api/v1/auth/demo-login \
  -H "Content-Type: application/json" -d '{"role": "doctor"}' | python -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s http://localhost:8000/api/v1/alerts -H "Authorization: Bearer $DOCTOR"
curl -i http://localhost:8000/api/v1/alerts -H "Authorization: Bearer $TOKEN"
```

## Sensor dates need a timezone (added by Hugo, NOT RUN YET)

A period without a timezone should return 422 (it used to be able to return 500 when mixed
with a value that had one). Turn the motion consent on first:

```bash
curl -i -X POST http://localhost:8000/api/v1/sensors/aggregates \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"items": [{"type": "steps", "periodStart": "2026-11-13T00:00:00Z",
       "periodEnd": "2026-11-13T23:59:59", "value": 4200, "unit": "steps"}]}'
```

# GEMINI API Check Test

## Status: llm should be true, voice false
curl -s http://localhost:8000/api/v1/companion/status

## Normal message: expect source "llm" and a short reply
curl -s -X POST http://localhost:8000/api/v1/companion/reply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message": "I had a tiring day and could not sleep", "language": "fi"}'

## Crisis wording: expect crisis true and source "safety". Gemini is never called.
curl -s -X POST http://localhost:8000/api/v1/companion/reply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message": "I want to die", "language": "en"}'

## Spanish crisis wording, to check the multilingual keywords
curl -s -X POST http://localhost:8000/api/v1/companion/reply \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message": "Quiero morir", "language": "es"}'
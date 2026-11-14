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
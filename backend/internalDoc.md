## Development Stage

uvicorn app.main:app --reload --port 8000

1. Get a patient Token

TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"role": "patient"}' | python -c "import sys, json; print(json.load(sys.stdin)['token'])")


2. Call /me with it

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
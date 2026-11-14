# Companion AI and voice (optional features)

Both features are **off unless a key is configured** and the app treats every failure as
"use the built-in companion". The demo never depends on them.

| Endpoint | Auth | What it does |
| --- | --- | --- |
| `GET /api/v1/companion/status` | no | `{ "llm": bool, "voice": bool }`: what this server can do |
| `POST /api/v1/companion/reply` | Bearer | One reply from the LLM companion |
| `POST /api/v1/companion/speech` | Bearer | MP3 (base64) of a companion message |

## Safety order (do not change without the team)

1. **Fixed rule first.** `has_crisis_language()` runs before the model. A match returns
   `{ "reply": null, "source": "safety", "crisis": true }` and the model is never called.
   The app runs the same rule on the phone before sending anything.
2. **System prompt**: at most 3 short sentences, no diagnosis, no medication or treatment
   advice, one small step at most, points to 112 / MIELI on danger.
3. **Fail closed**: no key, timeout or odd answer gives `503`; the app answers with its own
   template companion.

## Privacy

- The LLM is **opt-in in the app, off by default** (Privacy screen). When on, the typed
  message and the last few turns are sent; no check-ins, scores or sensor data.
- Voice sends only text **written by the companion**, never what the person typed.
- Nothing is stored by these endpoints. Keys live in a Modal Secret, never in the repo
  or in the app.

## Requests

```bash
curl -X POST "$API/api/v1/companion/reply" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message": "I slept badly", "language": "en", "companionName": "Kuu", "history": []}'
# 200 {"reply": "...", "source": "llm", "crisis": false}

curl -X POST "$API/api/v1/companion/speech" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"text": "Good evening. I am here.", "language": "en"}'
# 200 {"audioBase64": "...", "mimeType": "audio/mpeg"}
```

## Configuration (environment variables)

`GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.8-flash`), `ELEVENLABS_API_KEY`,
`ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` (default `eleven_multilingual_v2`),
`CORS_ORIGINS` (default `*`).

## Where the keys go

- **Local run:** create `backend/.env` (ignored by git) with `GEMINI_API_KEY=...` and
  `ELEVENLABS_API_KEY=...`, then start the server from `backend/`. Real environment variables
  win over the file.
- **Modal:** a Secret named `hiillos-ai` with the same two names (see `modal_app.py`).
- **Never** in the app, in `EXPO_PUBLIC_*` variables, in the repo or in a chat.

## Deploy

See the header of `modal_app.py`.

## Not verified yet

Written without a Python runtime or keys at hand: run it once locally
(`uvicorn app.main:app --reload`) and call the three endpoints before the demo.

"""Deploy the API on Modal.

    cd backend
    modal secret create hiillos-ai GEMINI_API_KEY=... ELEVENLABS_API_KEY=...   # once, keys stay in Modal
    modal deploy modal_app.py

Modal prints the public URL. The app uses it as EXPO_PUBLIC_API_URL (without /api/v1).
Stores are in memory: one container is kept so demo data survives between calls.
"""

from pathlib import Path

import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("fastapi", "pydantic-settings", "httpx")
    .add_local_dir(Path(__file__).parent / "app", remote_path="/root/app")
)

app = modal.App("hiillos-api")


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("hiillos-ai")],
    # In-memory stores: a single warm container, never scaled out.
    min_containers=1,
    max_containers=1,
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def api():
    from app.main import app as fastapi_app

    return fastapi_app

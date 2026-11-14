#!/usr/bin/env node
/**
 * OPTIONAL: replaces the generated sea sound with one made by ElevenLabs sound effects.
 *
 * The key is read from the environment and is never written anywhere:
 *
 *   ELEVENLABS_API_KEY=... node scripts/elevenlabs-sounds.js        (bash)
 *   $env:ELEVENLABS_API_KEY = '...'; node scripts/elevenlabs-sounds.js   (PowerShell)
 *
 * It writes assets/sounds/sea.mp3. To use it, change SEA_SOUND in src/services/sounds.ts
 * to require the .mp3. NOT RUN YET: check the request against the ElevenLabs API reference
 * (POST /v1/sound-generation) before relying on it.
 */
const fs = require('fs');
const path = require('path');

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('Set ELEVENLABS_API_KEY in your shell first. Nothing was generated.');
  process.exit(1);
}

const SOUNDS = [
  { file: 'sea.mp3', text: 'Calm sea waves rolling slowly onto a pebble beach, soft and steady, no birds, no voices, no music', seconds: 22 },
];

(async () => {
  for (const sound of SOUNDS) {
    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sound.text, duration_seconds: sound.seconds, prompt_influence: 0.4 }),
    });
    if (!res.ok) {
      console.error(`${sound.file}: request failed with status ${res.status}`);
      process.exit(1);
    }
    const out = path.join(__dirname, '..', 'assets', 'sounds', sound.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    console.log(`Wrote ${out}`);
  }
})();

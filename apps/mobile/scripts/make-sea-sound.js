#!/usr/bin/env node
/**
 * Generates assets/sounds/sea.wav: slow waves made from filtered noise.
 *
 * Why generate it: the sound is original (written during the event), needs no licence,
 * no download and no API key, and the result is reproducible (fixed random seed).
 * For a richer recording, see scripts/elevenlabs-sounds.js.
 *
 *   node scripts/make-sea-sound.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const SECONDS = 24; // three 8-second waves, so the loop point is silent-smooth
const WAVE = 8;

// Small deterministic generator (same idea as src/domain/rng.ts).
let seed = 20261114;
function random() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const total = RATE * SECONDS;
const samples = new Float32Array(total);
let low = 0; // deep rumble
let mid = 0; // body of the wave
let hiss = 0; // foam on the crest
let peak = 0;

for (let i = 0; i < total; i++) {
  const t = i / RATE;
  const white = random() * 2 - 1;
  low += 0.02 * (white - low);
  mid += 0.12 * (white - mid);
  hiss = 0.55 * (white - mid) + 0.45 * hiss;

  // One wave: slow rise, quicker fall. A second, slower swell keeps the three waves different.
  const phase = (t % WAVE) / WAVE;
  const rise = Math.pow(Math.sin(Math.PI * Math.pow(phase, 0.7)), 2);
  const swell = 0.85 + 0.15 * Math.sin((2 * Math.PI * t) / SECONDS);
  const env = (0.18 + 0.82 * rise) * swell;

  const value = low * 3.2 * (0.5 + 0.5 * env) + mid * 1.1 * env + hiss * 0.22 * env * env;
  samples[i] = value;
  peak = Math.max(peak, Math.abs(value));
}

const header = Buffer.alloc(44);
const dataBytes = total * 2;
header.write('RIFF', 0);
header.writeUInt32LE(36 + dataBytes, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16); // PCM chunk size
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28); // byte rate
header.writeUInt16LE(2, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
header.write('data', 36);
header.writeUInt32LE(dataBytes, 40);

const data = Buffer.alloc(dataBytes);
const gain = 0.8 / peak;
for (let i = 0; i < total; i++) data.writeInt16LE(Math.round(samples[i] * gain * 32767), i * 2);

const out = path.join(__dirname, '..', 'assets', 'sounds', 'sea.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, data]));
console.log(`Wrote ${out} (${((44 + dataBytes) / 1024).toFixed(0)} KB, ${SECONDS} s, ${RATE} Hz mono)`);

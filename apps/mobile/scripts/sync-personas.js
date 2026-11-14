#!/usr/bin/env node
/**
 * Copies the generated persona files into the app:
 *   <source>/<id>.json  →  assets/personas/<id>/core.json
 *
 * Usage: npm run personas:sync [-- <source dir>]
 * Default source: ../../tools/synthetic/personas_extended (generator output, repo root).
 *
 * The app only loads files marked `"synthetic": true`. The generator's ABOUT.md states that all
 * personas are synthetic, so the flag is stamped here when the generator did not write it.
 * ground_truth/ is never copied: the app must not read it.
 */
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');
const source = path.resolve(process.argv[2] ?? path.join(appRoot, '..', '..', 'tools', 'synthetic', 'personas_extended'));
const target = path.join(appRoot, 'assets', 'personas');

if (!fs.existsSync(source)) {
  console.error(`Source folder not found: ${source}`);
  process.exit(1);
}

const files = fs.readdirSync(source).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error(`No .json files in ${source}`);
  process.exit(1);
}

for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(source, file), 'utf8').replace(/^﻿/, ''));
  const id = raw.persona?.id ?? path.basename(file, '.json');
  const { synthetic: _ignored, ...rest } = raw;
  const out = { synthetic: true, ...rest };
  const dir = path.join(target, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'core.json'), JSON.stringify(out) + '\n', 'utf8');
  console.log(`✓ ${id}: ${raw.checkIns?.length ?? 0} check-ins, ${raw.sensors?.length ?? 0} days, ${raw.phq9?.length ?? 0} PHQ-9`);
}
console.log(`\n${files.length} personas copied to assets/personas/<id>/core.json`);

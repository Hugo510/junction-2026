#!/usr/bin/env node
/**
 * Copies the generated persona files into the app:
 *   <source>/<id>/core.json  (or <source>/<id>.json)  →  assets/personas/<id>/core.json
 *
 * Usage: npm run personas:sync [-- <source dir>]
 * Default source: ../../tools/synthetic/personas (generator output, repo root).
 *
 * Files must already carry `"synthetic": true` (the generator writes it since v0.3); files
 * without it are skipped with an error, because the app refuses them.
 * ground_truth/ is never copied: the app must not read it.
 */
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');
const source = path.resolve(process.argv[2] ?? path.join(appRoot, '..', '..', 'tools', 'synthetic', 'personas'));
const target = path.join(appRoot, 'assets', 'personas');

if (!fs.existsSync(source)) {
  console.error(`Source folder not found: ${source}`);
  process.exit(1);
}

/** Supports one folder per persona (<id>/core.json) and flat files (<id>.json). */
const inputs = fs
  .readdirSync(source, { withFileTypes: true })
  .map((entry) => {
    if (entry.isDirectory()) {
      const file = path.join(source, entry.name, 'core.json');
      return fs.existsSync(file) ? file : null;
    }
    return entry.name.endsWith('.json') ? path.join(source, entry.name) : null;
  })
  .filter(Boolean);

if (inputs.length === 0) {
  console.error(`No persona files in ${source}`);
  process.exit(1);
}

let failed = false;
for (const file of inputs) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const data = JSON.parse(text);
  const id = data.persona?.id;
  if (!id) {
    console.error(`✗ ${file}: missing persona.id`);
    failed = true;
    continue;
  }
  if (data.synthetic !== true) {
    console.error(`✗ ${id}: "synthetic": true is missing, not copied`);
    failed = true;
    continue;
  }
  const dir = path.join(target, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'core.json'), JSON.stringify(data) + '\n', 'utf8');
  console.log(`✓ ${id} (v${data.generatorVersion ?? '?'}): ${data.checkIns?.length ?? 0} check-ins, ${data.sensors?.length ?? 0} days, ${data.phq9?.length ?? 0} PHQ-9`);
}

if (failed) process.exit(1);
console.log(`\n${inputs.length} personas copied to assets/personas/<id>/core.json`);

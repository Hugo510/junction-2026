#!/usr/bin/env node
/**
 * Fails (exit 1) if any locale is missing keys present in en.json,
 * or has keys that en.json does not have (likely typos).
 * Usage: npm run i18n:check
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const BASE = 'en.json';

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, key) : [key];
  });
}

const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
const base = new Set(flatten(read(BASE)));
const locales = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== BASE);

let failed = false;
for (const file of locales) {
  const keys = new Set(flatten(read(file)));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${file}`);
    missing.forEach((k) => console.error(`    missing: ${k}`));
    extra.forEach((k) => console.error(`    extra:   ${k}`));
  } else {
    console.log(`✓ ${file} (${keys.size} keys)`);
  }
}

if (failed) {
  console.error('\ni18n check failed: every locale must have exactly the keys of en.json.');
  process.exit(1);
}
console.log(`\nAll ${locales.length} locales match ${BASE} (${base.size} keys).`);

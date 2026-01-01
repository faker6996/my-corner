/*
  Migrate i18n per-namespace flat files to folder-per-namespace layout.
  From: i18n/locales/<ns>.<locale>.json
  To:   i18n/locales/<ns>/<locale>.json

  Usage: node scripts/namespace-to-folders.cjs
*/
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales');
const LOCALE_CODES = new Set(['vi', 'en', 'ko', 'ja']);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function migrate() {
  const entries = fs.readdirSync(LOCALES_DIR);
  for (const f of entries) {
    const m = /^([a-z0-9-]+)\.(vi|en|ko|ja)\.json$/i.exec(f);
    if (!m) continue;
    const ns = m[1];
    const locale = m[2];
    const src = path.join(LOCALES_DIR, f);
    const destDir = path.join(LOCALES_DIR, ns);
    const dest = path.join(destDir, `${locale}.json`);
    try {
      const raw = fs.readFileSync(src, 'utf8');
      const json = JSON.parse(raw);
      ensureDir(destDir);
      fs.writeFileSync(dest, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`Wrote ${dest}`);
    } catch (e) {
      console.warn(`Skip ${src}: ${e.message}`);
    }
  }
}

migrate();


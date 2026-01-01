/*
  Remove flat per-namespace locale files in i18n/locales:
  i18n/locales/<ns>.<locale>.json when a folder version exists
  (i18n/locales/<ns>/<locale>.json) or always if migrating fully.

  Usage: node scripts/cleanup-flat-locales.cjs
*/
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales');
const LOCALES = new Set(['vi','en','ko','ja']);

function cleanup() {
  const entries = fs.readdirSync(LOCALES_DIR);
  for (const f of entries) {
    const m = /^([a-z0-9-]+)\.(vi|en|ko|ja)\.json$/i.exec(f);
    if (!m) continue;
    const ns = m[1];
    const locale = m[2];
    // Skip if it's the legacy monolithic users.*? No, we migrate all flat files.
    const flat = path.join(LOCALES_DIR, f);
    const folderFile = path.join(LOCALES_DIR, ns, `${locale}.json`);
    // If folder version exists, remove flat; otherwise still remove to enforce folder layout
    try {
      fs.unlinkSync(flat);
      console.log(`Removed ${flat}`);
    } catch (e) {
      console.warn(`Failed to remove ${flat}: ${e.message}`);
    }
  }
}

cleanup();


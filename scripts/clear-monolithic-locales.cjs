/*
  Clear monolithic locale files in i18n/locales/{locale}.json
  by overwriting them with an empty object {}.

  This avoids duplication once per-page files exist.

  Usage: node scripts/clear-monolithic-locales.cjs [locale...]
  If no locales passed, it will infer from files in i18n/locales/*.json
*/
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales');

function clearLocale(locale) {
  const file = path.join(LOCALES_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`Skip ${locale}: ${file} not found`);
    return;
  }
  // Backup once if no .bak exists
  const backup = `${file}.bak`;
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
  }
  fs.writeFileSync(file, JSON.stringify({}, null, 2) + '\n', 'utf8');
  console.log(`Cleared ${file} (backup at ${backup})`);
}

function main() {
  let locales = process.argv.slice(2);
  if (locales.length === 0) {
    locales = (fs.readdirSync(LOCALES_DIR) || [])
      .filter((f) => /^(\w+)\.json$/.test(f))
      .map((f) => f.replace(/\.json$/, ''));
  }
  for (const locale of locales) clearLocale(locale);
}

main();


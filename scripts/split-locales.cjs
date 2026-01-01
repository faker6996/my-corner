/*
  Split monolithic locale files in i18n/locales/{locale}.json
  into per-namespace folders with files named <slug>.<locale>.json,
  e.g. i18n/locales/dashboard/dashboard.vi.json for { "Dashboard": { ... } }.

  Usage: node scripts/split-locales.cjs [locale...]
  If no locales passed, it will infer from files in i18n/locales/*.json
*/
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales');

function slugifyNamespace(ns) {
  return ns
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[._\s]+/g, '-')
    .toLowerCase();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function splitLocale(locale) {
  const srcFile = path.join(LOCALES_DIR, `${locale}.json`);
  if (!fs.existsSync(srcFile)) {
    console.warn(`Skipping ${locale}: ${srcFile} not found`);
    return;
  }
  const raw = fs.readFileSync(srcFile, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${srcFile}:`, e.message);
    process.exitCode = 1;
    return;
  }

  const topLevelKeys = Object.keys(json);
  if (topLevelKeys.length === 0) {
    console.warn(`No keys in ${srcFile}`);
    return;
  }

  for (const key of topLevelKeys) {
    const slug = slugifyNamespace(key);
    const folder = path.join(LOCALES_DIR, slug);
    const filename = `${slug}.${locale}.json`;
    const outFile = path.join(folder, filename);
    const payload = { [key]: json[key] };
    writeJson(outFile, payload);
  }
  console.log(`Split ${srcFile} into ${topLevelKeys.length} files under ${LOCALES_DIR}`);
}

function main() {
  let locales = process.argv.slice(2);
  if (locales.length === 0) {
    locales = (fs.readdirSync(LOCALES_DIR) || [])
      .filter((f) => /^(\w+)\.json$/.test(f))
      .map((f) => f.replace(/\.json$/, ''));
  }
  for (const locale of locales) {
    splitLocale(locale);
  }
}

main();


/*
  Split i18n/locales/common/<locale>.json into per-namespace files at
  i18n/locales/<namespace>.<locale>.json and leave only "Common" in the source.

  Usage: node scripts/split-common-locales.cjs [locale...]
  If no locales passed, infer from files in i18n/locales/common/*.json
*/
const fs = require('fs');
const path = require('path');

const COMMON_DIR = path.join(__dirname, '..', 'i18n', 'locales', 'common');
const OUT_DIR = path.join(__dirname, '..', 'i18n', 'locales');

const KEY_TO_NS = {
  // Auth flows
  LoginPage: 'auth-login',
  RegisterPage: 'auth-register',
  ForgotPassword: 'auth-forgot',
  ResetPassword: 'auth-reset',
  // Pages
  LogsPage: 'logs',
  UsersPage: 'users',
  ProfilePage: 'profile',
  ErrorPage: 'errors',
  ForbiddenPage: 'errors',
  // Feature areas / components
  OCR: 'ocr',
  LLM: 'llm',
  RightPanel: 'right-panel',
  Loading: 'loading',
  Pagination: 'pagination',
  ValidationInput: 'validation',
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function splitLocale(locale) {
  const srcFile = path.join(COMMON_DIR, `${locale}.json`);
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

  const keys = Object.keys(json);
  if (keys.length === 0) {
    console.warn(`No keys in ${srcFile}`);
    return;
  }

  let kept = {};
  if (json.Common) kept.Common = json.Common;

  // For each known top-level key, emit a separate file
  for (const key of keys) {
    if (key === 'Common') continue;
    const ns = KEY_TO_NS[key];
    if (!ns) {
      // Unmapped keys are kept in common to avoid data loss
      kept[key] = json[key];
      continue;
    }
    const outFile = path.join(OUT_DIR, `${ns}.${locale}.json`);
    writeJson(outFile, { [key]: json[key] });
  }

  // Backup original once
  const backup = `${srcFile}.bak`;
  if (!fs.existsSync(backup)) fs.copyFileSync(srcFile, backup);

  // Write back the reduced common file
  writeJson(srcFile, kept);
  console.log(`Split ${srcFile} -> namespaces, kept keys: ${Object.keys(kept).join(', ')}`);
}

function main() {
  let locales = process.argv.slice(2);
  if (locales.length === 0) {
    locales = (fs.readdirSync(COMMON_DIR) || [])
      .filter((f) => /^(\w+)\.json$/.test(f))
      .map((f) => f.replace(/\.json$/, ''));
  }
  for (const locale of locales) splitLocale(locale);
}

main();

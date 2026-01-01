#!/usr/bin/env node
// Prune en.json keys that don't exist in vi.json (recursive)
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const viPath = path.join(root, 'i18n', 'locales', 'vi.json');
const enPath = path.join(root, 'i18n', 'locales', 'en.json');

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

let removedCount = 0;

function countAllKeys(node) {
  if (!isPlainObject(node)) return 1; // count this key as one
  let c = 0;
  for (const k of Object.keys(node)) {
    c += countAllKeys(node[k]);
  }
  return c || 1;
}

function prune(enNode, viNode) {
  if (!isPlainObject(enNode) || !isPlainObject(viNode)) return enNode;
  const result = {};
  for (const key of Object.keys(enNode)) {
    if (!(key in viNode)) {
      removedCount += countAllKeys(enNode[key]);
      continue;
    }
    const enVal = enNode[key];
    const viVal = viNode[key];
    if (isPlainObject(enVal) && isPlainObject(viVal)) {
      result[key] = prune(enVal, viVal);
    } else if (!isPlainObject(viVal)) {
      // vi expects a primitive/array at this key
      if (isPlainObject(enVal)) {
        // en has an object here, so all nested keys are extra; drop them
        removedCount += countAllKeys(enVal);
        // keep the key but coerce to an empty string placeholder
        result[key] = "";
      } else {
        result[key] = enVal;
      }
    } else {
      // vi has object but en is not an object: keep en as-is (no additions per requirement)
      result[key] = enVal;
    }
  }
  return result;
}

try {
  const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const pruned = prune(en, vi);
  fs.writeFileSync(enPath, JSON.stringify(pruned, null, 2) + '\n', 'utf8');
  console.log(`Pruned ${removedCount} key(s) from en.json`);
} catch (err) {
  console.error('Error pruning en.json:', err.message);
  process.exit(1);
}

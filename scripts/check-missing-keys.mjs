#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Patterns to find translation usage when fully-qualified keys are passed directly
// e.g. t("Common.density") OR someTranslator("LoginPage.title")
const fqKeyPatterns = [
  // match somethingLikeT("Namespace.key") but avoid useTranslations("...") and require Namespace to start with uppercase (Common, LoginPage, UsersPage, etc.)
  /\b(?!useTranslations\b)[A-Za-z_$][A-Za-z0-9_$]*\(\s*["']([A-Z][A-Za-z0-9_-]*\.[A-Za-z][A-Za-z0-9._-]*)["']\s*[,)]/g,
];

// File extensions to scan
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

// Directories to exclude
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'scripts'];

// Load locale files
function loadLocales() {
  const localesDir = path.join(projectRoot, 'i18n', 'locales');
  const locales = {};
  
  if (!fs.existsSync(localesDir)) {
    console.error('❌ Locales directory not found:', localesDir);
    process.exit(1);
  }
  
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const locale = path.basename(file, '.json');
    const filePath = path.join(localesDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      locales[locale] = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error.message);
      process.exit(1);
    }
  }
  
  return locales;
}

// Get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    }
  }
  
  return keys;
}

// Check if file should be scanned
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  if (!extensions.includes(ext)) return false;
  
  const relativePath = path.relative(projectRoot, filePath);
  return !excludeDirs.some(dir => relativePath.startsWith(dir));
}

// Extract translation keys from file content
function extractKeysFromContent(content, filePath) {
  const keys = new Set();
  // 1) Fully-qualified keys passed directly to translator function
  for (const pattern of fqKeyPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      if (key && key.trim()) {
        const trimmedKey = key.trim();
        // Filter out obvious false positives
        if (isValidTranslationKey(trimmedKey)) {
          keys.add(trimmedKey);
        }
      }
    }
  }

  // 2) Infer namespace from useTranslations('Namespace') and capture calls like t('errors.loginFailed')
  //    Handles arbitrary translator variable names (t, tp, tu, etc.)
  const nsMap = new Map(); // var -> namespace
  try {
    const nsRegex = /\bconst\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*useTranslations\(\s*['"]([A-Za-z][A-Za-z0-9_-]*)['"]\s*\)/g;
    let m;
    while ((m = nsRegex.exec(content)) !== null) {
      nsMap.set(m[1], m[2]);
    }
  } catch {}

  for (const [varName, namespace] of nsMap.entries()) {
    const callRegex = new RegExp(`\\b${varName}\\(\\s*['"]([A-Za-z][A-Za-z0-9._-]*)['"]\\s*[,)]`, 'g');
    let m2;
    while ((m2 = callRegex.exec(content)) !== null) {
      const subKey = m2[1];
      if (!subKey || !subKey.includes('.')) continue; // need at least group.sub
      const fullKey = `${namespace}.${subKey}`;
      if (isValidTranslationKey(fullKey)) keys.add(fullKey);
    }
  }
  
  return keys;
}

// Check if a key looks like a valid translation key
function isValidTranslationKey(key) {
  // Must contain at least one dot (namespace.key)
  if (!key.includes('.')) return false;
  
  // Must start with a letter
  if (!/^[A-Za-z]/.test(key)) return false;
  
  // Must not contain special characters that aren't dots, dashes, or underscores
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(key)) return false;
  
  // Must be at least 3 characters (e.g., "A.b")
  if (key.length < 3) return false;
  
  return true;
}

// Scan directory recursively
function scanDirectory(dir, usedKeys = new Set()) {
  if (!fs.existsSync(dir)) return usedKeys;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
      scanDirectory(fullPath, usedKeys);
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const fileKeys = extractKeysFromContent(content, fullPath);
        fileKeys.forEach(key => usedKeys.add(key));
      } catch (error) {
        console.warn(`⚠️  Warning: Could not read ${fullPath}:`, error.message);
      }
    }
  }
  
  return usedKeys;
}

// Main function
function main() {
  console.log('🔍 Scanning project for translation key usage...\n');
  
  // Load all locale files
  const locales = loadLocales();
  const localeNames = Object.keys(locales);
  
  if (localeNames.length === 0) {
    console.error('❌ No locale files found!');
    process.exit(1);
  }
  
  console.log(`📋 Found locales: ${localeNames.join(', ')}\n`);
  
  // Get all available keys from locales
  const availableKeys = new Map();
  for (const [locale, data] of Object.entries(locales)) {
    availableKeys.set(locale, getAllKeys(data));
  }
  
  // Scan project for used keys
  console.log('🔎 Scanning project files...');
  const usedKeys = scanDirectory(projectRoot);
  
  console.log(`✅ Found ${usedKeys.size} unique translation keys in use\n`);
  
  // Check for missing keys in each locale
  let hasErrors = false;
  
  for (const [locale, keys] of availableKeys) {
    const missingKeys = [];
    
    for (const usedKey of usedKeys) {
      if (!keys.has(usedKey)) {
        missingKeys.push(usedKey);
      }
    }
    
    if (missingKeys.length > 0) {
      hasErrors = true;
      console.log(`❌ Missing keys in locale "${locale}":`);
      missingKeys.sort().forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('');
    } else {
      console.log(`✅ All keys present in locale "${locale}"`);
    }
  }
  
  // Check for unused keys
  console.log('\n📊 Checking for unused keys...');
  
  for (const [locale, keys] of availableKeys) {
    const unusedKeys = [];
    
    for (const key of keys) {
      if (!usedKeys.has(key)) {
        unusedKeys.push(key);
      }
    }
    
    if (unusedKeys.length > 0) {
      console.log(`⚠️  Unused keys in locale "${locale}" (${unusedKeys.length}):`);
      unusedKeys.sort().forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('');
    } else {
      console.log(`✅ No unused keys in locale "${locale}"`);
    }
  }
  
  // Summary
  console.log('\n📈 Summary:');
  console.log(`   Used keys: ${usedKeys.size}`);
  for (const [locale, keys] of availableKeys) {
    console.log(`   Available keys in ${locale}: ${keys.size}`);
  }
  
  if (hasErrors) {
    console.log('\n❌ Translation validation failed! Please add missing keys.');
    process.exit(1);
  } else {
    console.log('\n✅ All translation keys are properly defined!');
  }
}

// Run the script
main();

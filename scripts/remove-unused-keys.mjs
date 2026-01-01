#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Patterns to find translation usage when fully-qualified keys are passed directly
// Allow both lowercase and uppercase namespaces (e.g., Common.save or common.save)
// Support t('Ns.key') and t.rich('Ns.key') / t.markup('Ns.key')
const fqKeyPatterns = [
  /\b(?!useTranslations\b)[A-Za-z_$][A-Za-z0-9_$]*(?:\.(?:rich|markup))?\(\s*["']([A-Za-z][A-Za-z0-9_-]*\.[A-Za-z][A-Za-z0-9._-]*)["']\s*[,)]/g,
];

// File extensions to scan
const extensions = [".tsx", ".ts", ".jsx", ".js"];

// Directories to exclude
const excludeDirs = ["node_modules", ".git", ".next", "dist", "build", "scripts"];

// Command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || args.includes("-d");
const interactive = args.includes("--interactive") || args.includes("-i");
const forceRemove = args.includes("--force") || args.includes("-f");
const includePreserved = args.includes("--include-preserved") || args.includes("--no-preserve");
// Optional namespace filters
const onlyNsArg = (args.find((a) => a.startsWith("--only-ns=")) || "").split("=")[1] || "";
const onlyNamespaces = new Set(onlyNsArg ? onlyNsArg.split(",").map((s) => s.trim()).filter(Boolean) : []);
const preserveNsArg = (args.find((a) => a.startsWith("--preserve-ns=")) || "").split("=")[1] || "";
const preserveNamespaces = new Set([
  // Safe defaults: these often use dynamic keys or are passed down as t("...") without local namespace
  "ValidationInput",
  "Common",
  ...(
    preserveNsArg
      ? preserveNsArg.split(",").map((s) => s.trim()).filter(Boolean)
      : []
  ),
]);

// Load locale files
function loadLocales() {
  const localesDir = path.join(projectRoot, "i18n", "locales");
  const locales = {};

  if (!fs.existsSync(localesDir)) {
    console.error("❌ Locales directory not found:", localesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const locale = path.basename(file, ".json");
    const filePath = path.join(localesDir, file);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      locales[locale] = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error.message);
      process.exit(1);
    }
  }

  return locales;
}

// Get all keys from a nested object
function getAllKeys(obj, prefix = "") {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    }
  }

  return keys;
}

// Check if file should be scanned
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  if (!extensions.includes(ext)) return false;

  const relativePath = path.relative(projectRoot, filePath);
  return !excludeDirs.some((dir) => relativePath.startsWith(dir));
}

// Extract translation keys from file content
function extractKeysFromContent(content, filePath) {
  const keys = new Set();

  // 1) Fully-qualified keys passed directly to translator function
  for (const pattern of fqKeyPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      if (key && key.trim()) {
        const trimmedKey = key.trim();
        if (isValidTranslationKey(trimmedKey)) {
          keys.add(trimmedKey);
        }
      }
    }
  }

  // 2) Infer namespace from useTranslations('Namespace') and capture calls
  const nsMap = new Map();
  try {
    // Support dotted namespaces like "DirectoryFilePicker.toast"
    const nsRegex = /\bconst\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*useTranslations\(\s*['"]([A-Za-z][A-Za-z0-9_.-]*)['"]\s*\)/g;
    const nsRegex2 = /\bconst\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*getTranslations\(\s*['"]([A-Za-z][A-Za-z0-9_.-]*)['"]\s*\)/g;
    let m;
    while ((m = nsRegex.exec(content)) !== null) {
      nsMap.set(m[1], m[2]);
    }
    while ((m = nsRegex2.exec(content)) !== null) {
      nsMap.set(m[1], m[2]);
    }
  } catch {}

  for (const [varName, namespace] of nsMap.entries()) {
    const callRegex = new RegExp(`\\b${varName}(?:\\.(?:rich|markup))?\\(\\s*['"]([A-Za-z][A-Za-z0-9._-]*)['"]\\s*[,)]`, "g");
    let m2;
    while ((m2 = callRegex.exec(content)) !== null) {
      const subKey = m2[1];
      if (!subKey) continue;
      const fullKey = `${namespace}.${subKey}`;
      if (isValidTranslationKey(fullKey)) keys.add(fullKey);
    }
  }

  return keys;
}

// Check if a key looks like a valid translation key
function isValidTranslationKey(key) {
  if (!key.includes(".")) return false;
  if (!/^[A-Za-z]/.test(key)) return false;
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(key)) return false;
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
        const content = fs.readFileSync(fullPath, "utf-8");
        const fileKeys = extractKeysFromContent(content, fullPath);
        fileKeys.forEach((key) => usedKeys.add(key));
      } catch (error) {
        console.warn(`⚠️  Warning: Could not read ${fullPath}:`, error.message);
      }
    }
  }

  return usedKeys;
}

// Remove unused keys from object recursively
// Remove only keys that are explicitly listed in removeKeys
function removeUnusedKeys(obj, removeKeys, prefix = "") {
  const result = {};
  let removedCount = 0;

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      // This is a nested object, recursively process it
      const [cleanedValue, nestedRemovedCount] = removeUnusedKeys(value, removeKeys, fullKey);
      removedCount += nestedRemovedCount;

      // Only include the nested object if it has remaining keys
      if (Object.keys(cleanedValue).length > 0) {
        result[key] = cleanedValue;
      } else {
        // Empty nested object after cleanup
        removedCount++;
        console.log(`    🗑️  Removed empty namespace: ${fullKey}`);
      }
    } else {
      // This is a leaf value, remove if it's in removeKeys
      if (removeKeys.has(fullKey)) {
        removedCount++;
        console.log(`    🗑️  Removed unused key: ${fullKey}`);
      } else {
        result[key] = value;
      }
    }
  }

  return [result, removedCount];
}

// Format JSON with consistent styling
function formatJson(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

// Interactive confirmation for each unused key
async function confirmRemoval(unusedKeys) {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const keysToRemove = new Set();

  console.log("\n🤔 Interactive mode: Choose which keys to remove:\n");

  for (const key of Array.from(unusedKeys).sort()) {
    const answer = await new Promise((resolve) => {
      rl.question(`Remove "${key}"? (y/N/a=all/q=quit): `, resolve);
    });

    if (answer.toLowerCase() === "q") {
      break;
    } else if (answer.toLowerCase() === "a") {
      // Add all remaining keys
      unusedKeys.forEach((k) => keysToRemove.add(k));
      break;
    } else if (answer.toLowerCase() === "y") {
      keysToRemove.add(key);
    }
  }

  rl.close();
  return keysToRemove;
}

// Main function
async function main() {
  console.log("🔍 Scanning project for unused translation keys...\n");

  if (dryRun) {
    console.log("🧪 DRY RUN MODE: No files will be modified\n");
  }

  // Load all locale files
  const locales = loadLocales();
  const localeNames = Object.keys(locales);

  if (localeNames.length === 0) {
    console.error("❌ No locale files found!");
    process.exit(1);
  }

  console.log(`📋 Found locales: ${localeNames.join(", ")}\n`);

  // Get all available keys from locales
  const availableKeys = new Map();
  for (const [locale, data] of Object.entries(locales)) {
    availableKeys.set(locale, getAllKeys(data));
  }

  // Scan project for used keys
  console.log("🔎 Scanning project files...");
  const usedKeys = scanDirectory(projectRoot);

  console.log(`✅ Found ${usedKeys.size} unique translation keys in use\n`);

  // Find unused keys
  let totalRemovedCount = 0;
  const unusedKeysByLocale = new Map();

  for (const [locale, keys] of availableKeys) {
    const unusedKeys = new Set();

    for (const key of keys) {
      if (!usedKeys.has(key)) {
        // Filter by namespace rules
        const ns = key.split(".")[0];
        if (!includePreserved && preserveNamespaces.has(ns)) continue; // optionally include preserved ones
        if (onlyNamespaces.size > 0 && !onlyNamespaces.has(ns)) continue; // restrict removal scope
        unusedKeys.add(key);
      }
    }

    unusedKeysByLocale.set(locale, unusedKeys);

    if (unusedKeys.size > 0) {
      console.log(`📊 Found ${unusedKeys.size} unused keys in "${locale}"`);
    } else {
      console.log(`✅ No unused keys in "${locale}"`);
    }
  }

  // Check if there are any unused keys at all
  const hasUnusedKeys = Array.from(unusedKeysByLocale.values()).some((set) => set.size > 0);

  if (!hasUnusedKeys) {
    console.log("\n🎉 No unused keys found in any locale!");
    return;
  }

  if (!forceRemove && !interactive) {
    console.log("\n⚠️  Use --force to remove all unused keys, --interactive to choose, or --dry-run to preview");
    console.log("💡 Example: npm run i18n:remove-unused -- --dry-run");
    return;
  }

  // Process each locale
  for (const [locale, unusedKeys] of unusedKeysByLocale) {
    if (unusedKeys.size === 0) continue;

    console.log(`\n🧹 Processing locale "${locale}":`);

    let keysToRemove = unusedKeys;

    // Interactive mode
    if (interactive && !dryRun) {
      keysToRemove = await confirmRemoval(unusedKeys);
      if (keysToRemove.size === 0) {
        console.log(`   ⏭️  Skipped "${locale}"`);
        continue;
      }
    }

    // Remove unused keys (only the ones in keysToRemove)
    const [cleanedData, removedCount] = removeUnusedKeys(locales[locale], keysToRemove);
    totalRemovedCount += removedCount;

    if (removedCount > 0) {
      console.log(`   ✅ Removed ${removedCount} unused keys from "${locale}"`);

      if (!dryRun) {
        // Write cleaned data back to file
        const localeFile = path.join(projectRoot, "i18n", "locales", `${locale}.json`);
        fs.writeFileSync(localeFile, formatJson(cleanedData), "utf-8");
        console.log(`   💾 Updated ${localeFile}`);
      }
    }
  }

  // Summary
  console.log(`\n📈 Summary:`);
  console.log(`   Total unused keys removed: ${totalRemovedCount}`);
  console.log(`   Used keys: ${usedKeys.size}`);
  if (onlyNamespaces.size > 0) {
    console.log(`   Restricted to namespaces: ${Array.from(onlyNamespaces).join(', ')}`);
  }
  if (preserveNamespaces.size > 0) {
    console.log(`   Preserved namespaces: ${Array.from(preserveNamespaces).join(', ')}`);
  }

  if (dryRun) {
    console.log("\n🧪 This was a dry run. Use --force or --interactive to actually remove keys.");
  } else if (totalRemovedCount > 0) {
    console.log("\n✅ Cleanup completed! Locale files have been updated.");
    console.log("💡 Run `npm run i18n:check` to verify everything is still working.");
  }
}

// Show help
function showHelp() {
  console.log(`
🧹 Remove Unused Translation Keys

Usage:
  npm run i18n:remove-unused [options]

Options:
  --dry-run, -d        Show what would be removed without making changes
  --interactive, -i    Interactively choose which keys to remove
  --force, -f          Remove all unused keys without confirmation
  --include-preserved  Include namespaces preserved by default (e.g., Common)
  --only-ns=LIST       Comma-separated namespaces to target (others ignored)
  --preserve-ns=LIST   Comma-separated namespaces to always keep (default includes ValidationInput)
  --help, -h           Show this help message

Examples:
  npm run i18n:remove-unused -- --dry-run
  npm run i18n:remove-unused -- --interactive
  npm run i18n:remove-unused -- --force
  npm run i18n:remove-unused -- --force --only-ns=Admin,Plans
  npm run i18n:remove-unused -- --force --preserve-ns=Common
  npm run i18n:remove-unused -- --dry-run --include-preserved --only-ns=Common

⚠️  Always backup your locale files before running with --force!
`);
}

// Handle help flag
if (args.includes("--help") || args.includes("-h")) {
  showHelp();
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});

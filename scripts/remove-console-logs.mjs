#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCRIPT_PATH = fileURLToPath(import.meta.url);

const TARGET_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".cts",
  ".mts"
]);

const SKIP_EXTENSIONS = new Set([".mjs", ".cjs"]);

const IGNORE_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "tmp",
  "logs"
]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || args.includes("--dry");
const verbose = args.includes("--verbose");
const explicitPaths = args.filter((arg) => !arg.startsWith("--"));

async function collectFiles(startPath) {
  const results = [];
  const stack = [path.resolve(startPath)];

  while (stack.length > 0) {
    const current = stack.pop();
    let stats;

    try {
      stats = await fs.stat(current);
    } catch (error) {
      console.warn(`Skipping ${current}: ${(error && error.message) || error}`);
      continue;
    }

    if (stats.isDirectory()) {
      const name = path.basename(current);
      if (IGNORE_DIRECTORIES.has(name)) {
        continue;
      }

      let entries;
      try {
        entries = await fs.readdir(current, { withFileTypes: true });
      } catch (error) {
        console.warn(`Cannot read directory ${current}: ${(error && error.message) || error}`);
        continue;
      }

      for (const entry of entries) {
        if (entry.name.startsWith(".")) {
          continue;
        }
        stack.push(path.join(current, entry.name));
      }
      continue;
    }

    if (stats.isFile()) {
      const ext = path.extname(current).toLowerCase();
      if (TARGET_EXTENSIONS.has(ext)) {
        results.push(current);
      }
    }
  }

  return results;
}

function getScriptKind(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".cts":
      return ts.ScriptKind.CTS;
    case ".mts":
      return ts.ScriptKind.MTS;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.Unknown;
  }
}

function isConsoleNamespace(node) {
  if (!node) {
    return false;
  }

  if (ts.isIdentifier(node)) {
    return node.text === "console";
  }

  if (ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain(node)) {
    return isConsoleNamespace(node.expression) && node.name.text === "console";
  }

  if (ts.isElementAccessExpression(node) || ts.isElementAccessChain(node)) {
    const argument = node.argumentExpression;
    return (
      isConsoleNamespace(node.expression) &&
      argument &&
      ts.isStringLiteralLike(argument) &&
      argument.text === "console"
    );
  }

  return false;
}

function isConsoleLogTarget(node) {
  if (!node) {
    return false;
  }

  if (ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain(node)) {
    return node.name.text === "log" && isConsoleNamespace(node.expression);
  }

  if (ts.isElementAccessExpression(node) || ts.isElementAccessChain(node)) {
    const argument = node.argumentExpression;
    return (
      argument &&
      ts.isStringLiteralLike(argument) &&
      argument.text === "log" &&
      isConsoleNamespace(node.expression)
    );
  }

  return false;
}

function isConsoleLogCall(expression) {
  return ts.isCallExpression(expression) && isConsoleLogTarget(expression.expression);
}

function computeRemovalRange(node, sourceFile, text) {
  const nodeStart = node.getStart(sourceFile);
  const nodeEnd = node.getEnd();
  const length = text.length;

  let removalStart = nodeStart;
  let lineStart = text.lastIndexOf("\n", nodeStart - 1);
  if (lineStart === -1) {
    lineStart = 0;
  } else {
    lineStart += 1;
  }
  const leading = text.slice(lineStart, nodeStart);
  if (/^[ \t]*$/.test(leading)) {
    removalStart = lineStart;
  }

  let removalEnd = nodeEnd;
  let cursor = nodeEnd;
  while (cursor < length) {
    const ch = text[cursor];
    if (ch === " " || ch === "\t") {
      cursor += 1;
      continue;
    }

    if (ch === "\r") {
      if (cursor + 1 < length && text[cursor + 1] === "\n") {
        removalEnd = cursor + 2;
      } else {
        removalEnd = cursor + 1;
      }
    } else if (ch === "\n") {
      removalEnd = cursor + 1;
    }

    break;
  }

  return { start: removalStart, end: removalEnd };
}

function removeConsoleLogsFromSource(filePath, sourceText) {
  const scriptKind = getScriptKind(filePath);
  if (scriptKind === ts.ScriptKind.Unknown) {
    return { content: sourceText, removed: 0, changed: false };
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const removals = [];

  const visit = (node) => {
    if (ts.isExpressionStatement(node) && isConsoleLogCall(node.expression)) {
      removals.push(computeRemovalRange(node, sourceFile, sourceText));
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  if (removals.length === 0) {
    return { content: sourceText, removed: 0, changed: false };
  }

  removals.sort((a, b) => b.start - a.start);

  let updated = sourceText;
  for (const { start, end } of removals) {
    updated = `${updated.slice(0, start)}${updated.slice(end)}`;
  }

  return {
    content: updated,
    removed: removals.length,
    changed: updated !== sourceText
  };
}

async function run() {
  const roots = explicitPaths.length > 0 ? explicitPaths : ["."];
  const filesSet = new Set();

  for (const entry of roots) {
    const files = await collectFiles(entry);
    for (const file of files) {
      const absolute = path.resolve(file);
      if (absolute === SCRIPT_PATH) {
        continue;
      }
      filesSet.add(absolute);
    }
  }

  const files = Array.from(filesSet).sort();
  let totalRemoved = 0;
  let touchedFiles = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) {
      if (verbose) {
        console.log(`[skip] ${path.relative(process.cwd(), file)} (extension ignored)`);
      }
      continue;
    }

    let original;
    try {
      original = await fs.readFile(file, "utf8");
    } catch (error) {
      console.warn(`Cannot read file ${file}: ${(error && error.message) || error}`);
      continue;
    }

    const { content, removed, changed } = removeConsoleLogsFromSource(file, original);

    if (!changed || removed === 0) {
      continue;
    }

    touchedFiles += 1;
    totalRemoved += removed;

    if (verbose) {
      console.log(`${dryRun ? "[dry]" : "[write]"} ${path.relative(process.cwd(), file)} -> -${removed}`);
    }

    if (!dryRun) {
      await fs.writeFile(file, content, "utf8");
    }
  }

  if (touchedFiles === 0) {
    console.log("No console.log statements found.");
    return;
  }

  if (dryRun) {
    console.log(`Would remove ${totalRemoved} console.log statement${totalRemoved === 1 ? "" : "s"} across ${touchedFiles} file${touchedFiles === 1 ? "" : "s"}.`);
  } else {
    console.log(`Removed ${totalRemoved} console.log statement${totalRemoved === 1 ? "" : "s"} across ${touchedFiles} file${touchedFiles === 1 ? "" : "s"}.`);
  }
}

run().catch((error) => {
  console.error("Failed to remove console.log statements:", error);
  process.exitCode = 1;
});

import fs from "fs";

function findDuplicateKeys(jsonText) {
  const duplicates = [];
  const stack = []; // each item: { keys:Set<string> }
  let i = 0;
  const len = jsonText.length;
  let inStr = false;
  let str = "";
  let esc = false;
  let expectingKey = false;
  let lastToken = "";

  function pushObj() {
    stack.push({ keys: new Set() });
    expectingKey = true;
  }
  function popObj() {
    stack.pop();
    expectingKey = false;
  }

  while (i < len) {
    const ch = jsonText[i];
    if (inStr) {
      str += ch;
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        // end string
        inStr = false;
        if (
          expectingKey &&
          jsonText
            .slice(i + 1)
            .trimStart()
            .startsWith(":")
        ) {
          // key candidate
          const key = JSON.parse(str);
          const top = stack[stack.length - 1];
          if (top) {
            if (top.keys.has(key)) {
              duplicates.push({ pathDepth: stack.length, key });
            } else {
              top.keys.add(key);
            }
          }
          expectingKey = false; // after key
        }
      }
    } else {
      if (ch === '"') {
        inStr = true;
        str = '"';
        esc = false;
      } else if (ch === "{") {
        pushObj();
      } else if (ch === "}") {
        popObj();
      } else if (ch === ",") {
        // next key in same object
        if (stack.length > 0) expectingKey = true;
      } else if (!/\s/.test(ch)) {
        // other token
        expectingKey = false;
      }
    }
    i++;
  }
  return duplicates;
}

const files = ["i18n/locales/common/en.json", "i18n/locales/common/vi.json"];

let hasDup = false;
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  try {
    JSON.parse(txt);
  } catch (e) {
    console.error(`${f}: INVALID JSON - ${e.message}`);
    continue;
  }
  const dups = findDuplicateKeys(txt);
  if (dups.length) {
    hasDup = true;
    console.log(`${f}: Duplicate keys within same object:`);
    const counts = {};
    for (const d of dups) {
      counts[d.key] = (counts[d.key] || 0) + 1;
    }
    Object.entries(counts).forEach(([k, c]) => console.log(`  ${k} x${c}`));
  } else {
    console.log(`${f}: No duplicate sibling keys`);
  }
}

if (hasDup) process.exit(2);

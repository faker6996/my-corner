export interface SqlStatementRange {
  // start inclusive, end exclusive
  start: number;
  end: number;
  text: string;
}

// Split SQL script into statements separated by ";" (ignoring those inside
// strings and comments) and return trimmed ranges with original offsets.
export function splitSqlStatements(source: string): SqlStatementRange[] {
  const text = source ?? "";
  const len = text.length;
  const result: SqlStatementRange[] = [];

  let stmtStart = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < len; i += 1) {
    const ch = text[i];
    const next = i + 1 < len ? text[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === "-" && next === "-") {
        inLineComment = true;
        i += 1;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 1;
        continue;
      }
    }

    if (!inDoubleQuote && ch === "'" && text[i - 1] !== "\\") {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (!inSingleQuote && ch === '"' && text[i - 1] !== "\\") {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && ch === ";") {
      // Include the semicolon in the raw segment so that cursor positions
      // around it still map to this statement.
      const rawSegment = text.slice(stmtStart, i + 1);
      const trimmed = rawSegment.trim();
      if (trimmed) {
        const leadingWs = rawSegment.length - rawSegment.trimStart().length;
        const start = stmtStart + leadingWs;
        const logicalEnd = start + trimmed.length;

        // Extend hit area to cover trailing spaces/tabs on the same line,
        // so cursor after ";" on that line still maps to this statement.
        let hitEnd = logicalEnd;
        let j = logicalEnd;
        while (j < len) {
          const ch2 = source[j];
          if (ch2 === " " || ch2 === "\t") {
            hitEnd = j + 1;
            j += 1;
            continue;
          }
          break;
        }

        result.push({ start, end: hitEnd, text: source.slice(start, logicalEnd) });
      }
      stmtStart = i + 1;
    }
  }

  if (stmtStart < len) {
    const rawSegment = text.slice(stmtStart);
    const trimmed = rawSegment.trim();
    if (trimmed) {
      const leadingWs = rawSegment.length - rawSegment.trimStart().length;
      const start = stmtStart + leadingWs;
      const logicalEnd = start + trimmed.length;

      let hitEnd = logicalEnd;
      let j = logicalEnd;
      while (j < len) {
        const ch2 = source[j];
        if (ch2 === " " || ch2 === "\t") {
          hitEnd = j + 1;
          j += 1;
          continue;
        }
        break;
      }

      result.push({ start, end: hitEnd, text: source.slice(start, logicalEnd) });
    }
  }

  return result;
}

// Find the statement that contains the cursor (by offset in the full text).
export function getStatementForCursor(
  source: string,
  cursorOffset: number
): SqlStatementRange | null {
  const statements = splitSqlStatements(source);
  if (!statements.length) return null;

  const pos = Math.max(0, Math.min(cursorOffset, source.length));

  for (const stmt of statements) {
    // Treat end as inclusive so that a cursor placed immediately
    // after the last non-whitespace character on the line (e.g. after ";")
    // is still considered inside this statement.
    if (pos >= stmt.start && pos <= stmt.end) {
      return stmt;
    }
  }

  return null;
}

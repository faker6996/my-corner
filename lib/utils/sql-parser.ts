import { SQL_KEYWORDS_SET } from "@/lib/constants/sql-keywords";

export type SqlContextKind = "keyword" | "table" | "column";

export type SqlClause = "select" | "from" | "where" | "groupBy" | "orderBy" | "having" | "join" | "set" | "other";

export interface SqlCompletionContext {
  kind: SqlContextKind;
  currentToken: string;
  clause: SqlClause;
  tableAlias?: string;
  tableForAlias?: string;
}

const TOKEN_BOUNDARY = /[\s,();]+/;

export function getSqlCompletionContext(sql: string, cursorOffset: number): SqlCompletionContext {
  const safeCursor = Math.max(0, Math.min(cursorOffset, sql.length));
  const before = sql.slice(0, safeCursor);

  const tokenMatch = before.match(/([a-zA-Z0-9_\.]+)$/);
  const currentToken = tokenMatch ? tokenMatch[1] : "";

  const beforeWithoutCurrent = before.slice(0, before.length - currentToken.length);
  const tokens = beforeWithoutCurrent
    .split(TOKEN_BOUNDARY)
    .map((t) => t.trim())
    .filter(Boolean);

  const upperTokens = tokens.map((t) => t.toUpperCase());

  let lastKeyword: string | undefined;
  for (let i = upperTokens.length - 1; i >= 0; i -= 1) {
    if (SQL_KEYWORDS_SET.has(upperTokens[i])) {
      lastKeyword = upperTokens[i];
      break;
    }
  }

  let clause: SqlClause = "other";
  if (lastKeyword === "SELECT") clause = "select";
  else if (lastKeyword === "FROM") clause = "from";
  else if (lastKeyword === "WHERE") clause = "where";
  else if (lastKeyword === "GROUP") clause = "groupBy";
  else if (lastKeyword === "ORDER") clause = "orderBy";
  else if (lastKeyword === "HAVING") clause = "having";
  else if (lastKeyword === "JOIN") clause = "join";
  else if (lastKeyword === "SET") clause = "set";

  // Build simple alias map from FROM/JOIN/UPDATE/INTO clauses
  const aliasMap = new Map<string, string>();

  for (let i = 0; i < upperTokens.length; i += 1) {
    const tok = upperTokens[i];
    if (tok === "FROM" || tok === "JOIN" || tok === "UPDATE" || tok === "INTO") {
      const tableToken = tokens[i + 1];
      if (!tableToken) continue;

      let aliasToken: string | undefined;
      const nextUpper = upperTokens[i + 2];

      if (nextUpper === "AS") {
        aliasToken = tokens[i + 3];
      } else {
        aliasToken = tokens[i + 2];
      }

      const tableName = tableToken;

      if (tableName && /^[a-zA-Z_][a-zA-Z0-9_\.]*$/.test(tableName)) {
        aliasMap.set(tableName, tableName);
      }

      if (aliasToken && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(aliasToken)) {
        aliasMap.set(aliasToken, tableName);
      }
    }
  }

  let tableAlias: string | undefined;
  let tableForAlias: string | undefined;

  const dotIndex = currentToken.indexOf(".");
  if (dotIndex > 0) {
    const aliasCandidate = currentToken.slice(0, dotIndex);
    if (aliasCandidate) {
      tableAlias = aliasCandidate;
      const mapped = aliasMap.get(aliasCandidate);
      if (mapped) {
        tableForAlias = mapped;
      }
    }
  }

  let kind: SqlContextKind;

  if (clause === "from" || clause === "join" || (clause === "other" && lastKeyword === "INTO") || lastKeyword === "UPDATE") {
    kind = "table";
  } else if (clause === "select" || clause === "where" || clause === "groupBy" || clause === "orderBy" || clause === "having" || clause === "set") {
    kind = "column";
  } else if (!currentToken || /^[a-zA-Z_]+$/.test(currentToken)) {
    kind = "keyword";
  } else {
    kind = "column";
  }

  return {
    kind,
    currentToken,
    clause,
    tableAlias,
    tableForAlias,
  };
}

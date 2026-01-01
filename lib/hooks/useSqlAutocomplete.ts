"use client";

import { useEffect, useMemo, useState } from "react";
import { getSqlCompletionContext } from "@/lib/utils/sql-parser";
import { SQL_FUNCTIONS, SQL_KEYWORDS } from "@/lib/constants/sql-keywords";

export type SqlSuggestionKind = "keyword" | "table" | "column" | "function";

export interface SqlSuggestion {
  kind: SqlSuggestionKind;
  label: string;
  insertText: string;
  detail?: string;
}

interface SchemaColumn {
  name: string;
  dataType: string;
}

interface SchemaTable {
  name: string;
  schema: string;
  columns: SchemaColumn[];
}

interface SqlSchema {
  tables: SchemaTable[];
}

let schemaCache: SqlSchema | null = null;
const MAX_SUGGESTIONS = 50;

async function fetchSchema(): Promise<SqlSchema> {
  const res = await fetch("/api/admin/sql-schema", { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error(`Failed to load schema: HTTP ${res.status}`);
  }
  const json = await res.json();
  const data = json?.data ?? json;
  return data as SqlSchema;
}

export function useSqlAutocomplete(query: string, cursorOffset: number) {
  const [schema, setSchema] = useState<SqlSchema | null>(schemaCache);
  const [loadingSchema, setLoadingSchema] = useState(!schemaCache);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    if (schemaCache) return;

    let cancelled = false;
    setLoadingSchema(true);

    fetchSchema()
      .then((data) => {
        if (cancelled) return;
        schemaCache = data;
        setSchema(data);
        setSchemaError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setSchemaError(err?.message || "Failed to load schema");
      })
      .finally(() => {
        if (!cancelled) setLoadingSchema(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { suggestions, currentToken } = useMemo(() => {
    const ctx = getSqlCompletionContext(query, cursorOffset);
    const token = ctx.currentToken;
    const rawPrefix = token.toLowerCase();

    // For alias like "u.col" we want column prefix after the dot
    const dotIdx = token.indexOf(".");
    const columnPrefix = dotIdx > -1 ? token.slice(dotIdx + 1).toLowerCase() : rawPrefix;

    const keywordSuggestions: SqlSuggestion[] = [];
    const functionSuggestions: SqlSuggestion[] = [];
    const tableSuggestions: SqlSuggestion[] = [];
    const columnSuggestions: SqlSuggestion[] = [];

    // Keywords
    for (const kw of SQL_KEYWORDS) {
      if (!rawPrefix || kw.toLowerCase().startsWith(rawPrefix)) {
        keywordSuggestions.push({
          kind: "keyword",
          label: kw,
          insertText: kw,
        });
      }
    }

    // Functions
    for (const fn of SQL_FUNCTIONS) {
      if (!rawPrefix || fn.toLowerCase().startsWith(rawPrefix)) {
        functionSuggestions.push({
          kind: "function",
          label: fn,
          insertText: `${fn}()`,
        });
      }
    }

    if (schema) {
      if (ctx.kind === "table") {
        for (const table of schema.tables) {
          const fullName = table.schema && table.schema !== "public" ? `${table.schema}.${table.name}` : table.name;
          if (!rawPrefix || fullName.toLowerCase().startsWith(rawPrefix)) {
            tableSuggestions.push({
              kind: "table",
              label: table.name,
              insertText: fullName,
              detail: table.schema,
            });
          }
        }
      } else {
        // Column context (and general)
        let tables = schema.tables;

        if (ctx.tableForAlias) {
          const aliasTarget = ctx.tableForAlias.toLowerCase();
          tables = schema.tables.filter((table) => {
            const fullName = table.schema && table.schema !== "public" ? `${table.schema}.${table.name}`.toLowerCase() : table.name.toLowerCase();
            return fullName === aliasTarget;
          });
        }

        for (const table of tables) {
          const tableFullName = table.schema && table.schema !== "public" ? `${table.schema}.${table.name}` : table.name;

          for (const col of table.columns) {
            const fullName = `${table.name}.${col.name}`;
            const matchPrefix = !columnPrefix || col.name.toLowerCase().startsWith(columnPrefix) || fullName.toLowerCase().startsWith(columnPrefix);
            if (!matchPrefix) continue;

            const useAlias = ctx.tableAlias && ctx.tableForAlias && tableFullName.toLowerCase() === ctx.tableForAlias.toLowerCase();

            const insertText = useAlias ? `${ctx.tableAlias}.${col.name}` : fullName;

            columnSuggestions.push({
              kind: "column",
              label: col.name,
              insertText,
              detail: `${table.name} · ${col.dataType}`,
            });
          }
        }
      }
    }

    let ordered: SqlSuggestion[] = [];

    // Sort each group alphabetically by label
    keywordSuggestions.sort((a, b) => a.label.localeCompare(b.label));
    functionSuggestions.sort((a, b) => a.label.localeCompare(b.label));
    tableSuggestions.sort((a, b) => a.label.localeCompare(b.label));
    columnSuggestions.sort((a, b) => a.label.localeCompare(b.label));

    if (ctx.kind === "table") {
      ordered = [...tableSuggestions, ...keywordSuggestions, ...functionSuggestions];
    } else if (ctx.kind === "column") {
      ordered = [...columnSuggestions, ...functionSuggestions, ...keywordSuggestions, ...tableSuggestions];
    } else {
      ordered = [...keywordSuggestions, ...functionSuggestions, ...tableSuggestions, ...columnSuggestions];
    }

    const limited = ordered.slice(0, MAX_SUGGESTIONS);

    return { suggestions: limited, currentToken: token };
  }, [query, cursorOffset, schema]);

  function applySuggestion(s: SqlSuggestion): { text: string; cursor: number } {
    const safeCursor = Math.max(0, Math.min(cursorOffset, query.length));
    const before = query.slice(0, safeCursor);
    const after = query.slice(safeCursor);

    const prefixMatch = before.match(/([a-zA-Z0-9_\.]+)$/);
    const existingToken = prefixMatch ? prefixMatch[1] : "";
    const replaceStart = before.length - existingToken.length;

    const beforeWithoutToken = before.slice(0, replaceStart);
    const needsSpaceBefore = beforeWithoutToken.length > 0 && !/\s$/.test(beforeWithoutToken);

    const insertion = (needsSpaceBefore ? " " : "") + s.insertText + " ";

    const newBefore = beforeWithoutToken + insertion;
    const newText = newBefore + after;
    const newCursor = newBefore.length;

    return { text: newText, cursor: newCursor };
  }

  return {
    suggestions,
    currentToken,
    loadingSchema,
    schemaError,
    applySuggestion,
  };
}

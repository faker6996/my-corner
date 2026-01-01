"use client";

import { cn } from "@/lib/utils/cn";
import React from "react";
import type { SqlSuggestion } from "../../../../lib/hooks/useSqlAutocomplete";

interface Props {
  open: boolean;
  suggestions: SqlSuggestion[];
  highlightedIndex: number;
  onSelect: (item: SqlSuggestion) => void;
  loadingSchema?: boolean;
  schemaError?: string | null;
  anchorTop?: number;
  anchorLeft?: number;
}

export function SqlAutocompleteDropdown({ open, suggestions, highlightedIndex, onSelect, loadingSchema, schemaError, anchorTop, anchorLeft }: Props) {
  if (!open) return null;

  const showEmptyState = !loadingSchema && !schemaError && suggestions.length === 0;

  const style: React.CSSProperties =
    typeof anchorTop === "number" || typeof anchorLeft === "number"
      ? {
          top: typeof anchorTop === "number" ? anchorTop : "100%",
          left: typeof anchorLeft === "number" ? anchorLeft : 0,
        }
      : { top: "100%", left: 0, marginTop: 4 };

  return (
    <div
      className="absolute z-50 max-h-60 w-80 max-w-full overflow-y-auto rounded-md border border-border/60 bg-popover shadow-lg text-sm"
      style={style}
    >
      {loadingSchema && (
        <div className="flex items-center gap-2 border-b border-border/40 px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-3 w-3 animate-spin rounded-full border border-border/60 border-t-transparent" />
          <span>Loading schema…</span>
        </div>
      )}

      {schemaError && !loadingSchema && <div className="border-b border-destructive/40 px-3 py-1.5 text-xs text-destructive">{schemaError}</div>}

      {showEmptyState && <div className="px-3 py-2 text-xs text-muted-foreground">No suggestions</div>}

      {suggestions.map((item, index) => {
        const isActive = index === highlightedIndex;
        const icon = item.kind === "keyword" ? "🔷" : item.kind === "table" ? "📊" : item.kind === "column" ? "📋" : "⚙️";

        return (
          <button
            key={`${item.kind}-${item.label}-${index}`}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground"
            )}
            onClick={() => onSelect(item)}
          >
            <span className="w-4 text-center">{icon}</span>
            <span className="flex-1 truncate font-mono text-xs">{item.label}</span>
            {item.detail && <span className="ml-2 truncate text-xs text-muted-foreground/80">{item.detail}</span>}
          </button>
        );
      })}
    </div>
  );
}

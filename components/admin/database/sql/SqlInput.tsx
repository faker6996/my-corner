"use client";

import React, { useCallback, useState, useRef, KeyboardEvent } from "react";
import { Textarea } from "@underverse-ui/underverse";
import { SqlAutocompleteDropdown } from "./SqlAutocompleteDropdown";
import { useSqlAutocomplete } from "@/lib/hooks/useSqlAutocomplete";
import { getStatementForCursor } from "@/lib/utils/sql-query-range";
import { KEY_CODE } from "@/lib/constants/keyboard";

export interface SqlInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue: (value: string) => void;
  onExecuteShortcut?: (sql: string) => void;
}

export const SqlInput = React.forwardRef<HTMLTextAreaElement, SqlInputProps>(
  ({ value, onChangeValue, onExecuteShortcut, className, onKeyDown, ...rest }, ref) => {
    const [cursor, setCursor] = useState(0);
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [dropdownTop, setDropdownTop] = useState<number | null>(null);
    const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const { suggestions, currentToken, loadingSchema, schemaError, applySuggestion } = useSqlAutocomplete(value, cursor);

    const hasSuggestions = suggestions.length > 0;

    React.useEffect(() => {
      if (currentToken && hasSuggestions) {
        setOpen(true);
        setHighlightedIndex(0);
      } else if (!currentToken) {
        setOpen(false);
      }
    }, [currentToken, hasSuggestions]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Execute query: Ctrl+Enter / Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === KEY_CODE.ENTER) {
          if (onExecuteShortcut) {
            e.preventDefault();
            const target = e.currentTarget;
            const selStart = target.selectionStart ?? cursor;
            const selEnd = target.selectionEnd ?? cursor;

            let sqlToRun = "";

            if (selStart !== selEnd) {
              sqlToRun = value.slice(selStart, selEnd);
            } else {
              const stmt = getStatementForCursor(value, cursor);
              if (stmt) sqlToRun = stmt.text;
            }

            if (sqlToRun.trim()) {
              onExecuteShortcut(sqlToRun.trim());
            }
            return;
          }
        }

        // Trigger autocomplete manually
        if (e.key === KEY_CODE.SPACE && e.ctrlKey) {
          e.preventDefault();
          setOpen(true);
          setHighlightedIndex(0);
          return;
        }

        if (open && hasSuggestions) {
          if (e.key === KEY_CODE.ARROW_LEFT || e.key === KEY_CODE.ARROW_RIGHT) {
            // Để caret di chuyển bình thường, chỉ đóng dropdown
            setOpen(false);
            return;
          }

          if (e.key === KEY_CODE.ARROW_DOWN) {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
            return;
          }
          if (e.key === KEY_CODE.ARROW_UP) {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
            return;
          }
          if (e.key === KEY_CODE.ESCAPE) {
            e.preventDefault();
            setOpen(false);
            return;
          }
          if (e.key === KEY_CODE.ENTER || e.key === KEY_CODE.TAB) {
            const suggestion = suggestions[highlightedIndex] || suggestions[0];
            if (suggestion) {
              e.preventDefault();
              const { text, cursor: nextCursor } = applySuggestion(suggestion);
              onChangeValue(text);
              setCursor(nextCursor);
              setOpen(false);
              return;
            }
          }
        }

        if (onKeyDown) {
          onKeyDown(e);
        }
      },
      [onExecuteShortcut, hasSuggestions, open, suggestions, highlightedIndex, applySuggestion, onChangeValue, onKeyDown]
    );

    const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      setCursor(target.selectionStart || 0);
    }, []);

    const handleClickSuggestion = useCallback(
      (item: ReturnType<typeof useSqlAutocomplete>["suggestions"][number]) => {
        const { text, cursor: nextCursor } = applySuggestion(item);
        onChangeValue(text);
        setCursor(nextCursor);
        setOpen(false);
      },
      [applySuggestion, onChangeValue]
    );

    const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      setCursor(target.selectionStart || 0);
    }, []);

    const updateDropdownPosition = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;

      try {
        const before = value.slice(0, cursor);
        const lines = before.split("\n");
        const lineIndex = Math.max(0, lines.length - 1);
        const columnIndex = lines[lineIndex]?.length ?? 0;

        const style = window.getComputedStyle(el);
        const lineHeight = parseFloat(style.lineHeight || "16") || 16;
        const paddingTop = parseFloat(style.paddingTop || "0") || 0;
        const paddingLeft = parseFloat(style.paddingLeft || "0") || 0;
        const borderTop = parseFloat(style.borderTopWidth || "0") || 0;
        const borderLeft = parseFloat(style.borderLeftWidth || "0") || 0;
        const scrollTop = el.scrollTop || 0;
        const scrollLeft = el.scrollLeft || 0;
        const fontSize = parseFloat(style.fontSize || "14") || 14;
        const charWidth = fontSize * 0.6;

        const top = paddingTop + borderTop + (lineIndex + 1) * lineHeight - scrollTop + 4;

        setDropdownTop(top);

        const left = paddingLeft + borderLeft + columnIndex * charWidth - scrollLeft;
        setDropdownLeft(Math.max(paddingLeft, left));
      } catch {
        setDropdownTop(null);
        setDropdownLeft(null);
      }
    }, [value, cursor]);

    const combinedRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref && "current" in ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      if (open) {
        updateDropdownPosition();
      }
    }, [open, cursor, value, updateDropdownPosition]);

    return (
      <div className="relative">
        <Textarea
          ref={combinedRef}
          value={value}
          onChange={(e) => {
            setCursor(e.target.selectionStart || 0);
            onChangeValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onSelect={(e) => {
            const target = e.currentTarget;
            setCursor(target.selectionStart || 0);
          }}
          onClick={(e) => {
            const target = e.currentTarget;
            setCursor(target.selectionStart || 0);
          }}
          className={className}
          {...rest}
        />
        <SqlAutocompleteDropdown
          open={open}
          suggestions={suggestions}
          highlightedIndex={highlightedIndex}
          onSelect={handleClickSuggestion}
          loadingSchema={loadingSchema}
          schemaError={schemaError}
          anchorTop={dropdownTop ?? undefined}
          anchorLeft={dropdownLeft ?? undefined}
        />
      </div>
    );
  }
);

SqlInput.displayName = "SqlInput";

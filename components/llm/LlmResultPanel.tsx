"use client";

import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, DataTable, DataTableColumn } from "@underverse-ui/underverse";
import { Copy as CopyIcon, RefreshCw, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export type LlmSpellingItem = {
  line_index: number; // 1-based
  word_index: number; // 1-based within that line
  original_word: string;
  corrected_word: string;
};

export type LlmExtractedInfo = {
  full_name?: string;
  birth_date?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  id_number?: string;
};

export type LlmResult = {
  corrected_text: string;
  spelling_analysis: LlmSpellingItem[];
  extracted_info?: LlmExtractedInfo[];
};

interface LlmResultPanelProps {
  llm?: LlmResult;
  hasOcr: boolean;
  loading?: boolean;
  onRun?: () => void;
  onCopyCorrected?: (text: string) => void;
  className?: string;
  // Optional OCR lines (per overlay grouping) to align corrected text per line
  ocrLines?: Array<{ id: number; words: string[] }>;
}

// Define columns for spelling analysis DataTable
const spellingColumns: DataTableColumn<LlmSpellingItem>[] = [
  {
    key: "line_index",
    title: "Line",
    dataIndex: "line_index",
    width: 60,
    align: "center",
    sortable: true,
    filter: { type: "text", placeholder: "Line #" },
  },
  {
    key: "word_index",
    title: "Word",
    dataIndex: "word_index",
    width: 60,
    align: "center",
    sortable: true,
    filter: { type: "text", placeholder: "Word #" },
  },
  {
    key: "original_word",
    title: "OCR Text",
    dataIndex: "original_word",
    sortable: true,
    filter: { type: "text", placeholder: "Search OCR text" },
    render: (value) => <span className="text-muted-foreground">{value}</span>,
  },
  {
    key: "corrected_word",
    title: "LLM Text",
    dataIndex: "corrected_word",
    sortable: true,
    filter: { type: "text", placeholder: "Search LLM text" },
    render: (value) => <Badge variant="primary">{value}</Badge>,
  },
];

export default function LlmResultPanel({ llm, hasOcr, loading, onRun, onCopyCorrected, className, ocrLines }: LlmResultPanelProps) {
  const t = useTranslations("LLM");
  const tocr = useTranslations("OCR.ocrDisplay");
  const [leftColumnHeight, setLeftColumnHeight] = React.useState<number | null>(null);
  const leftColumnRef = React.useRef<HTMLDivElement>(null);

  const hasLlmContent =
    !!llm &&
    ((typeof llm.corrected_text === "string" && llm.corrected_text.trim().length > 0) ||
      (Array.isArray(llm.spelling_analysis) && llm.spelling_analysis.length > 0) ||
      (Array.isArray(llm.extracted_info) && llm.extracted_info.length > 0));
  // Preferred: rebuild per-line text by applying spelling_analysis onto OCR tokens (stable alignment)
  const replacedByLineFromAnalysis = React.useMemo(() => {
    if (!ocrLines || !llm?.spelling_analysis || llm.spelling_analysis.length === 0) return null as null | Array<{ id: number; text: string }>;

    // Build a map: line_index (1-based from LLM) -> OCR line data
    const lineMap = new Map<number, { words: string[]; originalId: number }>();
    ocrLines.forEach((ln, idx) => {
      const llmLineIndex = idx + 1; // Convert 0-based index to 1-based for LLM
      lineMap.set(llmLineIndex, { words: [...ln.words], originalId: ln.id });
    });

    // Apply spelling corrections
    llm.spelling_analysis.forEach((s) => {
      const lineData = lineMap.get(s.line_index);
      if (lineData) {
        const wordIdx = s.word_index - 1; // Convert to 0-based
        if (wordIdx >= 0 && wordIdx < lineData.words.length) {
          lineData.words[wordIdx] = s.corrected_word || lineData.words[wordIdx];
        }
      }
    });

    // Convert back to result format
    const result: Array<{ id: number; text: string }> = [];
    lineMap.forEach((lineData, llmLineIndex) => {
      result.push({
        id: lineData.originalId,
        text: lineData.words.join(" ").trim(),
      });
    });

    // Sort by original OCR line order
    result.sort((a, b) => a.id - b.id);

    return result;
  }, [ocrLines, llm?.spelling_analysis]);
  // Build corrected text aligned to OCR lines by using line breaks or smart distribution
  const correctedByLine = React.useMemo(() => {
    if (!ocrLines || !llm?.corrected_text) return null as null | Array<{ id: number; text: string }>;

    // First try: split by line breaks if LLM preserved line structure
    const correctedText = String(llm.corrected_text).trim();
    const llmLines = correctedText.split(/\r?\n/).filter(Boolean);

    if (llmLines.length === ocrLines.length) {
      // LLM preserved line breaks - use them directly
      return ocrLines.map((ln, idx) => ({
        id: ln.id,
        text: llmLines[idx]?.trim() || "",
      }));
    }

    // Fallback: distribute tokens proportionally based on OCR character count per line
    const tokens = correctedText.split(/\s+/).filter(Boolean);
    const ocrLineLengths = ocrLines.map((ln) => ln.words.join(" ").length);
    const totalOcrLength = ocrLineLengths.reduce((sum, len) => sum + len, 0);

    if (totalOcrLength === 0) {
      // Edge case: no OCR text, put all in first line
      return ocrLines.map((ln, idx) => ({
        id: ln.id,
        text: idx === 0 ? correctedText : "",
      }));
    }

    let cursor = 0;
    const lines = ocrLines.map((ln, idx) => {
      const proportion = ocrLineLengths[idx] / totalOcrLength;
      const take = Math.round(tokens.length * proportion);
      const slice = tokens.slice(cursor, cursor + take);
      cursor = Math.min(cursor + take, tokens.length);
      return { id: ln.id, text: slice.join(" ").trim() };
    });

    // Append any remaining tokens to last line
    if (cursor < tokens.length && lines.length > 0) {
      const rest = tokens.slice(cursor).join(" ").trim();
      if (rest) {
        const lastLine = lines[lines.length - 1];
        lines[lines.length - 1] = {
          id: lastLine.id,
          text: lastLine.text ? `${lastLine.text} ${rest}` : rest,
        };
      }
    }

    return lines;
  }, [ocrLines, llm?.corrected_text]);

  // Measure left column height to match table container height
  React.useEffect(() => {
    if (leftColumnRef.current) {
      const height = leftColumnRef.current.offsetHeight;
      setLeftColumnHeight(height);
    }
  }, [llm, correctedByLine, replacedByLineFromAnalysis]);

  const handleCopy = async () => {
    const text = llm?.corrected_text || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      onCopyCorrected?.(text);
    } catch {}
  };

  return (
    <Card className={cn("p-4 max-h-[85vh] overflow-auto", className)}>
      {!hasOcr ? (
        <div className="text-sm text-muted-foreground">{tocr("noOcrData") as string}</div>
      ) : !hasLlmContent ? (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">{t("noResult") as string}</div>
          {onRun && (
            <Button variant="default" size="sm" onClick={onRun} loading={!!loading} title={t("continue") as string}>
              <Wand2 className="w-4 h-4 mr-1" /> {t("continue")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LLM texts */}
          <div ref={leftColumnRef} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-muted-foreground">{t("correctedText")}</h3>
              <Button variant="ghost" size="sm" onClick={handleCopy} title={t("copyCorrected") as string}>
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="rounded border border-border p-3 text-sm space-y-1">
              {Array.isArray(ocrLines) && ocrLines.length > 0 && Array.isArray(correctedByLine) && correctedByLine.length > 0 ? (
                // Prefer full corrected_text reflowed to OCR lines
                correctedByLine.map((ln) => (
                  <div key={ln.id} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-6 text-right">#{ln.id + 1}</span>
                    <div className="flex-1 whitespace-pre-wrap">{ln.text}</div>
                  </div>
                ))
              ) : Array.isArray(ocrLines) &&
                ocrLines.length > 0 &&
                Array.isArray(replacedByLineFromAnalysis) &&
                replacedByLineFromAnalysis.length > 0 ? (
                // Fallback to per-word replacements if corrected_text reflow not available
                replacedByLineFromAnalysis.map((ln) => (
                  <div key={ln.id} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-6 text-right">#{ln.id + 1}</span>
                    <div className="flex-1 whitespace-pre-wrap">{ln.text}</div>
                  </div>
                ))
              ) : (
                <div className="whitespace-pre-wrap">{llm.corrected_text}</div>
              )}
            </div>
          </div>

          {/* Spelling analysis as a table */}
          <div className="space-y-2 flex flex-col" style={{ height: leftColumnHeight ? `${leftColumnHeight}px` : "auto" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-muted-foreground">{t("spellingAnalysis")}</h3>
              {onRun && (
                <Button variant="ghost" size="sm" onClick={onRun} title={t("rerun") as string} disabled={!!loading}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="text-sm flex-1 overflow-hidden">
              {llm.spelling_analysis.length === 0 ? (
                <div className="p-3 text-muted-foreground">{t("noSpellingIssues")}</div>
              ) : (
                <div className="h-full">
                  <DataTable
                    columns={spellingColumns}
                    data={llm.spelling_analysis}
                    rowKey={(row) => `${row.line_index}-${row.word_index}`}
                    pageSize={10}
                    total={llm.spelling_analysis.length}
                    className="text-xs"
                    enableColumnVisibilityToggle={false}
                    enableDensityToggle={false}
                  />
                </div>
              )}
            </div>

            {llm.extracted_info && llm.extracted_info.length > 0 && (
              <div className="space-y-1 text-sm">
                <h3 className="text-sm text-muted-foreground">{t("extractedInfo")}</h3>
                <div className="rounded border border-border p-3">
                  {llm.extracted_info.map((e, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 text-xs">
                      {e.full_name && (
                        <div>
                          <span className="text-muted-foreground">{t("name")}:</span> {e.full_name}
                        </div>
                      )}
                      {e.phone_number && (
                        <div>
                          <span className="text-muted-foreground">{t("phone")}:</span> {e.phone_number}
                        </div>
                      )}
                      {e.email && (
                        <div>
                          <span className="text-muted-foreground">{t("email")}:</span> {e.email}
                        </div>
                      )}
                      {e.address && (
                        <div className="col-span-3">
                          <span className="text-muted-foreground">{t("address")}:</span> {e.address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

"use client";

import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { KEY_CODE } from "@/lib/constants/keyboard";
import { cn } from "@/lib/utils/cn";
import { getStatementForCursor } from "@/lib/utils/sql-query-range";
import { Alert, Button, Card, DataTable, DataTableColumn } from "@underverse-ui/underverse";
import { AlertTriangle, CheckCircle, Copy, Database, Download, History, Play, RotateCcw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SqlInput } from "./sql/SqlInput";

interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowsAffected?: number;
  executionTime?: number;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  result: QueryResult;
}

export default function SqlQueryEditor() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getActiveSqlFromEditor = () => {
    const el = textareaRef.current;
    const value = query;
    if (!el) {
      const trimmed = value.trim();
      return trimmed || null;
    }

    const selStart = el.selectionStart ?? 0;
    const selEnd = el.selectionEnd ?? 0;

    if (selStart !== selEnd) {
      const selected = value.slice(selStart, selEnd).trim();
      return selected || null;
    }

    const stmt = getStatementForCursor(value, selStart);
    return stmt?.text.trim() || null;
  };

  const executeQuery = async (sqlOverride?: string) => {
    const raw = (sqlOverride ?? query).trim();
    if (!raw) {
      toast.error("Please enter a SQL query");
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/admin/sql-query", {
        method: HTTP_METHOD_ENUM.POST,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: raw }),
        credentials: "same-origin",
      });

      const executionTime = Date.now() - startTime;
      const json: any = await res.json().catch(() => ({}));

      const finalResult: QueryResult =
        res.ok && json?.success
          ? {
              success: true,
              data: Array.isArray(json.data) ? json.data : undefined,
              rowsAffected: json.rowsAffected ?? json.rowCount,
              executionTime: json.executionTime ?? executionTime,
            }
          : {
              success: false,
              error: (json && (json.error || json.message)) || `HTTP ${res.status}`,
              executionTime,
            };

      setResults(finalResult);

      // Add to history
      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        query: raw,
        timestamp: new Date(),
        result: finalResult,
      };

      setHistory((prev) => [historyItem, ...prev.slice(0, 19)]); // Keep last 20 queries

      if (finalResult.success) {
        toast.success(`Query executed successfully in ${executionTime}ms`);
      } else {
        toast.error("Query failed - check results below");
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorResult: QueryResult = {
        success: false,
        error: error.message || "Unknown error occurred",
        executionTime,
      };

      setResults(errorResult);
      toast.error("Query execution failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const clearResults = () => {
    setResults(null);
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success("Query history cleared");
  };

  // Generate columns for table results
  const generateColumns = (data: any[]): DataTableColumn<any>[] => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      key,
      title: key.charAt(0).toUpperCase() + key.slice(1),
      dataIndex: key,
      render: (value: any) => {
        if (value === null || value === undefined) {
          return <span className="text-muted-foreground italic">null</span>;
        }
        if (typeof value === "object") {
          return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
        }
        if (typeof value === "boolean") {
          return <span className={value ? "text-success" : "text-destructive"}>{value.toString()}</span>;
        }
        return <span className="font-mono text-sm">{value.toString()}</span>;
      },
    }));
  };

  const exportResults = () => {
    if (!results?.data || results.data.length === 0) return;

    const delimiter = ","; // enforce comma; Excel respects sep= hint
    const cols = Object.keys(results.data[0]);

    const escapeCell = (v: any) => {
      if (v === null || v === undefined) return "";
      let s: string;
      if (typeof v === "object") s = JSON.stringify(v);
      else s = String(v);
      s = s.replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines: string[] = [];
    // Excel separator hint
    lines.push(`sep=${delimiter}`);
    // Header
    lines.push(cols.map(escapeCell).join(delimiter));
    // Rows
    for (const row of results.data) {
      const cells = cols.map((c) => escapeCell((row as any)[c]));
      lines.push(cells.join(delimiter));
    }

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sql-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">SQL Query Editor</h2>
            <p className="text-sm text-muted-foreground">Execute database queries with real-time results</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-card hover:bg-accent hover:text-accent-foreground border-border/50"
          >
            <History className="w-4 h-4" />
            History
            <span className="ml-1 px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">{history.length}</span>
          </Button>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              icon={Trash2}
              aria-label="Clear history"
            />
          )}
        </div>
      </div>

      {/* Query Editor (plain, no wrapper padding) */}
      <div className="space-y-4">
        <div className="relative group">
          <SqlInput
            ref={textareaRef}
            value={query}
            onChangeValue={setQuery}
            onExecuteShortcut={(sql) => {
              if (!loading && sql.trim()) {
                executeQuery(sql);
              }
            }}
            placeholder="Enter your SQL query here...

Examples:
SELECT * FROM users LIMIT 10;
UPDATE users SET is_active = true WHERE id = 1;
CREATE TABLE test (id SERIAL PRIMARY KEY, name VARCHAR(255));
SELECT u.name, COUNT(t.id) as task_count
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.name
ORDER BY task_count DESC;"
            className="font-mono text-sm min-h-100 resize-y bg-background/80 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/60"
            disabled={loading}
          />
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(query)}
              disabled={!query.trim()}
              className="h-7 w-7 p-0 hover:bg-muted/70 bg-background/80 backdrop-blur-sm border border-border/30"
              title="Copy query"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              disabled={!query.trim() || loading}
              className="h-7 w-7 p-0 hover:bg-muted/70 bg-background/80 backdrop-blur-sm border border-border/30"
              title="Clear query"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
              {query.trim() ? <span className="font-medium">{query.trim().length} characters</span> : <span>Enter SQL query above</span>}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
              <kbd className="px-1.5 py-0.5 bg-muted/50 border border-border/50 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-muted/50 border border-border/50 rounded text-xs">Enter</kbd>
              <span>to execute</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => {
                const active = getActiveSqlFromEditor();
                if (active) {
                  executeQuery(active);
                } else {
                  executeQuery();
                }
              }}
              disabled={!query.trim() || loading}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Query</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Query History (flat Card) */}
      {showHistory && history.length > 0 && (
        <Card className="bg-transparent shadow-none border border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-accent" />
              <h3 className="font-medium text-foreground">Query History</h3>
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full font-medium">{history.length}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {history.map((item, index) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="group w-full text-left p-3 md:p-4 rounded-md bg-muted/10 hover:bg-accent/10 border border-border/30 hover:border-accent/30 transition-colors cursor-pointer"
                onClick={() => setQuery(item.query)}
                onKeyDown={(e) => {
                  if (e.key === KEY_CODE.ENTER || e.key === KEY_CODE.SPACE) {
                    e.preventDefault();
                    setQuery(item.query);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      <span className="text-xs text-muted-foreground">{item.timestamp.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        {item.result.success ? (
                          <CheckCircle className="w-3 h-3 text-success" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-destructive" />
                        )}
                        <span className="text-xs text-muted-foreground font-mono">{item.result.executionTime}ms</span>
                      </div>
                    </div>
                    <div className="text-sm font-mono text-foreground/90 truncate bg-muted/30 px-2 py-1 rounded">{item.query}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.query);
                    }}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-accent/20 transition-all"
                    title="Copy query"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Results (flat Card) */}
      {results && (
        <Card className={cn("bg-transparent shadow-none", results.success ? "border border-success/40" : "border border-destructive/40")}>
          <div className="space-y-6">
            {/* Result Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", results.success ? "bg-success/20" : "bg-destructive/20")}>
                  {results.success ? <CheckCircle className="w-5 h-5 text-success" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                  <h3 className={cn("font-semibold text-lg", results.success ? "text-success" : "text-destructive")}>
                    {results.success ? "Query Successful" : "Query Failed"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Executed in {results.executionTime}ms</span>
                    {results.success && results.data && <span>• {results.data.length} rows returned</span>}
                    {results.success && results.rowsAffected !== undefined && <span>• {results.rowsAffected} rows affected</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {results.success && results.data && (
                  <Button variant="outline" size="sm" onClick={exportResults} className="hover:bg-info/10 border-info/30 text-info hover:text-info">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearResults} className="hover:bg-muted/50 text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {!results.success && results.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Query Error</h4>
                    <pre className="text-sm text-destructive/90 whitespace-pre-wrap font-mono bg-destructive/5 p-3 rounded border border-destructive/20 overflow-x-auto">
                      {results.error}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Success Results */}
            {results.success && (
              <div className="space-y-4">
                {/* Data Table */}
                {results.data && results.data.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Query Results</h4>
                      <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full font-medium">{results.data.length} rows</span>
                    </div>
                    <DataTable
                      columns={generateColumns(results.data)}
                      data={results.data}
                      caption={`${results.data.length} results`}
                      className="border border-border/50 rounded-lg bg-card/50"
                    />
                  </div>
                )}

                {/* No Data */}
                {results.data && results.data.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Query Successful</h4>
                    <p className="text-sm text-muted-foreground">No data was returned by this query.</p>
                  </div>
                )}

                {/* Non-SELECT queries */}
                {!results.data && results.rowsAffected !== undefined && (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-medium text-success">Operation Successful</h4>
                        <p className="text-sm text-success/80">Query executed successfully. {results.rowsAffected} rows were affected.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Warning Banner */}
      <Alert
        variant="warning"
        title="Database Query Editor - Use with Caution"
        description={
          "You have direct access to the database. Please ensure you understand the impact of your queries, especially UPDATE, DELETE, and DDL statements."
        }
        className="shadow-sm"
      />
    </div>
  );
}

import { ApiError } from "@/lib/utils/error";
import { sqlQueryRepo } from "../repositories/sql_query_repo";
import { DatabaseError } from "@/lib/error/database-error";

const dangerousPatterns = [
  /;\s*drop\s+/i,
  /;\s*truncate\s+/i,
  /;\s*alter\s+/i,
  /;\s*grant\s+/i,
  /;\s*revoke\s+/i,
  /;\s*create\s+user\s+/i,
  /;\s*drop\s+user\s+/i,
  /--.*$/m,
  /\/\*.*?\*\//g,
];

export type SqlQueryResult =
  | {
      type: "select";
      command: string;
      data: any[];
      rowCount: number;
      executionTime: number;
    }
  | {
      type: "mutation";
      command: string;
      rowsAffected: number;
      executionTime: number;
    };

export const sqlQueryApp = {
  async executeRawSql(rawQuery: string): Promise<SqlQueryResult> {
    const trimmedQuery = (rawQuery || "").trim();

    if (!trimmedQuery) {
      throw new ApiError("Query cannot be empty", 400);
    }

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmedQuery)) {
        throw new ApiError(
          "Query contains potentially dangerous SQL patterns and has been blocked for security.",
          400
        );
      }
    }

    const startTime = Date.now();

    try {
      const result = await sqlQueryRepo.execute(trimmedQuery);
      const executionTime = Date.now() - startTime;

      const command = (result as any).command ?? "";
      const rows = (result as any).rows ?? [];
      const rowCount = (result as any).rowCount ?? rows.length ?? 0;

      if (command === "SELECT") {
        return {
          type: "select",
          command,
          data: rows,
          rowCount,
          executionTime,
        };
      }

      return {
        type: "mutation",
        command,
        rowsAffected: rowCount,
        executionTime,
      };
    } catch (err: any) {
      if (err instanceof DatabaseError) {
        throw new ApiError(
          err.originalError?.message || "Database query failed",
          400
        );
      }
      throw err;
    }
  },
};


import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { APP_ROLE } from "@/lib/constants/enum";
import { ApiError } from "@/lib/utils/error";
import { safeQuery } from "@/lib/modules/common/safe_query";

interface SchemaColumn {
  name: string;
  dataType: string;
}

interface SchemaTable {
  name: string;
  schema: string;
  columns: SchemaColumn[];
}

let cachedSchema: SchemaTable[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function loadSchema(): Promise<SchemaTable[]> {
  const now = Date.now();
  if (cachedSchema && now - cachedAt < CACHE_TTL_MS) {
    return cachedSchema;
  }

  const sql = `
    SELECT table_schema,
           table_name,
           column_name,
           data_type,
           ordinal_position
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position
  `;

  const { rows } = await safeQuery(sql);

  const map = new Map<string, SchemaTable>();

  for (const row of rows as any[]) {
    const schema = row.table_schema as string;
    const tableName = row.table_name as string;
    const columnName = row.column_name as string;
    const dataType = row.data_type as string;

    const key = `${schema}.${tableName}`;
    if (!map.has(key)) {
      map.set(key, {
        name: tableName,
        schema,
        columns: [],
      });
    }

    map.get(key)!.columns.push({
      name: columnName,
      dataType,
    });
  }

  const tables = Array.from(map.values());
  cachedSchema = tables;
  cachedAt = now;
  return tables;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const currentUser = await getUserFromRequest(req);
  const role = (currentUser as any).role as APP_ROLE | undefined;

  const allowed = role === APP_ROLE.ADMIN || role === APP_ROLE.SUPER_ADMIN;
  if (!allowed) {
    throw new ApiError("Forbidden", 403);
  }

  const tables = await loadSchema();
  return createResponse({ tables }, "OK");
});


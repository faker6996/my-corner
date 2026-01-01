import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { APP_ROLE } from "@/lib/constants/enum";
import { ApiError } from "@/lib/utils/error";
import { sqlQueryApp } from "@/lib/modules/admins/sql_query/applications/sql_query_app";

// POST /api/admin/sql-query
export const POST = withApiHandler(async (req: NextRequest) => {
  const currentUser = await getUserFromRequest(req);
  const role = (currentUser as any).role as APP_ROLE | undefined;

  // Admin area: cho phép ADMIN và SUPER_ADMIN
  const allowed = role === APP_ROLE.ADMIN || role === APP_ROLE.SUPER_ADMIN;
  if (!allowed) {
    throw new ApiError("Forbidden", 403);
  }

  const body = await req.json().catch(() => null);
  const rawQuery = (body && typeof body.query === "string" ? body.query : "").trim();

  const result = await sqlQueryApp.executeRawSql(rawQuery);

  // Trả về shape tương thích với SqlQueryEditor:
  //  - data: array cho SELECT
  //  - rowsAffected / rowCount / executionTime nằm ở root
  if (result.type === "select") {
    return NextResponse.json({
      success: true,
      message: "OK",
      data: result.data,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
    });
  }

  return NextResponse.json({
    success: true,
    message: "OK",
    data: null,
    rowsAffected: result.rowsAffected,
    executionTime: result.executionTime,
    command: result.command,
  });
});

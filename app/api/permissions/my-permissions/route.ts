import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp } from "@/lib/modules/rbac";

/**
 * GET /api/permissions/my-permissions
 *
 * Lấy tất cả permissions của user hiện tại
 * Dùng cho caching permissions client-side
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  // Get current user
  const currentUser = await getUserFromRequest(req);

  // Get user's permissions
  const result = await permissionCheckApp.getUserPermissions(currentUser.id!);

  return createResponse(result, "OK");
});

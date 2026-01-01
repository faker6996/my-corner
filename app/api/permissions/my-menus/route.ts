import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp } from "@/lib/modules/rbac";

/**
 * GET /api/permissions/my-menus
 *
 * Lấy danh sách menus mà user có quyền view
 * Dùng cho Sidebar component
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  // Get current user
  const currentUser = await getUserFromRequest(req);

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "vi";

  // Get user's menus
  const result = await permissionCheckApp.getUserMenus(currentUser.id!, locale);

  return createResponse(result, "OK");
});

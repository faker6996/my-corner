import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp, rbacAdminApp, menuRepo } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(request: NextRequest) {
  const user = await getUserFromRequest(request);

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "vi";

  // Ensure user has view permission on the Permissions menu
  const canView = await permissionCheckApp.checkMenuAction(
    user.id!,
    RBAC_MENU_CODES.PERMISSIONS,
    RBAC_ACTION_CODES.VIEW
  );
  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  const [menuTree, roles, rolePermissions] = await Promise.all([
    menuRepo.getMenuTree(locale),
    rbacAdminApp.getAllRoles({ includeSystem: true }),
    rbacAdminApp.getAllRolePermissions(),
  ]);

  return createResponse(
    {
      menuTree,
      roles,
      rolePermissions,
    },
    "Permissions view setup data fetched successfully"
  );
}

export const GET = withApiHandler(handler);

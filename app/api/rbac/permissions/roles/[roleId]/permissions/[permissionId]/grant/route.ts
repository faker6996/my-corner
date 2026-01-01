import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp, rbacAdminApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(
  request: NextRequest,
  ctx: { params: Promise<{ roleId: string; permissionId: string }> }
) {
  const user = await getUserFromRequest(request);

  // Ensure user has update permission on the Permissions menu
  const canUpdate = await permissionCheckApp.checkMenuAction(
    user.id!,
    RBAC_MENU_CODES.PERMISSIONS,
    RBAC_ACTION_CODES.UPDATE
  );
  if (!canUpdate) {
    throw new ApiError("Forbidden", 403);
  }
  const { roleId: roleIdParam, permissionId: permissionIdParam } = await ctx.params;
  const roleId = parseInt(roleIdParam);
  const permissionId = parseInt(permissionIdParam);

  if (isNaN(roleId) || isNaN(permissionId)) {
    throw new ApiError("Invalid role ID or permission ID", 400);
  }

  await rbacAdminApp.grantPermissionToRole({
    role_id: roleId,
    permission_id: permissionId,
    is_granted: true,
  });

  return createResponse(null, "Permission granted successfully");
}

export const POST = withApiHandler(handler);

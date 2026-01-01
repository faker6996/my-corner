import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp, rbacAdminApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; permissionId: string }> }
) {
  const currentUser = await getUserFromRequest(request);

  const canUpdate = await permissionCheckApp.checkMenuAction(
    currentUser.id!,
    RBAC_MENU_CODES.PERMISSIONS,
    RBAC_ACTION_CODES.UPDATE
  );
  if (!canUpdate) {
    throw new ApiError("Forbidden", 403);
  }

  const { userId: userIdParam, permissionId: permissionIdParam } = await ctx.params;
  const userId = parseInt(userIdParam, 10);
  const permissionId = parseInt(permissionIdParam, 10);

  if (Number.isNaN(userId) || Number.isNaN(permissionId) || userId <= 0 || permissionId <= 0) {
    throw new ApiError("Invalid user ID or permission ID", 400);
  }

  await rbacAdminApp.grantPermissionToUser(userId, permissionId);

  return createResponse(null, "User permission granted successfully");
}

export const POST = withApiHandler(handler);


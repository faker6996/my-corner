import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp, rbacAdminApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(request: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const user = await getUserFromRequest(request);

  // Chỉ cho phép user có quyền update trên menu Permissions
  const canView = await permissionCheckApp.checkMenuAction(
    user.id!,
    RBAC_MENU_CODES.PERMISSIONS,
    RBAC_ACTION_CODES.UPDATE
  );
  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  const { userId: userIdParam } = await ctx.params;
  const userId = parseInt(userIdParam, 10);
  if (Number.isNaN(userId) || userId <= 0) {
    throw new ApiError("Invalid user ID", 400);
  }

  const assignments = await rbacAdminApp.getUserPermissionsAssignments(userId);

  return createResponse(assignments, "User permissions assignments fetched successfully");
}

export const GET = withApiHandler(handler);


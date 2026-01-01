import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { menuRepo } from "@/lib/modules/rbac/repositories/menu_repo";
import { permissionCheckApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(request: NextRequest) {
  const user = await getUserFromRequest(request);

  // Only users with menu.permissions.view can see full menu tree
  const canView = await permissionCheckApp.checkMenuAction(
    user.id!,
    RBAC_MENU_CODES.PERMISSIONS,
    RBAC_ACTION_CODES.VIEW
  );
  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  const menuTree = await menuRepo.getMenuTree();

  return createResponse(menuTree, "Menu tree fetched successfully");
}

export const GET = withApiHandler(handler);

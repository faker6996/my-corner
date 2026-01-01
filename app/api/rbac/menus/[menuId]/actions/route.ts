import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { menuRepo } from "@/lib/modules/rbac/repositories/menu_repo";
import { permissionCheckApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(request: NextRequest, ctx: { params: Promise<{ menuId: string }> }) {
  const user = await getUserFromRequest(request);

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "vi";

  // Hard-coded permission check for Permissions menu view
  const canView = await permissionCheckApp.checkMenuAction(
    user.id!,
    RBAC_MENU_CODES.PERMISSIONS,
    RBAC_ACTION_CODES.VIEW
  );
  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  const { menuId: menuIdParam } = await ctx.params;
  const menuId = parseInt(menuIdParam);
  if (isNaN(menuId)) {
    throw new ApiError("Invalid menu ID", 400);
  }

  // Get actions for this menu
  const actions = await menuRepo.getMenuActions(menuId, locale);

  return createResponse(actions, "Menu actions fetched successfully");
}

export const GET = withApiHandler(handler);

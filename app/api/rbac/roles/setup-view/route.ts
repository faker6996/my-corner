import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function handler(request: NextRequest) {
  const user = await getUserFromRequest(request);

  const canView = await permissionCheckApp.checkMenuAction(
    user.id!,
    RBAC_MENU_CODES.ROLES,
    RBAC_ACTION_CODES.VIEW
  );

  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  const { actions, menu_code } = await permissionCheckApp.getUserMenuActions(
    user.id!,
    RBAC_MENU_CODES.ROLES
  );

  return createResponse(
    {
      menu_code,
      actions,
    },
    "Roles view setup data fetched successfully"
  );
}

export const GET = withApiHandler(handler);


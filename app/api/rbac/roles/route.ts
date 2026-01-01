import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp, rbacAdminApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function getHandler(request: NextRequest) {
  const user = await getUserFromRequest(request);

  const canView = await permissionCheckApp.checkMenuAction(user.id!, RBAC_MENU_CODES.ROLES, RBAC_ACTION_CODES.VIEW);
  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  // Get all roles, including system roles (super_admin, admin, user) for admin UI
  const roles = await rbacAdminApp.getAllRoles({ includeSystem: true });

  return createResponse(roles, "Roles fetched successfully");
}

async function postHandler(request: NextRequest) {
  const user = await getUserFromRequest(request);

  const canCreate = await permissionCheckApp.checkMenuAction(user.id!, RBAC_MENU_CODES.ROLES, RBAC_ACTION_CODES.CREATE);
  if (!canCreate) {
    throw new ApiError("Forbidden", 403);
  }

  const body = await request.json();
  const { code, name, description, level } = body;

  // Validate required fields
  if (!code || !name) {
    throw new ApiError("Code and name are required", 400);
  }

  // Create role
  const newRole = await rbacAdminApp.createRole({
    code: code.trim(),
    name: name.trim(),
    description: description?.trim(),
    level: level || 99,
  });

  return createResponse(newRole, "Role created successfully");
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);

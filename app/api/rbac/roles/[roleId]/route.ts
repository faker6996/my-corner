import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp, rbacAdminApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

async function getHandler(request: NextRequest, { params }: { params: { roleId: string } }) {
  const user = await getUserFromRequest(request);

  const canView = await permissionCheckApp.checkMenuAction(user.id!, RBAC_MENU_CODES.ROLES, RBAC_ACTION_CODES.VIEW);
  if (!canView) {
    throw new ApiError("Forbidden", 403);
  }

  const roleId = parseInt(params.roleId);
  if (isNaN(roleId)) {
    throw new ApiError("Invalid role ID", 400);
  }

  const role = await rbacAdminApp.getRoleById(roleId);

  return createResponse(role, "Role fetched successfully");
}

async function putHandler(request: NextRequest, { params }: { params: { roleId: string } }) {
  const user = await getUserFromRequest(request);

  const canUpdate = await permissionCheckApp.checkMenuAction(user.id!, RBAC_MENU_CODES.ROLES, RBAC_ACTION_CODES.UPDATE);
  if (!canUpdate) {
    throw new ApiError("Forbidden", 403);
  }

  const roleId = parseInt(params.roleId);
  if (isNaN(roleId)) {
    throw new ApiError("Invalid role ID", 400);
  }

  const body = await request.json();
  const { name, description, level, is_active } = body;

  // Update role
  const updatedRole = await rbacAdminApp.updateRole(roleId, {
    name: name?.trim(),
    description: description?.trim(),
    level,
    is_active,
  });

  return createResponse(updatedRole, "Role updated successfully");
}

async function deleteHandler(request: NextRequest, { params }: { params: { roleId: string } }) {
  const user = await getUserFromRequest(request);

  const canDelete = await permissionCheckApp.checkMenuAction(user.id!, RBAC_MENU_CODES.ROLES, RBAC_ACTION_CODES.DELETE);
  if (!canDelete) {
    throw new ApiError("Forbidden", 403);
  }

  const roleId = parseInt(params.roleId);
  if (isNaN(roleId)) {
    throw new ApiError("Invalid role ID", 400);
  }

  await rbacAdminApp.deleteRole(roleId);

  return createResponse(null, "Role deleted successfully");
}

export const GET = withApiHandler(getHandler);
export const PUT = withApiHandler(putHandler);
export const DELETE = withApiHandler(deleteHandler);

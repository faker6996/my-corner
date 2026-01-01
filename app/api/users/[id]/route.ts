import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { userApp } from "@/lib/modules/user/applications/user_app";
import { APP_ROLE } from "@/lib/constants";

// PATCH /api/users/:id { isDeleted: boolean }
export const PATCH = withApiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) throw new ApiError("Invalid id", 400);

  const currentUser = await getUserFromRequest(req);
  const body = await req.json();
  const isDeleted = body?.isDeleted;
  const role = body?.role as APP_ROLE.SUPER_ADMIN | APP_ROLE.ADMIN | APP_ROLE.USER | undefined;
  const name = body?.name;
  const is_active = body?.is_active;
  const email = body?.email;
  const user_name = body?.user_name;

  const result = await userApp.updateUserAdmin(currentUser as any, id, { isDeleted, role, name, is_active, email, user_name });
  return createResponse(result, "Updated");
});
// GET /api/users/:id (admin/super_admin or self)
export const GET = withApiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) throw new ApiError("Invalid id", 400);

  const current = await getUserFromRequest(req);
  const summary = await userApp.getUserSummaryForAdminOrSelf(current as any, id);
  return createResponse(summary, "OK");
});

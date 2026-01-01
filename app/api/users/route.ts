import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { userApp } from "@/lib/modules/user/applications/user_app";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp } from "@/lib/modules/rbac";

// GET /api/users?name=&user_name=&email=&role=&status=&page=&pageSize=
export const GET = withApiHandler(async (req: NextRequest) => {
  const current = await getUserFromRequest(req);

  // Check RBAC permission
  const canView = await permissionCheckApp.checkMenuAction(current.id!, "users", "view");
  if (!canView) throw new ApiError("Forbidden", 403);

  const { searchParams } = new URL(req.url);

  // Parse filter params
  const filters = {
    name: searchParams.get("name") || undefined,
    user_name: searchParams.get("user_name") || undefined,
    email: searchParams.get("email") || undefined,
    role: searchParams.get("role") || undefined,
    status: searchParams.get("status") || undefined,
  };

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const showDeleted = searchParams.get("showDeleted") === "true";

  const result = await userApp.listUsers({ filters, page, pageSize, currentUserId: current.id, showDeleted });
  return createResponse(result, "OK");
});

// POST /api/users { name, email, password, role }
export const POST = withApiHandler(async (req: NextRequest) => {
  const current = await getUserFromRequest(req);

  // Check RBAC permission
  const canCreate = await permissionCheckApp.checkMenuAction(current.id!, "users", "create");
  if (!canCreate) throw new ApiError("Forbidden", 403);

  const body = await req.json();
  const { name, email, role, baseUrl, locale } = body || {};

  // Use invite flow instead of direct creation
  const result = await userApp.inviteUser(
    { name, email, role },
    baseUrl || `${req.nextUrl.protocol}//${req.nextUrl.host}`,
    locale || "en"
  );

  return createResponse(
    { id: result.user.id, email: result.user.email, name: result.user.name, role: (result.user as any).role },
    "User invited successfully"
  );
});

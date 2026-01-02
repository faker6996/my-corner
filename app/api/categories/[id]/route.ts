import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { categoryApp } from "@/lib/modules/categories";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id]
export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) throw new ApiError("Invalid ID", 400);

  const category = await categoryApp.getById(categoryId);
  return createResponse(category, "Category retrieved");
});

// PUT /api/categories/[id]
export const PUT = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const { id } = await context.params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) throw new ApiError("Invalid ID", 400);

  const body = await req.json();
  const category = await categoryApp.update(categoryId, body);
  return createResponse(category, "Category updated");
});

// DELETE /api/categories/[id]
export const DELETE = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const { id } = await context.params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) throw new ApiError("Invalid ID", 400);

  await categoryApp.delete(categoryId);
  return createResponse(null, "Category deleted");
});

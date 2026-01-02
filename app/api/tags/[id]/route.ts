import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { tagApp } from "@/lib/modules/tags";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const tag = await tagApp.getById(parseInt(id, 10));
  return createResponse(tag, "Tag retrieved");
});

export const PUT = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const { id } = await context.params;
  const body = await req.json();
  const tag = await tagApp.update(parseInt(id, 10), body);
  return createResponse(tag, "Tag updated");
});

export const DELETE = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const { id } = await context.params;
  await tagApp.delete(parseInt(id, 10));
  return createResponse(null, "Tag deleted");
});

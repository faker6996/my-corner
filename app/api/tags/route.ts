import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { tagApp } from "@/lib/modules/tags";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

// GET /api/tags
export const GET = withApiHandler(async () => {
  const tags = await tagApp.getAll();
  return createResponse(tags, "Tags retrieved");
});

// POST /api/tags
export const POST = withApiHandler(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const body = await req.json();
  const tag = await tagApp.create(body);
  return createResponse(tag, "Tag created", 201);
});

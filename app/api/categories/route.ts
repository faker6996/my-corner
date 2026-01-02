import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { categoryApp } from "@/lib/modules/categories";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

// GET /api/categories - List all categories
export const GET = withApiHandler(async () => {
  const categories = await categoryApp.getAll();
  return createResponse(categories, "Categories retrieved");
});

// POST /api/categories - Create new category
export const POST = withApiHandler(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const body = await req.json();
  const category = await categoryApp.create(body);
  return createResponse(category, "Category created", 201);
});

import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { postApp } from "@/lib/modules/posts";
import { ApiError } from "@/lib/utils/error";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/posts/slug/[slug] - Get post by slug
export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { slug } = await context.params;

  if (!slug) {
    throw new ApiError("Slug is required", 400);
  }

  const post = await postApp.getPostBySlug(slug, true);
  return createResponse(post, "Post retrieved");
});

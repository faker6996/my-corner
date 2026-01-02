import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { postApp } from "@/lib/modules/posts";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - Get post by ID
export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  const post = await postApp.getPostById(postId, true);
  return createResponse(post, "Post retrieved");
});

// PUT /api/posts/[id] - Update post
export const PUT = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const { id } = await context.params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  const body = await req.json();
  const post = await postApp.updatePost(postId, body);

  return createResponse(post, "Post updated");
});

// DELETE /api/posts/[id] - Delete post
export const DELETE = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const { id } = await context.params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  await postApp.deletePost(postId);
  return createResponse(null, "Post deleted");
});

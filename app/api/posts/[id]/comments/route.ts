import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { commentApp } from "@/lib/modules/comments";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id]/comments
export const GET = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  const comments = await commentApp.getByPostId(postId);
  return createResponse(comments, "Comments retrieved");
});

// POST /api/posts/[id]/comments
export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  let user;
  try {
    user = await getUserFromRequest(req);
  } catch {
    user = null;
  }

  const body = await req.json();
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  const userAgent = req.headers.get("user-agent") || "";

  const comment = await commentApp.create({
    post_id: postId,
    user_id: user?.id,
    author_name: body.author_name,
    author_email: body.author_email,
    content: body.content,
    parent_id: body.parent_id,
    ip_address: ip,
    user_agent: userAgent,
  });

  return createResponse(comment, "Comment created", 201);
});

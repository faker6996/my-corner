import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { postRepo } from "@/lib/modules/posts";
import { ApiError } from "@/lib/utils/error";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/share - Track share
export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  const post = await postRepo.findById(postId);
  if (!post) throw new ApiError("Post not found", 404);

  const body = await req.json();
  const platform = body.platform || "other";

  let userId: number | null = null;
  try {
    const user = await getUserFromRequest(req);
    userId = user?.id || null;
  } catch {
    userId = null;
  }

  const sessionId = req.headers.get("x-session-id") || null;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

  await query(`INSERT INTO post_shares (post_id, user_id, platform, session_id, ip_address) VALUES ($1, $2, $3, $4, $5)`, [
    postId,
    userId,
    platform,
    sessionId,
    ip,
  ]);
  await query(`UPDATE posts SET share_count = share_count + 1 WHERE id = $1`, [postId]);

  return createResponse({ shared: true, platform }, "Share tracked");
});

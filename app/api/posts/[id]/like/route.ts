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

// POST /api/posts/[id]/like - Toggle like
export const POST = withApiHandler(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) throw new ApiError("Invalid post ID", 400);

  const post = await postRepo.findById(postId);
  if (!post) throw new ApiError("Post not found", 404);

  let userId: number | null = null;
  try {
    const user = await getUserFromRequest(req);
    userId = user?.id || null;
  } catch {
    userId = null;
  }

  const sessionId = req.headers.get("x-session-id") || null;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

  if (!userId && !sessionId) throw new ApiError("User or session ID required", 400);

  // Check if already liked
  let existingLike;
  if (userId) {
    const result = await query(`SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
    existingLike = (result.rows || result)[0];
  } else if (sessionId) {
    const result = await query(`SELECT id FROM post_likes WHERE post_id = $1 AND session_id = $2`, [postId, sessionId]);
    existingLike = (result.rows || result)[0];
  }

  if (existingLike) {
    // Unlike
    await query(`DELETE FROM post_likes WHERE id = $1`, [existingLike.id]);
    await query(`UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1`, [postId]);
    return createResponse({ liked: false }, "Unliked");
  } else {
    // Like
    await query(`INSERT INTO post_likes (post_id, user_id, session_id, ip_address) VALUES ($1, $2, $3, $4)`, [postId, userId, sessionId, ip]);
    await query(`UPDATE posts SET like_count = like_count + 1 WHERE id = $1`, [postId]);
    return createResponse({ liked: true }, "Liked");
  }
});

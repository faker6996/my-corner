import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { postApp } from "@/lib/modules/posts";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

// GET /api/posts - List posts with pagination
export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const status = searchParams.get("status") || undefined;
  const categoryId = searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!, 10) : undefined;
  const search = searchParams.get("search") || undefined;

  const result = await postApp.getPosts({
    page,
    pageSize,
    status,
    categoryId,
    search,
  });

  return createResponse(
    {
      posts: result.data,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    },
    "Posts retrieved"
  );
});

// POST /api/posts - Create new post
export const POST = withApiHandler(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  if (!user?.id) throw new ApiError("Unauthorized", 401);

  const body = await req.json();

  const post = await postApp.createPost({
    ...body,
    author_id: user.id,
  });

  return createResponse(post, "Post created", 201);
});

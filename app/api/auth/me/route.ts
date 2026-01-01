// app/api/auth/me/route.ts              ⬅︎ đổi path tuỳ dự án
import { NextRequest } from "next/server";

import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

async function getHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  return createResponse(user, "Authenticated");
}

/* Xuất route GET đã bọc HOF */
export const GET = withApiHandler(getHandler);

import { NextRequest } from "next/server";
import { createResponse } from "@/lib/utils/response";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { ApiError } from "@/lib/utils/error";
import { refreshTokenApp } from "@/lib/modules/auth/refresh_token/applications/refresh_token_app";
import { getAuthCookieBaseOptions } from "@/lib/utils/cookies";

async function handler(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  
  if (!refreshToken) {
    throw new ApiError("Refresh token not found", 401);
  }

  // Use application layer to handle token refresh
  const { accessToken, refreshToken: newRefreshToken } = await refreshTokenApp.refreshAccessToken(refreshToken);

  const res = createResponse({ accessToken }, "Token refreshed successfully");

  // Set new cookies (unified options)
  const baseHttpOnly = getAuthCookieBaseOptions(true);
  res.cookies.set("access_token", accessToken, {
    ...baseHttpOnly,
    maxAge: 15 * 60,
  });
  res.cookies.set("refresh_token", newRefreshToken, {
    ...baseHttpOnly,
    maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}

export const POST = withApiHandler(handler);

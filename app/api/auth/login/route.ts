// app/api/auth/login/route.ts
import { NextRequest } from "next/server";

import { userApp } from "@/lib/modules/user/applications/user_app";
import { createTokenPair } from "@/lib/utils/jwt";
import { createResponse } from "@/lib/utils/response";

import { withApiHandler } from "@/lib/utils/withApiHandler";
import { ApiError } from "@/lib/utils/error";
import { saveToLocalStorage } from "@/lib/utils/local-storage";
import { normalLoginApp } from "@/lib/modules/auth/normal_login/applications/normal_login_app";
import { cacheUser } from "@/lib/cache/user";
import { refreshTokenApp } from "@/lib/modules/auth/refresh_token/applications/refresh_token_app";
import { applyRateLimit, loginRateLimit } from "@/lib/middlewares/auth-rate-limit";
import { APP_ROLE } from "@/lib/constants";
import { getAuthCookieBaseOptions } from "@/lib/utils/cookies";

async function handler(req: NextRequest) {
  // Apply rate limiting first
  await applyRateLimit(req, loginRateLimit);

  const { email, password, rememberMe } = await req.json();

  const userVerify = await userApp.verifyUser(email, password);
  const user = await normalLoginApp.handleAfterLogin(userVerify);

  if (!user) throw new ApiError("Sai tài khoản hoặc mật khẩu", 401);

  // Generate token pair
  const { accessToken, refreshToken } = createTokenPair(
    {
      sub: user.id!.toString(),
      email: user.email,
      name: user.name,
      id: user.id!,
      role: (user as any).role || APP_ROLE.USER,
    },
    rememberMe
  );

  // Store refresh token in database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + (rememberMe ? 30 : 7)); // 30 days or 7 days

  await refreshTokenApp.createRefreshToken(user.id!, refreshToken, refreshTokenExpiry);
  await cacheUser(user);

  /* ✅ KHÔNG đưa token vào JSON */
  const res = createResponse(null, "Đăng nhập thành công");

  const baseHttpOnly = getAuthCookieBaseOptions(true);

  res.cookies.set("access_token", accessToken, {
    ...baseHttpOnly,
    maxAge: 15 * 60,
  });
  res.cookies.set("refresh_token", refreshToken, {
    ...baseHttpOnly,
    maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60,
  });

  return res; // { success:true, data:null }
}

export const POST = withApiHandler(handler);

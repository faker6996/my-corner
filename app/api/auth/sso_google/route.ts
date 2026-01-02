import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM, LOCALE } from "@/lib/constants/enum";

// Simple interface for OAuth token response
interface SsoAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}
import { UserInfoSsoGg } from "@/lib/models/user";
import { ssoGoogleApp } from "@/lib/modules/auth/sso_google/applications/sso_google_app";
import { ApiError } from "@/lib/utils/error";
import { createTokenPair } from "@/lib/utils/jwt";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { NextRequest, NextResponse } from "next/server";
import { cacheUser } from "@/lib/cache/user";
import { refreshTokenApp } from "@/lib/modules/auth/refresh_token/applications/refresh_token_app";
import { getAuthCookieBaseOptions } from "@/lib/utils/cookies";
import { APP_ROLE } from "@/lib/constants";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const AUTH_URL = process.env.FRONTEND_URL!;
const FRONTEND_REDIRECT = process.env.FRONTEND_URL || "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* STEP-1: Tạo URL redirect sang Google OAuth                         */
/* ------------------------------------------------------------------ */
async function postHandler(req: NextRequest) {
  const { locale } = await req.json();
  const redirect_uri = encodeURIComponent(`${AUTH_URL}${API_ROUTES.AUTH.SSO_GOOGLE}`);
  const client_id = GOOGLE_CLIENT_ID;
  const scope = encodeURIComponent("email profile");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&state=${locale}`;

  return NextResponse.json({ redirectUrl: url });
}

export const POST = withApiHandler(postHandler);

// STEP 2: Handle Google redirect with code and fetch access_token + user info
async function getHandler(req: NextRequest) {
  // 1. Lấy mã code từ query params
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("state") || LOCALE.VI;

  if (!code) throw new ApiError("Missing code", 400);

  const tokenParams = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: `${AUTH_URL}${API_ROUTES.AUTH.SSO_GOOGLE}`,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(API_ROUTES.AUTH.SSO_GOOGLE_GET_TOKEN, {
    method: HTTP_METHOD_ENUM.POST,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams, // KHÔNG JSON.stringify!
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    throw new ApiError(`Google token request failed: ${detail}`, tokenRes.status);
  }

  const tokenData: SsoAuthToken = await tokenRes.json(); // { access_token, refresh_token, ... }

  /* 3️⃣  Lấy thông tin user từ access_token (GET) */
  const infoRes = await fetch(`${API_ROUTES.AUTH.SSO_GOOGLE_GET_INFO}?alt=json`, {
    method: HTTP_METHOD_ENUM.GET,
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!infoRes.ok) {
    const detail = await infoRes.text();
    throw new ApiError(`Google user-info request failed: ${detail}`, infoRes.status);
  }

  const userInfo: UserInfoSsoGg = await infoRes.json();

  // 4. Kiểm tra/tạo user trong DB
  const user = await ssoGoogleApp.handleAfterSso(userInfo);

  // Cache user after successful login
  await cacheUser(user);

  // Generate token pair
  const { accessToken, refreshToken } = createTokenPair({
    sub: user.id!.toString(),
    email: user.email,
    name: user.name,
    id: user.id!,
    role: (user as any).role || APP_ROLE.USER,
  });

  // Store refresh token in database (30 days for SSO)
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

  await refreshTokenApp.createRefreshToken(user.id!, refreshToken, refreshTokenExpiry);

  // Redirect with cookies
  const response = NextResponse.redirect(`${FRONTEND_REDIRECT}/${locale}`);

  const baseHttpOnly = getAuthCookieBaseOptions(true);
  response.cookies.set("access_token", accessToken, { ...baseHttpOnly, maxAge: 15 * 60 });
  response.cookies.set("refresh_token", refreshToken, { ...baseHttpOnly, maxAge: 30 * 24 * 60 * 60 });
  return response;
}

export const GET = withApiHandler(getHandler);

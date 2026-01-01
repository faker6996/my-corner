export type SameSiteOpt = "lax" | "strict" | "none";

export function getAuthCookieBaseOptions(httpOnly: boolean = true) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  let derivedDomain: string | undefined;
  try {
    derivedDomain = new URL(frontendUrl).hostname;
  } catch {
    derivedDomain = undefined;
  }

  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || derivedDomain;
  const secureFromEnv = process.env.AUTH_COOKIE_SECURE;
  const isHttps = frontendUrl.startsWith("https://");
  const secure = secureFromEnv ? secureFromEnv === "true" : isHttps;

  const sameSiteEnv = (process.env.AUTH_COOKIE_SAMESITE || "")
    .toLowerCase() as SameSiteOpt | "";
  const sameSite: SameSiteOpt = sameSiteEnv || (secure ? "none" : "lax");

  return {
    httpOnly,
    secure,
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}


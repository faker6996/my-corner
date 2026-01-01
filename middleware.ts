import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { middlewarePipeline } from "./lib/middlewares/pipeline";
// role guard handled inline with JWT verification
import { withCors, withLogger, withAuth } from "./lib/middlewares";
import { withRateLimit } from "./lib/middlewares/rate-limit";
import { routing } from "@/i18n/routing";
import { APP_ROLE } from "@/lib/constants";
import { verifyJwtEdge } from "@/lib/utils/jwt-edge";

const intlMiddleware = createIntlMiddleware({
  ...routing,
  // Enhanced locale detection
  localeDetection: true,
  alternateLinks: true,
});

export async function middleware(req: NextRequest) {
  try {
    // Skip i18n for API routes
    if (req.nextUrl.pathname.startsWith("/api")) {
      return await middlewarePipeline(req, [withCors, withLogger, withAuth]);
    }

    // Handle root path redirect to locale
    if (req.nextUrl.pathname === "/") {
      const acceptLanguage = req.headers.get("accept-language") || "";
      let detectedLocale = routing.defaultLocale;

      // Parse Accept-Language header
      if (acceptLanguage) {
        const preferredLocales = acceptLanguage
          .split(",")
          .map((lang) => lang.split(";")[0].trim().toLowerCase())
          .map((lang) => lang.split("-")[0]);

        for (const preferredLocale of preferredLocales) {
          if (routing.locales.includes(preferredLocale as (typeof routing.locales)[number])) {
            detectedLocale = preferredLocale as (typeof routing.locales)[number];
            break;
          }
        }
      }

      console.log(`🌐 Redirecting ${req.nextUrl.pathname} to /${detectedLocale} (detected from: ${acceptLanguage})`);
      return Response.redirect(new URL(`/${detectedLocale}`, req.url));
    }

    const intlRes = intlMiddleware(req);
    if (intlRes?.redirected) return intlRes;

    let res = await middlewarePipeline(req, [
      withCors,
      // withRateLimit,
      withLogger,
      withAuth,
    ]);

    intlRes?.headers.forEach((value, key) => {
      res.headers.set(key, value);
    });

    // Admin-only legacy area
    if (req.nextUrl.pathname.startsWith("/admin")) {
      let role = "";
      const token = req.cookies.get("access_token")?.value;
      if (token) {
        try {
          const payload = await verifyJwtEdge(token);
          role = (payload as any)?.role || role;
        } catch {}
      }
      const allowed = role === APP_ROLE.SUPER_ADMIN;
      if (!allowed) {
        const p = req.nextUrl.pathname;
        const m = p.match(/^\/(vi|en|ko|ja)\//);
        const locale = m ? m[1] : routing.defaultLocale;
        return Response.redirect(new URL(`/${locale}/403`, req.url));
      }
    }

    // Role guard for users management page: /:locale/users
    const p = req.nextUrl.pathname;
    const m = p.match(/^\/(vi|en|ko|ja)\/(users)(\/.*)?$/);
    if (m) {
      // Read role strictly from JWT access_token
      let role = "";
      const token = req.cookies.get("access_token")?.value;
      if (token) {
        try {
          const payload = await verifyJwtEdge(token);
          role = (payload as any)?.role || role;
        } catch {}
      }
      const allowed = role === APP_ROLE.ADMIN || role === APP_ROLE.SUPER_ADMIN;
      if (!allowed) {
        const locale = m[1] || routing.defaultLocale;
        return Response.redirect(new URL(`/${locale}/403`, req.url));
      }
    }

    return res;
  } catch (err: any) {
    console.error("[Middleware Error]", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    "/",

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    "/(vi|en|ko|ja)/:path*",

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};

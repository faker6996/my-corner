// lib/i18n/namespaces.ts
// Map URL pathnames to i18n namespaces to load.

export function deriveNamespaces(pathname: string): string[] {
  // Normalize
  const p = pathname || "/";
  const segs = p.split("/").filter(Boolean);
  const out: string[] = [];

  // Expect locale as first segment (vi|en|ko|ja)
  const afterLocale = segs[1] ? `/${segs.slice(1).join("/")}` : "/";

  // Define simple prefix-to-namespace mapping
  const map: Array<{ prefix: string; ns: string[] }> = [
    { prefix: "/login", ns: ["auth-login"] },
    { prefix: "/register", ns: ["auth-register"] },
    { prefix: "/forgot-password", ns: ["auth-forgot"] },
    { prefix: "/reset-password", ns: ["auth-reset"] },
    { prefix: "/activate", ns: ["auth-activate"] },
    { prefix: "/dashboard", ns: ["dashboard"] },
    { prefix: "/users", ns: ["users", "pagination"] },
    { prefix: "/settings/users", ns: ["users", "pagination"] },
    { prefix: "/settings/permissions", ns: ["permissions", "settings"] },
    { prefix: "/settings/roles", ns: ["roles"] },
    { prefix: "/profile", ns: ["profile"] },
    { prefix: "/change-password", ns: ["change-password"] },
    { prefix: "/logs", ns: ["logs"] },
    { prefix: "/settings/logs", ns: ["logs"] },
    { prefix: "/403", ns: ["errors"] },
  ];

  for (const m of map) {
    if (afterLocale === m.prefix || afterLocale.startsWith(m.prefix + "/")) {
      out.push(...m.ns);
    }
  }

  // Always include global UI namespaces used across components
  out.push("validation");
  out.push("pagination");
  // Deduplicate
  return Array.from(new Set(out));
}

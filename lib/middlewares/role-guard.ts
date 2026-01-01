import { NextRequest, NextResponse } from 'next/server';

export function withRoleGuard(req: NextRequest, res: NextResponse, requiredRoles: string[]): NextResponse {
  // Fallback guard using role cookie; JWT-based guard is handled in middleware.ts
  const role = req.cookies.get('role')?.value;

  if (!role || !requiredRoles.includes(role)) {
    console.warn(`Access denied: role "${role}" is not in allowed roles [${requiredRoles.join(', ')}]`);
    const p = req.nextUrl.pathname;
    const m = p.match(/^\/(vi|en|ko|ja)\//);
    const locale = m ? m[1] : 'vi';
    return NextResponse.redirect(new URL(`/${locale}/403`, req.url));
  }

  return res;
}

import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { userApp } from "@/lib/modules/user/applications/user_app";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { APP_ROLE } from "@/lib/constants";
import { ApiError } from "@/lib/utils/error";

// POST /api/auth/invite { name, email, role? }
export const POST = withApiHandler(async (req: NextRequest) => {
    // Only admin can invite users
    const current = await getUserFromRequest(req);
    if (![APP_ROLE.SUPER_ADMIN, APP_ROLE.ADMIN].includes((current as any).role)) {
        throw new ApiError("Forbidden", 403);
    }

    const body = await req.json();
    const { name, email, role, locale } = body || {};

    // Get base URL from environment variable or request headers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (() => {
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        return `${protocol}://${host}`;
    })();

    const result = await userApp.inviteUser({ name, email, role }, baseUrl, locale || "en");

    return createResponse(
        { id: result.user.id, email: result.user.email, name: result.user.name, status: result.user.status },
        "Đã gửi email mời thành công"
    );
});

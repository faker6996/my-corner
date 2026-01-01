import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { userApp } from "@/lib/modules/user/applications/user_app";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { APP_ROLE } from "@/lib/constants";
import { ApiError } from "@/lib/utils/error";

// POST /api/auth/invite/resend { userId, locale?, newEmail? }
export const POST = withApiHandler(async (req: NextRequest) => {
    // Only admin can resend invite
    const current = await getUserFromRequest(req);
    if (![APP_ROLE.SUPER_ADMIN, APP_ROLE.ADMIN].includes((current as any).role)) {
        throw new ApiError("Forbidden", 403);
    }

    const body = await req.json();
    const { userId, locale, newEmail } = body || {};

    if (!userId) {
        throw new ApiError("userId là bắt buộc", 400);
    }

    // Get base URL from environment variable or request headers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (() => {
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        return `${protocol}://${host}`;
    })();

    // If newEmail is provided, send invite to new email (for email change flow)
    // Otherwise, use existing resendInvite which checks INVITED status
    if (newEmail) {
        await userApp.sendEmailChangeVerification(userId, newEmail, baseUrl, locale || "en");
    } else {
        await userApp.resendInvite(userId, baseUrl, locale || "en");
    }

    return createResponse({ success: true }, "Đã gửi lại email mời thành công");
});

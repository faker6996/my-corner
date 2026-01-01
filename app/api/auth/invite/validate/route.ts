import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { hashToken } from "@/lib/utils/token";
import { userTokenRepo } from "@/lib/modules/user/repositories/user_token_repo";
import { baseRepo } from "@/lib/modules/common/base_repo";
import { User } from "@/lib/models/user";

// POST /api/auth/invite/validate { token }
export const POST = withApiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const { token } = body || {};

    if (!token) {
        return createResponse({ valid: false, reason: "TOKEN_MISSING" }, "Token không được cung cấp", 400);
    }

    const tokenHash = hashToken(token);
    const tokenRecord = await userTokenRepo.findValidToken(tokenHash, "INVITE");

    if (!tokenRecord) {
        return createResponse({ valid: false, reason: "TOKEN_INVALID_OR_EXPIRED" }, "Token không hợp lệ hoặc đã hết hạn", 400);
    }

    // Get user info
    const user = await baseRepo.getById<User>(User, tokenRecord.user_id!);

    return createResponse(
        {
            valid: true,
            user: user ? { id: user.id, email: user.email, name: user.name } : null,
            expiresAt: tokenRecord.expires_at,
        },
        "Token hợp lệ"
    );
});

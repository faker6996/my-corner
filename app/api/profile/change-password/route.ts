import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { userApp } from "@/lib/modules/user/applications/user_app";

// POST /api/profile/change-password - Change password for current user
export const POST = withApiHandler(async (req: NextRequest) => {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser?.id) throw new ApiError("Unauthorized", 401);

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
        throw new ApiError("Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
        throw new ApiError("New password must be at least 6 characters", 400);
    }

    await userApp.changePassword(currentUser.id, currentPassword, newPassword);

    return createResponse(null, "Password changed successfully");
});

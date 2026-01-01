import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { userApp } from "@/lib/modules/user/applications/user_app";

// POST /api/auth/activate { token, password }
export const POST = withApiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const { token, password } = body || {};

    const user = await userApp.activateUser(token, password);

    return createResponse(
        { id: user.id, email: user.email, name: user.name },
        "Kích hoạt tài khoản thành công"
    );
});

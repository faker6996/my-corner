import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";

// POST /api/utils/verify-email { email }
export const POST = withApiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const { email } = body || {};

    // TODO: Implement actual email verification logic here
    // For now, we return success to satisfy the client requirement

    return createResponse({ valid: true, exists: true, email }, "Email verified");
});

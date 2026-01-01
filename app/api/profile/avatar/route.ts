import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { ApiError } from "@/lib/utils/error";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { userApp } from "@/lib/modules/user/applications/user_app";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/profile/avatar - Upload avatar for current user
export const POST = withApiHandler(async (req: NextRequest) => {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser?.id) throw new ApiError("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) throw new ApiError("No file uploaded", 400);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ApiError("Invalid file type. Allowed: jpeg, png, gif, webp, svg", 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new ApiError("File too large. Max 5MB allowed", 400);
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatar_${currentUser.id}_${Date.now()}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public", "avatars", filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(uploadPath, buffer);

    // Generate avatar URL
    const avatarUrl = `/avatars/${filename}`;

    // Update user's avatar_url in database
    await userApp.updateAvatar(currentUser.id, avatarUrl);

    return createResponse({ avatar_url: avatarUrl }, "Avatar updated successfully");
});

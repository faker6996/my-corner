// app/api/upload/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { imageUploadApp } from "@/lib/modules/uploads/applications/image_upload_app";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { permissionCheckApp } from "@/lib/modules/rbac";
import { ApiError } from "@/lib/utils/error";
import { RBAC_MENU_CODES, RBAC_ACTION_CODES } from "@/lib/constants";

export const POST = withApiHandler(async (req: NextRequest) => {
  try {
    const user = await getUserFromRequest(req);

    // Upload image is part of creating OCR tasks -> require create permission on Tasks menu
    const canCreateTasks = await permissionCheckApp.checkMenuAction(
      user.id!,
      RBAC_MENU_CODES.TASKS,
      RBAC_ACTION_CODES.CREATE
    );
    if (!canCreateTasks) {
      throw new ApiError("Forbidden", 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided", data: null },
        { status: 400 }
      );
    }

    const { imageFile, uploadResult } = await imageUploadApp.uploadImage(file);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        id: imageFile.id,
        path: imageFile.getPath(),
        // Return a relative URL so it works across hosts
        url: imageFile.getPath(),
        originalName: imageFile.getOriginalName(),
        size: imageFile.getSize(),
        mimeType: imageFile.getMimeType(),
        width: imageFile.width,
        height: imageFile.height,
        formattedSize: imageFile.getFormattedSize(),
        thumbnailPath: uploadResult.thumbnailPath,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    const message = error instanceof ApiError ? error.message : error?.message || "Upload failed";
    return NextResponse.json(
      {
        success: false,
        message,
        data: null,
      },
      { status: 500 }
    );
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

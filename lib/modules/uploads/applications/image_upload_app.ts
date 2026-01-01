import { v4 as uuidv4 } from "uuid";
import { fileUploadService } from "@/lib/utils/file-upload";
import { ImageFile } from "@/lib/models/image_file";
import { imageFileRepo } from "@/lib/modules/image_file/repositories/image_file_repo";

export const imageUploadApp = {
  async uploadImage(file: File) {
    const uploadResult = await fileUploadService.uploadFile(file);

    const imageId = uuidv4();
    const imageData: Partial<ImageFile> = {
      id: imageId,
      path: uploadResult.path,
      original_name: uploadResult.originalName,
      size: uploadResult.size,
      mime_type: uploadResult.mimeType,
      width: uploadResult.width,
      height: uploadResult.height,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const imageFile = await imageFileRepo.create(imageData);
    return { imageFile, uploadResult };
  },
};

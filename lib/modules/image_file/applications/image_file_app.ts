// Application layer for Image File (placeholder)
import { imageFileRepo } from '@/lib/modules/image_file/repositories/image_file_repo';
import { ImageFile } from '@/lib/models/image_file';

export const imageFileApp = {
  async create(data: Partial<ImageFile>) {
    return imageFileRepo.create(data);
  }
};


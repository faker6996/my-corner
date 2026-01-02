import { tagRepo } from "../repositories/tag_repo";
import { Tag } from "@/lib/models/tag";
import { ApiError } from "@/lib/utils/error";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export const tagApp = {
  async getAll(): Promise<Tag[]> {
    return tagRepo.findAll();
  },

  async getById(id: number): Promise<Tag> {
    const tag = await tagRepo.findById(id);
    if (!tag) throw new ApiError("Tag not found", 404);
    return tag;
  },

  async create(data: { name: string; description?: string; color?: string }): Promise<Tag> {
    if (!data.name) throw new ApiError("Name is required", 400);
    const slug = generateSlug(data.name);
    const existing = await tagRepo.findBySlug(slug);
    if (existing) throw new ApiError("Tag already exists", 400);
    return tagRepo.create({ ...data, slug });
  },

  async update(id: number, data: Partial<Tag>): Promise<Tag> {
    const existing = await tagRepo.findById(id);
    if (!existing) throw new ApiError("Tag not found", 404);
    if (data.name && data.name !== existing.name) {
      data.slug = generateSlug(data.name);
    }
    const updated = await tagRepo.update(id, data);
    if (!updated) throw new ApiError("Failed to update", 500);
    return updated;
  },

  async delete(id: number): Promise<void> {
    const existing = await tagRepo.findById(id);
    if (!existing) throw new ApiError("Tag not found", 404);
    await tagRepo.delete(id);
  },

  async getTagsByPost(postId: number): Promise<Tag[]> {
    return tagRepo.getTagsByPostId(postId);
  },

  async setPostTags(postId: number, tagIds: number[]): Promise<void> {
    await tagRepo.setPostTags(postId, tagIds);
  },
};

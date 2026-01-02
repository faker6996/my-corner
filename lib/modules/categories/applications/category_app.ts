import { categoryRepo } from "../repositories/category_repo";
import { Category } from "@/lib/models/category";
import { ApiError } from "@/lib/utils/error";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const categoryApp = {
  async getAll(): Promise<Category[]> {
    return categoryRepo.findAll();
  },

  async getById(id: number): Promise<Category> {
    const category = await categoryRepo.findById(id);
    if (!category) throw new ApiError("Category not found", 404);
    return category;
  },

  async getBySlug(slug: string): Promise<Category> {
    const category = await categoryRepo.findBySlug(slug);
    if (!category) throw new ApiError("Category not found", 404);
    return category;
  },

  async create(data: { name: string; description?: string; icon?: string; color?: string; parent_id?: number }): Promise<Category> {
    if (!data.name) throw new ApiError("Name is required", 400);

    const slug = generateSlug(data.name);
    const existing = await categoryRepo.findBySlug(slug);
    if (existing) throw new ApiError("Category slug already exists", 400);

    return categoryRepo.create({ ...data, slug });
  },

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new ApiError("Category not found", 404);

    if (data.name && data.name !== existing.name) {
      data.slug = generateSlug(data.name);
      const slugExists = await categoryRepo.findBySlug(data.slug);
      if (slugExists && slugExists.id !== id) throw new ApiError("Slug already exists", 400);
    }

    const updated = await categoryRepo.update(id, data);
    if (!updated) throw new ApiError("Failed to update", 500);
    return updated;
  },

  async delete(id: number): Promise<void> {
    const existing = await categoryRepo.findById(id);
    if (!existing) throw new ApiError("Category not found", 404);
    await categoryRepo.delete(id);
  },
};

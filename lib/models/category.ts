// lib/models/category.ts
// Category model for blog posts

export class Category {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;

  static table = "categories";
  static columns = {
    id: "id",
    name: "name",
    slug: "slug",
    description: "description",
    icon: "icon",
    color: "color",
    parent_id: "parent_id",
    sort_order: "sort_order",
    is_active: "is_active",
    created_at: "created_at",
    updated_at: "updated_at",
  } as const;

  constructor(data: Partial<Category> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
      if (typeof data.created_at === "string") {
        this.created_at = new Date(data.created_at);
      }
      if (typeof data.updated_at === "string") {
        this.updated_at = new Date(data.updated_at);
      }
    }
  }

  getName(): string {
    return this.name || "";
  }

  getSlug(): string {
    return this.slug || "";
  }

  isActive(): boolean {
    return this.is_active !== false;
  }

  isRootCategory(): boolean {
    return !this.parent_id;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      icon: this.icon,
      color: this.color,
      parent_id: this.parent_id,
      sort_order: this.sort_order,
      is_active: this.is_active,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }
}

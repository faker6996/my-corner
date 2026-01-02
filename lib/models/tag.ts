// lib/models/tag.ts
// Tag model for blog posts

export class Tag {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  post_count?: number;
  created_at?: Date;

  static table = "tags";
  static columns = {
    id: "id",
    name: "name",
    slug: "slug",
    description: "description",
    color: "color",
    post_count: "post_count",
    created_at: "created_at",
  } as const;

  constructor(data: Partial<Tag> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
      if (typeof data.created_at === "string") {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  getName(): string {
    return this.name || "";
  }

  getSlug(): string {
    return this.slug || "";
  }

  getColor(): string {
    return this.color || "#6b7280";
  }

  getPostCount(): number {
    return this.post_count || 0;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      color: this.color,
      post_count: this.post_count,
      created_at: this.created_at?.toISOString(),
    };
  }
}

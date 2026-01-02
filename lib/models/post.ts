// lib/models/post.ts
// Post model for blog

export class Post {
  id?: number;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  author_id?: number;
  category_id?: number;
  status?: string;
  visibility?: string;
  is_featured?: boolean;
  is_pinned?: boolean;
  allow_comments?: boolean;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  reading_time_minutes?: number;
  published_at?: Date;
  scheduled_at?: Date;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean;
  metadata?: Record<string, any>;

  static table = "posts";
  static jsonbColumns = ["metadata"];
  static columns = {
    id: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    content: "content",
    thumbnail_url: "thumbnail_url",
    cover_image_url: "cover_image_url",
    author_id: "author_id",
    category_id: "category_id",
    status: "status",
    visibility: "visibility",
    is_featured: "is_featured",
    is_pinned: "is_pinned",
    allow_comments: "allow_comments",
    view_count: "view_count",
    like_count: "like_count",
    comment_count: "comment_count",
    share_count: "share_count",
    reading_time_minutes: "reading_time_minutes",
    published_at: "published_at",
    scheduled_at: "scheduled_at",
    seo_title: "seo_title",
    seo_description: "seo_description",
    seo_keywords: "seo_keywords",
    created_at: "created_at",
    updated_at: "updated_at",
    is_deleted: "is_deleted",
    metadata: "metadata",
  } as const;

  constructor(data: Partial<Post> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
      if (typeof data.created_at === "string") this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === "string") this.updated_at = new Date(data.updated_at);
      if (typeof data.published_at === "string") this.published_at = new Date(data.published_at);
      if (typeof data.scheduled_at === "string") this.scheduled_at = new Date(data.scheduled_at);
      if (typeof data.metadata === "string") {
        try {
          this.metadata = JSON.parse(data.metadata);
        } catch {
          this.metadata = {};
        }
      }
    }
  }

  getTitle(): string {
    return this.title || "";
  }
  getSlug(): string {
    return this.slug || "";
  }
  getExcerpt(): string {
    return this.excerpt || "";
  }
  getContent(): string {
    return this.content || "";
  }

  isPublished(): boolean {
    return this.status === "published";
  }
  isDraft(): boolean {
    return this.status === "draft";
  }
  isScheduled(): boolean {
    return this.status === "scheduled";
  }
  isArchived(): boolean {
    return this.status === "archived";
  }

  isFeatured(): boolean {
    return this.is_featured === true;
  }
  isPinned(): boolean {
    return this.is_pinned === true;
  }
  isDeleted(): boolean {
    return this.is_deleted === true;
  }

  isPublic(): boolean {
    return this.visibility === "public";
  }
  isPrivate(): boolean {
    return this.visibility === "private";
  }

  getViewCount(): number {
    return this.view_count || 0;
  }
  getLikeCount(): number {
    return this.like_count || 0;
  }
  getCommentCount(): number {
    return this.comment_count || 0;
  }
  getReadingTime(): number {
    return this.reading_time_minutes || 0;
  }

  toJSON(): any {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      excerpt: this.excerpt,
      content: this.content,
      thumbnail_url: this.thumbnail_url,
      cover_image_url: this.cover_image_url,
      author_id: this.author_id,
      category_id: this.category_id,
      status: this.status,
      visibility: this.visibility,
      is_featured: this.is_featured,
      is_pinned: this.is_pinned,
      allow_comments: this.allow_comments,
      view_count: this.view_count,
      like_count: this.like_count,
      comment_count: this.comment_count,
      share_count: this.share_count,
      reading_time_minutes: this.reading_time_minutes,
      published_at: this.published_at?.toISOString(),
      scheduled_at: this.scheduled_at?.toISOString(),
      seo_title: this.seo_title,
      seo_description: this.seo_description,
      seo_keywords: this.seo_keywords,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
      is_deleted: this.is_deleted,
      metadata: this.metadata,
    };
  }
}

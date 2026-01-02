import { postRepo } from "../repositories/post_repo";
import { Post } from "@/lib/models/post";
import { ApiError } from "@/lib/utils/error";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Calculate reading time (words per minute)
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content
    .replace(/<[^>]*>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export const postApp = {
  /**
   * Get posts with pagination and filters
   */
  async getPosts(params: { page?: number; pageSize?: number; status?: string; categoryId?: number; authorId?: number; search?: string }) {
    return postRepo.findAll(params);
  },

  /**
   * Get post by ID
   */
  async getPostById(id: number, incrementView: boolean = false): Promise<Post> {
    const post = await postRepo.findById(id);
    if (!post) {
      throw new ApiError("Post not found", 404);
    }
    if (incrementView) {
      await postRepo.incrementViewCount(id);
    }
    return post;
  },

  /**
   * Get post by slug
   */
  async getPostBySlug(slug: string, incrementView: boolean = true): Promise<Post> {
    const post = await postRepo.findBySlug(slug);
    if (!post) {
      throw new ApiError("Post not found", 404);
    }
    if (incrementView && post.id) {
      await postRepo.incrementViewCount(post.id);
    }
    return post;
  },

  /**
   * Create new post
   */
  async createPost(data: {
    title: string;
    content: string;
    author_id: number;
    excerpt?: string;
    slug?: string;
    category_id?: number;
    status?: string;
    visibility?: string;
    is_featured?: boolean;
    is_pinned?: boolean;
    thumbnail_url?: string;
    cover_image_url?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
  }): Promise<Post> {
    if (!data.title || !data.content) {
      throw new ApiError("Title and content are required", 400);
    }

    // Generate slug if not provided
    let slug = data.slug || generateSlug(data.title);

    // Check slug uniqueness
    const existing = await postRepo.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(data.content);

    // Auto-set published_at if status is published
    const publishedAt = data.status === "published" ? new Date() : null;

    return postRepo.create({
      ...data,
      slug,
      reading_time_minutes: readingTime,
      published_at: publishedAt as any,
    });
  },

  /**
   * Update post
   */
  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    const existing = await postRepo.findById(id);
    if (!existing) {
      throw new ApiError("Post not found", 404);
    }

    // Recalculate reading time if content changed
    if (data.content) {
      data.reading_time_minutes = calculateReadingTime(data.content);
    }

    // Auto-set published_at if status changed to published
    if (data.status === "published" && existing.status !== "published") {
      data.published_at = new Date() as any;
    }

    // Validate slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await postRepo.findBySlug(data.slug);
      if (slugExists) {
        throw new ApiError("Slug already exists", 400);
      }
    }

    const updated = await postRepo.update(id, data);
    if (!updated) {
      throw new ApiError("Failed to update post", 500);
    }
    return updated;
  },

  /**
   * Delete post (soft delete)
   */
  async deletePost(id: number): Promise<void> {
    const existing = await postRepo.findById(id);
    if (!existing) {
      throw new ApiError("Post not found", 404);
    }
    await postRepo.delete(id);
  },

  /**
   * Get featured posts
   */
  async getFeaturedPosts(limit: number = 5): Promise<Post[]> {
    return postRepo.getFeatured(limit);
  },

  /**
   * Get recent posts
   */
  async getRecentPosts(limit: number = 10): Promise<Post[]> {
    return postRepo.getRecent(limit);
  },
};

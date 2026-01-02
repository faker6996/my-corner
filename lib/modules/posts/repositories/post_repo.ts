import { query } from "@/lib/db";
import { Post } from "@/lib/models/post";

export const postRepo = {
  /**
   * Get all posts with pagination
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    categoryId?: number;
    authorId?: number;
    search?: string;
    orderBy?: string;
    orderDir?: "ASC" | "DESC";
  }): Promise<{ data: Post[]; total: number }> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    let whereClauses: string[] = ["is_deleted = FALSE"];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (params.status) {
      whereClauses.push(`status = $${paramIndex++}`);
      queryParams.push(params.status);
    }

    if (params.categoryId) {
      whereClauses.push(`category_id = $${paramIndex++}`);
      queryParams.push(params.categoryId);
    }

    if (params.authorId) {
      whereClauses.push(`author_id = $${paramIndex++}`);
      queryParams.push(params.authorId);
    }

    if (params.search) {
      whereClauses.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const orderBy = params.orderBy || "created_at";
    const orderDir = params.orderDir || "DESC";

    // Count total
    const countSQL = `SELECT COUNT(*) as total FROM posts ${whereSQL}`;
    const countResult = await query(countSQL, queryParams);
    const total = parseInt((countResult.rows || countResult)[0]?.total || "0", 10);

    // Get data
    const dataSQL = `
      SELECT * FROM posts 
      ${whereSQL}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataResult = await query(dataSQL, [...queryParams, pageSize, offset]);
    const rows = dataResult.rows || dataResult;

    return {
      data: rows.map((row: any) => new Post(row)),
      total,
    };
  },

  /**
   * Find post by ID
   */
  async findById(id: number): Promise<Post | null> {
    const sql = `SELECT * FROM posts WHERE id = $1 AND is_deleted = FALSE`;
    const result = await query(sql, [id]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Post(rows[0]) : null;
  },

  /**
   * Find post by slug
   */
  async findBySlug(slug: string): Promise<Post | null> {
    const sql = `SELECT * FROM posts WHERE slug = $1 AND is_deleted = FALSE`;
    const result = await query(sql, [slug]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Post(rows[0]) : null;
  },

  /**
   * Create new post
   */
  async create(data: Partial<Post>): Promise<Post> {
    const sql = `
      INSERT INTO posts (
        title, slug, excerpt, content, thumbnail_url, cover_image_url,
        author_id, category_id, status, visibility, is_featured, is_pinned,
        allow_comments, reading_time_minutes, seo_title, seo_description,
        seo_keywords, published_at, scheduled_at, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *
    `;
    const params = [
      data.title,
      data.slug,
      data.excerpt || null,
      data.content,
      data.thumbnail_url || null,
      data.cover_image_url || null,
      data.author_id,
      data.category_id || null,
      data.status || "draft",
      data.visibility || "public",
      data.is_featured || false,
      data.is_pinned || false,
      data.allow_comments !== false,
      data.reading_time_minutes || 0,
      data.seo_title || null,
      data.seo_description || null,
      data.seo_keywords || null,
      data.published_at || null,
      data.scheduled_at || null,
      JSON.stringify(data.metadata || {}),
    ];
    const result = await query(sql, params);
    const rows = result.rows || result;
    return new Post(rows[0]);
  },

  /**
   * Update post
   */
  async update(id: number, data: Partial<Post>): Promise<Post | null> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields = [
      "title",
      "slug",
      "excerpt",
      "content",
      "thumbnail_url",
      "cover_image_url",
      "category_id",
      "status",
      "visibility",
      "is_featured",
      "is_pinned",
      "allow_comments",
      "reading_time_minutes",
      "seo_title",
      "seo_description",
      "seo_keywords",
      "published_at",
      "scheduled_at",
    ];

    for (const field of fields) {
      if ((data as any)[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        params.push((data as any)[field]);
      }
    }

    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      params.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `UPDATE posts SET ${setClauses.join(", ")} WHERE id = $${paramIndex} AND is_deleted = FALSE RETURNING *`;
    const result = await query(sql, params);
    const rows = result.rows || result;
    return rows.length > 0 ? new Post(rows[0]) : null;
  },

  /**
   * Soft delete post
   */
  async delete(id: number): Promise<boolean> {
    const sql = `UPDATE posts SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount || 0) > 0;
  },

  /**
   * Increment view count
   */
  async incrementViewCount(id: number): Promise<void> {
    const sql = `UPDATE posts SET view_count = view_count + 1 WHERE id = $1`;
    await query(sql, [id]);
  },

  /**
   * Get featured posts
   */
  async getFeatured(limit: number = 5): Promise<Post[]> {
    const sql = `
      SELECT * FROM posts 
      WHERE is_featured = TRUE AND status = 'published' AND is_deleted = FALSE
      ORDER BY published_at DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    const rows = result.rows || result;
    return rows.map((row: any) => new Post(row));
  },

  /**
   * Get recent posts
   */
  async getRecent(limit: number = 10): Promise<Post[]> {
    const sql = `
      SELECT * FROM posts 
      WHERE status = 'published' AND is_deleted = FALSE
      ORDER BY published_at DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    const rows = result.rows || result;
    return rows.map((row: any) => new Post(row));
  },
};

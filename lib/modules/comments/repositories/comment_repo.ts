import { query } from "@/lib/db";
import { Comment } from "@/lib/models/comment";

export const commentRepo = {
  async findByPostId(postId: number, approved: boolean = true): Promise<Comment[]> {
    const whereClause = approved ? "AND is_approved = TRUE AND is_deleted = FALSE" : "AND is_deleted = FALSE";
    const sql = `SELECT * FROM comments WHERE post_id = $1 ${whereClause} ORDER BY created_at ASC`;
    const result = await query(sql, [postId]);
    const rows = result.rows || result;
    return rows.map((row: any) => new Comment(row));
  },

  async findById(id: number): Promise<Comment | null> {
    const sql = `SELECT * FROM comments WHERE id = $1`;
    const result = await query(sql, [id]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Comment(rows[0]) : null;
  },

  async create(data: Partial<Comment>): Promise<Comment> {
    const sql = `
      INSERT INTO comments (post_id, user_id, parent_id, author_name, author_email, author_url, content, is_approved, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [
      data.post_id,
      data.user_id || null,
      data.parent_id || null,
      data.author_name || null,
      data.author_email || null,
      data.author_url || null,
      data.content,
      data.is_approved !== false,
      data.ip_address || null,
      data.user_agent || null,
    ];
    const result = await query(sql, params);
    const rows = result.rows || result;

    // Update post comment_count
    await query(`UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`, [data.post_id]);

    return new Comment(rows[0]);
  },

  async update(id: number, data: Partial<Comment>): Promise<Comment | null> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const field of ["content", "is_approved", "is_spam", "is_deleted"]) {
      if ((data as any)[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        params.push((data as any)[field]);
      }
    }
    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `UPDATE comments SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    const rows = result.rows || result;
    return rows.length > 0 ? new Comment(rows[0]) : null;
  },

  async delete(id: number): Promise<boolean> {
    const comment = await this.findById(id);
    if (comment) {
      await query(`UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1`, [comment.post_id]);
    }
    const sql = `UPDATE comments SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount || 0) > 0;
  },
};

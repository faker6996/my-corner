import { query } from "@/lib/db";
import { Tag } from "@/lib/models/tag";

export const tagRepo = {
  async findAll(): Promise<Tag[]> {
    const sql = `SELECT * FROM tags ORDER BY name ASC`;
    const result = await query(sql, []);
    const rows = result.rows || result;
    return rows.map((row: any) => new Tag(row));
  },

  async findById(id: number): Promise<Tag | null> {
    const sql = `SELECT * FROM tags WHERE id = $1`;
    const result = await query(sql, [id]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Tag(rows[0]) : null;
  },

  async findBySlug(slug: string): Promise<Tag | null> {
    const sql = `SELECT * FROM tags WHERE slug = $1`;
    const result = await query(sql, [slug]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Tag(rows[0]) : null;
  },

  async create(data: Partial<Tag>): Promise<Tag> {
    const sql = `INSERT INTO tags (name, slug, description, color) VALUES ($1, $2, $3, $4) RETURNING *`;
    const params = [data.name, data.slug, data.description || null, data.color || null];
    const result = await query(sql, params);
    const rows = result.rows || result;
    return new Tag(rows[0]);
  },

  async update(id: number, data: Partial<Tag>): Promise<Tag | null> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const field of ["name", "slug", "description", "color"]) {
      if ((data as any)[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        params.push((data as any)[field]);
      }
    }
    if (setClauses.length === 0) return null;

    params.push(id);
    const sql = `UPDATE tags SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    const rows = result.rows || result;
    return rows.length > 0 ? new Tag(rows[0]) : null;
  },

  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM tags WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount || 0) > 0;
  },

  async getTagsByPostId(postId: number): Promise<Tag[]> {
    const sql = `
      SELECT t.* FROM tags t
      JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = $1
      ORDER BY t.name
    `;
    const result = await query(sql, [postId]);
    const rows = result.rows || result;
    return rows.map((row: any) => new Tag(row));
  },

  async setPostTags(postId: number, tagIds: number[]): Promise<void> {
    await query(`DELETE FROM post_tags WHERE post_id = $1`, [postId]);
    for (const tagId of tagIds) {
      await query(`INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [postId, tagId]);
    }
  },
};

import { query } from "@/lib/db";
import { Category } from "@/lib/models/category";

export const categoryRepo = {
  async findAll(includeInactive: boolean = false): Promise<Category[]> {
    const whereClause = includeInactive ? "" : "WHERE is_active = TRUE";
    const sql = `SELECT * FROM categories ${whereClause} ORDER BY sort_order ASC, name ASC`;
    const result = await query(sql, []);
    const rows = result.rows || result;
    return rows.map((row: any) => new Category(row));
  },

  async findById(id: number): Promise<Category | null> {
    const sql = `SELECT * FROM categories WHERE id = $1`;
    const result = await query(sql, [id]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Category(rows[0]) : null;
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const sql = `SELECT * FROM categories WHERE slug = $1`;
    const result = await query(sql, [slug]);
    const rows = result.rows || result;
    return rows.length > 0 ? new Category(rows[0]) : null;
  },

  async create(data: Partial<Category>): Promise<Category> {
    const sql = `
      INSERT INTO categories (name, slug, description, icon, color, parent_id, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      data.name,
      data.slug,
      data.description || null,
      data.icon || null,
      data.color || null,
      data.parent_id || null,
      data.sort_order || 0,
      data.is_active !== false,
    ];
    const result = await query(sql, params);
    const rows = result.rows || result;
    return new Category(rows[0]);
  },

  async update(id: number, data: Partial<Category>): Promise<Category | null> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields = ["name", "slug", "description", "icon", "color", "parent_id", "sort_order", "is_active"];
    for (const field of fields) {
      if ((data as any)[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        params.push((data as any)[field]);
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `UPDATE categories SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);
    const rows = result.rows || result;
    return rows.length > 0 ? new Category(rows[0]) : null;
  },

  async delete(id: number): Promise<boolean> {
    const sql = `DELETE FROM categories WHERE id = $1`;
    const result = await query(sql, [id]);
    return (result.rowCount || 0) > 0;
  },
};

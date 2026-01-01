import { safeQuery } from "@/lib/modules/common/safe_query";
import { Role } from "@/lib/models/role";

export const roleRepo = {
  /**
   * Lấy role theo code
   */
  async getRoleByCode(code: string): Promise<Role | null> {
    const sql = `SELECT * FROM ${Role.table} WHERE code = $1 AND is_active = TRUE`;
    const result = await safeQuery(sql, [code]);
    return result.rows[0] ? new Role(result.rows[0]) : null;
  },

  /**
   * Lấy tất cả roles (có thể filter)
   */
  async getAllRoles(options?: { includeInactive?: boolean; includeSystem?: boolean }): Promise<Role[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (!options?.includeInactive) {
      conditions.push(`is_active = TRUE`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT * FROM ${Role.table}
      ${whereClause}
      ORDER BY level ASC, name ASC
    `;

    const result = await safeQuery(sql, params);
    return result.rows.map((row) => new Role(row));
  },

  /**
   * Lấy roles của user
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    const sql = `
      SELECT r.*
      FROM ${Role.table} r
      JOIN user_role_assignments ura ON ura.role_id = r.id
      WHERE ura.user_id = $1 AND r.is_active = TRUE
      ORDER BY r.level ASC
    `;

    const result = await safeQuery(sql, [userId]);
    return result.rows.map((row) => new Role(row));
  },

  /**
   * Lấy role với số lượng users
   */
  async getRolesWithUserCount(): Promise<any[]> {
    const sql = `
      SELECT 
        r.*,
        COUNT(ura.user_id)::int as user_count
      FROM ${Role.table} r
      LEFT JOIN user_role_assignments ura ON ura.role_id = r.id
      WHERE r.is_active = TRUE
      GROUP BY r.id
      ORDER BY r.level ASC, r.name ASC
    `;

    const result = await safeQuery(sql);
    return result.rows.map((row) => ({
      ...new Role(row),
      user_count: row.user_count,
    }));
  },

  /**
   * Check xem role có users không (để validate trước khi delete)
   */
  async hasUsers(roleId: number): Promise<boolean> {
    const sql = `
      SELECT EXISTS(
        SELECT 1 FROM user_role_assignments
        WHERE role_id = $1
      ) as has_users
    `;

    const result = await safeQuery(sql, [roleId]);
    return result.rows[0]?.has_users || false;
  },

  /**
   * Tìm kiếm roles
   */
  async searchRoles(query: string): Promise<Role[]> {
    const searchPattern = `%${query}%`;
    const sql = `
      SELECT * FROM ${Role.table}
      WHERE is_active = TRUE
        AND (
          LOWER(name) LIKE LOWER($1) 
          OR LOWER(code) LIKE LOWER($2)
          OR LOWER(description) LIKE LOWER($3)
        )
      ORDER BY level ASC, name ASC
      LIMIT 20
    `;

    const result = await safeQuery(sql, [searchPattern, searchPattern, searchPattern]);
    return result.rows.map((row) => new Role(row));
  },

  /**
   * Assign role to user (insert into user_role_assignments)
   * Will not insert if assignment already exists
   */
  async assignRoleToUser(userId: number, roleCode: string, assignedBy?: number): Promise<boolean> {
    // Get role id by code
    const role = await this.getRoleByCode(roleCode);
    if (!role) {
      return false;
    }

    // Check if assignment already exists
    const checkSql = `
      SELECT EXISTS(
        SELECT 1 FROM user_role_assignments
        WHERE user_id = $1 AND role_id = $2
      ) as exists
    `;
    const checkResult = await safeQuery(checkSql, [userId, role.id]);
    if (checkResult.rows[0]?.exists) {
      return true; // Already assigned
    }

    // Insert assignment
    const insertSql = `
      INSERT INTO user_role_assignments (user_id, role_id, assigned_at, assigned_by)
      VALUES ($1, $2, NOW(), $3)
    `;
    await safeQuery(insertSql, [userId, role.id, assignedBy || null]);
    return true;
  },

  /**
   * Remove all role assignments for a user
   */
  async removeAllUserRoles(userId: number): Promise<void> {
    const sql = `DELETE FROM user_role_assignments WHERE user_id = $1`;
    await safeQuery(sql, [userId]);
  },

  /**
   * Sync user's role (remove old, add new)
   */
  async syncUserRole(userId: number, roleCode: string, assignedBy?: number): Promise<boolean> {
    await this.removeAllUserRoles(userId);
    return await this.assignRoleToUser(userId, roleCode, assignedBy);
  },
};

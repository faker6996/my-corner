import { safeQuery } from "@/lib/modules/common/safe_query";
import { Permission } from "@/lib/models/permission";

export const permissionRepo = {
  /**
   * Lấy tất cả permissions của user (qua roles)
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const sql = `
      SELECT DISTINCT p.code
      FROM permissions p
      WHERE
        (
          -- Grant thông qua roles
          EXISTS (
            SELECT 1
            FROM role_permissions rp
            JOIN user_role_assignments ura ON ura.role_id = rp.role_id
            WHERE rp.permission_id = p.id
              AND rp.is_granted = TRUE
              AND ura.user_id = $1
          )
          OR
          -- Grant trực tiếp cho user
          EXISTS (
            SELECT 1
            FROM user_permissions up_grant
            WHERE up_grant.permission_id = p.id
              AND up_grant.user_id = $1
              AND up_grant.is_granted = TRUE
          )
        )
        AND NOT EXISTS (
          -- Explicit deny trên user sẽ luôn ưu tiên
          SELECT 1
          FROM user_permissions up_deny
          WHERE up_deny.permission_id = p.id
            AND up_deny.user_id = $1
            AND up_deny.is_granted = FALSE
        )
      ORDER BY p.code
    `;

    const result = await safeQuery(sql, [userId]);
    return result.rows.map((row) => row.code);
  },

  /**
   * Kiểm tra user có permission không
   */
  async checkUserPermission(userId: number, permissionCode: string): Promise<boolean> {
    const sql = `
      SELECT (
        -- Không bị explicit deny trên user
        NOT EXISTS (
          SELECT 1
          FROM permissions p_deny
          JOIN user_permissions up_deny ON up_deny.permission_id = p_deny.id
          WHERE up_deny.user_id = $1
            AND p_deny.code = $2
            AND up_deny.is_granted = FALSE
        )
        AND
        (
          -- Quyền từ roles
          EXISTS (
            SELECT 1
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id AND rp.is_granted = TRUE
            JOIN user_role_assignments ura ON ura.role_id = rp.role_id
            WHERE ura.user_id = $1 AND p.code = $2
          )
          OR
          -- Quyền gán trực tiếp cho user (grant)
          EXISTS (
            SELECT 1
            FROM permissions p2
            JOIN user_permissions up_grant ON up_grant.permission_id = p2.id AND up_grant.is_granted = TRUE
            WHERE up_grant.user_id = $1 AND p2.code = $2
          )
        )
      ) as has_permission
    `;

    const result = await safeQuery(sql, [userId, permissionCode]);
    return result.rows[0]?.has_permission || false;
  },

  /**
   * Lấy tất cả permissions theo resource type
   */
  async getPermissionsByResourceType(resourceType: string): Promise<Permission[]> {
    const sql = `
      SELECT * FROM ${Permission.table}
      WHERE resource_type = $1
      ORDER BY code ASC
    `;

    const result = await safeQuery(sql, [resourceType]);
    return result.rows.map((row) => new Permission(row));
  },

  /**
   * Lấy permissions của một role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const sql = `
      SELECT p.*
      FROM ${Permission.table} p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = $1 AND rp.is_granted = TRUE
      ORDER BY p.code ASC
    `;

    const result = await safeQuery(sql, [roleId]);
    return result.rows.map((row) => new Permission(row));
  },

  /**
   * Lấy permissions với thông tin grant status cho một role
   */
  async getPermissionsWithGrantStatus(roleId: number): Promise<any[]> {
    const sql = `
      SELECT 
        p.*,
        COALESCE(rp.is_granted, FALSE) as is_granted
      FROM ${Permission.table} p
      LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = $1
      ORDER BY p.resource_type, p.code
    `;

    const result = await safeQuery(sql, [roleId]);
    return result.rows;
  },

  /**
   * Lấy permissions theo menu code
   */
  async getMenuPermissions(menuCode: string): Promise<Permission[]> {
    const sql = `
      SELECT p.*
      FROM ${Permission.table} p
      JOIN menus m ON m.id = p.resource_id AND p.resource_type = 'menu'
      WHERE m.code = $1
      ORDER BY p.code ASC
    `;

    const result = await safeQuery(sql, [menuCode]);
    return result.rows.map((row) => new Permission(row));
  },

  /**
   * Lấy actions user có thể thực hiện trên một menu
   */
  async getUserMenuActions(userId: number, menuCode: string): Promise<string[]> {
    const sql = `
      SELECT DISTINCT a.code
      FROM actions a
      JOIN permissions p ON p.action_id = a.id
      JOIN menus m ON m.id = p.resource_id AND p.resource_type = 'menu'
      WHERE
        m.code = $2
        AND (
          -- Grant từ roles
          EXISTS (
            SELECT 1
            FROM role_permissions rp
            JOIN user_role_assignments ura ON ura.role_id = rp.role_id
            WHERE rp.permission_id = p.id
              AND rp.is_granted = TRUE
              AND ura.user_id = $1
          )
          OR
          -- Grant trực tiếp cho user
          EXISTS (
            SELECT 1
            FROM user_permissions up_grant
            WHERE up_grant.permission_id = p.id
              AND up_grant.user_id = $1
              AND up_grant.is_granted = TRUE
          )
        )
        AND NOT EXISTS (
          -- Explicit deny trên user sẽ loại bỏ action này
          SELECT 1
          FROM user_permissions up_deny
          WHERE up_deny.permission_id = p.id
            AND up_deny.user_id = $1
            AND up_deny.is_granted = FALSE
        )
      ORDER BY a.code
    `;

    const result = await safeQuery(sql, [userId, menuCode]);
    return result.rows.map((row) => row.code);
  },

  /**
   * Tìm permission theo code
   */
  async getPermissionByCode(code: string): Promise<Permission | null> {
    const sql = `SELECT * FROM ${Permission.table} WHERE code = $1`;
    const result = await safeQuery(sql, [code]);
    return result.rows[0] ? new Permission(result.rows[0]) : null;
  },

  /**
   * Tìm kiếm permissions
   */
  async searchPermissions(query: string, resourceType?: string): Promise<Permission[]> {
    const searchPattern = `%${query}%`;
    const params: any[] = [searchPattern, searchPattern];
    const conditions = [`(LOWER(code) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($2))`];

    if (resourceType) {
      params.push(resourceType);
      conditions.push(`resource_type = $${params.length}`);
    }

    const sql = `
      SELECT * FROM ${Permission.table}
      WHERE ${conditions.join(" AND ")}
      ORDER BY resource_type, code ASC
      LIMIT 50
    `;

    const result = await safeQuery(sql, params);
    return result.rows.map((row) => new Permission(row));
  },
};

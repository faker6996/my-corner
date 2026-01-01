import { safeQuery } from "@/lib/modules/common/safe_query";
import { Menu } from "@/lib/models/menu";
import { MenuTreeNode } from "@/lib/models/rbac-types";

export const menuRepo = {
  /**
   * Lấy tất cả menus active
   */
  async getAllMenus(): Promise<Menu[]> {
    const sql = `
      SELECT * FROM ${Menu.table}
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `;

    const result = await safeQuery(sql);
    return result.rows.map((row) => new Menu(row));
  },

  /**
   * Lấy menu theo code
   */
  async getMenuByCode(code: string): Promise<Menu | null> {
    const sql = `SELECT * FROM ${Menu.table} WHERE code = $1 AND is_active = TRUE`;
    const result = await safeQuery(sql, [code]);
    return result.rows[0] ? new Menu(result.rows[0]) : null;
  },

  /**
   * Lấy menus mà user có quyền view
   */
  async getUserMenus(userId: number): Promise<Menu[]> {
    const sql = `
      SELECT DISTINCT m.*
      FROM ${Menu.table} m
      JOIN permissions p ON p.resource_type = 'menu' AND p.resource_id = m.id
      JOIN actions a ON a.id = p.action_id
      WHERE
        m.is_active = TRUE
        AND a.code = 'view'
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
          -- Explicit deny trên user
          SELECT 1
          FROM user_permissions up_deny
          WHERE up_deny.permission_id = p.id
            AND up_deny.user_id = $1
            AND up_deny.is_granted = FALSE
        )
      ORDER BY m.sort_order ASC, m.name ASC
    `;

    const result = await safeQuery(sql, [userId]);
    return result.rows.map((row) => new Menu(row));
  },

  /**
   * Lấy menu tree với permissions của user
   */
  async getUserMenuTree(userId: number, locale?: string): Promise<MenuTreeNode[]> {
    const hasLocale = !!locale;
    const sql = hasLocale
      ? `
      WITH user_permission_ids AS (
        SELECT DISTINCT p.id AS permission_id
        FROM permissions p
        WHERE
          (
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
            -- Explicit deny trên user
            SELECT 1
            FROM user_permissions up_deny
            WHERE up_deny.permission_id = p.id
              AND up_deny.user_id = $1
              AND up_deny.is_granted = FALSE
          )
      )
      SELECT
        m.id,
        m.code,
        COALESCE(mt.name, m.name) as name,
        m.path,
        m.icon,
        m.parent_id,
        m.sort_order,
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'code', a.code,
            'name', COALESCE(at.name, a.name),
            'hasPermission', TRUE
          )
        ) FILTER (WHERE a.id IS NOT NULL) as actions
      FROM ${Menu.table} m
      JOIN permissions p ON p.resource_type = 'menu' AND p.resource_id = m.id
      JOIN user_permission_ids up_ids ON up_ids.permission_id = p.id
      LEFT JOIN actions a ON a.id = p.action_id
      LEFT JOIN menu_translations mt ON mt.menu_id = m.id AND mt.locale = $2
      LEFT JOIN action_translations at ON at.action_id = a.id AND at.locale = $2
      WHERE m.is_active = TRUE
      GROUP BY m.id, m.code, m.name, m.path, m.icon, m.parent_id, m.sort_order, mt.name
      ORDER BY m.sort_order ASC
    `
      : `
      WITH user_permission_ids AS (
        SELECT DISTINCT p.id AS permission_id
        FROM permissions p
        WHERE
          (
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
            -- Explicit deny trên user
            SELECT 1
            FROM user_permissions up_deny
            WHERE up_deny.permission_id = p.id
              AND up_deny.user_id = $1
              AND up_deny.is_granted = FALSE
          )
      )
      SELECT
        m.id,
        m.code,
        m.name,
        m.path,
        m.icon,
        m.parent_id,
        m.sort_order,
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'code', a.code,
            'name', a.name,
            'hasPermission', TRUE
          )
        ) FILTER (WHERE a.id IS NOT NULL) as actions
      FROM ${Menu.table} m
      JOIN permissions p ON p.resource_type = 'menu' AND p.resource_id = m.id
      JOIN user_permission_ids up_ids ON up_ids.permission_id = p.id
      LEFT JOIN actions a ON a.id = p.action_id
      WHERE m.is_active = TRUE
      GROUP BY m.id, m.code, m.name, m.path, m.icon, m.parent_id, m.sort_order
      ORDER BY m.sort_order ASC
    `;

    const params: any[] = [userId];
    if (hasLocale) params.push(locale);

    const result = await safeQuery(sql, params);

    // Build tree structure
    const menuMap = new Map<number, MenuTreeNode>();
    const rootMenus: MenuTreeNode[] = [];

    result.rows.forEach((row) => {
      const node: MenuTreeNode = {
        id: row.id,
        code: row.code,
        name: row.name,
        path: row.path,
        icon: row.icon,
        sort_order: row.sort_order,
        parent_id: row.parent_id,
        actions: row.actions || [],
        children: [],
      };
      menuMap.set(row.id, node);
    });

    // Link parent-child
    menuMap.forEach((node) => {
      if (node.parent_id) {
        const parent = menuMap.get(node.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootMenus.push(node);
      }
    });

    return rootMenus;
  },

  /**
   * Lấy all menu tree (for admin)
   */
  async getMenuTree(locale?: string): Promise<MenuTreeNode[]> {
    const hasLocale = !!locale;
    const sql = hasLocale
      ? `
      SELECT DISTINCT
        m.id,
        m.code,
        COALESCE(mt.name, m.name) as name,
        m.path,
        m.icon,
        m.parent_id,
        m.sort_order
      FROM ${Menu.table} m
      LEFT JOIN menu_translations mt ON mt.menu_id = m.id AND mt.locale = $1
      WHERE m.is_active = TRUE
      ORDER BY m.sort_order ASC
    `
      : `
      SELECT DISTINCT
        m.id,
        m.code,
        m.name,
        m.path,
        m.icon,
        m.parent_id,
        m.sort_order
      FROM ${Menu.table} m
      WHERE m.is_active = TRUE
      ORDER BY m.sort_order ASC
    `;

    const params: any[] = [];
    if (hasLocale) params.push(locale);

    const result = await safeQuery(sql, params);

    // Build tree structure
    const menuMap = new Map<number, MenuTreeNode>();
    const rootMenus: MenuTreeNode[] = [];

    result.rows.forEach((row) => {
      const node: MenuTreeNode = {
        id: row.id,
        code: row.code,
        name: row.name,
        path: row.path,
        icon: row.icon,
        sort_order: row.sort_order,
        parent_id: row.parent_id,
        actions: [],
        children: [],
      };
      menuMap.set(row.id, node);
    });

    // Link parent-child
    menuMap.forEach((node) => {
      if (node.parent_id) {
        const parent = menuMap.get(node.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootMenus.push(node);
      }
    });

    return rootMenus;
  },

  /**
   * Lấy root menus (parent_id IS NULL)
   */
  async getRootMenus(): Promise<Menu[]> {
    const sql = `
      SELECT * FROM ${Menu.table}
      WHERE parent_id IS NULL AND is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `;

    const result = await safeQuery(sql);
    return result.rows.map((row) => new Menu(row));
  },

  /**
   * Lấy submenus của một menu
   */
  async getSubMenus(parentId: number): Promise<Menu[]> {
    const sql = `
      SELECT * FROM ${Menu.table}
      WHERE parent_id = $1 AND is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `;

    const result = await safeQuery(sql, [parentId]);
    return result.rows.map((row) => new Menu(row));
  },

  /**
   * Lấy menu với actions
   */
  async getMenuWithActions(menuCode: string): Promise<any | null> {
    const sql = `
      SELECT 
        m.*,
        jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'code', a.code,
            'name', a.name,
            'category', a.category,
            'display_name', ma.display_name
          )
        ) FILTER (WHERE a.id IS NOT NULL) as actions
      FROM ${Menu.table} m
      LEFT JOIN menu_actions ma ON ma.menu_id = m.id
      LEFT JOIN actions a ON a.id = ma.action_id
      WHERE m.code = $1 AND m.is_active = TRUE
      GROUP BY m.id
    `;

    const result = await safeQuery(sql, [menuCode]);
    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      ...new Menu(row),
      actions: row.actions || [],
    };
  },

  /**
   * Tìm kiếm menus
   */
  async searchMenus(query: string): Promise<Menu[]> {
    const searchPattern = `%${query}%`;
    const sql = `
      SELECT * FROM ${Menu.table}
      WHERE is_active = TRUE
        AND (
          LOWER(name) LIKE LOWER($1)
          OR LOWER(code) LIKE LOWER($2)
          OR LOWER(path) LIKE LOWER($3)
        )
      ORDER BY sort_order ASC, name ASC
      LIMIT 20
    `;

    const result = await safeQuery(sql, [searchPattern, searchPattern, searchPattern]);
    return result.rows.map((row) => new Menu(row));
  },

  /**
   * Lấy actions cho menu (for permissions management)
   */
  async getMenuActions(menuId: number, locale?: string): Promise<any[]> {
    const hasLocale = !!locale;
    const sql = hasLocale
      ? `
      SELECT 
        ma.id,
        ma.menu_id,
        ma.action_id,
        m.code as menu_code,
        COALESCE(mt.name, m.name) as menu_name,
        a.code as action_code,
        COALESCE(at.name, a.name) as action_name,
        p.id as permission_id,
        p.code as permission_code
      FROM menu_actions ma
      JOIN menus m ON m.id = ma.menu_id
      LEFT JOIN menu_translations mt ON mt.menu_id = m.id AND mt.locale = $2
      JOIN actions a ON a.id = ma.action_id
      LEFT JOIN action_translations at ON at.action_id = a.id AND at.locale = $2
      LEFT JOIN permissions p ON p.resource_type = 'menu' 
        AND p.resource_id = ma.menu_id 
        AND p.action_id = ma.action_id
      WHERE ma.menu_id = $1
      ORDER BY action_name ASC
    `
      : `
      SELECT 
        ma.id,
        ma.menu_id,
        ma.action_id,
        m.code as menu_code,
        m.name as menu_name,
        a.code as action_code,
        a.name as action_name,
        p.id as permission_id,
        p.code as permission_code
      FROM menu_actions ma
      JOIN menus m ON m.id = ma.menu_id
      JOIN actions a ON a.id = ma.action_id
      LEFT JOIN permissions p ON p.resource_type = 'menu' 
        AND p.resource_id = ma.menu_id 
        AND p.action_id = ma.action_id
      WHERE ma.menu_id = $1
      ORDER BY a.name ASC
    `;

    const params: any[] = [menuId];
    if (hasLocale) params.push(locale);

    const result = await safeQuery(sql, params);
    const rows = result.rows;

    // Ensure every (menu, action) pair has a corresponding permission
    for (const row of rows) {
      if (!row.permission_id) {
        const code = `menu.${row.menu_code}.${row.action_code}`;
        const description = `${row.action_name} on ${row.menu_name}`;
        const insertSql = `
          INSERT INTO permissions (code, resource_type, resource_id, action_id, description)
          VALUES ($1, 'menu', $2, $3, $4)
          ON CONFLICT (code) DO UPDATE
          SET resource_id = EXCLUDED.resource_id,
              action_id = EXCLUDED.action_id
          RETURNING id, code
        `;
        const inserted = await safeQuery(insertSql, [code, row.menu_id, row.action_id, description]);
        const perm = inserted.rows[0];
        row.permission_id = perm.id;
        row.permission_code = perm.code;
      }
    }

    return rows;
  },
};

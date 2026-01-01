import { safeQuery } from "@/lib/modules/common/safe_query";
import { MenuTranslation, ActionTranslation } from "@/lib/models";

export const translationRepo = {
  async getMenuTranslations(menuIds: number[], locale: string): Promise<MenuTranslation[]> {
    if (!menuIds.length) return [];

    const sql = `
      SELECT * FROM ${MenuTranslation.table}
      WHERE menu_id = ANY($1::int[])
        AND locale = $2
    `;

    const result = await safeQuery(sql, [menuIds, locale]);
    return result.rows.map((row) => new MenuTranslation(row));
  },

  async getActionTranslations(actionIds: number[], locale: string): Promise<ActionTranslation[]> {
    if (!actionIds.length) return [];

    const sql = `
      SELECT * FROM ${ActionTranslation.table}
      WHERE action_id = ANY($1::int[])
        AND locale = $2
    `;

    const result = await safeQuery(sql, [actionIds, locale]);
    return result.rows.map((row) => new ActionTranslation(row));
  },
};


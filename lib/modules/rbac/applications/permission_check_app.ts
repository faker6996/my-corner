import { permissionRepo } from "../repositories/permission_repo";
import { menuRepo } from "../repositories/menu_repo";
import { roleRepo } from "../repositories/role_repo";
import { UserPermissionsResponse, UserMenusResponse, MenuActionsResponse, MenuTreeNode } from "@/lib/models/rbac-types";
import { ApiError } from "@/lib/utils/error";

/**
 * Permission Check Application
 *
 * Chỉ chứa các operations READ-ONLY để check permissions
 * Dùng cho runtime permission checking trong ứng dụng
 */
export const permissionCheckApp = {
  /**
   * Lấy tất cả permissions của user
   */
  async getUserPermissions(userId: number): Promise<UserPermissionsResponse> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    const [permissions, roles] = await Promise.all([permissionRepo.getUserPermissions(userId), roleRepo.getUserRoles(userId)]);

    return {
      user_id: userId,
      permissions,
      roles: roles.map((r) => ({
        id: r.id!,
        code: r.code!,
        name: r.name!,
      })),
    };
  },

  /**
   * Check user có permission cụ thể không
   */
  async checkPermission(userId: number, permissionCode: string): Promise<boolean> {
    if (!userId || !permissionCode) {
      return false;
    }

    return await permissionRepo.checkUserPermission(userId, permissionCode);
  },

  /**
   * Check user có bất kỳ permission nào trong danh sách không
   */
  async checkAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
    if (!userId || !permissionCodes || permissionCodes.length === 0) {
      return false;
    }

    for (const code of permissionCodes) {
      const hasPermission = await permissionRepo.checkUserPermission(userId, code);
      if (hasPermission) return true;
    }

    return false;
  },

  /**
   * Check user có tất cả permissions trong danh sách không
   */
  async checkAllPermissions(userId: number, permissionCodes: string[]): Promise<boolean> {
    if (!userId || !permissionCodes || permissionCodes.length === 0) {
      return false;
    }

    for (const code of permissionCodes) {
      const hasPermission = await permissionRepo.checkUserPermission(userId, code);
      if (!hasPermission) return false;
    }

    return true;
  },

  /**
   * Lấy danh sách menus của user (có quyền view)
   */
  async getUserMenus(userId: number, locale?: string): Promise<UserMenusResponse> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    const menus = await menuRepo.getUserMenuTree(userId, locale);

    return { menus };
  },

  /**
   * Lấy menu tree đơn giản (chỉ id, code, name, path, icon) - dùng cho sidebar
   */
  async getUserMenusSimple(userId: number, locale?: string): Promise<MenuTreeNode[]> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    return await menuRepo.getUserMenuTree(userId, locale);
  },

  /**
   * Lấy actions user có thể thực hiện trên một menu
   */
  async getUserMenuActions(userId: number, menuCode: string): Promise<MenuActionsResponse> {
    if (!userId || !menuCode) {
      throw new ApiError("User ID and menu code are required", 400);
    }

    const actions = await permissionRepo.getUserMenuActions(userId, menuCode);

    return {
      menu_code: menuCode,
      actions,
    };
  },

  /**
   * Check user có thể thực hiện action trên menu không
   */
  async checkMenuAction(userId: number, menuCode: string, actionCode: string): Promise<boolean> {
    if (!userId || !menuCode || !actionCode) {
      return false;
    }

    const permissionCode = `menu.${menuCode}.${actionCode}`;
    return await permissionRepo.checkUserPermission(userId, permissionCode);
  },

  /**
   * Lấy roles của user
   */
  async getUserRoles(userId: number) {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    return await roleRepo.getUserRoles(userId);
  },

  /**
   * Check user có role cụ thể không
   */
  async hasRole(userId: number, roleCode: string): Promise<boolean> {
    if (!userId || !roleCode) {
      return false;
    }

    const roles = await roleRepo.getUserRoles(userId);
    return roles.some((r) => r.code === roleCode);
  },

  /**
   * Check user có bất kỳ role nào trong danh sách không
   */
  async hasAnyRole(userId: number, roleCodes: string[]): Promise<boolean> {
    if (!userId || !roleCodes || roleCodes.length === 0) {
      return false;
    }

    const roles = await roleRepo.getUserRoles(userId);
    const userRoleCodes = roles.map((r) => r.code!);

    return roleCodes.some((code) => userRoleCodes.includes(code));
  },

  /**
   * Check user có tất cả roles trong danh sách không
   */
  async hasAllRoles(userId: number, roleCodes: string[]): Promise<boolean> {
    if (!userId || !roleCodes || roleCodes.length === 0) {
      return false;
    }

    const roles = await roleRepo.getUserRoles(userId);
    const userRoleCodes = roles.map((r) => r.code!);

    return roleCodes.every((code) => userRoleCodes.includes(code));
  },

};

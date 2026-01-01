import { baseRepo } from "@/lib/modules/common/base_repo";
import { roleRepo } from "../repositories/role_repo";
import { permissionRepo } from "../repositories/permission_repo";
import { menuRepo } from "../repositories/menu_repo";
import { Role, Permission, UserRoleAssignment, RolePermission } from "@/lib/models";
import {
  UserPermissionsResponse,
  UserMenusResponse,
  MenuActionsResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  GrantPermissionRequest,
} from "@/lib/models/rbac-types";
import { ApiError } from "@/lib/utils/error";

export const rbacApp = {
  // ============================================
  // Permission Operations
  // ============================================

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
   * Check user có permission không
   */
  async checkPermission(userId: number, permissionCode: string): Promise<boolean> {
    if (!userId || !permissionCode) {
      return false;
    }

    return await permissionRepo.checkUserPermission(userId, permissionCode);
  },

  /**
   * Lấy danh sách menus của user (có quyền view)
   */
  async getUserMenus(userId: number): Promise<UserMenusResponse> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    const menus = await menuRepo.getUserMenuTree(userId);

    return { menus };
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

  // ============================================
  // Role Operations
  // ============================================

  /**
   * Tạo role mới
   */
  async createRole(data: CreateRoleRequest): Promise<Role> {
    const { code, name, description, level, permission_ids } = data;

    if (!code || !name) {
      throw new ApiError("Code and name are required", 400);
    }

    // Validate code format (lowercase, underscore only)
    if (!/^[a-z_]+$/.test(code)) {
      throw new ApiError("Code must contain only lowercase letters and underscores", 400);
    }

    // Check if role code already exists
    const existing = await roleRepo.getRoleByCode(code);
    if (existing) {
      throw new ApiError(`Role with code "${code}" already exists`, 409);
    }

    // Create role (database will auto-set created_at and updated_at)
    const roleData = {
      code,
      name,
      description,
      level: level || 99,
      is_active: true,
      is_system: false,
    };

    const newRole = await baseRepo.insert<Role>(new Role(roleData));

    // Assign permissions if provided
    if (permission_ids && permission_ids.length > 0) {
      await this.grantPermissionsToRole(newRole.id!, permission_ids);
    }

    return newRole;
  },

  /**
   * Update role
   */
  async updateRole(roleId: number, data: UpdateRoleRequest): Promise<Role> {
    if (!roleId) {
      throw new ApiError("Role ID is required", 400);
    }

    const existing = await baseRepo.getById<Role>(Role, roleId);
    if (!existing) {
      throw new ApiError("Role not found", 404);
    }

    if (existing.is_system) {
      throw new ApiError("Cannot modify system roles", 403);
    }

    // Database trigger will auto-update updated_at
    const updateData: Partial<Role> = {
      id: roleId,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const updated = await baseRepo.update<Role>(new Role(updateData) as any);
    if (!updated) {
      throw new ApiError("Failed to update role", 500);
    }

    return updated;
  },

  /**
   * Delete role
   */
  async deleteRole(roleId: number): Promise<void> {
    if (!roleId) {
      throw new ApiError("Role ID is required", 400);
    }

    const role = await baseRepo.getById<Role>(Role, roleId);
    if (!role) {
      throw new ApiError("Role not found", 404);
    }

    if (role.is_system) {
      throw new ApiError("Cannot delete system roles", 403);
    }

    // Check if role has users
    const hasUsers = await roleRepo.hasUsers(roleId);
    if (hasUsers) {
      throw new ApiError("Cannot delete role with assigned users", 400);
    }

    await baseRepo.deleteById(Role, roleId);
  },

  /**
   * Lấy tất cả roles
   */
  async getAllRoles(options?: { includeInactive?: boolean; includeSystem?: boolean }) {
    return await roleRepo.getAllRoles(options);
  },

  /**
   * Lấy role by ID
   */
  async getRoleById(roleId: number): Promise<Role> {
    const role = await baseRepo.getById<Role>(Role, roleId);
    if (!role) {
      throw new ApiError("Role not found", 404);
    }
    return role;
  },

  // ============================================
  // User-Role Assignment Operations
  // ============================================

  /**
   * Gán role cho user
   */
  async assignRoleToUser(data: AssignRoleRequest): Promise<UserRoleAssignment> {
    const { user_id, role_id } = data;

    if (!user_id || !role_id) {
      throw new ApiError("User ID and Role ID are required", 400);
    }

    // Check if role exists
    const role = await baseRepo.getById<Role>(Role, role_id);
    if (!role || !role.is_active) {
      throw new ApiError("Role not found or inactive", 404);
    }

    // Check if already assigned
    const existing = await baseRepo.findManyByFields<UserRoleAssignment>(UserRoleAssignment, { user_id, role_id } as any);

    if (existing.length > 0) {
      throw new ApiError("Role already assigned to user", 409);
    }

    // Create assignment (database will auto-set assigned_at)
    const assignment = new UserRoleAssignment({
      user_id,
      role_id,
    });

    return await baseRepo.insert<UserRoleAssignment>(assignment);
  },

  /**
   * Xóa role khỏi user
   */
  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    if (!userId || !roleId) {
      throw new ApiError("User ID and Role ID are required", 400);
    }

    const assignments = await baseRepo.findManyByFields<UserRoleAssignment>(UserRoleAssignment, { user_id: userId, role_id: roleId } as any);

    if (assignments.length === 0) {
      throw new ApiError("Role assignment not found", 404);
    }

    await baseRepo.deleteById(UserRoleAssignment, assignments[0].id!);
  },

  /**
   * Lấy roles của user
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    return await roleRepo.getUserRoles(userId);
  },

  // ============================================
  // Role-Permission Operations
  // ============================================

  /**
   * Grant permission cho role
   */
  async grantPermissionToRole(data: GrantPermissionRequest): Promise<RolePermission> {
    const { role_id, permission_id, is_granted } = data;

    if (!role_id || !permission_id) {
      throw new ApiError("Role ID and Permission ID are required", 400);
    }

    // Check if already exists
    const existing = await baseRepo.findManyByFields<RolePermission>(RolePermission, { role_id, permission_id } as any);

    if (existing.length > 0) {
      // Update existing (database will auto-set granted_at)
      const updated = await baseRepo.update<RolePermission>(
        new RolePermission({
          id: existing[0].id,
          is_granted,
        }) as any
      );

      if (!updated) {
        throw new ApiError("Failed to update permission", 500);
      }

      return updated;
    }

    // Create new (database will auto-set granted_at)
    const rolePermission = new RolePermission({
      role_id,
      permission_id,
      is_granted,
    });

    return await baseRepo.insert<RolePermission>(rolePermission);
  },

  /**
   * Grant nhiều permissions cho role
   */
  async grantPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
    if (!roleId || !permissionIds || permissionIds.length === 0) {
      throw new ApiError("Role ID and permission IDs are required", 400);
    }

    const role = await baseRepo.getById<Role>(Role, roleId);
    if (!role) {
      throw new ApiError("Role not found", 404);
    }

    // Insert batch (database will auto-set granted_at)
    const assignments = permissionIds.map(
      (permissionId) =>
        new RolePermission({
          role_id: roleId,
          permission_id: permissionId,
          is_granted: true,
        })
    );

    await baseRepo.insertMany<RolePermission>(assignments);
  },

  /**
   * Revoke permission từ role
   */
  async revokePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    if (!roleId || !permissionId) {
      throw new ApiError("Role ID and Permission ID are required", 400);
    }

    const assignments = await baseRepo.findManyByFields<RolePermission>(RolePermission, { role_id: roleId, permission_id: permissionId } as any);

    if (assignments.length > 0) {
      await baseRepo.deleteById(RolePermission, assignments[0].id!);
    }
  },

  /**
   * Lấy permissions của role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    if (!roleId) {
      throw new ApiError("Role ID is required", 400);
    }

    return await permissionRepo.getRolePermissions(roleId);
  },

  /**
   * Lấy permissions với grant status cho role (for admin UI)
   */
  async getPermissionsWithGrantStatus(roleId: number) {
    if (!roleId) {
      throw new ApiError("Role ID is required", 400);
    }

    return await permissionRepo.getPermissionsWithGrantStatus(roleId);
  },
};

import { baseRepo } from "@/lib/modules/common/base_repo";
import { roleRepo } from "../repositories/role_repo";
import { permissionRepo } from "../repositories/permission_repo";
import { menuRepo } from "../repositories/menu_repo";
import { Role, Permission, Menu, UserRoleAssignment, RolePermission, UserPermission } from "@/lib/models";
import { CreateRoleRequest, UpdateRoleRequest, AssignRoleRequest, GrantPermissionRequest, BulkPermissionOperation } from "@/lib/models/rbac-types";
import { ApiError } from "@/lib/utils/error";

/**
 * RBAC Admin Application
 *
 * Chứa tất cả operations CRUD để quản lý roles, permissions, menus
 * Chỉ dành cho admin panel
 */
export const rbacAdminApp = {
  // ============================================
  // Role Management (CRUD)
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
      throw new ApiError("Cannot delete role with assigned users. Please remove all users from this role first.", 400);
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
   * Lấy roles với user count
   */
  async getRolesWithUserCount() {
    return await roleRepo.getRolesWithUserCount();
  },

  /**
   * Lấy danh sách roles của một user
   * Dùng cho Permissions UI (mode By user)
   */
  async getUserRoles(userId: number) {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    return await roleRepo.getUserRoles(userId);
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

  /**
   * Search roles
   */
  async searchRoles(query: string) {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await roleRepo.searchRoles(query.trim());
  },

  // ============================================
  // User-Role Assignment (CRUD)
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
   * Gán nhiều roles cho user
   */
  async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
    if (!userId || !roleIds || roleIds.length === 0) {
      throw new ApiError("User ID and role IDs are required", 400);
    }

    // Create assignments
    const assignments = roleIds.map(
      (roleId) =>
        new UserRoleAssignment({
          user_id: userId,
          role_id: roleId,
        })
    );

    await baseRepo.insertMany<UserRoleAssignment>(assignments);
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
   * Sync roles cho user (remove old, add new)
   */
  async syncUserRoles(userId: number, roleIds: number[]): Promise<void> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    // Get current assignments
    const currentAssignments = await baseRepo.findManyByFields<UserRoleAssignment>(UserRoleAssignment, { user_id: userId } as any);

    const currentRoleIds = currentAssignments.map((a) => a.role_id!);

    // Find roles to remove
    const toRemove = currentRoleIds.filter((id) => !roleIds.includes(id));

    // Find roles to add
    const toAdd = roleIds.filter((id) => !currentRoleIds.includes(id));

    // Remove old assignments
    for (const roleId of toRemove) {
      await this.removeRoleFromUser(userId, roleId);
    }

    // Add new assignments
    if (toAdd.length > 0) {
      await this.assignRolesToUser(userId, toAdd);
    }
  },

  // ============================================
  // Role-Permission Management (CRUD)
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
   * Sync permissions cho role (remove old, add new)
   */
  async syncRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    if (!roleId) {
      throw new ApiError("Role ID is required", 400);
    }

    // Get current permissions
    const currentPermissions = await permissionRepo.getRolePermissions(roleId);
    const currentPermissionIds = currentPermissions.map((p) => p.id!);

    // Find permissions to remove
    const toRemove = currentPermissionIds.filter((id) => !permissionIds.includes(id));

    // Find permissions to add
    const toAdd = permissionIds.filter((id) => !currentPermissionIds.includes(id));

    // Remove old permissions
    for (const permissionId of toRemove) {
      await this.revokePermissionFromRole(roleId, permissionId);
    }

    // Add new permissions
    if (toAdd.length > 0) {
      await this.grantPermissionsToRole(roleId, toAdd);
    }
  },

  /**
   * Bulk permission update cho role
   */
  async bulkUpdateRolePermissions(operations: BulkPermissionOperation[]): Promise<void> {
    for (const op of operations) {
      if (op.is_granted) {
        await this.grantPermissionsToRole(op.role_id, op.permission_ids);
      } else {
        for (const permissionId of op.permission_ids) {
          await this.revokePermissionFromRole(op.role_id, permissionId);
        }
      }
    }
  },

  // ============================================
  // User-Permission Management (CRUD, tách biệt với role_permissions)
  // ============================================

  /**
   * Grant permission trực tiếp cho user
   */
  async grantPermissionToUser(userId: number, permissionId: number): Promise<UserPermission> {
    if (!userId || !permissionId) {
      throw new ApiError("User ID and Permission ID are required", 400);
    }

    const existing = await baseRepo.findManyByFields<UserPermission>(UserPermission, {
      user_id: userId,
      permission_id: permissionId,
    } as any);

    if (existing.length > 0) {
      const updated = await baseRepo.update<UserPermission>(
        new UserPermission({
          id: existing[0].id,
          is_granted: true,
        }) as any
      );
      if (!updated) {
        throw new ApiError("Failed to update user permission", 500);
      }
      return updated;
    }

    const assignment = new UserPermission({
      user_id: userId,
      permission_id: permissionId,
      is_granted: true,
    });

    return await baseRepo.insert<UserPermission>(assignment);
  },

  /**
   * Revoke permission trực tiếp từ user (xóa hoặc set is_granted = FALSE)
   */
  async revokePermissionFromUser(userId: number, permissionId: number): Promise<void> {
    if (!userId || !permissionId) {
      throw new ApiError("User ID and Permission ID are required", 400);
    }

    const existing = await baseRepo.findManyByFields<UserPermission>(UserPermission, {
      user_id: userId,
      permission_id: permissionId,
    } as any);

    if (existing.length > 0) {
      // Update existing mapping thành explicit deny
      const updated = await baseRepo.update<UserPermission>(
        new UserPermission({
          id: existing[0].id,
          is_granted: false,
        }) as any
      );
      if (!updated) {
        throw new ApiError("Failed to update user permission", 500);
      }
      return;
    }

    // Nếu chưa có mapping nào, tạo mới với is_granted = FALSE (explicit deny)
    const assignment = new UserPermission({
      user_id: userId,
      permission_id: permissionId,
      is_granted: false,
    });

    const inserted = await baseRepo.insert<UserPermission>(assignment);
    if (!inserted) {
      throw new ApiError("Failed to create user permission deny mapping", 500);
    }
  },

  /**
   * Lấy tất cả user-permission mappings cho 1 user (for admin UI)
   */
  async getUserPermissionsAssignments(userId: number): Promise<UserPermission[]> {
    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    return await baseRepo.findManyByFields<UserPermission>(UserPermission, {
      user_id: userId,
    } as any);
  },

  // ============================================
  // Permission Query (for Admin UI)
  // ============================================

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

  /**
   * Lấy tất cả permissions theo resource type
   */
  async getPermissionsByResourceType(resourceType: string) {
    return await permissionRepo.getPermissionsByResourceType(resourceType);
  },

  /**
   * Search permissions
   */
  async searchPermissions(query: string, resourceType?: string) {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await permissionRepo.searchPermissions(query.trim(), resourceType);
  },

  /**
   * Lấy tất cả permissions (for admin UI)
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await baseRepo.getAll<Permission>(Permission);
  },

  /**
   * Lấy tất cả role-permission mappings (for admin UI)
   */
  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await baseRepo.getAll<RolePermission>(RolePermission);
  },

  // ============================================
  // Menu Query (for Admin UI)
  // ============================================

  /**
   * Lấy tất cả menus
   */
  async getAllMenus() {
    return await menuRepo.getAllMenus();
  },

  /**
   * Lấy menu by code
   */
  async getMenuByCode(code: string) {
    const menu = await menuRepo.getMenuByCode(code);
    if (!menu) {
      throw new ApiError("Menu not found", 404);
    }
    return menu;
  },

  /**
   * Lấy menu với actions
   */
  async getMenuWithActions(menuCode: string) {
    const menu = await menuRepo.getMenuWithActions(menuCode);
    if (!menu) {
      throw new ApiError("Menu not found", 404);
    }
    return menu;
  },

  /**
   * Search menus
   */
  async searchMenus(query: string) {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await menuRepo.searchMenus(query.trim());
  },
};

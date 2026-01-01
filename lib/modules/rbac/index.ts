/**
 * RBAC Module - Role-Based Access Control
 *
 * Export all repositories, applications, and types
 */

// Applications (Business Logic)
// - permissionCheckApp: Runtime permission checking (READ-ONLY)
// - rbacAdminApp: Admin panel CRUD operations
export { permissionCheckApp } from "./applications/permission_check_app";
export { rbacAdminApp } from "./applications/rbac_admin_app";

// Repositories (Database Queries)
export { roleRepo } from "./repositories/role_repo";
export { permissionRepo } from "./repositories/permission_repo";
export { menuRepo } from "./repositories/menu_repo";
export { translationRepo } from "./repositories/translation_repo";

// Re-export models and types for convenience
export type {
  UserPermissionsResponse,
  UserMenusResponse,
  MenuActionsResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  GrantPermissionRequest,
  MenuTreeNode,
} from "@/lib/models/rbac-types";

export { Role, Permission, Menu, Action, UserRoleAssignment, RolePermission } from "@/lib/models";

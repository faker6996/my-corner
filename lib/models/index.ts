// Blog Models - Export all entity classes

// RBAC Models - Role-Based Access Control
export { Role } from "./role";
export { UserRoleAssignment } from "./user_role_assignment";
export { Menu } from "./menu";
export { Action } from "./action";
export { MenuAction } from "./menu_action";
export { Permission } from "./permission";
export { RolePermission } from "./role_permission";
export { UserPermission } from "./user_permission";
export { MenuTranslation } from "./menu_translation";
export { ActionTranslation } from "./action_translation";

// RBAC Types - All type definitions and interfaces
export * from "./rbac-types";

// Re-export existing models for consistency
export { User } from "./user";

// Utility types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Blog Models - Export all entity classes

// ===========================================
// RBAC Models - Role-Based Access Control
// ===========================================
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

// ===========================================
// Core Models
// ===========================================
export { User } from "./user";

// ===========================================
// Blog Models
// ===========================================
export { Post } from "./post";
export { Category } from "./category";
export { Tag } from "./tag";
export { Comment } from "./comment";
export { Advertisement } from "./advertisement";

// ===========================================
// Auth Models
// ===========================================
export { RefreshToken } from "./refresh_token";
export { ResetPasswordToken } from "./password_reset_token";
export { UserToken } from "./user_token";

// ===========================================
// System Models
// ===========================================
export { SystemLog } from "./system_log";

// ===========================================
// Utility Types
// ===========================================
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

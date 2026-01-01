/**
 * RBAC (Role-Based Access Control) Type Definitions
 * Định nghĩa các types và interfaces cho hệ thống phân quyền
 */

import { Role, Menu, Action, Permission } from "./index";

// ============================================
// Extended Types với joined data
// ============================================

/**
 * User với thông tin roles
 */
export interface UserWithRoles {
  id: number;
  user_name: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
  roles: Role[];
  permissions?: string[]; // Permission codes
}

/**
 * Role với thông tin permissions
 */
export interface RoleWithPermissions {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_active: boolean;
  is_system: boolean;
  permissions: PermissionDetail[];
  permissionCount?: number;
}

/**
 * Menu với thông tin actions và permissions
 */
export interface MenuWithActions {
  id: number;
  code: string;
  name: string;
  path: string;
  icon: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  actions: Action[];
  children?: MenuWithActions[]; // Submenu
}

/**
 * Permission với thông tin chi tiết
 */
export interface PermissionDetail {
  id: number;
  code: string;
  resource_type: string;
  resource_id?: number;
  action_id?: number;
  description?: string;
  // Joined data
  menu_name?: string;
  action_name?: string;
  action_code?: string;
  is_granted?: boolean; // True nếu được grant, false nếu bị deny
}

/**
 * Menu tree node với permissions
 */
export interface MenuTreeNode {
  id: number;
  code: string;
  name: string;
  path: string;
  icon: string;
  sort_order: number;
  parent_id?: number;
  children?: MenuTreeNode[];
  actions: {
    id: number;
    code: string;
    name: string;
    hasPermission: boolean;
  }[];
}

// ============================================
// Request/Response Types
// ============================================

/**
 * Request để assign role cho user
 */
export interface AssignRoleRequest {
  user_id: number;
  role_id: number;
}

/**
 * Request để grant/revoke permission cho role
 */
export interface GrantPermissionRequest {
  role_id: number;
  permission_id: number;
  is_granted: boolean; // true = grant, false = deny
}

/**
 * Request để tạo role mới
 */
export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  level?: number;
  permission_ids?: number[]; // Danh sách permission IDs để gán ngay
}

/**
 * Request để update role
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  level?: number;
  is_active?: boolean;
}

/**
 * Request để tạo menu mới
 */
export interface CreateMenuRequest {
  code: string;
  name: string;
  path: string;
  icon?: string;
  parent_id?: number;
  sort_order?: number;
  metadata?: Record<string, any>;
  action_ids?: number[]; // Danh sách action IDs
}

/**
 * Request để update menu
 */
export interface UpdateMenuRequest {
  name?: string;
  path?: string;
  icon?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Response chứa user permissions
 */
export interface UserPermissionsResponse {
  user_id: number;
  permissions: string[]; // Permission codes
  roles: {
    id: number;
    code: string;
    name: string;
  }[];
}

/**
 * Response chứa menu tree của user
 */
export interface UserMenusResponse {
  menus: MenuTreeNode[];
}

/**
 * Response chứa actions user có thể thực hiện trên menu
 */
export interface MenuActionsResponse {
  menu_code: string;
  actions: string[]; // Action codes
}

// ============================================
// Filter Types
// ============================================

/**
 * Filter cho danh sách roles
 */
export interface RoleFilters {
  search?: string;
  is_active?: boolean;
  is_system?: boolean;
  level?: number;
}

/**
 * Filter cho danh sách permissions
 */
export interface PermissionFilters {
  search?: string;
  resource_type?: string;
  action_code?: string;
  menu_code?: string;
}

/**
 * Filter cho danh sách menus
 */
export interface MenuFilters {
  search?: string;
  is_active?: boolean;
  parent_id?: number | null; // null = root menus only
}

/**
 * Filter cho user assignments
 */
export interface UserRoleFilters {
  user_id?: number;
  role_id?: number;
  assigned_after?: Date;
  assigned_before?: Date;
}

// ============================================
// State Management Types
// ============================================

/**
 * Permission state trong Redux/Context
 */
export interface PermissionState {
  permissions: string[];
  roles: Role[];
  menus: MenuTreeNode[];
  loading: boolean;
  loaded: boolean;
  error?: string;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string; // Lý do nếu không có permission
  requiredPermission?: string;
}

// ============================================
// Component Props Types
// ============================================

/**
 * Props cho PermissionGate component
 */
export interface PermissionGateProps {
  permission: string | string[];
  requireAll?: boolean; // true = cần tất cả, false = chỉ cần 1
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Props cho RoleSelector component
 */
export interface RoleSelectorProps {
  value?: number | number[];
  onChange: (roleId: number | number[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  excludeSystemRoles?: boolean;
  className?: string;
}

/**
 * Props cho PermissionMatrix component (admin UI)
 */
export interface PermissionMatrixProps {
  roleId: number;
  onPermissionChange?: (permissionId: number, isGranted: boolean) => void;
  readonly?: boolean;
}

// ============================================
// Utility Types
// ============================================

/**
 * Permission resource types
 */
export type PermissionResourceType = "menu" | "api" | "feature" | "report" | "data";

/**
 * Action categories
 */
export type ActionCategory = "CRUD" | "IMPORT_EXPORT" | "WORKFLOW" | "SPECIAL" | "REPORT";

/**
 * Common CRUD actions
 */
export type CrudAction = "view" | "create" | "update" | "delete";

/**
 * Permission code format: resource.target.action
 * Examples: "menu.users.create", "api.tasks.delete"
 */
export type PermissionCode = `${string}.${string}.${string}`;

/**
 * Role level priority (1 = highest)
 */
export type RoleLevel = 1 | 2 | 3 | number;

// ============================================
// Validation Types
// ============================================

/**
 * Validation result cho permission operations
 */
export interface PermissionValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Bulk permission operation
 */
export interface BulkPermissionOperation {
  role_id: number;
  permission_ids: number[];
  is_granted: boolean;
}

/**
 * Permission audit log
 */
export interface PermissionAuditLog {
  id: number;
  user_id: number;
  action: "grant" | "revoke" | "assign_role" | "remove_role";
  target_user_id?: number;
  role_id?: number;
  permission_id?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================
// Constants Export
// ============================================

/**
 * Default role codes
 */
export const DEFAULT_ROLE_CODES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
} as const;

/**
 * Default action codes
 */
export const DEFAULT_ACTION_CODES = {
  VIEW: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
  IMPORT: "import",
} as const;

/**
 * Permission resource type labels
 */
export const RESOURCE_TYPE_LABELS: Record<PermissionResourceType, string> = {
  menu: "Menu",
  api: "API",
  feature: "Feature",
  report: "Report",
  data: "Data",
};

/**
 * Action category labels
 */
export const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  CRUD: "CRUD Operations",
  IMPORT_EXPORT: "Import/Export",
  WORKFLOW: "Workflow",
  SPECIAL: "Special Actions",
  REPORT: "Reporting",
};

// RBAC-related static codes for menus and actions

export const RBAC_MENU_CODES = {
  PERMISSIONS: "permissions",
  ROLES: "roles",
  TASKS: "tasks",
  USERS: "users",
} as const;

export const RBAC_ACTION_CODES = {
  VIEW: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

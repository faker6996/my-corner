# RBAC Models Summary

Tổng quan về các TypeScript models đã tạo cho hệ thống phân quyền (RBAC).

## 📁 Models đã tạo

### 1. **role.ts** - Role Model

- Quản lý các vai trò trong hệ thống
- Properties: `id`, `code`, `name`, `description`, `level`, `is_active`, `is_system`
- Helper methods:
  - `isActive()`, `isSystemRole()`, `canBeDeleted()`, `canBeModified()`
  - `isSuperAdmin()`, `isAdmin()`, `isUser()`
  - `getRoleLevelLabel()`

### 2. **user_role_assignment.ts** - UserRoleAssignment Model

- Gán role cho user (hỗ trợ multi-role)
- Properties: `id`, `user_id`, `role_id`, `assigned_at`, `assigned_by`
- Helper methods:
  - `getUserId()`, `getRoleId()`, `getAssignedBy()`
  - `getAssignedAtFormatted()`

### 3. **menu.ts** - Menu Model

- Quản lý menu items (hỗ trợ hierarchical structure)
- Properties: `id`, `code`, `name`, `path`, `icon`, `parent_id`, `sort_order`, `is_active`, `metadata`
- Helper methods:
  - `isActive()`, `isRootMenu()`, `isSubMenu()`
  - `getMetadata()`, `getDescription()`, `getBadge()`
  - `isExternalLink()`, `getTooltip()`

### 4. **action.ts** - Action Model

- Quản lý các action có thể thực hiện
- Properties: `id`, `code`, `name`, `description`, `category`
- Helper methods:
  - `isCrudAction()`, `isImportExportAction()`, `isWorkflowAction()`
  - `isViewAction()`, `isCreateAction()`, `isUpdateAction()`, `isDeleteAction()`
  - `getCategoryLabel()`

### 5. **menu_action.ts** - MenuAction Model

- Gán actions cho từng menu
- Properties: `id`, `menu_id`, `action_id`, `display_name`
- Helper methods:
  - `getMenuId()`, `getActionId()`, `getDisplayName()`
  - `hasCustomDisplayName()`

### 6. **permission.ts** - Permission Model

- Quản lý permissions (quyền hạn cụ thể)
- Properties: `id`, `code`, `resource_type`, `resource_id`, `action_id`, `description`
- Helper methods:
  - `isMenuPermission()`, `isApiPermission()`, `isFeaturePermission()`
  - `parseCode()` - Parse "menu.users.create" thành parts
  - `getTarget()`, `getActionFromCode()`
  - `getResourceTypeLabel()`

### 7. **role_permission.ts** - RolePermission Model

- Gán permissions cho role
- Properties: `id`, `role_id`, `permission_id`, `is_granted`, `granted_at`, `granted_by`
- Helper methods:
  - `isGranted()`, `isDenied()`
  - `getStatusLabel()`, `getStatusColor()`
  - `getGrantedAtFormatted()`

### 8. **rbac-types.ts** - TypeScript Type Definitions

Định nghĩa đầy đủ các types và interfaces cho RBAC system:

#### Extended Types

- `UserWithRoles` - User kèm roles và permissions
- `RoleWithPermissions` - Role kèm danh sách permissions
- `MenuWithActions` - Menu kèm actions và tree structure
- `PermissionDetail` - Permission với thông tin chi tiết
- `MenuTreeNode` - Menu tree với permissions

#### Request Types

- `AssignRoleRequest`, `GrantPermissionRequest`
- `CreateRoleRequest`, `UpdateRoleRequest`
- `CreateMenuRequest`, `UpdateMenuRequest`

#### Response Types

- `UserPermissionsResponse` - Permissions của user
- `UserMenusResponse` - Menu tree của user
- `MenuActionsResponse` - Actions trên menu

#### Filter Types

- `RoleFilters`, `PermissionFilters`, `MenuFilters`, `UserRoleFilters`

#### State Management

- `PermissionState` - State cho Redux/Context
- `PermissionCheckResult` - Kết quả check permission

#### Component Props

- `PermissionGateProps` - Props cho PermissionGate component
- `RoleSelectorProps` - Props cho RoleSelector
- `PermissionMatrixProps` - Props cho admin permission matrix

#### Utility Types

- `PermissionResourceType` = 'menu' | 'api' | 'feature' | 'report' | 'data'
- `ActionCategory` = 'CRUD' | 'IMPORT_EXPORT' | 'WORKFLOW' | 'SPECIAL' | 'REPORT'
- `CrudAction` = 'view' | 'create' | 'update' | 'delete'
- `PermissionCode` = Template literal type
- `RoleLevel` = 1 | 2 | 3 | number

#### Constants

- `DEFAULT_ROLE_CODES` - Super admin, admin, user codes
- `DEFAULT_ACTION_CODES` - View, create, update, delete, export, import
- `RESOURCE_TYPE_LABELS` - Labels cho resource types
- `ACTION_CATEGORY_LABELS` - Labels cho action categories

## 📋 File Structure

```
lib/models/
├── role.ts                      ✅ Mới
├── user_role_assignment.ts      ✅ Mới
├── menu.ts                      ✅ Mới
├── action.ts                    ✅ Mới
├── menu_action.ts               ✅ Mới
├── permission.ts                ✅ Mới
├── role_permission.ts           ✅ Mới
├── rbac-types.ts                ✅ Mới
├── index.ts                     ✅ Updated (added RBAC exports)
└── ... (existing models)
```

## 🎯 Usage Examples

### Import models

```typescript
import { Role, Permission, Menu, UserWithRoles, PermissionGateProps } from "@/lib/models";
```

### Create instances

```typescript
const role = new Role({
  code: "admin",
  name: "Administrator",
  level: 2,
});

console.log(role.isAdmin()); // true
console.log(role.canBeDeleted()); // false (system role)
```

### Use helper methods

```typescript
const permission = new Permission({
  code: "menu.users.create",
});

const parsed = permission.parseCode();
// { resource: 'menu', target: 'users', action: 'create' }

console.log(permission.getTarget()); // 'users'
console.log(permission.isMenuPermission()); // true
```

### Type-safe requests

```typescript
const request: CreateRoleRequest = {
  code: "moderator",
  name: "Moderator",
  description: "Content moderator role",
  level: 3,
  permission_ids: [1, 2, 3],
};
```

## ✨ Features

### ✅ Type Safety

- Tất cả properties đều có type definitions
- Constructor an toàn với null/undefined checks
- Helper methods với return type rõ ràng

### ✅ Consistent Pattern

- Follow template từ `_template_model.ts`
- Consistent constructor pattern
- Consistent helper method naming

### ✅ Date Handling

- Auto convert string dates to Date objects
- Safe date formatting methods
- `toJSON()` với ISO string dates

### ✅ Null Safety

- All properties optional
- Helper methods handle undefined safely
- Default values for missing data

### ✅ Rich Helper Methods

- Business logic encapsulation
- Easy-to-use convenience methods
- Readable and maintainable code

## 🔗 Related Files

- **Database Schema**: `database/migrations/20251216_create_rbac_system.sql`
- **Implementation Plan**: `C:\Users\Admin\.gemini\antigravity\brain\d1662cdb-074c-48af-be31-03c436b26a1b\implementation_plan.md`

## 📝 Notes

1. Tất cả models đều exported through `lib/models/index.ts`
2. Types và interfaces có thể dùng cho:
   - API request/response
   - Component props
   - State management (Redux/Context)
   - Form validation
3. Models hỗ trợ đầy đủ cho cả frontend và backend
4. Chuẩn bị sẵn cho integration với UI components và API routes

## 🚀 Next Steps

1. ✅ Database migration - Done
2. ✅ Models - Done
3. ⏳ Service Layer (PermissionApplication)
4. ⏳ API Routes
5. ⏳ Frontend Hooks (usePermissions)
6. ⏳ UI Components (PermissionGate)
7. ⏳ Admin Panel

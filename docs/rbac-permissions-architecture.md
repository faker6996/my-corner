RBAC & Permissions Architecture (OCR Editing)
============================================

Tài liệu này mô tả kiến trúc phân quyền trong dự án OCR Editing: từ cấu trúc CSDL → tầng domain (apps/repositories) → API → UI (Sidebar, trang Settings/Permissions). Mục tiêu là để người sau đọc vào có thể hiểu nhanh luồng xử lý và biết cần sửa ở đâu.

---

Mục tiêu thiết kế
----------------

- Hỗ trợ **2 loại phân quyền tách biệt**:
  - Theo **role** (role-based) – áp dụng cho nhiều user.
  - Theo **user** (user-based overrides) – quyền riêng từng người dùng.
- Quy tắc gộp quyền:
  - Quyền cuối cùng = quyền từ **role** + quyền trực tiếp từ **user**.
  - Nếu user có bản ghi `user_permissions.is_granted = FALSE` → coi là **explicit deny**, chặn cả quyền đến từ role.
- Hệ thống phân quyền cho:
  - **Menus** (Dashboard, Tasks, Settings, …) – quyền `view` quyết định hiển thị menu.
  - **Actions** trên từng menu (create, update, delete, export, …).

---

1. Cấu trúc CSDL liên quan
--------------------------

Các bảng chính (xem migration `database/migrations/20251216_create_rbac_system.sql`):

- `roles`
  - Danh sách vai trò: `super_admin`, `admin`, `user`, …
  - Trường chính: `code`, `name`, `level`, `is_system`, `is_active`.

- `user_role_assignments`
  - Gán nhiều role cho 1 user (multi-role).
  - Cột: `user_id`, `role_id`, `assigned_at`, `assigned_by`.

- `menus`
  - Cây menu trong hệ thống, hỗ trợ menu cha – con (`parent_id`).
  - Ví dụ các `code`: `dashboard`, `create_task`, `tasks`, `settings`, `users`, `roles`, `permissions`, `logs`.

- `actions`
  - Danh sách action chung: `view`, `create`, `update`, `delete`, `export`, `import`, `share`, `download`, `approve`, `reject`, …

- `menu_actions`
  - Mapping (menu, action) – quy định menu nào có những action nào.
  - Ví dụ: `tasks` có `view, create, update, delete, export, share, download`.

- `permissions`
  - Mỗi (menu, action) tương ứng với 1 **permission** riêng.
  - Format `code`: `menu.<menu_code>.<action_code>` – ví dụ:
    - `menu.dashboard.view`
    - `menu.tasks.create`
    - `menu.settings.permissions.view`
  - Cột: `resource_type = 'menu'`, `resource_id = menu_id`, `action_id`, `description`.
  - Migration `STEP 7` sinh tự động từ `menu_actions`.

- `role_permissions`
  - Gán permission cho role.
  - Cột: `role_id`, `permission_id`, `is_granted` (mặc định TRUE).
  - Chứa dữ liệu seed:
    - `super_admin` → grant **toàn bộ** permissions.
    - `admin` → grant gần hết, trừ một số menu nhạy cảm.
    - `user` → chỉ một subset cho Dashboard/Tasks.

- `user_permissions`
  - Gán permission trực tiếp cho user (song song với `role_permissions`).  
  - Trường quan trọng: `is_granted`:
    - `TRUE`  → grant trực tiếp.
    - `FALSE` → **explicit deny** – dùng để tắt quyền đã có từ role.

- `menu_translations`, `action_translations`
  - Bảng dịch tên menu/action theo locale (`en`, `vi`, `ko`, `ja`).
  - Dùng cho sidebar và cây menu trên trang Permissions.

---

2. Tầng domain: repositories & apps
-----------------------------------

### 2.1 Repositories

Nằm trong `lib/modules/rbac/repositories/`:

- `role_repo.ts`
  - `getUserRoles(userId)` – trả về danh sách `Role` mà user được gán (từ `user_role_assignments`).
  - `getAllRoles`, `getRolesWithUserCount`, `searchRoles`, …

- `permission_repo.ts`
  - `getUserPermissions(userId)`  
    - Lấy tất cả permission mà user **được phép** sau khi gộp:
      - Grant từ role (`role_permissions.is_granted = TRUE` + `user_role_assignments`).
      - Grant trực tiếp từ user (`user_permissions.is_granted = TRUE`).
      - Loại bỏ những permission có `user_permissions.is_granted = FALSE` (explicit deny).
  - `checkUserPermission(userId, permissionCode)`  
    - Logic:
      1. Nếu tồn tại `user_permissions` với `is_granted = FALSE` cho permission đó → trả về `false` (deny).
      2. Ngược lại, nếu có **grant** từ role hoặc `user_permissions.is_granted = TRUE` → `true`.
  - `getUserMenuActions(userId, menuCode)`  
    - Trả về danh sách action code mà user được phép trên menu đó, dùng cùng rule grant/deny ở trên.

- `menu_repo.ts`
  - `getUserMenus(userId)`  
    - Trả về các menu mà user có quyền `view` (effective) với rule grant/deny giống `permission_repo`.
  - `getUserMenuTree(userId, locale?)`  
    - Xây dựng cây menu (kèm danh sách actions) cho user.  
    - Dùng CTE `user_permission_ids` để chọn permission ID user **thực sự có** (grant – deny).  
    - Dùng translations nếu có `locale`.
  - `getMenuTree(locale?)`  
    - Cây menu full (không theo user) – dùng cho trang quản trị Permissions.
  - `getMenuActions(menuId, locale?)`  
    - Lấy danh sách actions của menu + đảm bảo mỗi cặp (menu, action) có 1 `permissions` tương ứng (nếu chưa có thì insert).

### 2.2 Applications (business logic)

Nằm trong `lib/modules/rbac/applications/`:

- `permission_check_app.ts`
  - `getUserPermissions(userId)` → trả về `{ user_id, permissions, roles }` (chỉ đọc).
  - `checkPermission(userId, permissionCode)` → wrapper dùng `permissionRepo.checkUserPermission`.
  - `getUserMenus(userId, locale)`  
    - Gọi `menuRepo.getUserMenuTree` → kết quả dùng cho sidebar và một số chỗ khác.
  - `getUserMenuActions(userId, menuCode)` → dùng cho UI kiểm tra action cho từng menu.
  - `checkMenuAction(userId, menuCode, actionCode)`  
    - Build permission code `menu.<menuCode>.<actionCode>` rồi check qua `permissionRepo.checkUserPermission`.

- `rbac_admin_app.ts`
  - CRUD roles: `createRole`, `updateRole`, `deleteRole`, `getAllRoles`, …
  - User–role:
    - `assignRoleToUser`, `removeRoleFromUser`, `syncUserRoles`, `getUserRoles(userId)`.
  - Role–permission:
    - `grantPermissionToRole`, `revokePermissionFromRole`, `grantPermissionsToRole`, `syncRolePermissions`, `bulkUpdateRolePermissions`.
  - User–permission (override):
    - `grantPermissionToUser(userId, permissionId)`:
      - Nếu đã có mapping → update `is_granted = TRUE`.
      - Nếu chưa có → insert `is_granted = TRUE`.
    - `revokePermissionFromUser(userId, permissionId)`:
      - Nếu đã có mapping → update `is_granted = FALSE` (explicit deny).
      - Nếu chưa có → insert `is_granted = FALSE`.
    - `getUserPermissionsAssignments(userId)` – trả về toàn bộ dòng `user_permissions` cho UI quản trị.
  - Permission query cho admin UI:
    - `getRolePermissions`, `getPermissionsWithGrantStatus`, `getPermissionsByResourceType`, `searchPermissions`, `getAllPermissions`, `getAllRolePermissions`.
  - Menu query cho admin:
    - `getAllMenus`, `getMenuByCode`, `getMenuWithActions`, `searchMenus`.

---

3. API liên quan đến permissions
--------------------------------

Các route chính trong `app/api`:

- Sidebar / menu của user:
  - `GET /api/permissions/my-menus?locale=vi`  
    - Handler: `app/api/permissions/my-menus/route.ts`  
    - Gọi `permissionCheckApp.getUserMenus(currentUser.id, locale)` → trả về `{ menus: MenuTreeNode[] }`.
    - Sidebar (`components/layout/Sidebar.tsx`) dùng endpoint này.

- Trang Settings → Permissions (setup):
  - `GET /api/rbac/permissions/setup-view?locale=vi`  
    - Handler: `app/api/rbac/permissions/setup-view/route.ts`  
    - Check quyền `menu.permissions.view`.  
    - Trả về:
      - `menuTree`: cây menu full (không theo user, dùng cho panel bên trái).
      - `roles`: danh sách role.
      - `rolePermissions`: toàn bộ role–permission mappings.

- Menu → Actions:
  - `GET /api/rbac/menus/:menuId/actions?locale=vi`  
    - Handler: `app/api/rbac/menus/[menuId]/actions/route.ts`  
    - Check `menu.permissions.view`.  
    - Dùng `menuRepo.getMenuActions` để load danh sách action + permission tương ứng.

- Role-permission toggle:
  - `POST /api/rbac/permissions/roles/:roleId/permissions/:permissionId/grant`
  - `POST /api/rbac/permissions/roles/:roleId/permissions/:permissionId/revoke`
  - Gọi `rbacAdminApp.grantPermissionToRole` / `revokePermissionFromRole`.

- User-permission toggle:
  - `POST /api/rbac/permissions/users/:userId/permissions/:permissionId/grant`
  - `POST /api/rbac/permissions/users/:userId/permissions/:permissionId/revoke`
  - Gọi `rbacAdminApp.grantPermissionToUser` / `revokePermissionFromUser`.
  - Kết hợp với logic explicit deny như mô tả ở trên.

- Load user-permission assignments:
  - `GET /api/rbac/permissions/users/:userId/permissions`  
    - Trả về danh sách dòng `user_permissions` cho user đó.

- Load roles của một user (phục vụ UI By user):
  - `GET /api/rbac/users/:userId/roles`  
    - Handler: `app/api/rbac/users/[userId]/roles/route.ts`  
    - Check `menu.permissions.view`.  
    - Gọi `rbacAdminApp.getUserRoles(userId)`.

---

4. UI: Sidebar & trang Settings/Permissions
-------------------------------------------

### 4.1 Sidebar (menu trái)

File: `components/layout/Sidebar.tsx`

- Khi user đăng nhập:
  - Sidebar gọi `/api/permissions/my-menus?locale=<locale>` để lấy cây menu mà user được phép `view`.
  - Kết quả được cache vào `localStorage` với key: `user_menus_<userId>_<locale>`.
- Khi permissions thay đổi từ trang quản trị:
  - `PermissionsContainer` bắn event `userMenusChanged` vào `window` và xóa các key `user_menus_<userId>_*` khỏi `localStorage`.
  - Sidebar lắng nghe event này, xóa cache và reload menus từ API.  
  - Nhờ đó, khi bật/tắt quyền `view` cho Dashboard, menu Sidebar sẽ cập nhật ngay lập tức.

### 4.2 Trang Settings → Permissions

File: `components/admin/permissions/PermissionsContainer.tsx`

Gồm 2 chế độ:

1. **Mode By role**
   - Bảng ma trận: **hàng = Roles**, **cột = Actions** của menu đang chọn.
   - Icon + switch mỗi ô:
     - ON → gọi endpoint grant cho role đó + permission đó.
     - OFF → revoke.
   - Dữ liệu lấy từ:
     - `setup-view` (`roles`, `rolePermissions`).
     - `getMenuActions(menuId)` để biết danh sách actions + permission ID tương ứng.

2. **Mode By user**
   - Chủ động hiển thị quyền theo từng user (override trên role):
     - Combobox chọn user (data từ `/api/users`).
     - Với user đã chọn:
       - Load assignments: `/api/rbac/permissions/users/:userId/permissions`.
       - Load roles của user: `/api/rbac/users/:userId/roles` (fallback sang cột `users.role` nếu chưa sync sang `user_role_assignments`).
   - Bảng hiển thị dạng 1 hàng:
     - Cột 1: `User direct permission` (hiển thị tên user).
     - Các cột còn lại: từng `action` trên menu, mỗi ô có:
       - Icon trạng thái (Check / X) → dựa trên **quyền hiệu lực** (`effectiveGranted`).
       - Switch ON/OFF để thay đổi trực tiếp quyền của user.
   - Tính `effectiveGranted` cho từng (user, permission):

     ```ts
     const directAssignment = userPermissions.find(
       (perm) => perm.user_id === selectedUser.id && perm.permission_id === action.permission_id
     );
     const directValue = directAssignment?.is_granted; // true / false / undefined

     const roleHasPermission =
       userRoles.length > 0 &&
       userRoles.some((role) =>
         rolePermissions.some(
           (rp) =>
             rp.role_id === role.id &&
             rp.permission_id === action.permission_id &&
             rp.is_granted
         )
       );

     const effectiveGranted =
       typeof directValue === "boolean" ? directValue : roleHasPermission;
     ```

   - Hành vi switch:
     - `checked={effectiveGranted}` – switch phản ánh quyền cuối cùng hiện tại.
     - Khi ON/OFF:
       - Nếu `effectiveGranted` đang **true** → gọi endpoint `revoke` → tạo/ghi `user_permissions.is_granted = FALSE` (explicit deny).
       - Nếu `effectiveGranted` đang **false** → gọi endpoint `grant` → tạo/ghi `is_granted = TRUE` (grant trực tiếp).
   - Sau khi cập nhật, component:
     - Cập nhật `userPermissions` trong state.
     - Xóa cache menu của user + bắn event `userMenusChanged` (để Sidebar reload).

---

5. Một ví dụ đơn giản: API kiểm tra quyền
----------------------------------------

Để dễ hình dung, đây là **luồng đơn giản** của một API có kiểm tra quyền, ví dụ: `GET /api/rbac/permissions/setup-view` (trang Settings → Permissions):

1. **User mở trang `/settings/permissions`**  
   - Next.js gọi route `app/api/rbac/permissions/setup-view/route.ts` để lấy dữ liệu ban đầu (menu tree, danh sách roles, mapping permissions).

2. **Route đọc thông tin người dùng hiện tại**  
   - Gọi helper `getUserFromRequest(request)` để lấy `currentUser` từ JWT/cookie.

3. **Route hỏi hệ thống RBAC: “Người này có được xem trang Permissions không?”**  
   - Gọi:

     ```ts
     const canView = await permissionCheckApp.checkMenuAction(
       currentUser.id!,
       RBAC_MENU_CODES.PERMISSIONS,
       RBAC_ACTION_CODES.VIEW
     );
     ```

   - Ở đây `checkMenuAction` chỉ là cách nói “user có permission `menu.permissions.view` hay không?”.

4. **`permissionCheckApp` chuyển câu hỏi xuống tầng repository/DB**  
   - `checkMenuAction` build ra chuỗi `menu.permissions.view`, rồi gọi:

     ```ts
     permissionRepo.checkUserPermission(userId, "menu.permissions.view");
     ```

   - Repo sẽ xuống DB kiểm tra theo các rule đã nói:
     - Nếu user có dòng `user_permissions` với `is_granted = FALSE` cho permission này → trả về `false`.
     - Nếu không deny mà:
       - Role của user có grant (`role_permissions`) **hoặc**
       - `user_permissions.is_granted = TRUE`  
       → trả về `true`.
     - Ngược lại → `false`.

5. **Route quyết định trả về gì**  
   - Nếu `canView === false` → ném lỗi `Forbidden` → client nhận JSON lỗi và hiển thị màn hình Access Denied.
   - Nếu `canView === true`:
     - Route gọi tiếp các “service” admin:

       ```ts
       const [menuTree, roles, rolePermissions] = await Promise.all([
         menuRepo.getMenuTree(locale),
         rbacAdminApp.getAllRoles({ includeSystem: true }),
         rbacAdminApp.getAllRolePermissions(),
       ]);
       ```

     - Sau đó đóng gói thành JSON `{ success: true, data: { menuTree, roles, rolePermissions } }` cho UI.

6. **UI nhận dữ liệu và hiển thị**  
   - `PermissionsContainer` dùng `menuTree` để vẽ panel “Menu Tree”, dùng `roles` và `rolePermissions` để vẽ bảng ma trận By role.

Điều quan trọng: khi đọc bất kỳ API nào có phân quyền, bạn chỉ cần tìm trong route:

- Có gọi `permissionCheckApp.checkMenuAction(...)` hoặc `permissionCheckApp.checkPermission(...)` không?  
- Đang kiểm tra permission code nào (`menu.<menu_code>.<action_code>`)?

Như vậy dù không đi sâu vào SQL, người đọc vẫn hiểu được **“API này yêu cầu quyền gì”** và biết cần sửa ở đâu nếu muốn thay đổi behavior.

---

5. Quy tắc gộp quyền (grant/deny)
---------------------------------

Tóm tắt lại rule quan trọng cho mọi nơi trong hệ thống:

1. **Grant từ role**
   - Nếu user được gán role R và `role_permissions` có dòng `(role_id = R.id, permission_id = P.id, is_granted = TRUE)` → user có quyền P (trừ khi bị deny).

2. **Grant trực tiếp cho user**
   - Nếu `user_permissions` có `(user_id = U.id, permission_id = P.id, is_granted = TRUE)` → user có quyền P, kể cả khi role không có.

3. **Explicit deny trên user**
   - Nếu `user_permissions` có `(user_id = U.id, permission_id = P.id, is_granted = FALSE)` → **luôn coi là không có quyền P**, dù role có grant.

4. **Quyền cuối cùng (`effectiveGranted`)**:

   ```text
   Nếu tồn tại user_permissions.is_granted = FALSE → always DENY
   else if (grant via user_permissions.is_granted = TRUE or via role_permissions) → GRANT
   else → DENY
   ```

5. **Hiển thị menu & cây menu**:
   - Một menu M xuất hiện trong Sidebar nếu và chỉ nếu user có `effectiveGranted = TRUE` cho permission `menu.<M.code>.view`.
   - Queries lấy menu (`getUserMenus`, `getUserMenuTree`) đều áp dụng rule này.

---

6. Checklist khi mở rộng RBAC
-----------------------------

### 6.1 Thêm menu mới

1. Thêm dòng trong `menus` ở migration hoặc seed.
2. Gán actions cho menu đó trong `menu_actions` (ví dụ `view`, `create`, …).
3. Khi API `getMenuActions` chạy lần đầu, nó sẽ tự sinh `permissions` tương ứng.
4. Cập nhật seed cho `role_permissions` (nếu muốn role mặc định có quyền trên menu mới).
5. Thêm translations vào `menu_translations` (4 locale).

### 6.2 Thêm action mới

1. Thêm dòng vào bảng `actions` (code + name).
2. Gán action đó vào `menu_actions` cho các menu cần dùng.
3. `getMenuActions` sẽ tự tạo permission mới nếu chưa có.
4. Seed thêm `role_permissions` cho các role cần được quyền mới.
5. Thêm translations vào `action_translations`.

### 6.3 Thêm UI / API mới dùng permission

1. Quy ước permission code:
   - Nếu là menu/action → dùng `menu.<menu_code>.<action_code>` (tái sử dụng hệ thống hiện tại).
   - Nếu là API/feature khác → cân nhắc thêm `resource_type` riêng (chưa dùng trong hệ thống hiện tại).
2. Trước khi xử lý logic chính, gọi:
   - `permissionCheckApp.checkMenuAction(user.id, MENU_CODE, ACTION_CODE)`
   - Hoặc `permissionCheckApp.checkPermission(user.id, "menu.xxx.yyy")`
3. Trả về `403 Forbidden` nếu không có quyền.

---

7. Debug nhanh khi quyền bị sai
-------------------------------

1. Kiểm tra DB:
   - `user_role_assignments` xem user đang có role nào.
   - `role_permissions` xem role đó có permission chưa.
   - `user_permissions` xem có dòng `is_granted = TRUE/FALSE` cho permission không.

2. Kiểm tra permission code đúng chưa:
   - Đảm bảo `permissions.code` đúng format `menu.<menu_code>.<action_code>`.
   - So sánh với code dùng trong `checkMenuAction`.

3. Thử gọi API quyền trực tiếp (bằng Postman/curl hoặc Network tab):
   - `/api/permissions/my-menus`
   - `/api/rbac/menus/:menuId/actions`
   - `/api/rbac/permissions/users/:userId/permissions`

4. Bật log tạm trong `permission_repo` hoặc `menu_repo` nếu cần.

---

Tài liệu này cố gắng gom lại bức tranh tổng thể về RBAC trong dự án. Khi sửa một phần (ví dụ thêm action mới, đổi rule deny, chỉnh UI By user), nên đối chiếu 4 tầng: **DB → repositories/apps → API → UI** để đảm bảo không bỏ sót. Nếu mở rộng lớn (ví dụ thêm resource type mới ngoài `menu`), nên cập nhật lại tài liệu này cho người sau. 

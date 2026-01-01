-- =====================================================
-- OCR Editing - RBAC System Migration
-- Created: 2025-12-16
-- Description: Tạo hệ thống phân quyền menu và action theo role và theo user (user override)
--              Updated: Settings as parent menu, hỗ trợ bảng user_permissions
-- =====================================================

-- =====================================================
-- STEP 0: DROP OLD TABLES (Clean slate)
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS v_menu_actions CASCADE;
DROP VIEW IF EXISTS v_role_permissions CASCADE;
DROP VIEW IF EXISTS v_user_roles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_menu_actions(INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_user_menus(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_user_permission(INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_user_permissions(INTEGER) CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS action_translations CASCADE;
DROP TABLE IF EXISTS menu_translations CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS menu_actions CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- 1.1. Bảng roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 99,
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

COMMENT ON TABLE roles IS 'Danh sách các vai trò trong hệ thống';
COMMENT ON COLUMN roles.code IS 'Mã role duy nhất (super_admin, admin, user, ...)';
COMMENT ON COLUMN roles.level IS 'Cấp độ ưu tiên: số càng nhỏ quyền càng cao (1=highest)';
COMMENT ON COLUMN roles.is_system IS 'Role hệ thống, không được phép xóa/sửa code';

-- 1.2. Bảng user_role_assignments
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by INTEGER,
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);

COMMENT ON TABLE user_role_assignments IS 'Gán role cho user (hỗ trợ multi-role)';

-- 1.3. Bảng menus
CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(255),
  icon VARCHAR(50),
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_code ON menus(code);
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active);
CREATE INDEX IF NOT EXISTS idx_menus_sort_order ON menus(sort_order);

COMMENT ON TABLE menus IS 'Danh sách menu items trong hệ thống';
COMMENT ON COLUMN menus.parent_id IS 'ID của menu cha (NULL = menu gốc)';
COMMENT ON COLUMN menus.metadata IS 'Thông tin bổ sung: {tooltip, badge, external_link, etc}';

-- 1.4. Bảng actions
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'CRUD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_code ON actions(code);
CREATE INDEX IF NOT EXISTS idx_actions_category ON actions(category);

COMMENT ON TABLE actions IS 'Danh sách các action có thể thực hiện';
COMMENT ON COLUMN actions.category IS 'Nhóm action: CRUD, IMPORT_EXPORT, WORKFLOW, REPORT, ...';

-- 1.5. Bảng menu_actions
CREATE TABLE IF NOT EXISTS menu_actions (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL,
  action_id INTEGER NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_id, action_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_actions_menu_id ON menu_actions(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_actions_action_id ON menu_actions(action_id);

COMMENT ON TABLE menu_actions IS 'Gán actions cho từng menu';
COMMENT ON COLUMN menu_actions.display_name IS 'Tên hiển thị của action trong menu này (có thể khác với action.name)';

-- 1.6. Bảng permissions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  action_id INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_id ON permissions(resource_id);
CREATE INDEX IF NOT EXISTS idx_permissions_action_id ON permissions(action_id);

COMMENT ON TABLE permissions IS 'Quyền hạn cụ thể trong hệ thống';
COMMENT ON COLUMN permissions.code IS 'Mã permission duy nhất (menu.users.create, api.tasks.delete, ...)';
COMMENT ON COLUMN permissions.resource_type IS 'Loại resource: menu, api, feature, report, ...';
COMMENT ON COLUMN permissions.resource_id IS 'ID của resource (menu_id, api_id, ...)';

-- 1.7. Bảng menu_translations (dịch tên menu theo locale)
CREATE TABLE IF NOT EXISTS menu_translations (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(menu_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_menu_translations_menu_id ON menu_translations(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_translations_locale ON menu_translations(locale);

COMMENT ON TABLE menu_translations IS 'Bản dịch tên/description cho menus theo từng locale';
COMMENT ON COLUMN menu_translations.locale IS 'Mã locale (vi, en, ko, ja, ...)';

-- 1.8. Bảng action_translations (dịch tên action theo locale)
CREATE TABLE IF NOT EXISTS action_translations (
  id SERIAL PRIMARY KEY,
  action_id INTEGER NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(action_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_action_translations_action_id ON action_translations(action_id);
CREATE INDEX IF NOT EXISTS idx_action_translations_locale ON action_translations(locale);

COMMENT ON TABLE action_translations IS 'Bản dịch tên/description cho actions theo từng locale';
COMMENT ON COLUMN action_translations.locale IS 'Mã locale (vi, en, ko, ja, ...)';

-- 1.9. Bảng role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by INTEGER,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_is_granted ON role_permissions(is_granted);

COMMENT ON TABLE role_permissions IS 'Gán permissions cho role';
COMMENT ON COLUMN role_permissions.is_granted IS 'TRUE = cho phép, FALSE = từ chối (explicit deny)';

-- 1.8. Bảng user_permissions (gán trực tiếp cho user, song song với role_permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by INTEGER,
  UNIQUE(user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_is_granted ON user_permissions(is_granted);

COMMENT ON TABLE user_permissions IS 'Gán permissions trực tiếp cho user (override theo từng người dùng)';
COMMENT ON COLUMN user_permissions.is_granted IS 'TRUE = cho phép, FALSE = từ chối (explicit deny)';

-- =====================================================
-- STEP 2: CREATE TRIGGERS
-- =====================================================

-- Trigger để auto-update updated_at cho roles
DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger để auto-update updated_at cho menus
DROP TRIGGER IF EXISTS trg_menus_updated_at ON menus;
CREATE TRIGGER trg_menus_updated_at
BEFORE UPDATE ON menus
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 3: SEED DATA - ROLES
-- =====================================================

INSERT INTO roles (code, name, description, level, is_system) VALUES
('super_admin', 'Super Admin', 'Quyền cao nhất, quản trị toàn hệ thống', 1, true),
('admin', 'Admin', 'Quản trị viên, quản lý người dùng và nội dung', 2, true),
('user', 'User', 'Người dùng thông thường', 3, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 4: SEED DATA - MENUS (Hierarchical structure with Settings)
-- =====================================================

-- Root menus
INSERT INTO menus (code, name, path, icon, parent_id, sort_order, metadata) VALUES
('dashboard', 'Dashboard', '/dashboard', 'Home', NULL, 1, '{"description": "Trang chủ tổng quan"}'::jsonb),
('create_task', 'New Task', '/create-task', 'Plus', NULL, 2, '{"description": "Tạo task OCR mới"}'::jsonb),
('tasks', 'Tasks', '/tasks', 'FolderOpen', NULL, 3, '{"description": "Quản lý tasks OCR"}'::jsonb),
('ocr', 'OCR Processing', '/tasks', 'Eye', NULL, 4, '{"description": "Xử lý OCR"}'::jsonb),
('settings', 'Settings', '/settings', 'Settings', NULL, 5, '{"description": "Cài đặt hệ thống"}'::jsonb);

-- Settings submenus (parent_id = settings menu id)
INSERT INTO menus (code, name, path, icon, parent_id, sort_order, metadata)
SELECT 
  'users', 
  'Users', 
  '/settings/users', 
  'Users', 
  (SELECT id FROM menus WHERE code = 'settings'),
  1,
  '{"description": "Quản lý người dùng"}'::jsonb;

INSERT INTO menus (code, name, path, icon, parent_id, sort_order, metadata)
SELECT 
  'roles', 
  'Roles', 
  '/settings/roles', 
  'Shield', 
  (SELECT id FROM menus WHERE code = 'settings'),
  2,
  '{"description": "Quản lý vai trò"}'::jsonb;

INSERT INTO menus (code, name, path, icon, parent_id, sort_order, metadata)
SELECT 
  'permissions', 
  'Permissions', 
  '/settings/permissions', 
  'Lock', 
  (SELECT id FROM menus WHERE code = 'settings'),
  3,
  '{"description": "Quản lý phân quyền"}'::jsonb;

INSERT INTO menus (code, name, path, icon, parent_id, sort_order, metadata)
SELECT 
  'logs', 
  'System Logs', 
  '/settings/logs', 
  'List', 
  (SELECT id FROM menus WHERE code = 'settings'),
  4,
  '{"description": "Nhật ký hệ thống"}'::jsonb;

-- =====================================================
-- STEP 5: SEED DATA - ACTIONS
-- =====================================================

INSERT INTO actions (code, name, description, category) VALUES
-- CRUD actions
('view', 'View', 'Xem/truy cập', 'CRUD'),
('create', 'Create', 'Tạo mới', 'CRUD'),
('update', 'Update', 'Cập nhật', 'CRUD'),
('delete', 'Delete', 'Xóa', 'CRUD'),
('display', 'Display', 'Hiển thị chi tiết', 'CRUD'),

-- Import/Export actions
('export', 'Export', 'Xuất dữ liệu', 'IMPORT_EXPORT'),
('import', 'Import', 'Nhập dữ liệu', 'IMPORT_EXPORT'),

-- Workflow actions
('approve', 'Approve', 'Phê duyệt', 'WORKFLOW'),
('reject', 'Reject', 'Từ chối', 'WORKFLOW'),

-- Special actions
('share', 'Share', 'Chia sẻ', 'SPECIAL'),
('download', 'Download', 'Tải xuống', 'SPECIAL')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 6: SEED DATA - MENU_ACTIONS
-- =====================================================

-- Dashboard: chỉ view
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'dashboard' AND a.code IN ('view')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Create Task: view
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'create_task' AND a.code IN ('view')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Tasks: view, create, update, delete, export, share, download
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'tasks' AND a.code IN ('view', 'create', 'update', 'delete', 'export', 'share', 'download')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- OCR: view
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'ocr' AND a.code IN ('view')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Settings: view
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'settings' AND a.code IN ('view')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Users (submenu): view, create, update, delete
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'users' AND a.code IN ('view', 'create', 'update', 'delete')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Roles (submenu): view, create, update, delete, display
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'roles' AND a.code IN ('view', 'create', 'update', 'delete', 'display')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Permissions (submenu): view, update (grant/revoke)
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'permissions' AND a.code IN ('view', 'update')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- Logs (submenu): view, export
INSERT INTO menu_actions (menu_id, action_id, display_name)
SELECT m.id, a.id, a.name
FROM menus m, actions a
WHERE m.code = 'logs' AND a.code IN ('view', 'export')
ON CONFLICT (menu_id, action_id) DO NOTHING;

-- =====================================================
-- STEP 7: SEED DATA - PERMISSIONS
-- =====================================================

-- Tạo permissions từ menu_actions
INSERT INTO permissions (code, resource_type, resource_id, action_id, description)
SELECT 
  CONCAT('menu.', m.code, '.', a.code) as code,
  'menu' as resource_type,
  m.id as resource_id,
  a.id as action_id,
  CONCAT(a.name, ' on ', m.name) as description
FROM menus m
JOIN menu_actions ma ON ma.menu_id = m.id
JOIN actions a ON a.id = ma.action_id
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 8: SEED DATA - ROLE_PERMISSIONS
-- =====================================================

-- SUPER_ADMIN: Full quyền tất cả
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.code = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN: Full quyền trừ logs và permissions management
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.code = 'admin' 
  AND p.code NOT LIKE 'menu.logs.%'
  AND p.code NOT LIKE 'menu.permissions.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- USER: Chỉ dashboard, create_task, tasks (view, create, update, share, download)
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT r.id, p.id, TRUE
FROM roles r, permissions p
WHERE r.code = 'user' 
  AND p.code IN (
    'menu.dashboard.view',
    'menu.create_task.view',
    'menu.tasks.view',
    'menu.tasks.create',
    'menu.tasks.update',
    'menu.tasks.share',
    'menu.tasks.download'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- STEP 9: MIGRATE EXISTING USERS
-- =====================================================

-- Gán role cho users hiện có dựa vào trường users.role
INSERT INTO user_role_assignments (user_id, role_id, assigned_at)
SELECT u.id, r.id, NOW()
FROM users u
JOIN roles r ON r.code = u.role
WHERE u.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura
    WHERE ura.user_id = u.id AND ura.role_id = r.id
  );

-- =====================================================
-- STEP 10: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Lấy danh sách permissions của user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE(permission_code VARCHAR) AS $$
BEGIN
  RETURN QUERY
  -- Permissions thông qua roles
  SELECT DISTINCT p.code
  FROM permissions p
  JOIN role_permissions rp ON rp.permission_id = p.id AND rp.is_granted = TRUE
  JOIN user_role_assignments ura ON ura.role_id = rp.role_id
  WHERE ura.user_id = p_user_id

  UNION

  -- Permissions gán trực tiếp cho user
  SELECT DISTINCT p2.code
  FROM permissions p2
  JOIN user_permissions up ON up.permission_id = p2.id AND up.is_granted = TRUE
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_permissions IS 'Lấy danh sách tất cả permissions của user';

-- Function: Kiểm tra user có permission không
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id INTEGER,
  p_permission_code VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN
    -- Quyền đến từ roles
    EXISTS(
      SELECT 1
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id AND rp.is_granted = TRUE
      JOIN user_role_assignments ura ON ura.role_id = rp.role_id
      WHERE ura.user_id = p_user_id
        AND p.code = p_permission_code
    )
    OR
    -- Quyền gán trực tiếp cho user
    EXISTS(
      SELECT 1
      FROM permissions p2
      JOIN user_permissions up ON up.permission_id = p2.id AND up.is_granted = TRUE
      WHERE up.user_id = p_user_id
        AND p2.code = p_permission_code
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_user_permission IS 'Kiểm tra user có permission cụ thể hay không';

-- Function: Lấy danh sách menus của user
CREATE OR REPLACE FUNCTION get_user_menus(p_user_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  code VARCHAR,
  name VARCHAR,
  path VARCHAR,
  icon VARCHAR,
  parent_id INTEGER,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    m.id,
    m.code,
    m.name,
    m.path,
    m.icon,
    m.parent_id,
    m.sort_order
  FROM menus m
  JOIN permissions p ON p.resource_type = 'menu' AND p.resource_id = m.id
  JOIN role_permissions rp ON rp.permission_id = p.id AND rp.is_granted = TRUE
  JOIN user_role_assignments ura ON ura.role_id = rp.role_id
  JOIN actions a ON a.id = p.action_id
  WHERE ura.user_id = p_user_id
    AND m.is_active = TRUE
    AND a.code = 'view'

  UNION

  SELECT DISTINCT 
    m2.id,
    m2.code,
    m2.name,
    m2.path,
    m2.icon,
    m2.parent_id,
    m2.sort_order
  FROM menus m2
  JOIN permissions p2 ON p2.resource_type = 'menu' AND p2.resource_id = m2.id
  JOIN user_permissions up ON up.permission_id = p2.id AND up.is_granted = TRUE
  JOIN actions a2 ON a2.id = p2.action_id
  WHERE up.user_id = p_user_id
    AND m2.is_active = TRUE
    AND a2.code = 'view'
  ORDER BY sort_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_menus IS 'Lấy danh sách menu mà user có quyền view';

-- Function: Lấy danh sách actions của user trên một menu
CREATE OR REPLACE FUNCTION get_user_menu_actions(
  p_user_id INTEGER,
  p_menu_code VARCHAR
)
RETURNS TABLE(action_code VARCHAR) AS $$
BEGIN
  RETURN QUERY
  -- Actions từ permissions gán qua roles
  SELECT DISTINCT a.code
  FROM actions a
  JOIN permissions p ON p.action_id = a.id
  JOIN menus m ON m.id = p.resource_id AND p.resource_type = 'menu'
  JOIN role_permissions rp ON rp.permission_id = p.id AND rp.is_granted = TRUE
  JOIN user_role_assignments ura ON ura.role_id = rp.role_id
  WHERE ura.user_id = p_user_id
    AND m.code = p_menu_code

  UNION

  -- Actions từ permissions gán trực tiếp cho user
  SELECT DISTINCT a2.code
  FROM actions a2
  JOIN permissions p2 ON p2.action_id = a2.id
  JOIN menus m2 ON m2.id = p2.resource_id AND p2.resource_type = 'menu'
  JOIN user_permissions up ON up.permission_id = p2.id AND up.is_granted = TRUE
  WHERE up.user_id = p_user_id
    AND m2.code = p_menu_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_menu_actions IS 'Lấy danh sách actions mà user có thể thực hiện trên một menu';

-- =====================================================
-- STEP 11: CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- View: User với roles
CREATE OR REPLACE VIEW v_user_roles AS
SELECT 
  u.id as user_id,
  u.user_name,
  u.name as user_name_display,
  u.email,
  r.id as role_id,
  r.code as role_code,
  r.name as role_name,
  r.level as role_level,
  ura.assigned_at
FROM users u
JOIN user_role_assignments ura ON ura.user_id = u.id
JOIN roles r ON r.id = ura.role_id
WHERE u.is_deleted = FALSE
  AND r.is_active = TRUE;

COMMENT ON VIEW v_user_roles IS 'View tổng hợp users và roles của họ';

-- View: Role với permissions
CREATE OR REPLACE VIEW v_role_permissions AS
SELECT 
  r.id as role_id,
  r.code as role_code,
  r.name as role_name,
  p.id as permission_id,
  p.code as permission_code,
  p.resource_type,
  p.description as permission_description,
  rp.is_granted,
  rp.granted_at
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.is_active = TRUE;

COMMENT ON VIEW v_role_permissions IS 'View tổng hợp roles và permissions';

-- View: Menu với actions
CREATE OR REPLACE VIEW v_menu_actions AS
SELECT 
  m.id as menu_id,
  m.code as menu_code,
  m.name as menu_name,
  m.path as menu_path,
  m.icon as menu_icon,
  a.id as action_id,
  a.code as action_code,
  a.name as action_name,
  a.category as action_category,
  ma.display_name
FROM menus m
JOIN menu_actions ma ON ma.menu_id = m.id
JOIN actions a ON a.id = ma.action_id
WHERE m.is_active = TRUE;

COMMENT ON VIEW v_menu_actions IS 'View tổng hợp menu và actions có thể thực hiện';

-- =====================================================
-- MIGRATION COMPLETED
-- =====================================================

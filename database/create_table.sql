-- BachTV's Corner - PostgreSQL Schema (blog platform)
-- Consolidated table creation script
-- Safe to run on a fresh database

-- ===========================================
-- DROP EXISTING TABLES (order matters)
-- ===========================================
DROP TABLE IF EXISTS post_shares CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS advertisements CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS password_reset_token CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
-- RBAC tables
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS menu_actions CASCADE;
DROP TABLE IF EXISTS action_translations CASCADE;
DROP TABLE IF EXISTS menu_translations CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===========================================
-- 1) USERS - Người dùng
-- ===========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  password VARCHAR(150) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email VARCHAR(150) NOT NULL,
  phone_number VARCHAR(20),
  bio TEXT,
  website VARCHAR(255),
  social_links JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  is_sso BOOLEAN DEFAULT FALSE,
  sub VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin','admin','user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_user_name ON users(user_name);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_sub ON users(sub);

-- ===========================================
-- 2) RBAC - ROLES
-- ===========================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  level INT DEFAULT 99,
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by INT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

-- ===========================================
-- 3) RBAC - MENUS
-- ===========================================
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(255),
  icon VARCHAR(50),
  parent_id INT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_menus_code ON menus(code);
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active);
CREATE INDEX IF NOT EXISTS idx_menus_sort_order ON menus(sort_order);

-- ===========================================
-- 4) RBAC - ACTIONS
-- ===========================================
CREATE TABLE actions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(30) DEFAULT 'CRUD' CHECK (category IN ('CRUD','IMPORT_EXPORT','WORKFLOW','SPECIAL','REPORT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_actions_code ON actions(code);
CREATE INDEX IF NOT EXISTS idx_actions_category ON actions(category);

-- ===========================================
-- 5) RBAC - MENU_ACTIONS (gán action cho menu)
-- ===========================================
CREATE TABLE menu_actions (
  id SERIAL PRIMARY KEY,
  menu_id INT NOT NULL,
  action_id INT NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_actions ON menu_actions(menu_id, action_id);
CREATE INDEX IF NOT EXISTS idx_menu_actions_menu_id ON menu_actions(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_actions_action_id ON menu_actions(action_id);

-- ===========================================
-- 6) RBAC - PERMISSIONS
-- ===========================================
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  resource_type VARCHAR(30) DEFAULT 'menu' CHECK (resource_type IN ('menu','api','feature','report','data')),
  resource_id INT,
  action_id INT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_id ON permissions(resource_id);

-- ===========================================
-- 7) RBAC - USER_ROLE_ASSIGNMENTS
-- ===========================================
CREATE TABLE user_role_assignments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by INT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_role ON user_role_assignments(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON user_role_assignments(role_id);

-- ===========================================
-- 8) RBAC - ROLE_PERMISSIONS
-- ===========================================
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by INT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_role_permission ON role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ===========================================
-- 9) RBAC - USER_PERMISSIONS (direct user permissions)
-- ===========================================
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by INT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_permission ON user_permissions(user_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- ===========================================
-- 10) RBAC - MENU_TRANSLATIONS
-- ===========================================
CREATE TABLE menu_translations (
  id SERIAL PRIMARY KEY,
  menu_id INT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_translation ON menu_translations(menu_id, locale);
CREATE INDEX IF NOT EXISTS idx_menu_translations_menu_id ON menu_translations(menu_id);

-- ===========================================
-- 11) RBAC - ACTION_TRANSLATIONS
-- ===========================================
CREATE TABLE action_translations (
  id SERIAL PRIMARY KEY,
  action_id INT NOT NULL,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_action_translation ON action_translations(action_id, locale);
CREATE INDEX IF NOT EXISTS idx_action_translations_action_id ON action_translations(action_id);

-- ===========================================
-- 12) CATEGORIES - Danh mục bài viết
-- ===========================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  parent_id INT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- ===========================================
-- 13) TAGS - Thẻ/nhãn bài viết
-- ===========================================
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  post_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ===========================================
-- 14) POSTS - Bài viết
-- ===========================================
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  cover_image_url TEXT,
  author_id INT NOT NULL,
  category_id INT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived','scheduled')),
  visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','unlisted')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);

-- ===========================================
-- 15) POST_TAGS - Liên kết bài viết - thẻ
-- ===========================================
CREATE TABLE post_tags (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_post_tags ON post_tags(post_id, tag_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- ===========================================
-- 16) COMMENTS - Bình luận (BIGINT for high volume)
-- ===========================================
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT,
  parent_id BIGINT,
  author_name VARCHAR(100),
  author_email VARCHAR(150),
  author_url VARCHAR(255),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  is_spam BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  like_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ===========================================
-- 17) POST_LIKES - Like bài viết (BIGINT)
-- ===========================================
CREATE TABLE post_likes (
  id BIGSERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT,
  session_id VARCHAR(100),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_post_likes_user ON post_likes(post_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_post_likes_session ON post_likes(post_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ===========================================
-- 18) POST_SHARES - Chia sẻ bài viết (BIGINT)
-- ===========================================
CREATE TABLE post_shares (
  id BIGSERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT,
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('facebook','twitter','linkedin','whatsapp','telegram','copy_link','other')),
  session_id VARCHAR(100),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_platform ON post_shares(platform);
CREATE INDEX IF NOT EXISTS idx_post_shares_created_at ON post_shares(created_at);

-- ===========================================
-- 19) ADVERTISEMENTS - Quảng cáo
-- ===========================================
CREATE TABLE advertisements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL DEFAULT 'banner' CHECK (type IN ('banner','sidebar','popup','inline','native')),
  position VARCHAR(50) NOT NULL,
  image_url TEXT,
  link_url TEXT,
  html_content TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  view_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_dates ON advertisements(start_date, end_date);

-- ===========================================
-- 20) SYSTEM_LOGS - Nhật ký hệ thống
-- ===========================================
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (level IN ('debug','info','warn','error')),
  event VARCHAR(100) NOT NULL,
  module VARCHAR(100),
  action VARCHAR(100),
  message TEXT,
  user_id INT,
  post_id INT,
  comment_id BIGINT,
  request_id VARCHAR(64),
  route VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_event ON system_logs(event);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- ===========================================
-- 21) REFRESH_TOKENS
-- ===========================================
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ===========================================
-- 22) PASSWORD_RESET_TOKEN
-- ===========================================
CREATE TABLE password_reset_token (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_user_id ON password_reset_token(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token_token ON password_reset_token(token);

-- ===========================================
-- 23) USER_TOKENS - Tokens for invite, verification
-- ===========================================
CREATE TABLE user_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  token_type VARCHAR(30) NOT NULL CHECK (token_type IN ('INVITE','RESET_PASSWORD','EMAIL_VERIFY')),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_token_hash ON user_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_tokens_type ON user_tokens(token_type);

-- ===========================================
-- TRIGGERS - Auto update updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_menus_updated_at ON menus;
CREATE TRIGGER trg_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON posts;
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_advertisements_updated_at ON advertisements;
CREATE TRIGGER trg_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SEED DATA - Super Admin
-- ===========================================
-- Password: bach.tv2000@gmail.com2025
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'bach.tv2000@gmail.com') THEN
    INSERT INTO users (user_name, password, name, email, bio, is_active, role)
    VALUES ('bachtv', '$2b$10$dlmPwV0NfM9kHM2VCBW3euitglLY2s5IBA1IMPHejB1vT.BT.283u', 'Bach TV', 'bach.tv2000@gmail.com', 'Chủ blog - Chia sẻ kinh nghiệm lập trình', TRUE, 'super_admin');
  END IF;
END$$;

-- Seed default roles
INSERT INTO roles (code, name, description, level, is_system) VALUES
  ('super_admin', 'Super Admin', 'Toàn quyền hệ thống', 1, TRUE),
  ('admin', 'Admin', 'Quản trị viên', 2, TRUE),
  ('user', 'User', 'Người dùng thường', 3, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed default actions
INSERT INTO actions (code, name, description, category) VALUES
  ('view', 'View', 'Xem dữ liệu', 'CRUD'),
  ('create', 'Create', 'Tạo mới', 'CRUD'),
  ('update', 'Update', 'Cập nhật', 'CRUD'),
  ('delete', 'Delete', 'Xóa', 'CRUD'),
  ('export', 'Export', 'Xuất dữ liệu', 'IMPORT_EXPORT'),
  ('import', 'Import', 'Nhập dữ liệu', 'IMPORT_EXPORT'),
  ('approve', 'Approve', 'Phê duyệt', 'WORKFLOW'),
  ('reject', 'Reject', 'Từ chối', 'WORKFLOW'),
  ('share', 'Share', 'Chia sẻ', 'SPECIAL'),
  ('download', 'Download', 'Tải xuống', 'SPECIAL')
ON CONFLICT (code) DO NOTHING;

-- Seed default menus
INSERT INTO menus (code, name, path, icon, parent_id, sort_order) VALUES
  ('dashboard', 'Dashboard', '/dashboard', 'Home', NULL, 1),
  ('posts', 'Bài viết', '/admin/posts', 'FileText', NULL, 2),
  ('categories', 'Danh mục', '/admin/categories', 'Folder', NULL, 3),
  ('tags', 'Thẻ tags', '/admin/tags', 'Tag', NULL, 4),
  ('comments', 'Bình luận', '/admin/comments', 'MessageSquare', NULL, 5),
  ('ads', 'Quảng cáo', '/admin/ads', 'Megaphone', NULL, 6),
  ('settings', 'Cài đặt', '/settings', 'Settings', NULL, 10),
  ('users', 'Người dùng', '/settings/users', 'Users', 7, 1),
  ('roles', 'Vai trò', '/settings/roles', 'Shield', 7, 2),
  ('permissions', 'Phân quyền', '/settings/permissions', 'Lock', 7, 3),
  ('logs', 'Nhật ký', '/settings/logs', 'ScrollText', 7, 4)
ON CONFLICT (code) DO NOTHING;

-- Seed default categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Lập trình', 'lap-trinh', 'Bài viết về lập trình, coding', 'Code', 1),
  ('Kinh nghiệm', 'kinh-nghiem', 'Chia sẻ kinh nghiệm làm việc', 'Lightbulb', 2),
  ('Dự án', 'du-an', 'Showcase các dự án đã làm', 'FolderOpen', 3),
  ('Cuộc sống', 'cuoc-song', 'Góc nhìn về cuộc sống', 'Heart', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed default tags
INSERT INTO tags (name, slug, color) VALUES
  ('JavaScript', 'javascript', '#f7df1e'),
  ('TypeScript', 'typescript', '#3178c6'),
  ('React', 'react', '#61dafb'),
  ('Next.js', 'nextjs', '#000000'),
  ('Node.js', 'nodejs', '#339933'),
  ('PostgreSQL', 'postgresql', '#336791'),
  ('Docker', 'docker', '#2496ed'),
  ('DevOps', 'devops', '#ff6b6b')
ON CONFLICT (slug) DO NOTHING;

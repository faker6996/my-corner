-- =====================================================
-- OCR Editing - RBAC Translations Seed
-- Created: 2025-12-16
-- Description: Seed initial translations for menus and actions
--              into menu_translations and action_translations
--              for locales: en, vi, ko, ja
-- =====================================================

-- =====================================================
-- MENUS TRANSLATIONS
-- =====================================================

-- Dashboard
INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'Dashboard', 'Dashboard'
FROM menus WHERE code = 'dashboard'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Bảng điều khiển', N'Trang chính tổng quan'
FROM menus WHERE code = 'dashboard'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', '대시보드', '대시보드'
FROM menus WHERE code = 'dashboard'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', 'ダッシュボード', 'ダッシュボード'
FROM menus WHERE code = 'dashboard'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- New Task
INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'New Task', 'Create new OCR task'
FROM menus WHERE code = 'create_task'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Tạo nhiệm vụ', N'Tạo nhiệm vụ OCR mới'
FROM menus WHERE code = 'create_task'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'새 작업', N'새 OCR 작업 생성'
FROM menus WHERE code = 'create_task'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'新規タスク', N'新しいOCRタスクを作成'
FROM menus WHERE code = 'create_task'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Tasks
INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'Tasks', 'Manage OCR tasks'
FROM menus WHERE code = 'tasks'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Nhiệm vụ', N'Quản lý nhiệm vụ OCR'
FROM menus WHERE code = 'tasks'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'작업', N'OCR 작업 관리'
FROM menus WHERE code = 'tasks'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'タスク', N'OCRタスクの管理'
FROM menus WHERE code = 'tasks'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- OCR Processing
INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'OCR Processing', 'OCR processing'
FROM menus WHERE code = 'ocr'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Xử lý OCR', N'Xử lý OCR'
FROM menus WHERE code = 'ocr'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'OCR 처리', N'OCR 처리'
FROM menus WHERE code = 'ocr'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'OCR処理', N'OCR処理'
FROM menus WHERE code = 'ocr'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Settings
INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'Settings', 'System settings'
FROM menus WHERE code = 'settings'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Cài đặt', N'Cài đặt hệ thống'
FROM menus WHERE code = 'settings'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'설정', N'시스템 설정'
FROM menus WHERE code = 'settings'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'設定', N'システム設定'
FROM menus WHERE code = 'settings'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Settings children: Users / Roles / Permissions / Logs

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'Users', 'Manage users'
FROM menus WHERE code = 'users'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Người dùng', N'Quản lý người dùng'
FROM menus WHERE code = 'users'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'사용자', N'사용자 관리'
FROM menus WHERE code = 'users'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'ユーザー', N'ユーザー管理'
FROM menus WHERE code = 'users'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'Roles', 'Manage roles'
FROM menus WHERE code = 'roles'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Vai trò', N'Quản lý vai trò'
FROM menus WHERE code = 'roles'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'역할', N'역할 관리'
FROM menus WHERE code = 'roles'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'ロール', N'ロール管理'
FROM menus WHERE code = 'roles'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'Permissions', 'Manage permissions'
FROM menus WHERE code = 'permissions'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Phân quyền', N'Quản lý phân quyền'
FROM menus WHERE code = 'permissions'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'권한', N'권한 관리'
FROM menus WHERE code = 'permissions'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'権限', N'権限管理'
FROM menus WHERE code = 'permissions'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'en', 'System Logs', 'System logs'
FROM menus WHERE code = 'logs'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'vi', N'Nhật ký hệ thống', N'Nhật ký hệ thống'
FROM menus WHERE code = 'logs'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ko', N'시스템 로그', N'시스템 로그'
FROM menus WHERE code = 'logs'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO menu_translations (menu_id, locale, name, description)
SELECT id, 'ja', N'システムログ', N'システムログ'
FROM menus WHERE code = 'logs'
ON CONFLICT (menu_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- =====================================================
-- ACTIONS TRANSLATIONS
-- =====================================================

-- view
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'View', 'View / access'
FROM actions WHERE code = 'view'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Xem', N'Xem / truy cập'
FROM actions WHERE code = 'view'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'보기', N'조회 / 접근'
FROM actions WHERE code = 'view'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'表示', N'表示 / アクセス'
FROM actions WHERE code = 'view'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- create
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Create', 'Create new'
FROM actions WHERE code = 'create'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Tạo', N'Tạo mới'
FROM actions WHERE code = 'create'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'생성', N'새로 생성'
FROM actions WHERE code = 'create'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'作成', N'新規作成'
FROM actions WHERE code = 'create'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- update
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Update', 'Update / edit'
FROM actions WHERE code = 'update'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Cập nhật', N'Cập nhật / chỉnh sửa'
FROM actions WHERE code = 'update'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'수정', N'수정 / 편집'
FROM actions WHERE code = 'update'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'更新', N'更新 / 編集'
FROM actions WHERE code = 'update'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- delete
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Delete', 'Delete'
FROM actions WHERE code = 'delete'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Xóa', N'Xóa'
FROM actions WHERE code = 'delete'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'삭제', N'삭제'
FROM actions WHERE code = 'delete'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'削除', N'削除'
FROM actions WHERE code = 'delete'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- display
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Display', 'Display details'
FROM actions WHERE code = 'display'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Hiển thị', N'Hiển thị chi tiết'
FROM actions WHERE code = 'display'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'표시', N'상세 표시'
FROM actions WHERE code = 'display'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'表示', N'詳細表示'
FROM actions WHERE code = 'display'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- export
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Export', 'Export data'
FROM actions WHERE code = 'export'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Xuất', N'Xuất dữ liệu'
FROM actions WHERE code = 'export'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'내보내기', N'데이터 내보내기'
FROM actions WHERE code = 'export'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'エクスポート', N'データをエクスポート'
FROM actions WHERE code = 'export'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- import
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Import', 'Import data'
FROM actions WHERE code = 'import'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Nhập', N'Nhập dữ liệu'
FROM actions WHERE code = 'import'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'가져오기', N'데이터 가져오기'
FROM actions WHERE code = 'import'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'インポート', N'データをインポート'
FROM actions WHERE code = 'import'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- approve
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Approve', 'Approve'
FROM actions WHERE code = 'approve'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Phê duyệt', N'Phê duyệt'
FROM actions WHERE code = 'approve'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'승인', N'승인'
FROM actions WHERE code = 'approve'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'承認', N'承認'
FROM actions WHERE code = 'approve'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- reject
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Reject', 'Reject'
FROM actions WHERE code = 'reject'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Từ chối', N'Từ chối'
FROM actions WHERE code = 'reject'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'반려', N'반려'
FROM actions WHERE code = 'reject'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'却下', N'却下'
FROM actions WHERE code = 'reject'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- share
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Share', 'Share'
FROM actions WHERE code = 'share'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Chia sẻ', N'Chia sẻ'
FROM actions WHERE code = 'share'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'공유', N'공유'
FROM actions WHERE code = 'share'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'共有', N'共有'
FROM actions WHERE code = 'share'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- download
INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'en', 'Download', 'Download'
FROM actions WHERE code = 'download'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'vi', N'Tải xuống', N'Tải xuống'
FROM actions WHERE code = 'download'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ko', N'다운로드', N'다운로드'
FROM actions WHERE code = 'download'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO action_translations (action_id, locale, name, description)
SELECT id, 'ja', N'ダウンロード', N'ダウンロード'
FROM actions WHERE code = 'download'
ON CONFLICT (action_id, locale) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- =====================================================
-- SEED COMPLETED
-- =====================================================


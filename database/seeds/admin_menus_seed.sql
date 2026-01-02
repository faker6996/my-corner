-- ===========================================
-- Admin Menus Seed Script for BachTV's Corner
-- Run this script to add admin menus and permissions
-- ===========================================

-- Add missing menus (tags)
INSERT INTO menus (code, name, path, icon, parent_id, sort_order) VALUES
  ('tags', 'Thẻ tags', '/admin/tags', 'Tag', NULL, 4)
ON CONFLICT (code) DO NOTHING;

-- Update existing menus to ensure correct paths
UPDATE menus SET path = '/admin/posts' WHERE code = 'posts';
UPDATE menus SET path = '/admin/categories' WHERE code = 'categories';
UPDATE menus SET path = '/admin/comments' WHERE code = 'comments';
UPDATE menus SET path = '/admin/ads' WHERE code = 'ads';

-- ========================================
-- MENU ACTIONS (link menus to actions)
-- ========================================

-- Get action IDs
DO $$
DECLARE
  v_view_id INT;
  v_create_id INT;
  v_update_id INT;
  v_delete_id INT;
  v_posts_id INT;
  v_categories_id INT;
  v_tags_id INT;
  v_comments_id INT;
  v_ads_id INT;
BEGIN
  -- Get action IDs
  SELECT id INTO v_view_id FROM actions WHERE code = 'view';
  SELECT id INTO v_create_id FROM actions WHERE code = 'create';
  SELECT id INTO v_update_id FROM actions WHERE code = 'update';
  SELECT id INTO v_delete_id FROM actions WHERE code = 'delete';
  
  -- Get menu IDs
  SELECT id INTO v_posts_id FROM menus WHERE code = 'posts';
  SELECT id INTO v_categories_id FROM menus WHERE code = 'categories';
  SELECT id INTO v_tags_id FROM menus WHERE code = 'tags';
  SELECT id INTO v_comments_id FROM menus WHERE code = 'comments';
  SELECT id INTO v_ads_id FROM menus WHERE code = 'ads';
  
  -- Posts menu actions
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_posts_id, v_view_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_posts_id, v_create_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_posts_id, v_update_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_posts_id, v_delete_id) ON CONFLICT DO NOTHING;
  
  -- Categories menu actions
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_categories_id, v_view_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_categories_id, v_create_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_categories_id, v_update_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_categories_id, v_delete_id) ON CONFLICT DO NOTHING;
  
  -- Tags menu actions
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_tags_id, v_view_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_tags_id, v_create_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_tags_id, v_update_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_tags_id, v_delete_id) ON CONFLICT DO NOTHING;
  
  -- Comments menu actions (no create, just moderate)
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_comments_id, v_view_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_comments_id, v_update_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_comments_id, v_delete_id) ON CONFLICT DO NOTHING;
  
  -- Ads menu actions
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_ads_id, v_view_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_ads_id, v_create_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_ads_id, v_update_id) ON CONFLICT DO NOTHING;
  INSERT INTO menu_actions (menu_id, action_id) VALUES (v_ads_id, v_delete_id) ON CONFLICT DO NOTHING;
END $$;

-- ========================================
-- PERMISSIONS (create permission records)
-- ========================================

-- Create permissions for admin menus
INSERT INTO permissions (code, resource_type, resource_id, action_id)
SELECT 
  'menu:' || m.code || ':' || a.code,
  'menu',
  m.id,
  a.id
FROM menus m
CROSS JOIN actions a
WHERE m.code IN ('posts', 'categories', 'tags', 'comments', 'ads')
  AND a.code IN ('view', 'create', 'update', 'delete')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- ROLE PERMISSIONS (assign to admin roles)
-- ========================================

-- Give all admin menu permissions to super_admin and admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('super_admin', 'admin')
  AND p.code LIKE 'menu:posts:%'
     OR p.code LIKE 'menu:categories:%'
     OR p.code LIKE 'menu:tags:%'
     OR p.code LIKE 'menu:comments:%'
     OR p.code LIKE 'menu:ads:%'
ON CONFLICT DO NOTHING;

-- ========================================
-- MENU TRANSLATIONS (Vietnamese/English)
-- ========================================

INSERT INTO menu_translations (menu_id, locale, name) 
SELECT m.id, 'vi', m.name FROM menus m WHERE m.code IN ('posts', 'categories', 'tags', 'comments', 'ads')
ON CONFLICT DO NOTHING;

INSERT INTO menu_translations (menu_id, locale, name) VALUES
  ((SELECT id FROM menus WHERE code = 'posts'), 'en', 'Posts'),
  ((SELECT id FROM menus WHERE code = 'categories'), 'en', 'Categories'),
  ((SELECT id FROM menus WHERE code = 'tags'), 'en', 'Tags'),
  ((SELECT id FROM menus WHERE code = 'comments'), 'en', 'Comments'),
  ((SELECT id FROM menus WHERE code = 'ads'), 'en', 'Advertisements')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Admin menus seeded successfully!' AS result;

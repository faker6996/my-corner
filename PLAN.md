# BachTV's Corner - Kế hoạch triển khai

## Tổng quan

Blog cá nhân chia sẻ kinh nghiệm lập trình với các tính năng: bài viết, bình luận, like, chia sẻ social, quản lý admin.

## Architecture Pattern

> **Tuân theo pattern các API cũ đang có:**

```
app/api/[resource]/route.ts    → API endpoints (gọi app)
lib/modules/[module]/
├── applications/[module]_app.ts   → Business logic
├── repositories/[module]_repo.ts  → Database access
lib/models/[model].ts              → Entity class
```

**Ví dụ cho Posts module:**

```
app/api/posts/route.ts
lib/modules/posts/applications/post_app.ts
lib/modules/posts/repositories/post_repo.ts
lib/models/post.ts
```

---

## Phase 1: Backend APIs (Core) ✅

### 1.1 Posts Module ✅

### 1.2 Categories & Tags ✅

### 1.3 Comments ✅

### 1.4 Likes & Shares ✅

---

## Phase 2: Frontend Pages (Public) ✅

### 2.1 Home Page ✅

### 2.2 Post List & Detail ✅

### 2.3 Category & Tag Pages ✅

### 2.4 Search ✅

### 2.5 Underverse UI + Tailwind CSS ✅

**SSR SEO:** Tất cả pages sử dụng `generateMetadata` với:

- Dynamic OG tags
- Twitter cards
- Canonical URLs
- i18n alternates
- Structured data

---

## Phase 3: Admin Panel

### 3.1 Post Management

- [ ] `app/[locale]/(pages)/admin/posts/page.tsx` - Danh sách
- [ ] `app/[locale]/(pages)/admin/posts/new/page.tsx` - Tạo mới
- [ ] `app/[locale]/(pages)/admin/posts/[id]/edit/page.tsx` - Chỉnh sửa
- [ ] Rich text editor (TipTap/Quill)

### 3.2 Category/Tag Management

- [ ] `app/[locale]/(pages)/admin/categories/page.tsx`
- [ ] `app/[locale]/(pages)/admin/tags/page.tsx`

### 3.3 Comment Moderation

- [ ] `app/[locale]/(pages)/admin/comments/page.tsx`
- [ ] Approve/spam/delete comments

### 3.4 Ads Management

- [ ] `app/[locale]/(pages)/admin/ads/page.tsx`
- [ ] CRUD quảng cáo theo vị trí

### 3.5 Analytics Dashboard

- [ ] `app/[locale]/(pages)/admin/analytics/page.tsx`
- [ ] Thống kê views, likes, comments

---

## Phase 4: Advanced Features

### 4.1 Social Sharing

- [ ] Facebook, Twitter share buttons
- [ ] Open Graph meta tags

### 4.2 SEO

- [ ] Dynamic sitemap.xml
- [ ] Meta tags cho từng bài viết

### 4.3 Email Notifications

- [ ] Thông báo comment mới
- [ ] Newsletter subscription

### 4.4 Image Upload

- [ ] Upload ảnh cho bài viết
- [ ] Image optimization

---

## Thứ tự ưu tiên

| Tuần | Nội dung                                        |
| ---- | ----------------------------------------------- |
| 1    | Phase 1.1-1.2 (Posts, Categories, Tags APIs)    |
| 2    | Phase 2.1-2.2 (Home, Post pages)                |
| 3    | Phase 1.3-1.4 + Phase 2.3-2.4 (Comments, Likes) |
| 4    | Phase 3 (Admin panel)                           |
| 5    | Phase 4 (Advanced features)                     |

---

## Database

Schema: `database/create_table.sql`

### Blog Tables

| Bảng             | Mô tả             | ID Type    |
| ---------------- | ----------------- | ---------- |
| `users`          | Người dùng        | INT        |
| `posts`          | Bài viết          | INT        |
| `categories`     | Danh mục          | INT        |
| `tags`           | Thẻ               | INT        |
| `post_tags`      | Liên kết post-tag | INT        |
| `comments`       | Bình luận         | **BIGINT** |
| `post_likes`     | Like              | **BIGINT** |
| `post_shares`    | Chia sẻ           | **BIGINT** |
| `advertisements` | Quảng cáo         | INT        |
| `system_logs`    | Logs              | INT        |

### RBAC Tables (đã có sẵn)

| Bảng                    | Mô tả               |
| ----------------------- | ------------------- |
| `roles`                 | Vai trò             |
| `menus`                 | Menu                |
| `actions`               | Actions (CRUD)      |
| `permissions`           | Quyền hạn           |
| `menu_actions`          | Gán action cho menu |
| `role_permissions`      | Gán quyền cho role  |
| `user_permissions`      | Gán quyền cho user  |
| `user_role_assignments` | Gán role cho user   |
| `menu_translations`     | Dịch menu           |
| `action_translations`   | Dịch action         |

---

## Đã hoàn thành

- [x] Database schema (22 tables)
- [x] Models: User, Post, Category, Tag, Comment, Advertisement
- [x] RBAC system (roles, permissions, menus)
- [x] Authentication (login, register, SSO Google/Facebook)
- [x] Middleware (auth, CORS, rate limit)

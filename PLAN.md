# BachTV's Corner - Kế hoạch triển khai

## Tổng quan

Blog cá nhân chia sẻ kinh nghiệm lập trình với các tính năng: bài viết, bình luận, like, chia sẻ social, quản lý admin.

---

## Phase 1: Backend APIs (Core)

### 1.1 Posts Module

- [ ] `lib/modules/posts/` - CRUD bài viết
- [ ] `app/api/posts/` - Endpoints: list, detail, create, update, delete
- [ ] `app/api/posts/[slug]/` - Get post by slug
- [ ] Pagination, filtering by category/tag/status

### 1.2 Categories & Tags

- [ ] `lib/modules/categories/` - CRUD danh mục
- [ ] `lib/modules/tags/` - CRUD tags
- [ ] `app/api/categories/`, `app/api/tags/`

### 1.3 Comments

- [ ] `lib/modules/comments/` - Bình luận (nested replies)
- [ ] `app/api/posts/[id]/comments/` - CRUD comments

### 1.4 Likes & Shares

- [ ] `app/api/posts/[id]/like` - Like/unlike
- [ ] `app/api/posts/[id]/share` - Track shares

---

## Phase 2: Frontend Pages (Public)

### 2.1 Home Page

- [ ] `app/[locale]/(pages)/page.tsx` - Trang chủ blog
- [ ] Featured posts, recent posts, categories

### 2.2 Post List & Detail

- [ ] `app/[locale]/(pages)/blog/page.tsx` - Danh sách bài viết
- [ ] `app/[locale]/(pages)/blog/[slug]/page.tsx` - Chi tiết bài viết
- [ ] Components: `PostCard`, `PostDetail`, `CommentSection`

### 2.3 Category & Tag Pages

- [ ] `app/[locale]/(pages)/category/[slug]/page.tsx`
- [ ] `app/[locale]/(pages)/tag/[slug]/page.tsx`

### 2.4 Search

- [ ] `app/[locale]/(pages)/search/page.tsx` - Tìm kiếm bài viết

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

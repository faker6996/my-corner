# Checklist triển khai tính năng mời và kích hoạt tài khoản

Trình tự từ lúc admin tạo user → gửi email mời → user kích hoạt/verify. Làm lần lượt theo checklist để có bản chạy ổn định.

## 1) Chốt quy tắc sản phẩm
- Trạng thái mặc định của user do admin tạo: khuyến nghị `INVITED`.
- Khi chưa kích hoạt: không cho đăng nhập.
- Kích hoạt gồm: verify email + đặt mật khẩu.
- Link mời hết hạn (khuyến nghị: 48h) và quy định rate limit resend.

## 2) Thiết kế DB & state
- Bảng `users` thêm:
  - `status` (`INVITED|ACTIVE|DISABLED`)
  - `email_verified_at` (nullable)
  - `password_hash` (nullable)
- Bảng `user_tokens` (khuyến nghị):
  - `user_id`, `purpose='INVITE'`
  - `token_hash` (unique), `expires_at`, `used_at`, `revoked_at`
  - `sent_count`, `last_sent_at`
  - Audit: `created_by_admin_id`, `ip`, `user_agent`
- Tạo index để lookup token nhanh.

## 3) Chức năng Admin tạo user
- Admin UI: form tạo user (email, role…).
- API `POST /admin/users`.
- Validate & normalize email.
- Tạo user với `status=INVITED`.
- Gọi service tạo invite token (random token → hash → insert `user_tokens`).
- Push job gửi email (khuyến nghị: queue; hệ thống nhỏ có thể gửi sync).
- Log/audit: admin nào tạo, thời gian.

## 4) Hệ thống gửi email (transactional)
- Cấu hình domain gửi mail (SPF/DKIM/DMARC nếu có).
- Template email: “You’re invited / Activate your account”.
- Worker/job `SendInviteEmail`:
  - Link `https://your-site.com/activate?token=...`
  - Update `sent_count`, `last_sent_at`
- Thêm rate limit resend ở tầng API.

## 5) Trang kích hoạt (frontend)
- Route `/activate?token=...`.
- UI cần có:
  - Trạng thái token hợp lệ/hết hạn.
  - Form đặt mật khẩu (và confirm).
  - Nút “Resend invite” nếu token hết hạn.
- Lưu ý: GET chỉ để hiển thị, chưa kích hoạt.

## 6) API Check token
- API `POST /api/invite/validate` (hoặc `GET /api/invite/validate?token=...`).
- Backend:
  - Hash token → tìm trong `user_tokens` còn sống (chưa dùng, chưa revoke, chưa hết hạn).
  - Trả `OK | Expired | Invalid` (không tiết lộ thông tin nhạy cảm).

## 7) API Activate account
- API `POST /api/activate`.
- Body: `{ token, password }`.
- Backend (transaction):
  - Validate password policy.
  - Hash token.
  - Consume token atomic: update `used_at=now()` với điều kiện token còn hiệu lực, return `user_id`.
  - Update user:
    - Set `password_hash`.
    - Set `email_verified_at` (nếu null).
    - Set `status=ACTIVE`.
  - (Tuỳ UX) tạo session/login luôn.

## 8) Resend / Revoke
- Resend (admin):
  - `POST /admin/users/{id}/resend-invite`
  - Rate limit.
  - Revoke token cũ còn sống → tạo token mới → gửi email.
- Revoke invite:
  - `POST /admin/users/{id}/revoke-invite`
  - Revoke token còn sống; giữ `INVITED` hoặc chuyển `DISABLED` (tuỳ bạn).

## 9) Chặn đăng nhập & phân quyền
- Middleware login:
  - Nếu `status != ACTIVE` → chặn đăng nhập (trả message hướng dẫn).
  - Với action nhạy cảm: yêu cầu `email_verified_at` khác null.

## 10) Bảo mật & edge case
- Không log token plain, mask query string.
- Rate limit `/api/activate` theo IP để chống brute force.
- Chống email scanner: GET không activate, chỉ POST mới activate.
- Xử lý idempotent:
  - Token đã dùng → báo đã kích hoạt.
  - Token hết hạn → hướng dẫn resend.

## 11) Test bắt buộc
- Admin tạo user → nhận email → activate thành công → login OK.
- Click link 2 lần → lần 2 báo used.
- Token hết hạn → resend → token mới hoạt động, token cũ fail.
- Admin đổi email user khi trạng thái `INVITED` → token cũ bị revoke.
- Rate limit resend hoạt động.
- User bị `DISABLED` không activate/login được.

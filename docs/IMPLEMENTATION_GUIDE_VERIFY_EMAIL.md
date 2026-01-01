# HƯỚNG DẪN TRIỂN KHAI: Tính năng Kích hoạt Tài khoản

Hướng dẫn này áp dụng file `GUIDE_VERIFY_EMAIL.md` gốc vào cấu trúc dự án `INF_DEV` cụ thể.

## 1. Thay đổi Database

Dự án sử dụng pattern Repository tùy chỉnh với raw SQL/Query Builder, nên bạn cần cập nhật database thủ công.

### SQL để thực thi
Chạy đoạn SQL sau để cập nhật schema:

```sql
-- 1. Chỉnh sửa bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE'; -- Mặc định active cho user cũ
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

-- 2. Tạo bảng user_tokens
CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'INVITE', 'RESET_PASSWORD'
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_token_hash ON user_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
```

### Cập nhật Models
#### [MODIFY] `lib/models/user.ts`
- Thêm thuộc tính `status: string`.
- Thêm thuộc tính `email_verified_at: Date | string`.
- Cập nhật mapping `columns` static để thêm các trường mới.

#### [NEW] `lib/models/user_token.ts`
- Tạo class `UserToken` kế thừa `BaseModel` (nếu có) hoặc làm theo mẫu của `User`.

## 2. Implement Backend

### Logic Token
- Tạo `lib/utils/token.ts`: Các hàm sinh token ngẫu nhiên (hex) và hash token (sha256).

### Repository
#### [NEW] `lib/modules/user/repositories/user_token_repo.ts`
- Các phương thức: `createToken`, `findValidToken`, `markTokenUsed`.

### Application Service
#### [MODIFY] `lib/modules/user/applications/user_app.ts`
- `createUser`:
  - Đổi status mặc định thành `'INVITED'` (nếu tạo qua luồng mới).
  - Sinh invite token.
  - Insert vào `user_tokens`.
  - **Gửi Email** sử dụng `lib/utils/email.ts`.
- `activateUser`:
  - Validate token.
  - Set password.
  - Cập nhật user status thành `'ACTIVE'`.
  - Đánh dấu token đã sử dụng.

### APIs
#### [NEW] `app/api/auth/activate/route.ts`
- `POST`: Xử lý kích hoạt (token + password).
- `GET`: (Tùy chọn) Validate token để hiển thị UI.

#### [NEW] `app/api/auth/invite/validate/route.ts`
- `POST`: Kiểm tra token có hợp lệ không.

## 3. Implement Frontend

### Trang Kích hoạt
#### [NEW] `app/[locale]/activate/page.tsx`
- **Route**: `/activate?token=...`
- **UI**:
  - Nếu token không hợp lệ/hết hạn: Hiện lỗi + Nút "Gửi lại lời mời" (tùy chọn).
  - Nếu token hợp lệ: Hiện form "Đặt mật khẩu".
- **Logic**:
  - Khi mount: Gọi API `validate`.
  - Khi submit: Gọi API `activate`.
  - Thành công: Chuyển hướng về `/login`.

## 4. Thay đổi giao diện Admin

### Danh sách Users
#### [MODIFY] `components/admin/users/UsersContainer.tsx`
- Hiển thị status "Invited" (có thể đổi màu Badge).
- Thêm action "Gửi lại lời mời" cho user đang mời.

---

## Kế hoạch thực hiện từng bước

1.  **Database**: Chạy script SQL.
2.  **Models**: Tạo model `UserToken` và cập nhật model `User`.
3.  **Repositories**: Tạo `UserTokenRepo`.
4.  **Utils**: Thêm utils sinh/hash token.
5.  **Service**: Cập nhật `user_app.ts` để xử lý logic mời.
6.  **APIs**: Tạo các endpoint validate và activate.
7.  **Frontend**: Tạo trang activate.
8.  **Admin UI**: Cập nhật danh sách user để hiển thị trạng thái.

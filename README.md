# BachTV's Corner

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19.2-blue.svg)

Blog cá nhân chia sẻ kinh nghiệm lập trình và thành quả cá nhân.

## 💡 Tính năng

- **Đa ngôn ngữ (i18n)**: Hỗ trợ en, vi, ja, ko với `next-intl`
- **Xác thực**: Đăng ký/đăng nhập, refresh token, SSO Google/Facebook
- **Hệ thống UI**: Tailwind CSS + Dark mode
- **Realtime**: Socket.IO Gateway

## 🛠 Công nghệ

- **Next.js** App Router 16.1, **React** 19.2, **TypeScript** 5.9
- **Tailwind CSS** 4.x, **Lucide React**
- **PostgreSQL** + **Redis**
- **JWT** authentication, **bcrypt**
- **Socket.IO** realtime

## 🚀 Bắt đầu nhanh

### Yêu cầu

- Node.js 18+ và npm
- PostgreSQL và Redis

### Cài đặt

```bash
git clone <repository-url>
cd my-corner
npm install
```

Tạo file `.env.local` và cập nhật giá trị phù hợp.

### Chạy dev

```bash
npm run dev
# hoặc (Turbopack)
npm run dev_v2
```

### Build production

```bash
npm run build
npm run start
```

## 🔑 Biến môi trường

| Biến                       | Mô tả                                      |
| -------------------------- | ------------------------------------------ |
| `DATABASE_URL`             | PostgreSQL connection string               |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection                           |
| `JWT_SECRET`               | Secret cho JWT (bắt buộc)                  |
| `FRONTEND_URL`             | URL frontend (VD: `http://localhost:3000`) |
| `UPLOAD_DIR`               | Thư mục upload (mặc định: `./uploads`)     |

## 📂 Cấu trúc thư mục

```
app/
  [locale]/              # layout, pages theo locale
  api/                   # API Routes
    auth/                # login, register, refresh, SSO
    upload/              # image upload
components/              # UI components
contexts/                # AuthContext, ThemeContext
i18n/                    # next-intl locales (en/vi/ja/ko)
lib/                     # utils, middlewares, models
```

## 🐳 Docker

```bash
npm run docker:up     # build + up service
npm run docker:down   # stop container
```

## 🌍 i18n

Locales: `en`, `vi`, `ja`, `ko` sử dụng `next-intl`.
Route theo locale: `/:locale/...`

## Bản quyền

Mã nguồn nội bộ.

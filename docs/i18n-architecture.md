Tài liệu i18n theo namespace (áp dụng chung cho dự án Next.js)

Mục tiêu
- Tránh file i18n đơn khối khó bảo trì
- Mỗi trang/tính năng có namespace riêng, dễ tìm, dễ review PR
- Nạp đúng những gói cần thiết cho từng trang (SSR + Client), tránh dynamic import JSON gây lỗi bundler
- Tương thích tốt với next-intl và kiến trúc App Router

Tư duy tổng quan
- Thư mục i18n dùng cấu trúc folder-per-namespace: `i18n/locales/<namespace>/<locale>.json`
- Mỗi file JSON có 1 key gốc duy nhất khớp với namespace bạn gọi bằng `useTranslations("<TopLevel>")`
- Toàn bộ JSON được import tĩnh qua `lib/i18n/manifest.ts` để Next bundler đóng gói an toàn
- Server (SSR) của từng page nạp đúng danh sách namespaces qua `getMessages(locale, { namespaces })` và bọc `NextIntlClientProvider`
- Client bổ sung merge theo pathname để hỗ trợ chuyển trang mượt mà

Cấu trúc thư mục chuẩn
- Global tối thiểu: `i18n/locales/common/<locale>.json` (chỉ những chuỗi thực sự toàn cục). Khuyến nghị hạn chế dùng
- Namespace theo trang/tính năng (ví dụ):
  - `i18n/locales/dashboard/<locale>.json` với key gốc `Dashboard`
  - `i18n/locales/tasks/<locale>.json` với key gốc `Tasks`
  - `i18n/locales/create-task/<locale>.json` với key gốc `CreateTask`
  - `i18n/locales/task/<locale>.json` với key gốc `Task`
  - Tính năng dùng lại:
    - `i18n/locales/ocr/<locale>.json` với key gốc `OCR` (con: `ocrDisplay`, `lineEditor`, ...)
    - `i18n/locales/llm/<locale>.json` với key gốc `LLM`
    - `i18n/locales/right-panel/<locale>.json` với key gốc `RightPanel`
    - `i18n/locales/pagination/<locale>.json` với key gốc `Pagination`
    - `i18n/locales/validation/<locale>.json` với key gốc `ValidationInput`

Luồng nạp i18n
- Server (SSR) tại file page:
  - Gọi: `const messages = await getMessages(locale, { namespaces: ["<ns1>", "<ns2>"] })`
  - Bọc: `<NextIntlClientProvider locale={locale} messages={messages}> ... </NextIntlClientProvider>`
  - Ví dụ thực tế trong repo:
    - `app/[locale]/(pages)/dashboard/page.tsx` → namespaces: `dashboard`, `ocr`, `validation`, `pagination`
    - `app/[locale]/(pages)/tasks/page.tsx` → `tasks`, `pagination`, `validation`
    - `app/[locale]/(pages)/create-task/page.tsx` → `create-task`, `ocr`, `validation`
    - `app/[locale]/(pages)/task/[id]/page.tsx` → `task`, `ocr`, `llm`, `right-panel`, `validation`
- Client:
  - `components/providers/UnderverseIntlBridge.tsx` dùng helper deriveNamespaces để import sẵn các bundle cần thiết khi điều hướng client

Ánh xạ route → namespaces
- `lib/i18n/namespaces.ts` kiểm tra prefix URL (sau segment locale) và trả về danh sách namespaces cần nạp cho client
- Mapping hiện tại trong repo:
  - `/login` → `auth-login`
  - `/register` → `auth-register`
  - `/forgot-password` → `auth-forgot`
  - `/reset-password` → `auth-reset`
  - `/dashboard` → `dashboard`, `ocr`
  - `/create-task` → `create-task`
  - `/tasks` → `tasks`, `ocr`, `llm`, `right-panel`, `pagination`
  - `/task` → `task`, `ocr`, `llm`, `right-panel`
  - `/users` → `users`, `pagination`
  - `/profile` → `profile`
  - `/logs` → `logs`
  - `/user-guide` → `user-guide`
  - `/403` → `errors`
- Luôn kèm namespaces toàn cục: `validation`, `pagination`

Manifest tĩnh (điểm then chốt)
- `lib/i18n/manifest.ts` import TĨNH tất cả file JSON theo namespace/locale và map thành bundles dạng `'namespace/vi'`
- API cung cấp:
  - `loadCommon(locale)`, `loadNamespace(ns, locale)` cho server và client dùng
- Lợi ích: tránh lỗi “Module not found” do dynamic import JSON và giúp bundler tree-shake tốt hơn

Hàm nạp messages (SSR & client)
- `lib/i18n/getMessages.ts`:
  - Nạp base từ `common/<locale>.json` (nếu có)
  - Với danh sách namespaces đầu vào, gọi `loadNamespace(ns, locale)` để merge tuần tự
  - Hỗ trợ truyền trực tiếp `namespaces` hoặc `pathname` (khi cần)

Quy ước code
- Trong component, gọi đúng key gốc:
  - `const t = useTranslations("Dashboard")`
  - `const tTasks = useTranslations("Tasks")`
  - Nhánh con: `const tocr = useTranslations("OCR.ocrDisplay")`
- Không đưa text UI của trang vào `Common` cho code mới; dùng namespace của chính trang

Thêm 1 trang/namespace mới – Checklist
1) Tạo file cho 4 locale:
   - `i18n/locales/<namespace>/<locale>.json`
   - JSON phải là `{ "<TopLevel>": { ... } }` và `<TopLevel>` là chuỗi bạn truyền vào `useTranslations()`
2) Đăng ký vào manifest:
   - Thêm import 4 file vào `lib/i18n/manifest.ts` và map `'namespace/<locale>'`
3) Sửa page SSR:
   - Nạp qua `getMessages(locale, { namespaces: ["<namespace>", ...] })` và bọc provider
4) (Khuyến nghị) Bổ sung mapping URL trong `lib/i18n/namespaces.ts`
5) Sử dụng trong component: `useTranslations("<TopLevel>")`

Script hỗ trợ migrate
- `scripts/split-common-locales.cjs`: tách các key top-level trong `common/<locale>.json` sang namespace theo map có sẵn; giữ lại `Common`
- `scripts/namespace-to-folders.cjs`: chuyển file phẳng `i18n/locales/<ns>.<locale>.json` thành folder `i18n/locales/<ns>/<locale>.json`
- `scripts/cleanup-flat-locales.cjs`: xóa các file phẳng sau khi migrate
- `scripts/clear-monolithic-locales.cjs`: xoá nội dung JSON đơn khối cũ (tạo `.bak` trước)

Ví dụ ngắn
- Dashboard:
  - File: `i18n/locales/dashboard/ja.json` với key `Dashboard`
  - Page SSR: `app/[locale]/(pages)/dashboard/page.tsx` nạp `dashboard`, `ocr`, `validation`, `pagination`
  - Component: `useTranslations("Dashboard")`, `useTranslations("OCR.ocrDisplay")`
- Tasks:
  - File: `i18n/locales/tasks/vi.json` với key `Tasks`
  - Page SSR: `app/[locale]/(pages)/tasks/page.tsx` nạp `tasks`, `pagination`, `validation`

Áp dụng cho dự án khác
- Sao chép cấu trúc thư mục `i18n/locales` theo namespace
- Copy các file `lib/i18n/manifest.ts`, `lib/i18n/getMessages.ts`, `lib/i18n/namespaces.ts`, `components/providers/UnderverseIntlBridge.tsx`
- Điều chỉnh route mapping theo router của bạn
- Đăng ký namespace mới của dự án vào manifest + namespaces; nạp trong page SSR
- Dọn toàn bộ text UI trang ra khỏi Common sang namespace tương ứng

Ghi chú
- Khi thêm/chỉnh sửa nhiều key, nên cập nhật đồng thời 4 locale để tránh lỗi MISSING_MESSAGE khi đổi ngôn ngữ
- Với các components dùng chung (Pagination, ValidationInput), luôn nạp namespace tương ứng hoặc thêm vào danh sách luôn kèm trong helper


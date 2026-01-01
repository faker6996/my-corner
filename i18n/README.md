I18n structure (folder-per-namespace)

Overview
- Each page/feature has its own namespace folder under `i18n/locales/<namespace>/<locale>.json`.
- The JSON inside must have a single top-level key that matches the namespace you call in code via `useTranslations("<TopLevel>")`.
  - Examples: `Dashboard`, `Tasks`, `CreateTask`, `Task`, `OCR`, `Pagination`, `ValidationInput`.
- We statically import all bundles in `lib/i18n/manifest.ts` so Next.js can bundle JSON without dynamic-import errors.
- Page files (SSR) load only the namespaces they need via `getMessages(locale, { namespaces: [...] })` and wrap with `NextIntlClientProvider`.

Directory layout
- Common base (optional, minimal):
  - `i18n/locales/common/vi.json`, `en.json`, `ko.json`, `ja.json`
  - Keep only truly global UI strings. Prefer page namespaces for page UI.
- Page/feature namespaces:
  - `i18n/locales/dashboard/<locale>.json` with top-level `Dashboard`
  - `i18n/locales/tasks/<locale>.json` with top-level `Tasks`
  - `i18n/locales/create-task/<locale>.json` with top-level `CreateTask`
  - `i18n/locales/task/<locale>.json` with top-level `Task`
  - Reusable feature namespaces:
    - `i18n/locales/ocr/<locale>.json` with top-level `OCR` (nested: `ocrDisplay`, `lineEditor`, ...)
    - `i18n/locales/llm/<locale>.json` with top-level `LLM`
    - `i18n/locales/right-panel/<locale>.json` with top-level `RightPanel`
    - `i18n/locales/pagination/<locale>.json` with top-level `Pagination`
    - `i18n/locales/validation/<locale>.json` with top-level `ValidationInput`

How loading works
- Server (SSR):
  - Page files call:
    - `const messages = await getMessages(locale, { namespaces: ["dashboard", "ocr", "validation"] })`
    - Then wrap with `<NextIntlClientProvider locale={locale} messages={messages}>`.
  - See examples:
    - `app/[locale]/(pages)/dashboard/page.tsx` → namespaces: `dashboard`, `ocr`, `validation`, `pagination`
    - `app/[locale]/(pages)/tasks/page.tsx` → namespaces: `tasks`, `pagination`, `validation`
    - `app/[locale]/(pages)/create-task/page.tsx` → namespaces: `create-task`, `ocr`, `validation`
    - `app/[locale]/(pages)/task/[id]/page.tsx` → namespaces: `task`, `ocr`, `llm`, `right-panel`, `validation`
- Client: `components/providers/UnderverseIntlBridge.tsx` uses a pathname→namespaces helper and merges additional messages when navigating client-side.

Namespace mapping by route
- `lib/i18n/namespaces.ts` maps URL prefixes to namespaces. Current mapping:
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
- Always included globally: `validation`, `pagination` (added by the helper).

Coding conventions
- In components, call the exact top-level key:
  - `const t = useTranslations("Dashboard")`
  - `const tTasks = useTranslations("Tasks")`
  - `const tocr = useTranslations("OCR.ocrDisplay")` for nested groups
- Do NOT put page UI strings under `Common` for new code. Keep them in the page namespace.

Adding a new page/namespace
1) Create files:
   - `i18n/locales/<namespace>/<locale>.json`
   - JSON content must be `{ "<TopLevel>": { ... } }`, where `<TopLevel>` is what you’ll use in `useTranslations()`.
2) Register in manifest:
   - Import all four locales in `lib/i18n/manifest.ts`
   - Add to `bundles` as `'namespace/vi': vi_ns`, `'namespace/en': en_ns`, `'namespace/ko': ko_ns`, `'namespace/ja': ja_ns`.
3) SSR page:
   - In the page file, load namespaces via `getMessages(locale, { namespaces: ["<namespace>", ...] })` and wrap provider.
4) Route mapping (optional but recommended for client nav):
   - Update `lib/i18n/namespaces.ts` to map the URL prefix to the new namespace.
5) Use in components:
   - `const t = useTranslations("<TopLevel>")` and reference keys under it.

Scripts (migration utilities)
- `scripts/split-common-locales.cjs`: split `common/<locale>.json` top-level keys into per-namespace files. Keeps `Common` in place.
- `scripts/namespace-to-folders.cjs`: move flat files `i18n/locales/<ns>.<locale>.json` → `i18n/locales/<ns>/<locale>.json`.
- `scripts/cleanup-flat-locales.cjs`: delete the old flat files after migration.
- `scripts/clear-monolithic-locales.cjs`: blank legacy monolithic `i18n/locales/<locale>.json` if present (keeps a `.bak`).

Examples
- Dashboard (client):
  - `const t = useTranslations("Dashboard")`
  - `const tocr = useTranslations("OCR.ocrDisplay")`
- Tasks (client):
  - `const t = useTranslations("Tasks")`

Tips
- Keep keys concise and grouped logically.
- Prefer page-specific namespaces over `Common`.
- When adding new submodules under `OCR`, keep the nesting (e.g., `OCR.lineEditor`, `OCR.ocrDisplay`).


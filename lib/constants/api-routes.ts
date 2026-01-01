export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
    SSO_FACEBOOK: "/api/auth/sso_facebook",
    SSO_GOOGLE: "/api/auth/sso_google",
    SSO_GOOGLE_GET_TOKEN: "https://oauth2.googleapis.com/token",
    SSO_GOOGLE_GET_INFO: "https://www.googleapis.com/oauth2/v2/userinfo",
    SSO_FACEBOOK_GET_TOKEN: "https://graph.facebook.com/v12.0/oauth/access_token",
    SSO_FACEBOOK_GET_INFO: "https://graph.facebook.com/me",
  },
  OCR: {
    // Chuẩn hóa: dùng endpoint upload chung có lưu DB và phục vụ từ UPLOAD_DIR
    // Giữ key để tương thích ngược
    UPLOAD: "/api/upload/image",
    PROCESS: "/api/ocr/process",
  },
  UPLOAD: {
    IMAGE: "/api/upload/image",
    VIDEO: "/api/uploads/video",
  },
  TASKS: {
    CREATE: "/api/tasks",
    DETAIL: (id: number | string) => `/api/tasks/${id}`,
    RESULT: (id: number | string) => `/api/tasks/${id}/result`,
    NEXT_TITLE: "/api/tasks/next-title",
    GROUP_RESULTS: (id: number | string) => `/api/tasks/${id}/group-results`,
    APPLY_LINE_EDITS: (id: number | string) => `/api/tasks/${id}/apply-line-edits`,
    LLM_START: (id: number | string) => `/api/tasks/${id}/llm-start`,
    LLM_APPLY: (id: number | string) => `/api/tasks/${id}/llm-apply`,
    LLM_CORRECT_LINE: (id: number | string) => `/api/tasks/${id}/llm-correct-line`,
    TTS_START: (id: number | string) => `/api/tasks/${id}/tts-start`,
  },
  USERS: {
    LIST: "/api/users",
    DETAIL: (id: number | string) => `/api/users/${id}`,
  },
  UTILS: {
    VERIFY_EMAIL: "/api/utils/verify-email",
  },
  LOGS: {
    LIST: "/api/logs",
  },
  SEARCH: {
    USER_NAME: (user_name: string) => `/api/search/user?user_name=${user_name}`,
  },
  RESET_PASSWORD: {
    REQUEST: `/api/forgot-password`,
    RESET: "/api/reset-password",
  },
  NOTIFICATIONS: {
    LIST: "/api/notifications", // GET ?page=1&pageSize=10
    UPDATE: "/api/notifications", // PATCH { action: 'mark_all_read' | 'clear_all' }
    BROADCAST: "/api/notifications/broadcast", // POST admin only
  },
  PERMISSIONS: {
    MY_MENUS: "/api/permissions/my-menus",
    MY_PERMISSIONS: "/api/permissions/my-permissions",
  },
  RBAC: {
    ROLES: {
      SETUP_VIEW: "/api/rbac/roles/setup-view",
      ROOT: "/api/rbac/roles",
    },
    USERS: {
      SETUP_VIEW: "/api/rbac/users/setup-view",
    },
    PERMISSIONS: {
      SETUP_VIEW: "/api/rbac/permissions/setup-view",
      ROOT: "/api/rbac/permissions",
    },
    MENUS: {
      TASKS_SETUP_VIEW: "/api/rbac/menus/tasks/setup-view",
      ACTIONS: (menuId: number | string) => `/api/rbac/menus/${menuId}/actions`,
      TREE: "/api/rbac/menus/tree",
    },
  },
  BILLING: {
    ...(typeof (undefined as any) !== "undefined" && {}), // placeholder to keep structure stable
    TOKENS: {
      BALANCE: "/api/billing/tokens/balance",
      USAGE: "/api/billing/tokens/usage",
    },
  },
};

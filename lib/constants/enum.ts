// lib/constants/http-method.ts
export enum HTTP_METHOD_ENUM {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export enum Z_INDEX_LEVEL {
  BASE = 100, // base layout, header, fixed nav
  DROPDOWN = 1000, // dropdown, popover, select
  TOOLTIP = 2000, // tooltip
  DIALOG = 10000, // modal, popup
  LOADING = 100000, // global loading, overlay
}

export enum LOCALE {
  VI = "vi",
  EN = "en",
  KO = "ko",
  JA = "ja",
}

export enum APP_ROLE {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  USER = "user",
}

export enum LOG_LEVEL {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export enum LOG_EVENT {
  OCR_START = "ocr_start",
  OCR_COMPLETED = "ocr_completed",
  OCR_PERSIST_FAILED = "ocr_persist_failed",
  OCR_ERROR = "ocr_error",
  LLM_START = "llm_start",
  LLM_DISPATCHED = "llm_dispatched",
  LLM_ERROR = "llm_error",
  LLM_APPLY = "llm_apply",
  TASK_COMPLETED = "task_completed",
}

export enum TASK_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum TASK_STEP {
  UPLOAD = "upload",
  OCR = "ocr",
  LLM = "llm",
  TTS = "tts",
  COMPLETED = "completed",
}

export type AppRole = `${APP_ROLE}`;

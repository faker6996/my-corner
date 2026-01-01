// lib/i18n/manifest.ts
// Statically import JSON bundles so Next.js can bundle them correctly
// and provide a runtime lookup by namespace + locale.

import vi_common from "@/i18n/locales/common/vi.json";
import en_common from "@/i18n/locales/common/en.json";
import ko_common from "@/i18n/locales/common/ko.json";
import ja_common from "@/i18n/locales/common/ja.json";

// Auth
import en_auth_login from "@/i18n/locales/auth-login/en.json";
import vi_auth_login from "@/i18n/locales/auth-login/vi.json";
import ko_auth_login from "@/i18n/locales/auth-login/ko.json";
import ja_auth_login from "@/i18n/locales/auth-login/ja.json";

import en_auth_register from "@/i18n/locales/auth-register/en.json";
import vi_auth_register from "@/i18n/locales/auth-register/vi.json";

import en_auth_forgot from "@/i18n/locales/auth-forgot/en.json";
import vi_auth_forgot from "@/i18n/locales/auth-forgot/vi.json";
import ko_auth_forgot from "@/i18n/locales/auth-forgot/ko.json";
import ja_auth_forgot from "@/i18n/locales/auth-forgot/ja.json";

import en_auth_reset from "@/i18n/locales/auth-reset/en.json";
import vi_auth_reset from "@/i18n/locales/auth-reset/vi.json";
import ko_auth_reset from "@/i18n/locales/auth-reset/ko.json";
import ja_auth_reset from "@/i18n/locales/auth-reset/ja.json";

import en_auth_activate from "@/i18n/locales/auth-activate/en.json";
import vi_auth_activate from "@/i18n/locales/auth-activate/vi.json";
import ko_auth_activate from "@/i18n/locales/auth-activate/ko.json";
import ja_auth_activate from "@/i18n/locales/auth-activate/ja.json";

// Pages / sections
import en_users from "@/i18n/locales/users/en.json";
import vi_users from "@/i18n/locales/users/vi.json";
import ko_users from "@/i18n/locales/users/ko.json";
import ja_users from "@/i18n/locales/users/ja.json";

import en_logs from "@/i18n/locales/logs/en.json";
import vi_logs from "@/i18n/locales/logs/vi.json";
import ko_logs from "@/i18n/locales/logs/ko.json";
import ja_logs from "@/i18n/locales/logs/ja.json";

import en_profile from "@/i18n/locales/profile/en.json";
import vi_profile from "@/i18n/locales/profile/vi.json";
import ko_profile from "@/i18n/locales/profile/ko.json";
import ja_profile from "@/i18n/locales/profile/ja.json";

import en_loading from "@/i18n/locales/loading/en.json";
import vi_loading from "@/i18n/locales/loading/vi.json";
import ko_loading from "@/i18n/locales/loading/ko.json";
import ja_loading from "@/i18n/locales/loading/ja.json";

import en_pagination from "@/i18n/locales/pagination/en.json";
import vi_pagination from "@/i18n/locales/pagination/vi.json";
import ko_pagination from "@/i18n/locales/pagination/ko.json";
import ja_pagination from "@/i18n/locales/pagination/ja.json";

import en_validation from "@/i18n/locales/validation/en.json";
import vi_validation from "@/i18n/locales/validation/vi.json";
import ko_validation from "@/i18n/locales/validation/ko.json";
import ja_validation from "@/i18n/locales/validation/ja.json";

import en_errors from "@/i18n/locales/errors/en.json";
import vi_errors from "@/i18n/locales/errors/vi.json";
import ko_errors from "@/i18n/locales/errors/ko.json";
import ja_errors from "@/i18n/locales/errors/ja.json";

// dashboard
import en_dashboard from "@/i18n/locales/dashboard/en.json";
import vi_dashboard from "@/i18n/locales/dashboard/vi.json";
import ko_dashboard from "@/i18n/locales/dashboard/ko.json";
import ja_dashboard from "@/i18n/locales/dashboard/ja.json";

// roles
import en_roles from "@/i18n/locales/roles/en.json";
import vi_roles from "@/i18n/locales/roles/vi.json";
import ko_roles from "@/i18n/locales/roles/ko.json";
import ja_roles from "@/i18n/locales/roles/ja.json";

// settings
import en_settings from "@/i18n/locales/settings/en.json";
import vi_settings from "@/i18n/locales/settings/vi.json";
import ko_settings from "@/i18n/locales/settings/ko.json";
import ja_settings from "@/i18n/locales/settings/ja.json";

// permissions
import en_permissions from "@/i18n/locales/permissions/en.json";
import vi_permissions from "@/i18n/locales/permissions/vi.json";
import ko_permissions from "@/i18n/locales/permissions/ko.json";
import ja_permissions from "@/i18n/locales/permissions/ja.json";

// change-password
import en_change_password from "@/i18n/locales/change-password/en.json";
import vi_change_password from "@/i18n/locales/change-password/vi.json";
import ko_change_password from "@/i18n/locales/change-password/ko.json";
import ja_change_password from "@/i18n/locales/change-password/ja.json";

export type Locale = "vi" | "en" | "ko" | "ja";

const bundles: Record<string, any> = {
  // common
  "common/vi": vi_common,
  "common/en": en_common,
  "common/ko": ko_common,
  "common/ja": ja_common,

  // auth-login
  "auth-login/en": en_auth_login,
  "auth-login/vi": vi_auth_login,
  "auth-login/ko": ko_auth_login,
  "auth-login/ja": ja_auth_login,

  // auth-register
  "auth-register/en": en_auth_register,
  "auth-register/vi": vi_auth_register,

  // auth-forgot
  "auth-forgot/en": en_auth_forgot,
  "auth-forgot/vi": vi_auth_forgot,
  "auth-forgot/ko": ko_auth_forgot,
  "auth-forgot/ja": ja_auth_forgot,

  // auth-reset
  "auth-reset/en": en_auth_reset,
  "auth-reset/vi": vi_auth_reset,
  "auth-reset/ko": ko_auth_reset,
  "auth-reset/ja": ja_auth_reset,

  // auth-activate
  "auth-activate/en": en_auth_activate,
  "auth-activate/vi": vi_auth_activate,
  "auth-activate/ko": ko_auth_activate,
  "auth-activate/ja": ja_auth_activate,

  // users
  "users/en": en_users,
  "users/vi": vi_users,
  "users/ko": ko_users,
  "users/ja": ja_users,

  // logs
  "logs/en": en_logs,
  "logs/vi": vi_logs,
  "logs/ko": ko_logs,
  "logs/ja": ja_logs,

  // profile
  "profile/en": en_profile,
  "profile/vi": vi_profile,
  "profile/ko": ko_profile,
  "profile/ja": ja_profile,

  // loading
  "loading/en": en_loading,
  "loading/vi": vi_loading,
  "loading/ko": ko_loading,
  "loading/ja": ja_loading,

  // pagination
  "pagination/en": en_pagination,
  "pagination/vi": vi_pagination,
  "pagination/ko": ko_pagination,
  "pagination/ja": ja_pagination,

  // validation
  "validation/en": en_validation,
  "validation/vi": vi_validation,
  "validation/ko": ko_validation,
  "validation/ja": ja_validation,

  // errors
  "errors/en": en_errors,
  "errors/vi": vi_errors,
  "errors/ko": ko_errors,
  "errors/ja": ja_errors,

  // dashboard
  "dashboard/en": en_dashboard,
  "dashboard/vi": vi_dashboard,
  "dashboard/ko": ko_dashboard,
  "dashboard/ja": ja_dashboard,

  // roles
  "roles/en": en_roles,
  "roles/vi": vi_roles,
  "roles/ko": ko_roles,
  "roles/ja": ja_roles,

  // settings
  "settings/en": en_settings,
  "settings/vi": vi_settings,
  "settings/ko": ko_settings,
  "settings/ja": ja_settings,

  // permissions
  "permissions/en": en_permissions,
  "permissions/vi": vi_permissions,
  "permissions/ko": ko_permissions,
  "permissions/ja": ja_permissions,

  // change-password
  "change-password/en": en_change_password,
  "change-password/vi": vi_change_password,
  "change-password/ko": ko_change_password,
  "change-password/ja": ja_change_password,
};

export function loadNamespace(ns: string, locale: Locale): any | null {
  return bundles[`${ns}/${locale}`] || null;
}

export function loadCommon(locale: Locale): any {
  return bundles[`common/${locale}`];
}

export const availableNamespaces = Array.from(new Set(Object.keys(bundles).map((k) => k.split("/")[0])));

export default {
  loadNamespace,
  loadCommon,
  availableNamespaces,
};

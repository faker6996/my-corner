import { APP_ROLE } from "@/lib/constants";

export class User {
  id?: number;
  name?: string;
  user_name?: string;
  password?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
  address?: string;
  sub?: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_by?: number;
  is_sso?: boolean;
  role?: APP_ROLE.SUPER_ADMIN | APP_ROLE.ADMIN | APP_ROLE.USER;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
  preferences?: Record<string, any>;
  status?: string;
  email_verified_at?: string | null;

  static table = "users";
  static jsonbColumns = ["preferences"];
  static columns = {
    id: "id",
    name: "name",
    user_name: "user_name",
    password: "password",
    email: "email",
    avatar_url: "avatar_url",
    phone_number: "phone_number",
    address: "address",
    sub: "sub",
    is_active: "is_active",
    is_deleted: "is_deleted",
    created_by: "created_by",
    is_sso: "is_sso",
    role: "role",
    created_at: "created_at",
    updated_at: "updated_at",
    last_login_at: "last_login_at",
    preferences: "preferences",
    status: "status",
    email_verified_at: "email_verified_at",
  } as const;

  constructor(data: Partial<User> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === "object") {
      Object.assign(this, data);
    }
  }
}

export interface UserInfoSso {
  sub: string;
  name: string;
  email: string;
  verified_email: boolean;
  given_name: string;
  family_name: string;
  picture: picture;
  locale: string;
  id: number;
}
export interface UserInfoSsoGg {
  sub: string;
  name: string;
  email: string;
  verified_email: boolean;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
export interface picture {
  data: pictureData;
}
export interface pictureData {
  is_silhouette: boolean;
  height: number;
  width: number;
  url: string;
}

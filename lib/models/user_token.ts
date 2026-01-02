// lib/models/user_token.ts
// Token model for user activation, password reset, email verification

export class UserToken {
  id?: number;
  user_id?: number;
  token_hash?: string;
  token_type?: string; // INVITE, RESET_PASSWORD, EMAIL_VERIFY
  expires_at?: Date;
  used_at?: Date;
  created_at?: Date;

  static table = "user_tokens";
  static columns = {
    id: "id",
    user_id: "user_id",
    token_hash: "token_hash",
    token_type: "token_type",
    expires_at: "expires_at",
    used_at: "used_at",
    created_at: "created_at",
  } as const;

  constructor(data: Partial<UserToken> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
      if (typeof data.expires_at === "string") this.expires_at = new Date(data.expires_at);
      if (typeof data.used_at === "string") this.used_at = new Date(data.used_at);
      if (typeof data.created_at === "string") this.created_at = new Date(data.created_at);
    }
  }

  isExpired(): boolean {
    if (!this.expires_at) return true;
    return new Date() > this.expires_at;
  }

  isUsed(): boolean {
    return !!this.used_at;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  toJSON(): any {
    return {
      id: this.id,
      user_id: this.user_id,
      token_hash: this.token_hash,
      token_type: this.token_type,
      expires_at: this.expires_at?.toISOString(),
      used_at: this.used_at?.toISOString(),
      created_at: this.created_at?.toISOString(),
    };
  }
}

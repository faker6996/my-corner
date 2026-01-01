export class UserToken {
    id?: number;
    user_id?: number;
    token_hash?: string;
    purpose?: string; // 'INVITE', 'RESET_PASSWORD'
    expires_at?: string;
    used_at?: string | null;
    created_at?: string;
    metadata?: Record<string, any>;

    static table = "user_tokens";
    static jsonbColumns = ["metadata"];
    static columns = {
        id: "id",
        user_id: "user_id",
        token_hash: "token_hash",
        purpose: "purpose",
        expires_at: "expires_at",
        used_at: "used_at",
        created_at: "created_at",
        metadata: "metadata",
    } as const;

    constructor(data: Partial<UserToken> = {}) {
        if (data && typeof data === "object") {
            Object.assign(this, data);
        }
    }
}

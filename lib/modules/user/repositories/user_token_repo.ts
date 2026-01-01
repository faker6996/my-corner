import { safeQuery } from "@/lib/modules/common/safe_query";
import { baseRepo } from "@/lib/modules/common/base_repo";
import { UserToken } from "@/lib/models/user_token";

export const userTokenRepo = {
    /**
     * Tạo token mới và insert vào DB
     */
    async createToken(
        userId: number,
        tokenHash: string,
        purpose: string,
        expiresAt: Date,
        metadata?: Record<string, any>
    ): Promise<UserToken> {
        const token = new UserToken({
            user_id: userId,
            token_hash: tokenHash,
            purpose,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            metadata: metadata || {},
        });
        return await baseRepo.insert<UserToken>(token);
    },

    /**
     * Tìm token hợp lệ (chưa hết hạn, chưa sử dụng)
     */
    async findValidToken(tokenHash: string, purpose?: string): Promise<UserToken | null> {
        let sql = `
      SELECT * FROM ${UserToken.table}
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
    `;
        const params: any[] = [tokenHash];

        if (purpose) {
            sql += ` AND purpose = $2`;
            params.push(purpose);
        }

        const { rows } = await safeQuery(sql, params);
        return rows[0] ? new UserToken(rows[0]) : null;
    },

    /**
     * Đánh dấu token đã sử dụng
     */
    async markTokenUsed(id: number): Promise<void> {
        const sql = `UPDATE ${UserToken.table} SET used_at = NOW() WHERE id = $1`;
        await safeQuery(sql, [id]);
    },

    /**
     * Xóa tất cả token chưa sử dụng của user (dùng khi gửi lại invite)
     */
    async revokeUnusedTokens(userId: number, purpose: string): Promise<void> {
        const sql = `
      UPDATE ${UserToken.table}
      SET used_at = NOW()
      WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL
    `;
        await safeQuery(sql, [userId, purpose]);
    },

    /**
     * Lấy token theo user và purpose (chủ yếu để debug/admin)
     */
    async getTokensByUser(userId: number, purpose?: string): Promise<UserToken[]> {
        let sql = `SELECT * FROM ${UserToken.table} WHERE user_id = $1`;
        const params: any[] = [userId];

        if (purpose) {
            sql += ` AND purpose = $2`;
            params.push(purpose);
        }

        sql += ` ORDER BY created_at DESC`;

        const { rows } = await safeQuery(sql, params);
        return rows.map((row) => new UserToken(row));
    },
};

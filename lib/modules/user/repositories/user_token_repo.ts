import { query } from "@/lib/db";
import { UserToken } from "@/lib/models/user_token";

export const userTokenRepo = {
  async createToken(userId: number, tokenHash: string, tokenType: string, expiresAt: Date): Promise<UserToken> {
    const sql = `
      INSERT INTO user_tokens (user_id, token_hash, token_type, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await query(sql, [userId, tokenHash, tokenType, expiresAt]);
    const rows = result.rows || result;
    return new UserToken(rows[0]);
  },

  async findValidToken(tokenHash: string, tokenType: string): Promise<UserToken | null> {
    const sql = `
      SELECT * FROM user_tokens
      WHERE token_hash = $1 AND token_type = $2 AND expires_at > NOW() AND used_at IS NULL
      LIMIT 1
    `;
    const result = await query(sql, [tokenHash, tokenType]);
    const rows = result.rows || result;
    return rows.length > 0 ? new UserToken(rows[0]) : null;
  },

  async markTokenUsed(id: number): Promise<void> {
    const sql = `UPDATE user_tokens SET used_at = NOW() WHERE id = $1`;
    await query(sql, [id]);
  },

  async revokeUnusedTokens(userId: number, tokenType: string): Promise<void> {
    const sql = `UPDATE user_tokens SET used_at = NOW() WHERE user_id = $1 AND token_type = $2 AND used_at IS NULL`;
    await query(sql, [userId, tokenType]);
  },
};

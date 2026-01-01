import crypto from "crypto";

/**
 * Sinh token ngẫu nhiên (hex string)
 * @param length Độ dài bytes (mặc định 32 → 64 ký tự hex)
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash token bằng SHA256
 * @param token Token gốc
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Tạo cặp token (plain text để gửi email) và hash (để lưu DB)
 */
export function createTokenPair(): { token: string; tokenHash: string } {
    const token = generateToken();
    const tokenHash = hashToken(token);
    return { token, tokenHash };
}

/**
 * Tính thời gian hết hạn (mặc định 48 giờ)
 * @param hours Số giờ (mặc định 48)
 */
export function getExpiresAt(hours: number = 48): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt;
}

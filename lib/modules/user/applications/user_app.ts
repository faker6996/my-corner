import { baseRepo } from "@/lib/modules/common/base_repo";
import { userRepo } from "../repositories/user_repo";
import { userTokenRepo } from "../repositories/user_token_repo";
import { permissionCheckApp, roleRepo } from "@/lib/modules/rbac";
import { createTokenPair, getExpiresAt, hashToken } from "@/lib/utils/token";
import { sendEmail } from "@/lib/utils/email";
import { getEmailTranslations, generateInviteEmailHtml } from "@/lib/utils/email-i18n";
import { User } from "@/lib/models/user";
import { comparePassword, hashPassword } from "@/lib/utils/hash";
import { ApiError } from "@/lib/utils/error";
import { APP_ROLE } from "@/lib/constants";

export const userApp = {
  async verifyUser(email: string, password: string): Promise<User> {
    const user = await baseRepo.getByField<User>(User, User.columns.email, email);
    if (!user) throw new ApiError("Sai tài khoản hoặc mật khẩu", 401);

    const ok = await comparePassword(password, user.password ?? "");
    if (!ok) throw new ApiError("Sai tài khoản hoặc mật khẩu", 401);

    // Check if user is deleted
    if (user.is_deleted) {
      throw new ApiError("Tài khoản đã bị xóa", 403);
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ApiError("Tài khoản đã bị vô hiệu hóa", 403);
    }

    return user;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return await baseRepo.getByField<User>(User, User.columns.email, email);
  },

  async createUser(userData: Partial<User>): Promise<User> {
    if (!userData.email || !userData.password || !userData.name) {
      throw new ApiError("Email, password và name là bắt buộc", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ApiError("Email không hợp lệ", 400);
    }

    // Validate password length
    if (userData.password.length < 6) {
      throw new ApiError("Mật khẩu phải có ít nhất 6 ký tự", 400);
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new ApiError("Email đã được sử dụng", 400);
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(userData.password);

    // Generate username from email if not provided
    const username = userData.user_name || userData.email.split("@")[0];

    const newUserData = {
      ...userData,
      password: hashedPassword,
      user_name: username,
      is_active: true,
      is_sso: false,
      role: (userData.role as any) || APP_ROLE.USER,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newUser = new User(newUserData);
    return await baseRepo.insert<User>(newUser);
  },

  async execute(data: Partial<User>): Promise<User> {
    if (!data.email || !data.password) {
      throw new ApiError("Email and password are required", 400);
    }

    // Check if user already exists
    const existingUser = await baseRepo.getByField<User>(User, User.columns.email, data.email);
    if (existingUser) {
      throw new ApiError("User with this email already exists", 409);
    }

    const newUser = await baseRepo.insert<User>(data);
    return newUser;
  },

  async getAll(): Promise<User[]> {
    return await baseRepo.getAll<User>(User, {
      orderBy: ["created_at"],
      orderDirections: { created_at: "DESC" },
      allowedOrderFields: ["id", "created_at", "name", "user_name"],
    });
  },

  async getById(id: number): Promise<User> {
    const user = await baseRepo.getById<User>(User, id);
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    return user;
  },

  async updateAvatar(userId: number, avatarUrl: string): Promise<User> {
    const user = await baseRepo.getById<User>(User, userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    user.avatar_url = avatarUrl;
    user.updated_at = new Date().toISOString();
    const updated = await baseRepo.update<User>(user);
    if (!updated) {
      throw new ApiError("Failed to update avatar", 500);
    }

    // Update cache with new avatar
    const { cacheUser } = await import("@/lib/cache/user");
    await cacheUser(updated);

    return updated;
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await baseRepo.getById<User>(User, userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // SSO users cannot change password
    if (user.is_sso) {
      throw new ApiError("SSO users cannot change password", 400);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password ?? "");
    if (!isCurrentPasswordValid) {
      throw new ApiError("Current password is incorrect", 400);
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.updated_at = new Date().toISOString();

    const updated = await baseRepo.update<User>(user);
    if (!updated) {
      throw new ApiError("Failed to change password", 500);
    }

    // Clear user cache to force re-fetch
    const { invalidateUser } = await import("@/lib/cache/user");
    await invalidateUser(userId);
  },

  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await userRepo.searchByNameOrUsername(query.trim());
  },

  async searchUsersForMessenger(currentUserId: number, query: string): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await userRepo.searchUsersWithConversation(currentUserId, query.trim());
  },

  async searchUsersForGroupInvite(currentUserId: number, query: string, groupId: number): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      throw new ApiError("Search query must be at least 2 characters", 400);
    }

    return await userRepo.searchUsersForGroupInvite(currentUserId, query.trim(), groupId);
  },

  async listUsers(params: {
    filters?: {
      name?: string;
      user_name?: string;
      email?: string;
      role?: string;
      status?: string;
    };
    page?: number;
    pageSize?: number;
    currentUserId?: number;
    showDeleted?: boolean;
  }) {
    const filters = params.filters || {};
    const rawPage = params.page ?? 1;
    const rawPageSize = params.pageSize ?? 20;
    const showDeleted = params.showDeleted ?? false;

    const page = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
    const pageSize = Math.min(100, Math.max(1, Number.isFinite(rawPageSize) ? rawPageSize : 20));

    // Get current user's role level for filtering
    let minRoleLevel: number | undefined;
    if (params.currentUserId) {
      const userRoles = await roleRepo.getUserRoles(params.currentUserId);
      if (userRoles.length > 0) {
        // Get the highest privilege role (lowest level number)
        minRoleLevel = Math.min(...userRoles.map((r) => r.level ?? 999));
      }
    }

    return userRepo.listUsersPaged(filters, page, pageSize, minRoleLevel, showDeleted);
  },

  async getUserSummaryForAdminOrSelf(currentUser: User, id: number) {
    const isSelf = currentUser.id === id;
    const isAdmin = [APP_ROLE.ADMIN, APP_ROLE.SUPER_ADMIN].includes((currentUser as any).role);
    if (!isSelf && !isAdmin) throw new ApiError("Forbidden", 403);

    const row = await userRepo.getUserSummaryById(id);
    if (!row) throw new ApiError("User not found", 404);
    return row;
  },

  async updateUserAdmin(
    currentUser: User,
    id: number,
    payload: { isDeleted?: boolean; role?: APP_ROLE.SUPER_ADMIN | APP_ROLE.ADMIN | APP_ROLE.USER | undefined; name?: string; is_active?: boolean; email?: string; user_name?: string }
  ) {
    const { isDeleted, role, name, is_active, email, user_name } = payload;

    const target = await baseRepo.getById<User>(User, id);
    if (!target) throw new ApiError("User not found", 404);

    const isSelf = currentUser.id === id;
    const isSuperAdmin = (currentUser as any).role === APP_ROLE.SUPER_ADMIN;

    // Check RBAC permissions
    const canUpdate = await permissionCheckApp.checkMenuAction(currentUser.id!, "users", "update");
    const canDelete = await permissionCheckApp.checkMenuAction(currentUser.id!, "users", "delete");

    // Delete/Restore permission
    if (typeof isDeleted === "boolean" && !isSelf && !canDelete) {
      throw new ApiError("Forbidden", 403);
    }

    // Role change logic: need update permission, only SuperAdmin can set SuperAdmin
    if (role) {
      if (!canUpdate) throw new ApiError("Forbidden", 403);
      if (role === APP_ROLE.SUPER_ADMIN && !isSuperAdmin) {
        throw new ApiError("Only SuperAdmin can assign SuperAdmin role", 403);
      }
    }

    // Update name, email, user_name, and is_active require update permission
    if ((name !== undefined || is_active !== undefined || email !== undefined || user_name !== undefined) && !canUpdate) {
      throw new ApiError("Forbidden", 403);
    }

    // Validate email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError("Invalid email format", 400);
      }
      // Check if email already exists for another user
      const existingUser = await baseRepo.getByField<User>(User, User.columns.email, email);
      if (existingUser && existingUser.id !== id) {
        throw new ApiError("Email already exists", 409);
      }
    }

    const patchObj: any = { id, updated_at: new Date().toISOString() };
    if (typeof isDeleted === "boolean") patchObj.is_deleted = isDeleted;
    if (role) patchObj.role = role;
    if (name !== undefined) patchObj.name = name;
    if (user_name !== undefined) patchObj.user_name = user_name;
    if (is_active !== undefined) patchObj.is_active = is_active;
    if (email !== undefined) {
      patchObj.email = email;
      patchObj.email_verified_at = null; // Reset verification when email changes
    }

    const updated = await baseRepo.update<User>(new User(patchObj) as any);

    // Sync role to user_role_assignments for RBAC
    if (role) {
      await roleRepo.syncUserRole(id, role, currentUser.id);
    }

    // Clear user cache when email or name changes
    if (email !== undefined || name !== undefined) {
      const { invalidateUser } = await import("@/lib/cache/user");
      await invalidateUser(id);
    }

    return { id, isDeleted: updated?.is_deleted ?? isDeleted, role: (updated as any)?.role ?? role, name: (updated as any)?.name ?? name, email: (updated as any)?.email ?? email };
  },

  /**
   * Tạo user với status INVITED và gửi email mời
   */
  async inviteUser(userData: { name: string; email: string; role?: string }, baseUrl: string, locale: string = "en"): Promise<{ user: User; token: string }> {
    if (!userData.email || !userData.name) {
      throw new ApiError("Email và name là bắt buộc", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ApiError("Email không hợp lệ", 400);
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new ApiError("Email đã được sử dụng", 400);
    }

    // Generate username from email
    const username = userData.email.split("@")[0];

    // Create user with INVITED status (no password yet)
    const newUserData = {
      name: userData.name,
      email: userData.email,
      user_name: username,
      password: await hashPassword("123456"), // Default password, user can change on activation
      is_active: false,
      is_sso: false,
      status: "INVITED",
      role: (userData.role as any) || APP_ROLE.USER,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newUser = new User(newUserData);
    const insertedUser = await baseRepo.insert<User>(newUser);

    // Create invite token
    const { token, tokenHash } = createTokenPair();
    const expiresAt = getExpiresAt(48); // 48 hours
    await userTokenRepo.createToken(insertedUser.id!, tokenHash, "INVITE", expiresAt);

    // Send invite email with i18n support using admin's current locale
    const t = getEmailTranslations(locale);
    const activateUrl = `${baseUrl}/${locale}/activate?token=${token}`;
    await sendEmail({
      to: userData.email,
      subject: t.inviteSubject,
      html: generateInviteEmailHtml(activateUrl, locale),
    });

    return { user: insertedUser, token };
  },

  /**
   * Kích hoạt tài khoản: validate token, set password, update status
   */
  async activateUser(tokenPlain: string, password: string): Promise<User> {
    if (!tokenPlain || !password) {
      throw new ApiError("Token và password là bắt buộc", 400);
    }

    if (password.length < 6) {
      throw new ApiError("Mật khẩu phải có ít nhất 6 ký tự", 400);
    }

    // Hash token to find in DB
    const tokenHash = hashToken(tokenPlain);
    const tokenRecord = await userTokenRepo.findValidToken(tokenHash, "INVITE");

    if (!tokenRecord) {
      throw new ApiError("Token không hợp lệ hoặc đã hết hạn", 400);
    }

    // Get user
    const user = await baseRepo.getById<User>(User, tokenRecord.user_id!);
    if (!user) {
      throw new ApiError("User không tồn tại", 404);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user: set password, status, email_verified_at
    const patchObj = new User({
      id: user.id,
      password: hashedPassword,
      status: "ACTIVE",
      is_active: true,
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const updatedUser = await baseRepo.update<User>(patchObj);

    // Sync role to user_role_assignments for RBAC
    const userRole = (user as any).role || "user";
    await roleRepo.assignRoleToUser(user.id!, userRole);

    // Mark token as used
    await userTokenRepo.markTokenUsed(tokenRecord.id!);

    return updatedUser!;
  },

  /**
   * Gửi lại email mời (revoke token cũ, tạo mới)
   */
  async resendInvite(userId: number, baseUrl: string, locale: string = "en"): Promise<{ token: string }> {
    const user = await baseRepo.getById<User>(User, userId);
    if (!user) {
      throw new ApiError("User không tồn tại", 404);
    }

    if (user.status !== "INVITED") {
      throw new ApiError("User đã được kích hoạt", 400);
    }

    // Revoke old tokens
    await userTokenRepo.revokeUnusedTokens(userId, "INVITE");

    // Create new token
    const { token, tokenHash } = createTokenPair();
    const expiresAt = getExpiresAt(48);
    await userTokenRepo.createToken(userId, tokenHash, "INVITE", expiresAt);

    // Send email with i18n support using admin's current locale
    const t = getEmailTranslations(locale);
    const activateUrl = `${baseUrl}/${locale}/activate?token=${token}`;
    await sendEmail({
      to: user.email!,
      subject: t.inviteSubject,
      html: generateInviteEmailHtml(activateUrl, locale),
    });

    return { token };
  },

  /**
   * Gửi email xác thực khi thay đổi email (không check status INVITED)
   */
  async sendEmailChangeVerification(userId: number, newEmail: string, baseUrl: string, locale: string = "en"): Promise<{ token: string }> {
    const user = await baseRepo.getById<User>(User, userId);
    if (!user) {
      throw new ApiError("User không tồn tại", 404);
    }

    // Revoke old tokens
    await userTokenRepo.revokeUnusedTokens(userId, "INVITE");

    // Create new token
    const { token, tokenHash } = createTokenPair();
    const expiresAt = getExpiresAt(48);
    await userTokenRepo.createToken(userId, tokenHash, "INVITE", expiresAt);

    // Send email to NEW email address with i18n support
    const t = getEmailTranslations(locale);
    const activateUrl = `${baseUrl}/${locale}/activate?token=${token}`;
    await sendEmail({
      to: newEmail,
      subject: t.inviteSubject,
      html: generateInviteEmailHtml(activateUrl, locale),
    });

    return { token };
  },
};

export class UserRoleAssignment {
  id?: number;
  user_id?: number;
  role_id?: number;
  assigned_at?: Date;
  assigned_by?: number;

  static table = "user_role_assignments";
  static columns = {
    id: "id",
    user_id: "user_id",
    role_id: "role_id",
    assigned_at: "assigned_at",
    assigned_by: "assigned_by",
  } as const;

  constructor(data: Partial<UserRoleAssignment> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);

      // Convert string dates to Date objects
      if (typeof data.assigned_at === "string") {
        this.assigned_at = new Date(data.assigned_at);
      }
    }
  }

  // Helper methods
  getUserId(): number {
    return this.user_id || 0;
  }

  getRoleId(): number {
    return this.role_id || 0;
  }

  getAssignedBy(): number | null {
    return this.assigned_by || null;
  }

  getAssignedAt(): Date | null {
    return this.assigned_at || null;
  }

  getAssignedAtFormatted(): string {
    if (!this.assigned_at) return "N/A";
    return this.assigned_at.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  toJSON(): any {
    return {
      id: this.id,
      user_id: this.user_id,
      role_id: this.role_id,
      assigned_at: this.assigned_at?.toISOString(),
      assigned_by: this.assigned_by,
    };
  }
}

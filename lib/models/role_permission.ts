export class RolePermission {
  id?: number;
  role_id?: number;
  permission_id?: number;
  is_granted?: boolean;
  granted_at?: Date;
  granted_by?: number;

  static table = "role_permissions";
  static columns = {
    id: "id",
    role_id: "role_id",
    permission_id: "permission_id",
    is_granted: "is_granted",
    granted_at: "granted_at",
    granted_by: "granted_by",
  } as const;

  constructor(data: Partial<RolePermission> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);

      // Convert string dates to Date objects
      if (typeof data.granted_at === "string") {
        this.granted_at = new Date(data.granted_at);
      }
    }
  }

  // Helper methods
  getRoleId(): number {
    return this.role_id || 0;
  }

  getPermissionId(): number {
    return this.permission_id || 0;
  }

  isGranted(): boolean {
    return this.is_granted === true;
  }

  isDenied(): boolean {
    return this.is_granted === false;
  }

  getGrantedBy(): number | null {
    return this.granted_by || null;
  }

  getGrantedAt(): Date | null {
    return this.granted_at || null;
  }

  getGrantedAtFormatted(): string {
    if (!this.granted_at) return "N/A";
    return this.granted_at.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getStatusLabel(): string {
    if (this.isGranted()) return "Granted";
    if (this.isDenied()) return "Denied";
    return "Unknown";
  }

  getStatusColor(): string {
    if (this.isGranted()) return "green";
    if (this.isDenied()) return "red";
    return "gray";
  }

  toJSON(): any {
    return {
      id: this.id,
      role_id: this.role_id,
      permission_id: this.permission_id,
      is_granted: this.is_granted,
      granted_at: this.granted_at?.toISOString(),
      granted_by: this.granted_by,
    };
  }
}

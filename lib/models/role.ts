export class Role {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  level?: number;
  is_active?: boolean;
  is_system?: boolean;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;

  static table = "roles";
  static columns = {
    id: "id",
    code: "code",
    name: "name",
    description: "description",
    level: "level",
    is_active: "is_active",
    is_system: "is_system",
    created_at: "created_at",
    updated_at: "updated_at",
    created_by: "created_by",
  } as const;

  constructor(data: Partial<Role> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);

      // Convert string dates to Date objects
      if (typeof data.created_at === "string") {
        this.created_at = new Date(data.created_at);
      }
      if (typeof data.updated_at === "string") {
        this.updated_at = new Date(data.updated_at);
      }
    }
  }

  // Helper methods
  getCode(): string {
    return this.code || "";
  }

  getName(): string {
    return this.name || "";
  }

  getDescription(): string {
    return this.description || "";
  }

  getLevel(): number {
    return this.level || 99;
  }

  isActive(): boolean {
    return this.is_active !== false; // Default to true
  }

  isSystemRole(): boolean {
    return this.is_system === true;
  }

  canBeDeleted(): boolean {
    return !this.isSystemRole();
  }

  canBeModified(): boolean {
    return !this.isSystemRole();
  }

  isSuperAdmin(): boolean {
    return this.code === "super_admin";
  }

  isAdmin(): boolean {
    return this.code === "admin";
  }

  isUser(): boolean {
    return this.code === "user";
  }

  getRoleLevelLabel(): string {
    if (this.level === 1) return "Highest";
    if (this.level === 2) return "High";
    if (this.level === 3) return "Medium";
    return "Low";
  }

  toJSON(): any {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      level: this.level,
      is_active: this.is_active,
      is_system: this.is_system,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
      created_by: this.created_by,
    };
  }
}

export class Permission {
  id?: number;
  code?: string;
  resource_type?: string;
  resource_id?: number;
  action_id?: number;
  description?: string;
  created_at?: Date;

  static table = "permissions";
  static columns = {
    id: "id",
    code: "code",
    resource_type: "resource_type",
    resource_id: "resource_id",
    action_id: "action_id",
    description: "description",
    created_at: "created_at",
  } as const;

  constructor(data: Partial<Permission> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);

      // Convert string dates to Date objects
      if (typeof data.created_at === "string") {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  getCode(): string {
    return this.code || "";
  }

  getResourceType(): string {
    return this.resource_type || "";
  }

  getResourceId(): number | null {
    return this.resource_id || null;
  }

  getActionId(): number | null {
    return this.action_id || null;
  }

  getDescription(): string {
    return this.description || "";
  }

  isMenuPermission(): boolean {
    return this.resource_type === "menu";
  }

  isApiPermission(): boolean {
    return this.resource_type === "api";
  }

  isFeaturePermission(): boolean {
    return this.resource_type === "feature";
  }

  isReportPermission(): boolean {
    return this.resource_type === "report";
  }

  getResourceTypeLabel(): string {
    const typeLabels: Record<string, string> = {
      menu: "Menu",
      api: "API",
      feature: "Feature",
      report: "Report",
      data: "Data",
    };
    return typeLabels[this.getResourceType()] || this.getResourceType();
  }

  /**
   * Parse permission code to extract parts
   * Example: "menu.users.create" => { resource: "menu", target: "users", action: "create" }
   */
  parseCode(): { resource: string; target: string; action: string } | null {
    const parts = this.code?.split(".");
    if (parts && parts.length === 3) {
      return {
        resource: parts[0],
        target: parts[1],
        action: parts[2],
      };
    }
    return null;
  }

  getTarget(): string {
    const parsed = this.parseCode();
    return parsed?.target || "";
  }

  getActionFromCode(): string {
    const parsed = this.parseCode();
    return parsed?.action || "";
  }

  toJSON(): any {
    return {
      id: this.id,
      code: this.code,
      resource_type: this.resource_type,
      resource_id: this.resource_id,
      action_id: this.action_id,
      description: this.description,
      created_at: this.created_at?.toISOString(),
    };
  }
}

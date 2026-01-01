export class Menu {
  id?: number;
  code?: string;
  name?: string;
  path?: string;
  icon?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;

  static table = "menus";
  static jsonbColumns = ["metadata"];
  static columns = {
    id: "id",
    code: "code",
    name: "name",
    path: "path",
    icon: "icon",
    parent_id: "parent_id",
    sort_order: "sort_order",
    is_active: "is_active",
    metadata: "metadata",
    created_at: "created_at",
    updated_at: "updated_at",
  } as const;

  constructor(data: Partial<Menu> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);

      // Convert string dates to Date objects
      if (typeof data.created_at === "string") {
        this.created_at = new Date(data.created_at);
      }
      if (typeof data.updated_at === "string") {
        this.updated_at = new Date(data.updated_at);
      }

      // Parse metadata if it's a string
      if (typeof data.metadata === "string") {
        try {
          this.metadata = JSON.parse(data.metadata);
        } catch {
          this.metadata = {};
        }
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

  getPath(): string {
    return this.path || "#";
  }

  getIcon(): string {
    return this.icon || "Circle";
  }

  getSortOrder(): number {
    return this.sort_order || 0;
  }

  isActive(): boolean {
    return this.is_active !== false; // Default to true
  }

  isRootMenu(): boolean {
    return !this.parent_id;
  }

  isSubMenu(): boolean {
    return !!this.parent_id;
  }

  getParentId(): number | null {
    return this.parent_id || null;
  }

  getMetadata(key: string, defaultValue: any = null): any {
    return this.metadata?.[key] ?? defaultValue;
  }

  getDescription(): string {
    return this.getMetadata("description", "");
  }

  getBadge(): string | null {
    return this.getMetadata("badge", null);
  }

  isExternalLink(): boolean {
    return this.getMetadata("external_link", false);
  }

  getTooltip(): string {
    return this.getMetadata("tooltip", this.name || "");
  }

  toJSON(): any {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      path: this.path,
      icon: this.icon,
      parent_id: this.parent_id,
      sort_order: this.sort_order,
      is_active: this.is_active,
      metadata: this.metadata,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }
}

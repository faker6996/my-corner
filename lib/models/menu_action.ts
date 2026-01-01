export class MenuAction {
  id?: number;
  menu_id?: number;
  action_id?: number;
  display_name?: string;
  created_at?: Date;

  static table = "menu_actions";
  static columns = {
    id: "id",
    menu_id: "menu_id",
    action_id: "action_id",
    display_name: "display_name",
    created_at: "created_at",
  } as const;

  constructor(data: Partial<MenuAction> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);

      // Convert string dates to Date objects
      if (typeof data.created_at === "string") {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  getMenuId(): number {
    return this.menu_id || 0;
  }

  getActionId(): number {
    return this.action_id || 0;
  }

  getDisplayName(): string {
    return this.display_name || "";
  }

  hasCustomDisplayName(): boolean {
    return !!this.display_name;
  }

  toJSON(): any {
    return {
      id: this.id,
      menu_id: this.menu_id,
      action_id: this.action_id,
      display_name: this.display_name,
      created_at: this.created_at?.toISOString(),
    };
  }
}

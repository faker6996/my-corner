// lib/models/advertisement.ts
// Advertisement model for blog

export class Advertisement {
  id?: number;
  name?: string;
  description?: string;
  type?: string;
  position?: string;
  image_url?: string;
  link_url?: string;
  html_content?: string;
  start_date?: Date;
  end_date?: Date;
  is_active?: boolean;
  priority?: number;
  view_count?: number;
  click_count?: number;
  created_at?: Date;
  updated_at?: Date;

  static table = "advertisements";
  static columns = {
    id: "id",
    name: "name",
    description: "description",
    type: "type",
    position: "position",
    image_url: "image_url",
    link_url: "link_url",
    html_content: "html_content",
    start_date: "start_date",
    end_date: "end_date",
    is_active: "is_active",
    priority: "priority",
    view_count: "view_count",
    click_count: "click_count",
    created_at: "created_at",
    updated_at: "updated_at",
  } as const;

  constructor(data: Partial<Advertisement> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
      if (typeof data.start_date === "string") this.start_date = new Date(data.start_date);
      if (typeof data.end_date === "string") this.end_date = new Date(data.end_date);
      if (typeof data.created_at === "string") this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === "string") this.updated_at = new Date(data.updated_at);
    }
  }

  getName(): string {
    return this.name || "";
  }
  getType(): string {
    return this.type || "banner";
  }
  getPosition(): string {
    return this.position || "";
  }

  isActive(): boolean {
    return this.is_active !== false;
  }

  isCurrentlyActive(): boolean {
    if (!this.is_active) return false;
    const now = new Date();
    if (this.start_date && now < this.start_date) return false;
    if (this.end_date && now > this.end_date) return false;
    return true;
  }

  getViewCount(): number {
    return this.view_count || 0;
  }
  getClickCount(): number {
    return this.click_count || 0;
  }

  getCTR(): number {
    const views = this.getViewCount();
    if (views === 0) return 0;
    return (this.getClickCount() / views) * 100;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      position: this.position,
      image_url: this.image_url,
      link_url: this.link_url,
      html_content: this.html_content,
      start_date: this.start_date?.toISOString(),
      end_date: this.end_date?.toISOString(),
      is_active: this.is_active,
      priority: this.priority,
      view_count: this.view_count,
      click_count: this.click_count,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }
}

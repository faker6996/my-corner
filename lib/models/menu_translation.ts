export class MenuTranslation {
  id?: number;
  menu_id?: number;
  locale?: string;
  name?: string;
  description?: string;

  static table = "menu_translations";
  static columns = {
    id: "id",
    menu_id: "menu_id",
    locale: "locale",
    name: "name",
    description: "description",
  } as const;

  constructor(data: Partial<MenuTranslation> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
    }
  }

  toJSON(): any {
    return {
      id: this.id,
      menu_id: this.menu_id,
      locale: this.locale,
      name: this.name,
      description: this.description,
    };
  }
}


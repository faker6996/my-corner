export class ActionTranslation {
  id?: number;
  action_id?: number;
  locale?: string;
  name?: string;
  description?: string;

  static table = "action_translations";
  static columns = {
    id: "id",
    action_id: "action_id",
    locale: "locale",
    name: "name",
    description: "description",
  } as const;

  constructor(data: Partial<ActionTranslation> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
    }
  }

  toJSON(): any {
    return {
      id: this.id,
      action_id: this.action_id,
      locale: this.locale,
      name: this.name,
      description: this.description,
    };
  }
}


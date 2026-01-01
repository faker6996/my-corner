export class Action {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  category?: string;
  created_at?: Date;

  static table = "actions";
  static columns = {
    id: "id",
    code: "code",
    name: "name",
    description: "description",
    category: "category",
    created_at: "created_at",
  } as const;

  constructor(data: Partial<Action> = {}) {
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

  getName(): string {
    return this.name || "";
  }

  getDescription(): string {
    return this.description || "";
  }

  getCategory(): string {
    return this.category || "CRUD";
  }

  isCrudAction(): boolean {
    return this.category === "CRUD";
  }

  isImportExportAction(): boolean {
    return this.category === "IMPORT_EXPORT";
  }

  isWorkflowAction(): boolean {
    return this.category === "WORKFLOW";
  }

  isSpecialAction(): boolean {
    return this.category === "SPECIAL";
  }

  isReportAction(): boolean {
    return this.category === "REPORT";
  }

  isViewAction(): boolean {
    return this.code === "view";
  }

  isCreateAction(): boolean {
    return this.code === "create";
  }

  isUpdateAction(): boolean {
    return this.code === "update";
  }

  isDeleteAction(): boolean {
    return this.code === "delete";
  }

  getCategoryLabel(): string {
    const categoryLabels: Record<string, string> = {
      CRUD: "CRUD Operations",
      IMPORT_EXPORT: "Import/Export",
      WORKFLOW: "Workflow",
      SPECIAL: "Special Actions",
      REPORT: "Reporting",
    };
    return categoryLabels[this.getCategory()] || this.getCategory();
  }

  toJSON(): any {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      category: this.category,
      created_at: this.created_at?.toISOString(),
    };
  }
}

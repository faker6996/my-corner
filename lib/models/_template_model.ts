// Template Model - Follow this pattern for all OCR models
// Based on password_reset_token.ts structure

export class TemplateModel {
  // Properties - All optional to match database flexibility
  id?: number;
  name?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;

  // Static properties for database mapping
  static table = "template_table";
  static columns = {
    id: "id",
    name: "name", 
    status: "status",
    created_at: "created_at",
    updated_at: "updated_at"
  } as const;

  // Constructor - Follow password_reset_token pattern exactly
  constructor(data: Partial<TemplateModel> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      
      // Convert string dates to Date objects if needed
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
      if (typeof data.updated_at === 'string') {
        this.updated_at = new Date(data.updated_at);
      }
    }
  }

  // Helper methods - Handle optional properties safely
  getName(): string {
    return this.name || '';
  }

  getStatus(): string {
    return this.status || 'unknown';
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  // Safe date formatting
  getCreatedAt(): string {
    return this.created_at ? this.created_at.toISOString() : '';
  }

  // Safe JSON serialization
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString()
    };
  }
}

/*
PATTERN SUMMARY for all OCR models:

1. All properties optional (use ?)
2. Static table and columns properties  
3. Constructor with default empty object
4. Safe null check in constructor
5. Helper methods handle undefined safely
6. Use optional chaining (?.) in methods
7. Return defaults for undefined values

EXAMPLE USAGE:
const model = new TemplateModel({ name: 'test' });
const name = model.getName(); // Safe, returns '' if undefined
const json = model.toJSON(); // Safe serialization
*/
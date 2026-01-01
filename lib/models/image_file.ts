// lib/models/image_file.ts
// Follow pattern from password_reset_token.ts

export class ImageFile {
  id?: string;                     // UUID primary key
  path?: string;                   // /uploads/2024/01/abc123.jpg
  original_name?: string;          // photo.jpg
  size?: number;                   // bytes
  mime_type?: string;              // image/jpeg
  width?: number;                  // pixels
  height?: number;                 // pixels
  task_id?: string;                // reference to OCR task (no foreign key)
  created_at?: Date;
  updated_at?: Date;

  static table = "image_files";
  static columns = {
    id: "id",
    path: "path",
    original_name: "original_name",
    size: "size",
    mime_type: "mime_type", 
    width: "width",
    height: "height",
    task_id: "task_id",
    created_at: "created_at",
    updated_at: "updated_at"
  } as const;

  constructor(data: Partial<ImageFile> = {}) {
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
  getPath(): string {
    return this.path || '';
  }

  getOriginalName(): string {
    return this.original_name || '';
  }

  getSize(): number {
    return this.size || 0;
  }

  getMimeType(): string {
    return this.mime_type || '';
  }

  // Get full URL for serving
  getUrl(baseUrl?: string): string {
    const serverUrl = baseUrl || process.env.UPLOAD_HOST;
    const path = this.getPath();
    // Files are stored under public/uploads, can be served statically as /uploads/*
    return path ? `${serverUrl}${path}` : '';
  }

  // Get file extension
  getExtension(): string {
    const path = this.getPath();
    return path ? path.split('.').pop()?.toLowerCase() || '' : '';
  }

  // Check if image
  isImage(): boolean {
    const mimeType = this.getMimeType();
    return mimeType.startsWith('image/');
  }

  // Format file size
  getFormattedSize(): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const size = this.getSize();
    if (size === 0) return '0 B';
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${Math.round(size / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  // Safe date formatting
  getCreatedAt(): string {
    return this.created_at ? this.created_at.toISOString() : '';
  }

  getUpdatedAt(): string {
    return this.updated_at ? this.updated_at.toISOString() : '';
  }

  // Safe JSON serialization
  toJSON(): any {
    return {
      id: this.id,
      path: this.path,
      original_name: this.original_name,
      size: this.size,
      mime_type: this.mime_type,
      width: this.width,
      height: this.height,
      task_id: this.task_id,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
      url: this.getUrl(),
      formatted_size: this.getFormattedSize()
    };
  }
}

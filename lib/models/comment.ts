// lib/models/comment.ts
// Comment model for blog posts (uses BIGINT id)

export class Comment {
  id?: number; // BIGINT in DB
  post_id?: number;
  user_id?: number;
  parent_id?: number; // BIGINT for nested replies
  author_name?: string;
  author_email?: string;
  author_url?: string;
  content?: string;
  is_approved?: boolean;
  is_spam?: boolean;
  is_deleted?: boolean;
  like_count?: number;
  reply_count?: number;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
  updated_at?: Date;

  static table = "comments";
  static columns = {
    id: "id",
    post_id: "post_id",
    user_id: "user_id",
    parent_id: "parent_id",
    author_name: "author_name",
    author_email: "author_email",
    author_url: "author_url",
    content: "content",
    is_approved: "is_approved",
    is_spam: "is_spam",
    is_deleted: "is_deleted",
    like_count: "like_count",
    reply_count: "reply_count",
    ip_address: "ip_address",
    user_agent: "user_agent",
    created_at: "created_at",
    updated_at: "updated_at",
  } as const;

  constructor(data: Partial<Comment> = {}) {
    if (data && typeof data === "object") {
      Object.assign(this, data);
      if (typeof data.created_at === "string") this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === "string") this.updated_at = new Date(data.updated_at);
    }
  }

  getContent(): string {
    return this.content || "";
  }
  getAuthorName(): string {
    return this.author_name || "Anonymous";
  }

  isApproved(): boolean {
    return this.is_approved !== false;
  }
  isSpam(): boolean {
    return this.is_spam === true;
  }
  isDeleted(): boolean {
    return this.is_deleted === true;
  }
  isReply(): boolean {
    return !!this.parent_id;
  }
  isRootComment(): boolean {
    return !this.parent_id;
  }

  getLikeCount(): number {
    return this.like_count || 0;
  }
  getReplyCount(): number {
    return this.reply_count || 0;
  }

  toJSON(): any {
    return {
      id: this.id,
      post_id: this.post_id,
      user_id: this.user_id,
      parent_id: this.parent_id,
      author_name: this.author_name,
      author_email: this.author_email,
      author_url: this.author_url,
      content: this.content,
      is_approved: this.is_approved,
      is_spam: this.is_spam,
      is_deleted: this.is_deleted,
      like_count: this.like_count,
      reply_count: this.reply_count,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }
}

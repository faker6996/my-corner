import { commentRepo } from "../repositories/comment_repo";
import { Comment } from "@/lib/models/comment";
import { ApiError } from "@/lib/utils/error";

export const commentApp = {
  async getByPostId(postId: number): Promise<Comment[]> {
    return commentRepo.findByPostId(postId);
  },

  async create(data: {
    post_id: number;
    content: string;
    user_id?: number;
    author_name?: string;
    author_email?: string;
    parent_id?: number;
    ip_address?: string;
    user_agent?: string;
  }): Promise<Comment> {
    if (!data.content) throw new ApiError("Content is required", 400);
    if (!data.user_id && !data.author_name) throw new ApiError("Author name is required for guests", 400);
    return commentRepo.create(data);
  },

  async update(id: number, data: Partial<Comment>): Promise<Comment> {
    const existing = await commentRepo.findById(id);
    if (!existing) throw new ApiError("Comment not found", 404);
    const updated = await commentRepo.update(id, data);
    if (!updated) throw new ApiError("Failed to update", 500);
    return updated;
  },

  async delete(id: number): Promise<void> {
    const existing = await commentRepo.findById(id);
    if (!existing) throw new ApiError("Comment not found", 404);
    await commentRepo.delete(id);
  },

  async approve(id: number): Promise<Comment> {
    return this.update(id, { is_approved: true });
  },

  async markAsSpam(id: number): Promise<Comment> {
    return this.update(id, { is_spam: true, is_approved: false });
  },
};

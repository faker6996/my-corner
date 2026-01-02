"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Badge, LoadingSpinner, Modal, Card } from "@underverse-ui/underverse";
import Link from "next/link";

interface Comment {
  id: number;
  post_id: number;
  post_title?: string;
  post_slug?: string;
  author_name?: string;
  author_email?: string;
  content: string;
  status: string;
  created_at: string;
}

export default function AdminCommentsContainer() {
  const locale = useLocale();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; comment?: Comment }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let url = "/api/comments";
      if (statusFilter !== "all") url += `?status=${statusFilter}`;
      const res = await callApi<Comment[]>(url, HTTP_METHOD_ENUM.GET);
      if (res) setComments(res);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const updateStatus = async (comment: Comment, newStatus: string) => {
    try {
      await callApi(`/api/comments/${comment.id}`, HTTP_METHOD_ENUM.PUT, { status: newStatus });
      fetchComments();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.comment) return;
    setDeleting(true);
    try {
      await callApi(`/api/comments/${deleteModal.comment.id}`, HTTP_METHOD_ENUM.DELETE);
      setDeleteModal({ open: false });
      fetchComments();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "destructive" | "default"> = {
      approved: "success",
      pending: "warning",
      spam: "destructive",
    };
    const labels: Record<string, string> = {
      approved: "Đã duyệt",
      pending: "Chờ duyệt",
      spam: "Spam",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý bình luận</h1>
          <p className="text-muted-foreground mt-1">{comments.length} bình luận</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="w-40 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="spam">Spam</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-foreground">{comment.author_name || "Anonymous"}</strong>
                    {getStatusBadge(comment.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {comment.author_email && <span>{comment.author_email} • </span>}
                    {formatDate(comment.created_at)}
                  </div>
                </div>
                {comment.post_slug && (
                  <Link href={`/${locale}/blog/${comment.post_slug}`} className="text-sm text-primary hover:underline">
                    {comment.post_title || `Post #${comment.post_id}`}
                  </Link>
                )}
              </div>
              <p className="text-foreground mb-4 whitespace-pre-wrap">{comment.content}</p>
              <div className="flex gap-2">
                {comment.status !== "approved" && (
                  <Button size="sm" variant="success" onClick={() => updateStatus(comment, "approved")}>
                    ✓ Duyệt
                  </Button>
                )}
                {comment.status !== "spam" && (
                  <Button size="sm" variant="warning" onClick={() => updateStatus(comment, "spam")}>
                    🚫 Spam
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => setDeleteModal({ open: true, comment })}>
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
          {comments.length === 0 && <p className="text-center text-muted-foreground py-12">Không có bình luận nào</p>}
        </div>
      )}

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })} title="Xác nhận xóa" size="sm">
        <p className="text-muted-foreground mb-6">Bạn có chắc muốn xóa bình luận này?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModal({ open: false })}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={deleting}>
            Xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Badge, LoadingSpinner, DataTable, Input, Modal } from "@underverse-ui/underverse";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminPostsContainer() {
  const router = useRouter();
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; post?: Post }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (search) params.set("search", search);

      const res = await callApi<PostsResponse>(`/api/posts?${params}`, HTTP_METHOD_ENUM.GET);
      if (res) {
        setPosts(res.posts || []);
        setTotal(res.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchPosts();
  };

  const handleDelete = async () => {
    if (!deleteModal.post) return;
    setDeleting(true);
    try {
      await callApi(`/api/posts/${deleteModal.post.id}`, HTTP_METHOD_ENUM.DELETE);
      setDeleteModal({ open: false });
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "default" | "destructive"> = {
      published: "success",
      draft: "warning",
      archived: "default",
    };
    const labels: Record<string, string> = {
      published: "Đã xuất bản",
      draft: "Nháp",
      archived: "Lưu trữ",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns = [
    {
      key: "title",
      title: "Tiêu đề",
      render: (post: Post) => (
        <Link href={`/${locale}/admin/posts/${post.id}/edit`} className="font-medium text-primary hover:underline">
          {post.title}
        </Link>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (post: Post) => getStatusBadge(post.status),
    },
    {
      key: "stats",
      title: "Thống kê",
      render: (post: Post) => (
        <div className="flex gap-3 text-sm text-muted-foreground">
          <span>👁 {post.view_count || 0}</span>
          <span>❤️ {post.like_count || 0}</span>
          <span>💬 {post.comment_count || 0}</span>
        </div>
      ),
    },
    {
      key: "published_at",
      title: "Ngày xuất bản",
      render: (post: Post) => formatDate(post.published_at),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (post: Post) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/admin/posts/${post.id}/edit`)}>
            Sửa
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteModal({ open: true, post })}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý bài viết</h1>
          <p className="text-muted-foreground mt-1">Tổng cộng {total} bài viết</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/admin/posts/new`)}>+ Tạo bài viết mới</Button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Tìm kiếm bài viết..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-md"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={posts}
          rowKey={(post) => post.id.toString()}
          page={page}
          pageSize={pageSize}
          total={total}
          onQueryChange={(query) => {
            if (query.page) setPage(query.page);
            if (query.pageSize) setPageSize(query.pageSize);
          }}
        />
      )}

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })} title="Xác nhận xóa" size="sm">
        <p className="text-muted-foreground mb-6">
          Bạn có chắc muốn xóa bài viết "<strong>{deleteModal.post?.title}</strong>"?
        </p>
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

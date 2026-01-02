"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Input, Textarea, LoadingSpinner, Card } from "@underverse-ui/underverse";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail_url: string;
  cover_image_url: string;
  category_id: number | null;
  tag_ids: number[];
  status: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

interface PostEditorContainerProps {
  postId?: string;
}

export default function PostEditorContainer({ postId }: PostEditorContainerProps) {
  const router = useRouter();
  const locale = useLocale();
  const isEdit = !!postId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState<PostFormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    thumbnail_url: "",
    cover_image_url: "",
    category_id: null,
    tag_ids: [],
    status: "draft",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and tags
        const [catRes, tagRes] = await Promise.all([
          callApi<Category[]>("/api/categories", HTTP_METHOD_ENUM.GET),
          callApi<Tag[]>("/api/tags", HTTP_METHOD_ENUM.GET),
        ]);
        if (catRes) setCategories(catRes);
        if (tagRes) setTags(tagRes);

        // Fetch post if editing
        if (isEdit && postId) {
          const post = await callApi<any>(`/api/posts/${postId}`, HTTP_METHOD_ENUM.GET);
          if (post) {
            setForm({
              title: post.title || "",
              slug: post.slug || "",
              content: post.content || "",
              excerpt: post.excerpt || "",
              thumbnail_url: post.thumbnail_url || "",
              cover_image_url: post.cover_image_url || "",
              category_id: post.category_id || null,
              tag_ids: post.tags?.map((t: Tag) => t.id) || [],
              status: post.status || "draft",
              seo_title: post.seo_title || "",
              seo_description: post.seo_description || "",
              seo_keywords: post.seo_keywords || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId, isEdit]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        category_id: form.category_id || undefined,
      };

      if (isEdit) {
        await callApi(`/api/posts/${postId}`, HTTP_METHOD_ENUM.PUT, payload);
      } else {
        await callApi("/api/posts", HTTP_METHOD_ENUM.POST, payload);
      }

      router.push(`/${locale}/admin/posts`);
    } catch (error) {
      console.error("Failed to save post:", error);
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "draft", label: "Nháp" },
    { value: "published", label: "Xuất bản" },
    { value: "archived", label: "Lưu trữ" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">{isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          ← Quay lại
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Nội dung</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
            <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Nhập tiêu đề bài viết" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-bai-viet" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tóm tắt</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Mô tả ngắn về bài viết"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nội dung *</label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Viết nội dung bài viết (hỗ trợ HTML)"
              rows={15}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Hỗ trợ HTML. Có thể tích hợp TipTap editor sau.</p>
          </div>
        </Card>

        {/* Media */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Hình ảnh</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
            <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cover Image URL</label>
            <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
          </div>
        </Card>

        {/* Taxonomy */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Phân loại</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Danh mục</label>
            <select
              value={form.category_id?.toString() || ""}
              onChange={(e) => setForm({ ...form, category_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* SEO */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">SEO</h2>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Title</label>
            <Input
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              placeholder="Tiêu đề hiển thị trên search engine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Description</label>
            <Textarea
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              placeholder="Mô tả cho search engine"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Keywords</label>
            <Input
              value={form.seo_keywords}
              onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Cập nhật" : "Tạo bài viết"}
          </Button>
        </div>
      </form>
    </div>
  );
}

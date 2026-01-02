"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Badge, LoadingSpinner, Input, Textarea, Modal, Card } from "@underverse-ui/underverse";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  post_count?: number;
}

export default function AdminCategoriesContainer() {
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    sort_order: 0,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await callApi<Category[]>("/api/categories?includeInactive=true", HTTP_METHOD_ENUM.GET);
      if (res) setCategories(res);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const openCreateModal = () => {
    setForm({ name: "", slug: "", description: "", icon: "", sort_order: categories.length + 1 });
    setModal({ open: true });
  };

  const openEditModal = (category: Category) => {
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      sort_order: category.sort_order,
    });
    setModal({ open: true, category });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || generateSlug(form.name) };
      if (modal.category) {
        await callApi(`/api/categories/${modal.category.id}`, HTTP_METHOD_ENUM.PUT, payload);
      } else {
        await callApi("/api/categories", HTTP_METHOD_ENUM.POST, payload);
      }
      setModal({ open: false });
      fetchCategories();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;
    setDeleting(true);
    try {
      await callApi(`/api/categories/${deleteModal.category.id}`, HTTP_METHOD_ENUM.DELETE);
      setDeleteModal({ open: false });
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý danh mục</h1>
          <p className="text-muted-foreground mt-1">{categories.length} danh mục</p>
        </div>
        <Button onClick={openCreateModal}>+ Thêm danh mục</Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {cat.icon && <span className="text-lg">{cat.icon}</span>}
                  <span className="font-medium">{cat.name}</span>
                  <Badge variant={cat.is_active ? "success" : "default"} size="sm">
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  /{cat.slug} • {cat.post_count || 0} bài viết
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditModal(cat)}>
                  Sửa
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteModal({ open: true, category: cat })}>
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
          {categories.length === 0 && <p className="text-center text-muted-foreground py-12">Chưa có danh mục nào</p>}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tên danh mục *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nhập tên danh mục" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-danh-muc" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mô tả</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về danh mục"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Code, Heart, Star..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thứ tự</label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {modal.category ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })} title="Xác nhận xóa" size="sm">
        <p className="text-muted-foreground mb-6">
          Bạn có chắc muốn xóa danh mục "<strong>{deleteModal.category?.name}</strong>"?
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

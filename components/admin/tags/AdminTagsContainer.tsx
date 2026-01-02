"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Badge, LoadingSpinner, Input, Modal, Card } from "@underverse-ui/underverse";

interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  post_count?: number;
}

export default function AdminTagsContainer() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; tag?: Tag }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; tag?: Tag }>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", color: "#3B82F6" });

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await callApi<Tag[]>("/api/tags", HTTP_METHOD_ENUM.GET);
      if (res) setTags(res);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
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
    setForm({ name: "", slug: "", color: "#3B82F6" });
    setModal({ open: true });
  };

  const openEditModal = (tag: Tag) => {
    setForm({ name: tag.name, slug: tag.slug, color: tag.color || "#3B82F6" });
    setModal({ open: true, tag });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || generateSlug(form.name) };
      if (modal.tag) {
        await callApi(`/api/tags/${modal.tag.id}`, HTTP_METHOD_ENUM.PUT, payload);
      } else {
        await callApi("/api/tags", HTTP_METHOD_ENUM.POST, payload);
      }
      setModal({ open: false });
      fetchTags();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tag) return;
    setDeleting(true);
    try {
      await callApi(`/api/tags/${deleteModal.tag.id}`, HTTP_METHOD_ENUM.DELETE);
      setDeleteModal({ open: false });
      fetchTags();
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
          <h1 className="text-3xl font-bold text-foreground">Quản lý thẻ tags</h1>
          <p className="text-muted-foreground mt-1">{tags.length} thẻ</p>
        </div>
        <Button onClick={openCreateModal}>+ Thêm thẻ</Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="p-3 flex items-center gap-3">
              <span
                style={{ backgroundColor: tag.color }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              >
                {tag.name}
              </span>
              <span className="text-sm text-muted-foreground">{tag.post_count || 0} bài</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEditModal(tag)}>
                  ✏️
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteModal({ open: true, tag })}>
                  🗑️
                </Button>
              </div>
            </Card>
          ))}
          {tags.length === 0 && <p className="text-center text-muted-foreground py-12 w-full">Chưa có thẻ nào</p>}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.tag ? "Chỉnh sửa thẻ" : "Thêm thẻ mới"} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tên thẻ *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="React, TypeScript..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="react" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Màu</label>
            <div className="flex gap-2">
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-16 h-10 p-1" />
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#3B82F6" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {modal.tag ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })} title="Xác nhận xóa" size="sm">
        <p className="text-muted-foreground mb-6">
          Bạn có chắc muốn xóa thẻ "<strong>{deleteModal.tag?.name}</strong>"?
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

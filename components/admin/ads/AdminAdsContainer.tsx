"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Badge, LoadingSpinner, Input, Textarea, Modal, Card } from "@underverse-ui/underverse";

interface Advertisement {
  id: number;
  title: string;
  position: string;
  image_url?: string;
  link_url?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  created_at: string;
}

const POSITIONS = [
  { value: "header", label: "Header Banner" },
  { value: "sidebar", label: "Sidebar" },
  { value: "in_content", label: "Trong bài viết" },
  { value: "footer", label: "Footer" },
  { value: "popup", label: "Popup" },
];

export default function AdminAdsContainer() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; ad?: Advertisement }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; ad?: Advertisement }>({ open: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    position: "sidebar",
    image_url: "",
    link_url: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await callApi<Advertisement[]>("/api/advertisements", HTTP_METHOD_ENUM.GET);
      if (res) setAds(res);
    } catch (error) {
      console.error("Failed to fetch ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreateModal = () => {
    setForm({
      title: "",
      position: "sidebar",
      image_url: "",
      link_url: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
    setModal({ open: true });
  };

  const openEditModal = (ad: Advertisement) => {
    setForm({
      title: ad.title,
      position: ad.position,
      image_url: ad.image_url || "",
      link_url: ad.link_url || "",
      start_date: ad.start_date?.split("T")[0] || "",
      end_date: ad.end_date?.split("T")[0] || "",
      is_active: ad.is_active,
    });
    setModal({ open: true, ad });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (modal.ad) {
        await callApi(`/api/advertisements/${modal.ad.id}`, HTTP_METHOD_ENUM.PUT, form);
      } else {
        await callApi("/api/advertisements", HTTP_METHOD_ENUM.POST, form);
      }
      setModal({ open: false });
      fetchAds();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.ad) return;
    setDeleting(true);
    try {
      await callApi(`/api/advertisements/${deleteModal.ad.id}`, HTTP_METHOD_ENUM.DELETE);
      setDeleteModal({ open: false });
      fetchAds();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (ad: Advertisement) => {
    try {
      await callApi(`/api/advertisements/${ad.id}`, HTTP_METHOD_ENUM.PUT, { is_active: !ad.is_active });
      fetchAds();
    } catch (error) {
      console.error("Failed to toggle:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý quảng cáo</h1>
          <p className="text-muted-foreground mt-1">{ads.length} quảng cáo</p>
        </div>
        <Button onClick={openCreateModal}>+ Thêm quảng cáo</Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <Card key={ad.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {ad.image_url && <img src={ad.image_url} alt={ad.title} className="w-24 h-16 object-cover rounded" />}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ad.title}</span>
                      <Badge variant={ad.is_active ? "success" : "default"}>{ad.is_active ? "Active" : "Inactive"}</Badge>
                      <Badge variant="outline">{POSITIONS.find((p) => p.value === ad.position)?.label || ad.position}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      👁 {ad.impression_count} views • 🖱️ {ad.click_count} clicks
                    </div>
                    {ad.link_url && (
                      <a href={ad.link_url} target="_blank" rel="noopener" className="text-sm text-primary hover:underline">
                        {ad.link_url}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(ad)}>
                    {ad.is_active ? "Tắt" : "Bật"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(ad)}>
                    Sửa
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteModal({ open: true, ad })}>
                    Xóa
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {ads.length === 0 && <p className="text-center text-muted-foreground py-12">Chưa có quảng cáo nào</p>}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.ad ? "Chỉnh sửa quảng cáo" : "Thêm quảng cáo mới"} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tiêu đề *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên quảng cáo" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Vị trí</label>
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Link URL</label>
            <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày bắt đầu</label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngày kết thúc</label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm">
              Kích hoạt ngay
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {modal.ad ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })} title="Xác nhận xóa" size="sm">
        <p className="text-muted-foreground mb-6">
          Bạn có chắc muốn xóa quảng cáo "<strong>{deleteModal.ad?.title}</strong>"?
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

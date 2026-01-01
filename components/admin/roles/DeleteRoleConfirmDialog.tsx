"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal, Button, useToast } from "@underverse-ui/underverse";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";

interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_active?: boolean;
  is_system?: boolean;
}

interface DeleteRoleConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

export default function DeleteRoleConfirmDialog({ open, onClose, onSuccess, role }: DeleteRoleConfirmDialogProps) {
  const t = useTranslations("RolesPage");
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!role) return;

    setLoading(true);
    try {
      await callApi(`/api/rbac/roles/${role.id}`, HTTP_METHOD_ENUM.DELETE);
      addToast({ type: "success", message: t("deleteSuccess") });
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || t("deleteFailed") });
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  const isSystemRole = role.is_system;

  return (
    <Modal isOpen={open} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {t("deleteRoleTitle")}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm">
            {t("deleteRoleConfirm")} <strong>{role.name}</strong> ({role.code})?
          </p>

          {isSystemRole && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{t("cannotDeleteSystemRole")}</div>
              </div>
            </div>
          )}

          {!isSystemRole && (
            <div className="p-3 bg-muted/50 border border-border rounded-md text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
                <div>{t("deleteRoleWarning")}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || isSystemRole}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Trash2 className="w-4 h-4 mr-2" />
            {t("deleteConfirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

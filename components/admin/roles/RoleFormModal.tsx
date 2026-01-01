"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Modal, Button, Input, Label, Textarea, Combobox, useToast } from "@underverse-ui/underverse";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Plus, Save, Loader2, X } from "lucide-react";

interface Role {
  id?: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_active?: boolean;
  is_system?: boolean;
}

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role?: Role;
  mode: "create" | "edit" | "view";
}

export default function RoleFormModal({ open, onClose, onSuccess, role, mode }: RoleFormModalProps) {
  const t = useTranslations("RolesPage");
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    level: 99,
  });

  useEffect(() => {
    if (open) {
      if ((mode === "edit" || mode === "view") && role) {
        setFormData({
          code: role.code,
          name: role.name,
          description: role.description || "",
          level: role.level,
        });
      } else {
        setFormData({
          code: "",
          name: "",
          description: "",
          level: 99,
        });
      }
    }
  }, [open, mode, role]);

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
    }));
  };

  const handleCodeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, code: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      addToast({ type: "error", message: t("nameRequired") });
      return false;
    }
    if (!formData.code.trim()) {
      addToast({ type: "error", message: t("codeRequired") });
      return false;
    }
    if (!/^[a-z_]+$/.test(formData.code)) {
      addToast({ type: "error", message: t("codeInvalid") });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // View mode just closes the modal
    if (mode === "view") {
      onClose();
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === "create") {
        await callApi("/api/rbac/roles", HTTP_METHOD_ENUM.POST, {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          level: formData.level,
        });
        addToast({ type: "success", message: t("createSuccess") });
      } else {
        await callApi(`/api/rbac/roles/${role?.id}`, HTTP_METHOD_ENUM.PUT, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          level: formData.level,
        });
        addToast({ type: "success", message: t("updateSuccess") });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({ type: "error", message: err?.message || t("saveFailed") });
    } finally {
      setLoading(false);
    }
  };

  const levelOptions = [
    { value: "1", label: `${t("levelHighest")} (1)` },
    { value: "2", label: `${t("levelHigh")} (2)` },
    { value: "3", label: `${t("levelMedium")} (3)` },
    { value: "99", label: `${t("levelLow")} (99)` },
  ];

  const modalTitle = mode === "create" ? t("createRole") : mode === "view" ? t("viewRole") : t("editRole");

  return (
    <Modal isOpen={open} onClose={onClose} size="md" title={modalTitle} className="p-2">
      {/* Form */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            {t("name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("namePlaceholder")}
            disabled={loading || mode === "view"}
          />
        </div>

        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">
            {t("code")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={t("codePlaceholder")}
            disabled={loading || mode === "edit" || mode === "view"}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{t("codeHint")}</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("descriptionPlaceholder")}
            disabled={loading || mode === "view"}
            rows={3}
          />
        </div>

        {/* Level */}
        <div className="space-y-2">
          <Label htmlFor="level">{t("level")}</Label>
          <Combobox
            value={formData.level.toString()}
            onChange={(value) => {
              if (!value) return;
              const parsed = parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                setFormData((prev) => ({ ...prev, level: parsed }));
              }
            }}
            options={levelOptions}
            placeholder={t("selectLevel")}
            disabled={loading || mode === "view"}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {mode === "view" ? t("close") : t("cancel")}
        </Button>
        {mode !== "view" && (
          <Button onClick={handleSubmit} disabled={loading} variant="primary">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "create" ? t("create") : t("save")}
          </Button>
        )}
      </div>
    </Modal>
  );
}

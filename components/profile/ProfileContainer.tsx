"use client";

import { useEffect, useState, useRef } from "react";
import { User as UserIcon, Mail, Shield, Camera, Save, Loader2 } from "lucide-react";
import { User } from "@/lib/models/user";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/utils/local-storage";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { APP_ROLE, HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Avatar, Button, Card, Input, Label, useToast } from "@underverse-ui/underverse";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";

export default function ProfileContainer() {
  const [user, setUser] = useState(new User());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("ProfilePage");
  const { addToast } = useToast();

  useEffect(() => {
    const cachedUser = loadFromLocalStorage(APP_ROLE.USER, User);
    setUser(cachedUser);
    if (cachedUser?.avatar_url) {
      setAvatarPreview(cachedUser.avatar_url);
    }
    if (cachedUser?.name) {
      setName(cachedUser.name);
      setOriginalName(cachedUser.name);
    }

    const fetchUserData = async () => {
      try {
        const freshUser = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET);
        if (freshUser) {
          setUser(freshUser);
          if (freshUser.avatar_url) {
            setAvatarPreview(freshUser.avatar_url);
          }
          if (freshUser.name) {
            setName(freshUser.name);
            setOriginalName(freshUser.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/gif", "image/png", "image/jpg", "image/bmp", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        addToast({ type: "error", message: t("invalidFileType") || "Invalid file type" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    const nameChanged = name.trim() !== originalName;

    if (!avatarFile && !nameChanged) {
      addToast({ type: "info", message: t("noChanges") || "No changes to update" });
      return;
    }

    if (nameChanged && !name.trim()) {
      addToast({ type: "error", message: t("nameRequired") || "Name is required" });
      return;
    }

    setSaving(true);
    try {
      // Update name if changed
      if (nameChanged) {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update name");
        }

        // Update local user state and localStorage
        const updatedUser = { ...user, name: name.trim() };
        setUser(updatedUser as User);
        setOriginalName(name.trim());
        saveToLocalStorage(APP_ROLE.USER, updatedUser);
      }

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const response = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Upload failed");
        }

        const result = await response.json();

        // Update local user state
        setUser((prev) => ({ ...prev, avatar_url: result.data.avatar_url }));
        setAvatarFile(null);
      }

      addToast({ type: "success", message: t("updateSuccess") || "Profile updated successfully" });
    } catch (error: any) {
      addToast({ type: "error", message: error?.message || t("updateFailed") || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-100">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("updateInfoTitle") || "Update information of"} {user.name || user.user_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("subtitle") || "Manage your profile information"}
            </p>
          </div>
        </div>

        {/* Profile Form Card */}
        <Card className="p-8">
          <div className="space-y-6">
            {/* Name Field */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">
                {t("name") || "Name"}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("enterName") || "Enter your name"}
                className="bg-background"
              />
            </div>

            {/* Mail Field */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">
                {t("mail") || "Mail"}
              </Label>
              <Input
                value={user.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>

            {/* Role Field */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-right text-muted-foreground font-medium">
                {t("role") || "Role"}
              </Label>
              <Input
                value={(user as any).role || ""}
                disabled
                className="bg-muted/50"
              />
            </div>

            {/* Avatar Field */}
            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <Label className="text-right text-muted-foreground font-medium pt-2">
                {t("avatar") || "Avatar"}
              </Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/gif,image/png,image/jpg,image/bmp,image/svg+xml"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("chooseFile") || "Choose File"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {avatarFile?.name || (t("noFileChosen") || "No file chosen")}
                  </span>
                </div>

                {/* Avatar Preview */}
                {avatarPreview && (
                  <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  ※{t("validFormats") || "Valid only for jpeg, gif, png, jpg, bmp, svg file formats"}
                </p>
              </div>
            </div>

            {/* Update Button */}
            <div className="grid grid-cols-[120px_1fr] items-center gap-4 pt-4">
              <div></div>
              <Button
                variant="primary"
                onClick={handleUpdate}
                disabled={saving}
                className="w-fit"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("update") || "Update"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

"use client";

import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { useLocale } from "@/lib/hooks/useLocale";
import { Button, Card, Input, Label, useToast } from "@underverse-ui/underverse";
import { ArrowLeft, Loader2, Lock, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordContainer() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  const t = useTranslations("ChangePasswordPage");
  const { addToast } = useToast();
  const router = useRouter();
  const locale = useLocale();

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.current = t("currentPasswordRequired") || "Current password is required";
    }

    if (!newPassword) {
      newErrors.new = t("newPasswordRequired") || "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.new = t("passwordMinLength") || "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirm = t("confirmPasswordRequired") || "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = t("passwordMismatch") || "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      addToast({
        type: "success",
        message: t("changePasswordSuccess") || "Password changed successfully",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to profile
      router.push(`/${locale}/profile`);
    } catch (error: any) {
      addToast({
        type: "error",
        message: error?.message || t("changePasswordFailed") || "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/profile`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title") || "Change Password"}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle") || "Update your password to keep your account secure"}</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {t("currentPassword") || "Current Password"} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("currentPasswordPlaceholder") || "Enter your current password"}
                  className={`pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden ${
                    errors.current ? "border-destructive" : ""
                  }`}
                  style={{ WebkitTextSecurity: showCurrentPassword ? "none" : undefined } as any}
                />
              </div>
              {errors.current && <p className="text-sm text-destructive">{errors.current}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t("newPassword") || "New Password"} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder") || "Enter your new password (min 6 characters)"}
                  className={`pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden ${
                    errors.new ? "border-destructive" : ""
                  }`}
                  style={{ WebkitTextSecurity: showNewPassword ? "none" : undefined } as any}
                />
              </div>
              {errors.new && <p className="text-sm text-destructive">{errors.new}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("confirmPassword") || "Confirm New Password"} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder") || "Re-enter your new password"}
                  className={`pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden ${
                    errors.confirm ? "border-destructive" : ""
                  }`}
                  style={{ WebkitTextSecurity: showConfirmPassword ? "none" : undefined } as any}
                />
              </div>
              {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {t("saveButton") || "Save Changes"}
              </Button>
              <Link href={`/${locale}/profile`}>
                <Button type="button" variant="outline">
                  {t("cancel") || "Cancel"}
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

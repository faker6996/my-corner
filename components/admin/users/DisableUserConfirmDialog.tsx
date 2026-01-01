"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal, Button, useToast } from "@underverse-ui/underverse";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Ban, Loader2 } from "lucide-react";

interface DisableUserConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: number | null;
    userName: string;
    currentUserId?: number;
}

export default function DisableUserConfirmDialog({ open, onClose, onSuccess, userId, userName, currentUserId }: DisableUserConfirmDialogProps) {
    const t = useTranslations("UsersPage");
    const { addToast } = useToast();
    const { logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDisable = async () => {
        if (!userId) return;

        const isSelf = currentUserId && userId === currentUserId;

        setLoading(true);
        try {
            await callApi(API_ROUTES.USERS.DETAIL(userId), HTTP_METHOD_ENUM.PATCH, { is_active: false });
            addToast({ type: "success", message: t("updateSuccess") });

            // If user disabled themselves, logout and redirect to login
            if (isSelf) {
                logout();
                router.push("/en/login");
                return;
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            addToast({ type: "error", message: err?.message || t("updateFailed") });
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <Modal isOpen={open} onClose={onClose} size="md" title={t("disableConfirmTitle")}>
            <div className="py-4">
                {/* Content */}
                <div className="space-y-4">
                    <p className="text-sm">
                        {t("disableConfirmMessage")}
                    </p>

                    <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-sm">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
                            <div>
                                <strong>{userName}</strong> {t("disableConfirmDetail")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {t("cancel")}
                    </Button>
                    <Button variant="destructive" onClick={handleDisable} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Ban className="w-4 h-4 mr-2" />
                        {t("disableConfirmButton")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Input, Button, useToast } from "@underverse-ui/underverse";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { useLocale } from "@/lib/hooks/useLocale";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { loading } from "@/lib/utils/loading";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type TokenStatus = "loading" | "valid" | "invalid" | "expired" | "activated";

export default function ActivateContainer() {
    const router = useRouter();
    const locale = useLocale();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const { addToast } = useToast();
    const t = useTranslations("ActivatePage");

    const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
    const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            setTokenStatus("invalid");
            return;
        }

        const validateToken = async () => {
            try {
                const res = await callApi<any>("/api/auth/invite/validate", HTTP_METHOD_ENUM.POST, { token }, { silent: true });
                if (res?.valid) {
                    setTokenStatus("valid");
                    setUserInfo(res.user);
                } else {
                    setTokenStatus(res?.reason === "TOKEN_INVALID_OR_EXPIRED" ? "expired" : "invalid");
                }
            } catch {
                setTokenStatus("invalid");
            }
        };

        validateToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password.length < 6) {
            addToast({ type: "error", message: t("passwordMinLength") });
            return;
        }

        if (password !== confirmPassword) {
            addToast({ type: "error", message: t("passwordMismatch") });
            return;
        }

        setSubmitting(true);
        loading.show(t("activating"));

        try {
            await callApi("/api/auth/activate", HTTP_METHOD_ENUM.POST, { token, password });
            setTokenStatus("activated");
            addToast({ type: "success", message: t("activateSuccessToast") });
        } catch (err: any) {
            addToast({ type: "error", message: err?.message || t("activateFailed") });
        } finally {
            setSubmitting(false);
            loading.hide();
        }
    };

    // Loading state
    if (tokenStatus === "loading") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("validating")}</p>
                </div>
            </div>
        );
    }

    // Invalid or expired token
    if (tokenStatus === "invalid" || tokenStatus === "expired") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-md space-y-6 animate-fade-in">
                    <div className="rounded-xl glass-card px-6 py-8 shadow-lg sm:px-10 border-2 border-destructive/20 text-center">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">
                            {tokenStatus === "expired" ? t("linkExpired") : t("linkInvalid")}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            {tokenStatus === "expired" ? t("linkExpiredDesc") : t("linkInvalidDesc")}
                        </p>
                        <Link href={`/${locale}/login`}>
                            <Button variant="primary" className="w-full">
                                {t("goToLogin")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Activated successfully
    if (tokenStatus === "activated") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-md space-y-6 animate-fade-in">
                    <div className="rounded-xl glass-card px-6 py-8 shadow-lg sm:px-10 border-2 border-success/20 text-center">
                        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">{t("activateSuccess")}</h2>
                        <p className="text-muted-foreground mb-6">
                            {t("activateSuccessDesc")}
                        </p>
                        <Link href={`/${locale}/login`}>
                            <Button variant="primary" className="w-full">
                                {t("loginNow")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Valid token - show password form
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                {/* Logo + Heading */}
                <div className="text-center">
                    <div className="relative mx-auto mb-3 h-10 w-10 flex items-center justify-center rounded-lg">
                        <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-secondary/30 rounded-lg blur-md"></div>
                        <div className="relative bg-primary/10 h-full w-full rounded-lg flex items-center justify-center">
                            <Image src="/ocr-logo.svg" alt="Logo" width={28} height={28} priority />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-balance bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {t("activateAccount")}
                    </h2>
                    {userInfo?.email && (
                        <p className="text-muted-foreground mt-2">
                            {t("welcome")} <span className="text-primary font-medium">{userInfo.name || userInfo.email}</span>
                        </p>
                    )}
                </div>

                {/* Form */}
                <div className="rounded-xl glass-card px-6 py-8 shadow-lg sm:px-10 border-2 border-border/20">
                    <form className="space-y-6" onSubmit={handleActivate}>
                        <Input
                            label={t("newPassword")}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder={t("newPasswordPlaceholder")}
                            className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />

                        <Input
                            label={t("confirmPassword")}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder={t("confirmPasswordPlaceholder")}
                            className="mt-1 block w-full rounded-md border border-border bg-input text-foreground px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting}
                            className="w-full rounded-md bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/30 font-medium shadow-sm transition-all duration-200"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t("processing")}
                                </span>
                            ) : (
                                t("activateButton")
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

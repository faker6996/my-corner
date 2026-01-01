"use client";

import { useState } from "react";
import { Input, Button } from "@underverse-ui/underverse";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM, LOCALE } from "@/lib/constants/enum";
import { callApi } from "@/lib/utils/api-client";
import { useLocale } from "@/lib/hooks/useLocale";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ForgotPassword() {
  /* ---------- hooks ---------- */
  const locale = useLocale();
  const t = useTranslations("ForgotPassword");

  /* ---------- state ---------- */
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(t("sending"));

    try {
      await callApi<null>(API_ROUTES.RESET_PASSWORD.REQUEST, HTTP_METHOD_ENUM.POST, { email, locale }, { silent: true });
      setStatus(t("sentSuccess"));
    } catch (_error) {
      setStatus(t("errorDefault"));
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("heading")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {t("emailLabel")}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full"
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{t("sending")}</span>
                </div>
              ) : (
                t("submitButton")
              )}
            </Button>
          </form>

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-md text-sm ${
              status === t("sentSuccess") 
                ? "bg-success/10 text-success border border-success/20" 
                : status === t("sending")
                ? "bg-info/10 text-info border border-info/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              <div className="flex items-start space-x-2">
                {status === t("sentSuccess") && (
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {status === t("sending") && (
                  <div className="w-5 h-5 mt-0.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {status !== t("sentSuccess") && status !== t("sending") && (
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <p className="wrap-break-word">{status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Back to Login Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("rememberPassword")}{" "}
            <Link 
              href={`/${locale}/login`}
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

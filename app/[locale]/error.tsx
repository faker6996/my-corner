"use client";

import { useLocale } from "@/lib/hooks/useLocale";
import { useEffect, useState } from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Button } from "@underverse-ui/underverse";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const locale = useLocale();
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    getMessages(locale as any).then(setMessages);
  }, [locale]);

  if (!messages) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ErrorContent error={error} reset={reset} />
    </NextIntlClientProvider>
  );
}

function ErrorContent({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("ErrorPage");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-destructive/5 via-background to-primary/5 -z-10" />

      {/* Error Card */}
      <div className="max-w-2xl w-full">
        <div className="bg-card border border-border rounded-xl shadow-xl p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Icon & Badge */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-destructive/10 p-6 rounded-full">
                <svg className="w-16 h-16 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <div className="inline-flex items-center px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
              <span className="text-xs font-medium text-destructive uppercase tracking-wider">Error Occurred</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">{t("message")}</p>
          </div>

          {/* Error Details */}
          {error.message && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-foreground">Error Details</h3>
              </div>
              <p className="text-sm font-mono text-muted-foreground bg-background/50 rounded px-3 py-2 wrap-break-word">{error.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={reset}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg group"
            >
              <svg
                className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t("retry")}
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="flex-1 border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-sm text-muted-foreground mt-6 animate-in fade-in duration-700 delay-300">
          If the problem persists, please contact support
        </p>
      </div>
    </div>
  );
}

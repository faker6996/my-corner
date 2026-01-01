import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages as getAppMessages } from "@/lib/i18n/getMessages";
import { AppProviders } from "@/components/providers/AppProviders";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OCR Editor",
  description: "",
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getAppMessages(locale as any);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-inter`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <div className="min-h-screen bg-background" role="main" aria-label="Main content">
              <ConditionalLayout>{children}</ConditionalLayout>
            </div>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { AdminAdsContainer } from "@/components/admin/ads";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý quảng cáo | Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminAdsPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "admin"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminAdsContainer />
    </NextIntlClientProvider>
  );
}

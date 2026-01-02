import DashboardContainer from "@/components/admin/dashboard/DashboardContainer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["dashboard", "ocr", "validation", "pagination"] });
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DashboardContainer />
    </NextIntlClientProvider>
  );
}

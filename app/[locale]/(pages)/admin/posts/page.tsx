import { AdminPostsContainer } from "@/components/admin/posts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý bài viết | Admin",
  description: "Quản lý bài viết trên BachTV's Corner",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPostsPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "admin"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminPostsContainer />
    </NextIntlClientProvider>
  );
}

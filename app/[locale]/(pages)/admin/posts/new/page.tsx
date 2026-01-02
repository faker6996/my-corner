import { PostEditorContainer } from "@/components/admin/posts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tạo bài viết mới | Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewPostPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "admin"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PostEditorContainer />
    </NextIntlClientProvider>
  );
}

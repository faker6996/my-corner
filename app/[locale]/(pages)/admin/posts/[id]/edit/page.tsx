import { PostEditorContainer } from "@/components/admin/posts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết | Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { locale, id } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "admin"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PostEditorContainer postId={id} />
    </NextIntlClientProvider>
  );
}

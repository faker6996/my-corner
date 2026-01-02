import BlogHomeContainer from "@/components/blog/BlogHomeContainer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  const title = locale === "vi" ? "BachTV's Corner - Blog về Lập trình & Công nghệ" : "BachTV's Corner - Programming & Technology Blog";

  const description =
    locale === "vi"
      ? "Chia sẻ kinh nghiệm lập trình, công nghệ, và cuộc sống. Các bài viết về JavaScript, TypeScript, React, Next.js và nhiều hơn nữa."
      : "Sharing programming experiences, technology insights, and life stories. Articles about JavaScript, TypeScript, React, Next.js and more.";

  return {
    title,
    description,
    keywords: ["blog", "programming", "tech", "javascript", "typescript", "react", "nextjs", "lập trình", "công nghệ"],
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      siteName: "BachTV's Corner",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/${locale}/blog`,
      languages: {
        vi: "/vi/blog",
        en: "/en/blog",
      },
    },
  };
}

export default async function BlogHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "blog"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <BlogHomeContainer />
    </NextIntlClientProvider>
  );
}

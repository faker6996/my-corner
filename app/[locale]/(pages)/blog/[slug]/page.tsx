import PostDetailContainer from "@/components/blog/PostDetailContainer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";
import { postApp } from "@/lib/modules/posts";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const post = await postApp.getPostBySlug(slug, false);

    const title = post.seo_title || post.title || "Blog Post";
    const description = post.seo_description || post.excerpt || `Đọc bài viết ${post.title}`;
    const image = post.cover_image_url || post.thumbnail_url;

    return {
      title: `${title} | BachTV's Corner`,
      description,
      keywords: post.seo_keywords?.split(",").map((k: string) => k.trim()) || [],
      openGraph: {
        title,
        description,
        type: "article",
        locale: locale === "vi" ? "vi_VN" : "en_US",
        siteName: "BachTV's Corner",
        images: image ? [{ url: image, width: 1200, height: 630 }] : [],
        publishedTime: post.published_at?.toISOString(),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : [],
      },
      alternates: {
        canonical: `/${locale}/blog/${slug}`,
      },
    };
  } catch {
    return {
      title: "Bài viết | BachTV's Corner",
      description: "Đọc bài viết trên BachTV's Corner",
    };
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "blog"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PostDetailContainer slug={slug} />
    </NextIntlClientProvider>
  );
}

import CategoryPageContainer from "@/components/blog/CategoryPageContainer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";
import { categoryApp } from "@/lib/modules/categories";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const category = await categoryApp.getBySlug(slug);

    const title = locale === "vi" ? `${category.name} - Danh mục | BachTV's Corner` : `${category.name} - Category | BachTV's Corner`;

    const description =
      category.description || (locale === "vi" ? `Các bài viết trong danh mục ${category.name}` : `Articles in ${category.name} category`);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        locale: locale === "vi" ? "vi_VN" : "en_US",
        siteName: "BachTV's Corner",
      },
      alternates: {
        canonical: `/${locale}/category/${slug}`,
      },
    };
  } catch {
    return {
      title: locale === "vi" ? "Danh mục | BachTV's Corner" : "Category | BachTV's Corner",
      description: locale === "vi" ? "Xem các bài viết theo danh mục" : "View articles by category",
    };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const messages = await getMessages(locale as any, { namespaces: ["common", "blog"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CategoryPageContainer slug={slug} />
    </NextIntlClientProvider>
  );
}

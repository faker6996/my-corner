import SearchPageContainer from "@/components/blog/SearchPageContainer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n/getMessages";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;

  const baseTitle = locale === "vi" ? "Tìm kiếm" : "Search";
  const title = q ? `${baseTitle}: "${q}" | BachTV's Corner` : `${baseTitle} | BachTV's Corner`;

  const description =
    locale === "vi"
      ? "Tìm kiếm bài viết về lập trình, công nghệ và nhiều chủ đề khác trên BachTV's Corner"
      : "Search articles about programming, technology and more topics on BachTV's Corner";

  return {
    title,
    description,
    robots: {
      index: false, // Don't index search result pages
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      siteName: "BachTV's Corner",
    },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const messages = await getMessages(locale as any, { namespaces: ["common", "blog"] });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SearchPageContainer query={q} />
    </NextIntlClientProvider>
  );
}

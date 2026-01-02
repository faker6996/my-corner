"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import PostCard from "./PostCard";
import { LoadingSpinner, Grid, Section } from "@underverse-ui/underverse";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail_url?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  reading_time_minutes?: number;
  published_at?: string;
  created_at?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface CategoryPageContainerProps {
  slug: string;
}

export default function CategoryPageContainer({ slug }: CategoryPageContainerProps) {
  const locale = useLocale();
  const [category, setCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categories = await callApi<Category[]>("/api/categories", HTTP_METHOD_ENUM.GET);
        const foundCategory = categories?.find((c) => c.slug === slug);

        if (foundCategory) {
          setCategory(foundCategory);
          const postsData = await callApi<{ posts: Post[] }>(`/api/posts?categoryId=${foundCategory.id}&status=published`, HTTP_METHOD_ENUM.GET);
          if (postsData?.posts) setPosts(postsData.posts);
        }
      } catch (error) {
        console.error("Failed to fetch category:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Danh mục không tồn tại</h1>
        <Link href={`/${locale}/blog`} className="text-primary hover:underline">
          ← Quay lại trang blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <Section
        variant="gradient"
        gradientFrom="from-primary/70"
        gradientTo="to-secondary/70"
        gradientDirection="to-r"
        spacing="lg"
        fullWidth
        className="text-center rounded-2xl mb-10 text-primary-foreground"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && <p className="opacity-90">{category.description}</p>}
      </Section>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <Grid columns={3} gap="1.5rem" responsive={{ sm: { columns: 1 }, md: { columns: 2 }, lg: { columns: 3 } }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Grid>
      ) : (
        <p className="text-center text-muted-foreground py-16">Chưa có bài viết trong danh mục này.</p>
      )}
    </div>
  );
}

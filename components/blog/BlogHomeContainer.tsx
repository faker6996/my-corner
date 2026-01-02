"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import PostCard from "./PostCard";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { LoadingSpinner, Badge, Grid, Section } from "@underverse-ui/underverse";
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
}

export default function BlogHomeContainer() {
  const locale = useLocale();
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsData, categoriesData] = await Promise.all([
          callApi<{ posts: Post[] }>("/api/posts", HTTP_METHOD_ENUM.GET),
          callApi<Category[]>("/api/categories", HTTP_METHOD_ENUM.GET),
        ]);

        if (postsData?.posts) {
          const posts = postsData.posts;
          setFeaturedPosts(posts.slice(0, 3));
          setRecentPosts(posts.slice(3, 9));
        }

        if (categoriesData) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Failed to fetch blog data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <Section
        variant="gradient"
        gradientFrom="from-primary/80"
        gradientTo="to-secondary/80"
        gradientDirection="to-r"
        spacing="lg"
        fullWidth
        className="text-center rounded-2xl mb-12 text-primary-foreground"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">BachTV's Corner</h1>
        <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto">Chia sẻ kinh nghiệm lập trình, công nghệ và cuộc sống</p>
      </Section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">Bài viết nổi bật</h2>
          <Grid columns={3} gap="1.5rem" responsive={{ sm: { columns: 1 }, md: { columns: 2 }, lg: { columns: 3 } }}>
            {featuredPosts.map((post, index) => (
              <PostCard key={post.id} post={post} variant={index === 0 ? "featured" : "default"} />
            ))}
          </Grid>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">Danh mục</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/${locale}/category/${cat.slug}`}>
                <Badge
                  variant="outline"
                  size="lg"
                  clickable
                  className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">Bài viết mới</h2>
          <Grid columns={3} gap="1.5rem" responsive={{ sm: { columns: 1 }, md: { columns: 2 }, lg: { columns: 3 } }}>
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Grid>
        </section>
      )}

      {/* Empty State */}
      {featuredPosts.length === 0 && recentPosts.length === 0 && (
        <Section spacing="xl" className="text-center">
          <h2 className="text-2xl text-foreground mb-2">Chưa có bài viết nào</h2>
          <p className="text-muted-foreground">Các bài viết sẽ sớm được cập nhật!</p>
        </Section>
      )}
    </div>
  );
}

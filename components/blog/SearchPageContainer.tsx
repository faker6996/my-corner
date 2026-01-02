"use client";

import { useState } from "react";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import PostCard from "./PostCard";
import { Input, Button, LoadingSpinner, Grid, Section } from "@underverse-ui/underverse";

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

interface SearchPageContainerProps {
  query?: string;
}

export default function SearchPageContainer({ query = "" }: SearchPageContainerProps) {
  const [searchQuery, setSearchQuery] = useState(query);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const result = await callApi<{ posts: Post[] }>(`/api/posts?search=${encodeURIComponent(q)}&status=published`, HTTP_METHOD_ENUM.GET);
      if (result?.posts) setPosts(result.posts);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Header */}
      <Section spacing="lg" className="text-center rounded-2xl mb-10 bg-gradient-to-r from-primary/80 to-secondary/80 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-6">Tìm kiếm bài viết</h1>
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-lg mx-auto">
          <Input
            placeholder="Nhập từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-white/90 text-foreground"
            size="lg"
          />
          <Button type="submit" size="lg" variant="secondary">
            Tìm kiếm
          </Button>
        </form>
      </Section>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">Kết quả tìm kiếm ({posts.length})</h2>
          {posts.length > 0 ? (
            <Grid columns={3} gap="1.5rem" responsive={{ sm: { columns: 1 }, md: { columns: 2 }, lg: { columns: 3 } }}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </Grid>
          ) : (
            <p className="text-center text-muted-foreground py-12">Không tìm thấy bài viết nào phù hợp.</p>
          )}
        </section>
      )}
    </div>
  );
}

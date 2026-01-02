"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Card, Badge, SmartImage } from "@underverse-ui/underverse";

interface PostCardProps {
  post: {
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
  };
  categoryName?: string;
  variant?: "default" | "featured" | "compact";
}

export default function PostCard({ post, categoryName, variant = "default" }: PostCardProps) {
  const locale = useLocale();
  const postUrl = `/${locale}/blog/${post.slug}`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (variant === "compact") {
    return (
      <Link href={postUrl} className="flex justify-between items-center py-3 border-b border-border hover:text-primary transition-colors">
        <span className="text-sm font-medium text-foreground">{post.title}</span>
        <span className="text-xs text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
      </Link>
    );
  }

  return (
    <Card
      hoverable
      clickable
      onClick={() => (window.location.href = postUrl)}
      className={`overflow-hidden ${variant === "featured" ? "md:col-span-2" : ""}`}
    >
      {post.thumbnail_url && (
        <div className="aspect-video overflow-hidden">
          <SmartImage src={post.thumbnail_url} alt={post.title} fill fit="cover" className="transition-transform duration-300 hover:scale-105" />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3">
        {categoryName && (
          <Badge variant="secondary" size="sm" className="w-fit">
            {categoryName}
          </Badge>
        )}
        <Link href={postUrl}>
          <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
        </Link>
        {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-auto">
          <span>{formatDate(post.published_at || post.created_at)}</span>
          {post.reading_time_minutes && post.reading_time_minutes > 0 && <span>• {post.reading_time_minutes} min read</span>}
          <div className="flex gap-2 ml-auto">
            {post.view_count !== undefined && <span className="flex items-center gap-1">👁 {post.view_count}</span>}
            {post.like_count !== undefined && <span className="flex items-center gap-1">❤️ {post.like_count}</span>}
            {post.comment_count !== undefined && <span className="flex items-center gap-1">💬 {post.comment_count}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

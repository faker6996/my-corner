"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { LoadingSpinner, Card } from "@underverse-ui/underverse";

interface Analytics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalCategories: number;
  totalTags: number;
  topPosts: Array<{
    id: number;
    title: string;
    slug: string;
    view_count: number;
    like_count: number;
  }>;
  recentComments: Array<{
    id: number;
    content: string;
    author_name: string;
    post_title: string;
    created_at: string;
  }>;
}

export default function AdminAnalyticsContainer() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch data from multiple endpoints
        const [postsRes, categoriesRes, tagsRes, commentsRes] = await Promise.all([
          callApi<{ posts: any[]; total: number }>("/api/posts?limit=1000", HTTP_METHOD_ENUM.GET),
          callApi<any[]>("/api/categories", HTTP_METHOD_ENUM.GET),
          callApi<any[]>("/api/tags", HTTP_METHOD_ENUM.GET),
          callApi<any[]>("/api/comments?limit=5", HTTP_METHOD_ENUM.GET),
        ]);

        const posts = postsRes?.posts || [];
        const publishedPosts = posts.filter((p) => p.status === "published");
        const draftPosts = posts.filter((p) => p.status === "draft");

        const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
        const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);

        const topPosts = [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);

        setAnalytics({
          totalPosts: posts.length,
          publishedPosts: publishedPosts.length,
          draftPosts: draftPosts.length,
          totalViews,
          totalLikes,
          totalComments,
          totalCategories: categoriesRes?.length || 0,
          totalTags: tagsRes?.length || 0,
          topPosts,
          recentComments: commentsRes || [],
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-12 text-muted-foreground">Không thể tải dữ liệu thống kê</div>;
  }

  const stats = [
    { label: "Tổng bài viết", value: analytics.totalPosts, icon: "📝", color: "bg-blue-500/10 text-blue-600" },
    { label: "Đã xuất bản", value: analytics.publishedPosts, icon: "✅", color: "bg-green-500/10 text-green-600" },
    { label: "Bản nháp", value: analytics.draftPosts, icon: "📋", color: "bg-yellow-500/10 text-yellow-600" },
    { label: "Lượt xem", value: analytics.totalViews, icon: "👁", color: "bg-purple-500/10 text-purple-600" },
    { label: "Lượt thích", value: analytics.totalLikes, icon: "❤️", color: "bg-red-500/10 text-red-600" },
    { label: "Bình luận", value: analytics.totalComments, icon: "💬", color: "bg-cyan-500/10 text-cyan-600" },
    { label: "Danh mục", value: analytics.totalCategories, icon: "📁", color: "bg-orange-500/10 text-orange-600" },
    { label: "Thẻ tags", value: analytics.totalTags, icon: "🏷️", color: "bg-pink-500/10 text-pink-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Tổng quan về blog của bạn</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className={`p-4 ${stat.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Posts */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">🏆 Bài viết nổi bật</h2>
          <div className="space-y-3">
            {analytics.topPosts.map((post, idx) => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                  <span className="font-medium text-foreground line-clamp-1">{post.title}</span>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>👁 {post.view_count}</span>
                  <span>❤️ {post.like_count}</span>
                </div>
              </div>
            ))}
            {analytics.topPosts.length === 0 && <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu</p>}
          </div>
        </Card>

        {/* Recent Comments */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">💬 Bình luận gần đây</h2>
          <div className="space-y-3">
            {analytics.recentComments.map((comment) => (
              <div key={comment.id} className="py-2 border-b border-border last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-foreground">{comment.author_name || "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{comment.content}</p>
                <p className="text-xs text-primary mt-1">{comment.post_title}</p>
              </div>
            ))}
            {analytics.recentComments.length === 0 && <p className="text-muted-foreground text-center py-4">Chưa có bình luận</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

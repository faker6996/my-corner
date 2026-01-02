"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Button, Input, Textarea, Card, LoadingSpinner, SmartImage } from "@underverse-ui/underverse";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  reading_time_minutes?: number;
  published_at?: string;
  created_at?: string;
}

interface Comment {
  id: number;
  content: string;
  author_name?: string;
  created_at: string;
}

interface PostDetailContainerProps {
  slug: string;
}

export default function PostDetailContainer({ slug }: PostDetailContainerProps) {
  const locale = useLocale();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await callApi<Post>(`/api/posts/slug/${slug}`, HTTP_METHOD_ENUM.GET);
        if (postData) {
          setPost(postData);
          try {
            const commentsData = await callApi<Comment[]>(`/api/posts/${postData.id}/comments`, HTTP_METHOD_ENUM.GET);
            if (commentsData) setComments(commentsData);
          } catch {
            setComments([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await callApi<{ liked: boolean }>(`/api/posts/${post.id}/like`, HTTP_METHOD_ENUM.POST, undefined, {
        headers: { "x-session-id": getSessionId() },
      });
      if (result) {
        setLiked(result.liked);
        setPost({ ...post, like_count: (post.like_count || 0) + (result.liked ? 1 : -1) });
      }
    } catch {}
  };

  const handleShare = async (platform: string) => {
    if (!post) return;
    try {
      await callApi(`/api/posts/${post.id}/share`, HTTP_METHOD_ENUM.POST, { platform });
    } catch {}
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    };
    if (shareUrls[platform]) window.open(shareUrls[platform], "_blank", "width=600,height=400");
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const result = await callApi<Comment>(`/api/posts/${post.id}/comments`, HTTP_METHOD_ENUM.POST, {
        content: newComment,
        author_name: authorName || "Anonymous",
      });
      if (result) {
        setComments([...comments, result]);
        setNewComment("");
        setPost({ ...post, comment_count: (post.comment_count || 0) + 1 });
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Bài viết không tồn tại</h1>
        <a href={`/${locale}/blog`} className="text-primary hover:underline">
          ← Quay lại trang blog
        </a>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      {/* Cover Image */}
      {(post.cover_image_url || post.thumbnail_url) && (
        <div className="aspect-[21/9] rounded-xl overflow-hidden mb-8 -mx-4 md:mx-0">
          <SmartImage src={post.cover_image_url || post.thumbnail_url || ""} alt={post.title} fill fit="cover" priority />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">{post.title}</h1>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{formatDate(post.published_at || post.created_at)}</span>
          {post.reading_time_minutes && <span>• {post.reading_time_minutes} phút đọc</span>}
          <span>• {post.view_count || 0} lượt xem</span>
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* Actions */}
      <div className="flex gap-3 py-6 border-y border-border mb-8">
        <Button variant={liked ? "destructive" : "outline"} size="sm" onClick={handleLike}>
          ❤️ {post.like_count || 0}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleShare("facebook")}>
          📘 Share
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleShare("twitter")}>
          🐦 Tweet
        </Button>
      </div>

      {/* Comments Section */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">Bình luận ({post.comment_count || 0})</h2>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="space-y-4 mb-8">
          <Input placeholder="Tên của bạn" value={authorName} onChange={(e) => setAuthorName(e.target.value)} size="md" />
          <Textarea placeholder="Viết bình luận..." value={newComment} onChange={(e) => setNewComment(e.target.value)} size="md" />
          <Button type="submit" loading={submitting}>
            Gửi bình luận
          </Button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex justify-between mb-2 text-sm">
                <strong className="text-foreground">{comment.author_name || "Anonymous"}</strong>
                <span className="text-muted-foreground">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-muted-foreground">{comment.content}</p>
            </Card>
          ))}
          {comments.length === 0 && <p className="text-center text-muted-foreground py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>}
        </div>
      </section>
    </article>
  );
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2);
    localStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

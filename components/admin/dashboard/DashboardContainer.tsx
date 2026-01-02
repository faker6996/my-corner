"use client";

import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { Card, Button, SkeletonCard, SkeletonText } from "@underverse-ui/underverse";
import { BookOpen, PenTool, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function DashboardContainer() {
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Dashboard");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <SkeletonText lines={1} className="h-8 w-48" />
            <SkeletonText lines={1} className="h-4 w-64 mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} textLines={3} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">BachTV's Corner</h1>
          <p className="text-muted-foreground">Blog chia sẻ kinh nghiệm lập trình và thành quả cá nhân</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Bài viết</h3>
            </div>
            <p className="text-muted-foreground mb-4">Chia sẻ kiến thức, kinh nghiệm lập trình và các bài học từ thực tế.</p>
            <Button variant="ghost" className="w-full">
              Xem thêm →
            </Button>
          </Card>

          <Card className="glass-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <PenTool className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Dự án</h3>
            </div>
            <p className="text-muted-foreground mb-4">Showcase các dự án cá nhân và open source đã thực hiện.</p>
            <Button variant="ghost" className="w-full">
              Xem thêm →
            </Button>
          </Card>

          <Card className="glass-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Rocket className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Thành tựu</h3>
            </div>
            <p className="text-muted-foreground mb-4">Ghi nhận các cột mốc và thành tựu trong sự nghiệp.</p>
            <Button variant="ghost" className="w-full">
              Xem thêm →
            </Button>
          </Card>
        </div>

        {/* Welcome Section */}
        <Card className="text-center p-8 glass-card">
          <h2 className="text-2xl font-bold mb-4">Chào mừng đến với BachTV's Corner!</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Đây là nơi tôi chia sẻ những kinh nghiệm, bài học và thành quả trong hành trình phát triển phần mềm. Hãy cùng khám phá và học hỏi!
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

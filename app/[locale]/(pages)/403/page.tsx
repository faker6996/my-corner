"use client";

import React from "react";
import DashboardLayout from "@/app/[locale]/layouts/DashboardLayout";
import { Card, Button } from "@underverse-ui/underverse";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";

export default function ForbiddenPage() {
  const t = useTranslations('ForbiddenPage');
  const router = useRouter();
  const params = useParams();
  const locale = (params as any).locale as string;

  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-lg w-full">
          <div className="text-4xl font-bold mb-2">403</div>
          <h1 className="text-xl font-semibold mb-2">{t('title') as string}</h1>
          <p className="text-muted-foreground mb-6">{t('subtitle') as string}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="primary" onClick={() => router.push(`/${locale}/dashboard`)}>
              {t('backToHome') as string}
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>
              {t('goBack') as string}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

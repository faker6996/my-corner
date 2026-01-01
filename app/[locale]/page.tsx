"use client";

import { useLocale } from "@/lib/hooks/useLocale";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Redirect to dashboard
    router.push(`/${locale}/dashboard`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}

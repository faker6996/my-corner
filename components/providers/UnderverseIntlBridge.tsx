"use client";

import React from "react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { usePathname } from "next/navigation";
import { getUnderverseMessages } from "@underverse-ui/underverse";
import { deriveNamespaces } from "@/lib/i18n/namespaces";
import { loadNamespace, type Locale as L } from "@/lib/i18n/manifest";

function deepMerge(target: any, source: any) {
  if (typeof target !== "object" || target === null) return source;
  if (typeof source !== "object" || source === null) return target;
  const out: any = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = (target as any)[key];
    if (sv && typeof sv === "object" && !Array.isArray(sv)) {
      out[key] = deepMerge(tv ?? {}, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

export default function UnderverseIntlBridge({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const base = useMessages();
  // Merge Underverse UI default messages on the client to avoid SSR import issues
  const uv = getUnderverseMessages((locale as any) || "en");

  // Load page-specific namespaces on the client using pathname
  const pathname = usePathname() || "/";
  const merged = React.useMemo(() => {
    const nss = deriveNamespaces(pathname);
    let extra: any = {};
    for (const ns of nss) {
      const loaded = loadNamespace(ns, (locale as unknown as L) || "vi");
      if (loaded) extra = deepMerge(extra, loaded);
    }
    const withBase = deepMerge(uv, base as any);
    return deepMerge(withBase, extra);
  }, [uv, base, pathname, locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}

// lib/i18n/getMessages.ts
import { type Locale } from "@/i18n.config";
import { deriveNamespaces } from "@/lib/i18n/namespaces";
import { loadNamespace, loadCommon, type Locale as L } from "@/lib/i18n/manifest";

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

export async function getMessages(locale: Locale, opts?: { namespaces?: string[]; pathname?: string }) {
  // Base messages under common/{locale}.json (via manifest)
  const base = loadCommon(locale as unknown as L);

  // Determine namespaces to load
  let namespaces: string[] = opts?.namespaces || [];
  if (!namespaces.length && opts?.pathname) {
    namespaces = deriveNamespaces(opts.pathname);
  }

  // Backward-compat: include "users" overlay if caller didn't specify anything
  if (!namespaces.length) namespaces = ["users"]; // safe default, no-op if file missing

  // Merge overlays in order
  let merged = base;
  for (const ns of namespaces) {
    const loaded = loadNamespace(ns, locale as unknown as L);
    if (loaded) merged = deepMerge(merged, loaded);
  }
  return merged;
}

export default getMessages;

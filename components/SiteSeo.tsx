"use client";

import { useEffect } from "react";
import type { SiteContent } from "@/lib/cms";

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element!.setAttribute(key, value));
}

export default function SiteSeo({ seo }: { seo: SiteContent["seo"] }) {
  useEffect(() => {
    if (!seo) return;
    document.title = seo.title || "NyalaLagi";
    upsertMeta('meta[name="description"]', { name: "description", content: seo.description || "" });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: seo.keywords || "" });
    upsertMeta('meta[name="robots"]', { name: "robots", content: `${seo.robotsIndex ? "index" : "noindex"},${seo.robotsFollow ? "follow" : "nofollow"}` });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.ogTitle || seo.title || "NyalaLagi" });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: seo.ogDescription || seo.description || "" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    if (seo.ogImage) upsertMeta('meta[property="og:image"]', { property: "og:image", content: seo.ogImage });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.ogTitle || seo.title || "NyalaLagi" });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.ogDescription || seo.description || "" });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (seo.canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = seo.canonicalUrl;
    } else if (canonical) {
      canonical.remove();
    }
  }, [seo]);

  return null;
}

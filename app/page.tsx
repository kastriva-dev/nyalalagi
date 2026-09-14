import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "@/lib/cms";

export const revalidate = 300;

function stringValue(field: any, fallback: string): string {
  return typeof field?.stringValue === "string" ? field.stringValue : fallback;
}
function boolValue(field: any, fallback: boolean): boolean {
  return typeof field?.booleanValue === "boolean" ? field.booleanValue : fallback;
}

async function getCmsSeo(): Promise<SiteContent["seo"]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return DEFAULT_SITE_CONTENT.seo;

  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/siteContent/main?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, { next: { revalidate: 300 } });
    if (!response.ok) return DEFAULT_SITE_CONTENT.seo;
    const json = await response.json();
    const fields = json?.fields?.seo?.mapValue?.fields;
    if (!fields) return DEFAULT_SITE_CONTENT.seo;
    return {
      title: stringValue(fields.title, DEFAULT_SITE_CONTENT.seo.title),
      description: stringValue(fields.description, DEFAULT_SITE_CONTENT.seo.description),
      keywords: stringValue(fields.keywords, DEFAULT_SITE_CONTENT.seo.keywords),
      canonicalUrl: stringValue(fields.canonicalUrl, DEFAULT_SITE_CONTENT.seo.canonicalUrl),
      ogTitle: stringValue(fields.ogTitle, DEFAULT_SITE_CONTENT.seo.ogTitle),
      ogDescription: stringValue(fields.ogDescription, DEFAULT_SITE_CONTENT.seo.ogDescription),
      ogImage: stringValue(fields.ogImage, DEFAULT_SITE_CONTENT.seo.ogImage),
      robotsIndex: boolValue(fields.robotsIndex, DEFAULT_SITE_CONTENT.seo.robotsIndex),
      robotsFollow: boolValue(fields.robotsFollow, DEFAULT_SITE_CONTENT.seo.robotsFollow)
    };
  } catch {
    return DEFAULT_SITE_CONTENT.seo;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getCmsSeo();
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.split(",").map(item => item.trim()).filter(Boolean),
    alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    openGraph: {
      type: "website",
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      url: seo.canonicalUrl || undefined,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined
    }
  };
}

export default function Page() {
  return <LandingPage />;
}

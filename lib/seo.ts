import type { Metadata } from "next";

export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://hausandgrace.ae").replace(/\/$/, "");
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og.png`;

export function pageMetadata(title: string, description: string, path = "", image = DEFAULT_IMAGE): Metadata {
  const url = `${SITE_ORIGIN}${path}`;
  return {
    title,
    description,
    keywords: ["UAE real estate", "UAE property investment", "Dubai property", "HAUS & GRACE", title],
    authors: [{ name: "HAUS & GRACE Properties" }],
    creator: "HAUS & GRACE Properties",
    publisher: "HAUS & GRACE Properties",
    alternates: { canonical: url },
    openGraph: { type: "website", url, siteName: "HAUS & GRACE", title, description, images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

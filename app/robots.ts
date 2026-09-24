import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/base-path";
import { SITE_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const routeBase = BASE_PATH || "";
  return {
    rules: {
      userAgent: "*",
      allow: `${routeBase}/`,
      disallow: [`${routeBase}/api/`, `${routeBase}/agent`],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: new URL(SITE_ORIGIN).origin,
  };
}

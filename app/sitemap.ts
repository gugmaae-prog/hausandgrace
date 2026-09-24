import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/imported-projects";
import { insights } from "@/lib/insights";
import { getCommunityDirectory, getDeveloperDirectory } from "@/lib/taxonomy";
import { SITE_ORIGIN } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectSlugs = await getProjectSlugs();
  const staticRoutes = ["", "/properties", "/projects", "/off-plan", "/developers", "/communities", "/insights", "/journal", "/services", "/about", "/advisors", "/contact", "/list-your-property", "/privacy", "/terms"];
  return [
    ...staticRoutes.map((route, index) => ({ url: `${SITE_ORIGIN}${route}`, lastModified: new Date(), changeFrequency: (index < 4 ? "daily" : "monthly") as "daily" | "monthly", priority: route === "" ? 1 : .8 })),
    ...getCommunityDirectory().map((community) => ({ url: `${SITE_ORIGIN}/communities/${community.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .7 })),
    ...getDeveloperDirectory().map((developer) => ({ url: `${SITE_ORIGIN}/developers/${developer.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .7 })),
    ...insights.map((insight) => ({ url: `${SITE_ORIGIN}/insights/${insight.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: .65 })),
    ...projectSlugs.map((slug) => ({ url: `${SITE_ORIGIN}/projects/${slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .8 })),
  ];
}

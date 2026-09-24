import type { Metadata } from "next";
import { Footer, InternalHeader } from "@/components/Chrome";
import { PublicAdvisorPortfolio } from "@/components/PublicAdvisorPortfolio";
import { SITE_ORIGIN } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = "HAUS & GRACE Advisor Portfolio";
  const description = "Meet a HAUS & GRACE property advisor and explore their selected UAE real estate focus.";
  return {
    title,
    description,
    alternates: { canonical: `${SITE_ORIGIN}/advisors/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function AdvisorPortfolioPage({ params }: Props) {
  const { slug } = await params;
  return <main><InternalHeader /><PublicAdvisorPortfolio slug={slug} /><Footer /></main>;
}

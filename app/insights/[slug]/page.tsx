import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BriefingPlayer } from "@/components/BriefingPlayer";
import { Footer, InternalHeader } from "@/components/Chrome";
import { MarketCharts } from "@/components/MarketCharts";
import { getInsight, insights } from "@/lib/insights";
import { SITE_ORIGIN } from "@/lib/seo";

export function generateStaticParams() { return insights.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const insight = getInsight((await params).slug);
  if (!insight) return { title: "Insight" };
  const url = `${SITE_ORIGIN}/insights/${insight.slug}`;
  return {
    title: insight.title,
    description: insight.dek,
    keywords: ["UAE real estate", "UAE property investment", insight.category, insight.title],
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: insight.title, description: insight.dek, images: insight.image ? [{ url: insight.image, alt: insight.title }] : [] },
    twitter: { card: "summary_large_image", title: insight.title, description: insight.dek, images: insight.image ? [insight.image] : [] },
  };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const insight = getInsight((await params).slug);
  if (!insight) notFound();
  const url = `${SITE_ORIGIN}/insights/${insight.slug}`;
  const structuredData = { "@context": "https://schema.org", "@type": "Article", headline: insight.title, description: insight.dek, image: insight.image, datePublished: new Date(`${insight.published} 12:00:00 UTC`).toISOString(), mainEntityOfPage: url, author: { "@type": "Organization", name: "HAUS & GRACE Properties" }, publisher: { "@type": "Organization", name: "HAUS & GRACE Properties" } };
  return <main><InternalHeader />
    <article className="insight-article"><header><p>{insight.category} · {insight.published} · {insight.readTime}</p><h1>{insight.title}</h1><span>{insight.dek}</span></header>
      {insight.category === "Video briefing" ? <BriefingPlayer title={insight.title} image={insight.image} slides={insight.takeaways} /> : <figure><img src={insight.image} alt={`${insight.title} feature`} /><figcaption>UAE project imagery selected for this market briefing.</figcaption></figure>}
      {insight.charts?.length ? <section className="article-chart-suite section-pad"><div><p className="kicker">Evidence dashboard</p><h2>Read the signal.<br /><em>Keep the definition.</em></h2></div><MarketCharts charts={insight.charts} compact /></section> : null}
      <section className="insight-body section-pad"><aside><p className="kicker">Key takeaways</p>{insight.takeaways.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</aside><div>{insight.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}{insight.sources?.length ? <section className="article-sources"><h2>Research sources</h2>{insight.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title}</a>)}</section> : null}<div className="research-note"><strong>Important</strong><p>This content is general market information, not a promise of returns or personal financial advice. Verify live inventory, contracts, fees and eligibility before committing capital.</p></div></div></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </article><Footer />
  </main>;
}

import Link from "@/components/SiteLink";
import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import { MarketCharts } from "@/components/MarketCharts";
import { insights, marketResearchCharts } from "@/lib/insights";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("UAE Property Insights", "HAUS & GRACE market research, new-launch analysis, developer profiles, community intelligence and investor guides.", "/insights");

export default function InsightsPage() {
  return <main><InternalHeader /><PageIntro kicker="Research, guides & vlogs" title={<>Context for<br /><em>better decisions.</em></>} copy="Market research, developer due diligence, community intelligence and practical briefings for serious UAE property decisions." />
    <section className="market-observatory section-pad"><div className="market-observatory-heading"><div><p className="kicker">Market observatory · updated 23 July 2026</p><h2>One market.<br /><em>Four analytical lenses.</em></h2></div><p>Monthly momentum, quarterly residential performance, the historical transaction cycle and global-city context. Definitions remain visible so unlike datasets are never blended into a false headline.</p></div><MarketCharts charts={marketResearchCharts} /></section>
    <section className="insights-index section-pad">{insights.map((insight, index) => <Link href={`/insights/${insight.slug}`} className={index === 0 ? "lead" : ""} key={insight.slug}><div><img src={insight.image} alt={`${insight.title} editorial cover`} />{insight.category === "Video briefing" && <b>Visual vlog</b>}</div><p>{insight.category} · {insight.published} · {insight.readTime}</p><h2>{insight.title}</h2><span>{insight.dek}</span><strong>Open briefing</strong></Link>)}</section><Footer /></main>;
}

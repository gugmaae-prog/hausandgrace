import type { Metadata } from "next";
import Link from "@/components/SiteLink";
import { notFound } from "next/navigation";
import { Footer, InternalHeader } from "@/components/Chrome";
import { RegistryProjectGrid } from "@/components/RegistryProjectGrid";
import { getCommunityDirectory, getCommunityProfile } from "@/lib/taxonomy";
import { getAreaPricePerSqft } from "@/lib/market-pricing";
import { SITE_ORIGIN } from "@/lib/seo";
import type { RegistryProject } from "@/lib/imported-projects";

function money(value: number) { return `AED ${Math.round(value).toLocaleString("en-AE")}`; }

/** Entry and median starting price from our own indexed records for this
 *  community. Cheap per-community work over already-loaded projects — never a
 *  registry-wide scan (that pattern caused an outage). Ours, not sourced. */
function catalogueStats(projects: RegistryProject[]) {
  const values = projects
    .map((project) => Number(String(project.startingPrice || "").replace(/[^\d.]/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  return { entry: values[0], median: values[Math.floor(values.length / 2)], count: values.length };
}

export function generateStaticParams() { return getCommunityDirectory().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const community = getCommunityProfile((await params).slug);
  if (!community) return { title: "Community" };
  const url = `${SITE_ORIGIN}/communities/${community.slug}`;
  const title = `${community.name} Property and Community Guide`;
  const description = community.overview;
  return { title, description, keywords: [community.name, `${community.name} property`, `${community.emirate} real estate`, "UAE property communities"], alternates: { canonical: url }, openGraph: { type: "website", url, title, description, images: community.image ? [{ url: community.image, alt: `${community.name}, ${community.emirate}` }] : [] }, twitter: { card: "summary_large_image", title, description, images: community.image ? [community.image] : [] } };
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const community = getCommunityProfile((await params).slug);
  if (!community) notFound();
  const stats = catalogueStats(community.projects);
  const benchmark = getAreaPricePerSqft(community.name, community.propertyTypes, community.emirate);
  const structuredData = { "@context": "https://schema.org", "@type": "Place", name: community.name, address: { "@type": "PostalAddress", addressRegion: community.emirate, addressCountry: "AE" }, description: community.overview, image: community.image };
  return <main><InternalHeader />
    <section className="taxonomy-hero">{community.image && <img src={community.image} alt={`${community.name}, ${community.emirate}`} />}<div className="taxonomy-hero-shade" /><div><p>{community.emirate} · {community.descriptor}</p><h1>{community.name}</h1><span>{community.activeProjects} active projects · {community.developers.length} developers</span></div></section>
    <section className="taxonomy-overview section-pad"><div><p className="kicker">Community market guide</p><h2>Understand the place<br /><em>before the project.</em></h2></div><div><p className="taxonomy-lead">{community.overview}</p><p>HAUS &amp; GRACE structures this market from current project records. Availability, pricing, payment terms and completion dates should always be reconfirmed against the selected unit before reservation.</p><Link href={`/projects?q=${encodeURIComponent(community.name)}`} className="underlined">Search this community</Link></div></section>
    <section className="taxonomy-stats"><div><span>Active pipeline</span><strong>{community.activeProjects}</strong></div><div><span>Indexed records</span><strong>{community.projects.length}</strong></div><div><span>Developers</span><strong>{community.developers.length}</strong></div><div><span>{community.pricePerSqft ? community.pricePerSqft.label : "Residence types"}</span><strong>{community.pricePerSqft ? community.pricePerSqft.display : community.propertyTypes.length}</strong></div></section>
    <section className="taxonomy-pricing section-pad"><div><p className="kicker">Pricing signal</p><h2>Entry point and<br /><em>market benchmark.</em></h2><p className="taxonomy-lead">Two separate readings: our own indexed starting prices for {community.name}, and — where a published figure exists — the market price per square foot from an external source. They are different measures and are shown apart.</p></div><div className="price-panels">
      <article className="price-panel"><span className="price-tag">HAUS &amp; GRACE catalogue</span>{stats ? <><strong>{money(stats.entry)}</strong><p>Lowest indexed starting price across {stats.count} {stats.count === 1 ? "development" : "developments"} in {community.name}. Median start {money(stats.median)}.</p></> : <><strong>On request</strong><p>Starting prices for {community.name} are confirmed per unit with an advisor.</p></>}</article>
      {benchmark ? <article className="price-panel price-panel-market"><span className="price-tag">Market benchmark · external</span><strong>{benchmark.display}</strong><p>{benchmark.label} · {benchmark.period}. Source: {benchmark.sourceUrl ? <a href={benchmark.sourceUrl} target="_blank" rel="noreferrer">{benchmark.sourceLabel}</a> : benchmark.sourceLabel}. This is a community-level average, not a specific unit price.</p></article> : <article className="price-panel price-panel-market price-panel-empty"><span className="price-tag">Market benchmark · external</span><strong>Not published</strong><p>No sourced price-per-square-foot benchmark is currently available for {community.name}. Ask an advisor for recent comparable transactions.</p></article>}
    </div></section>
    <section className="taxonomy-detail section-pad"><div><p className="kicker">Market composition</p><h2>What is being built.</h2></div><div><article><span>Property types</span><p>{community.propertyTypes.join(" · ") || "Available on request"}</p></article>{community.pricePerSqft && <article><span>Price per square foot</span><p>{community.pricePerSqft.display} · {community.pricePerSqft.period}. {community.pricePerSqft.note}</p></article>}<article><span>Leading developers</span><p>{community.developers.slice(0, 12).join(" · ")}</p></article><article><span>Investor review</span><p>Compare delivery timing, competing inventory, micro-location, layout efficiency, service structure and the intended exit or income strategy.</p></article></div></section>
    <section className="section-pad taxonomy-listing"><div className="section-heading"><div><p className="kicker">Community project index</p><h2>Projects in<br /><em>{community.name}.</em></h2></div><p className="heading-note">Explore the development pipeline with project-specific architecture, interiors and residence layouts where available.</p></div><RegistryProjectGrid projects={community.projects} /><Link href={`/projects?q=${encodeURIComponent(community.name)}`} className="outline-action">View all matching projects</Link></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><Footer />
  </main>;
}

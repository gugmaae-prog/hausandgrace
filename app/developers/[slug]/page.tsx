import type { Metadata } from "next";
import Link from "@/components/SiteLink";
import { notFound } from "next/navigation";
import { Footer, InternalHeader } from "@/components/Chrome";
import { RegistryProjectGrid } from "@/components/RegistryProjectGrid";
import { SITE_ORIGIN } from "@/lib/seo";
import { getDeveloperDirectory, getDeveloperProfile } from "@/lib/taxonomy";

export function generateStaticParams() { return getDeveloperDirectory().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const developer = getDeveloperProfile((await params).slug);
  if (!developer) return { title: "Developer" };
  const url = `${SITE_ORIGIN}/developers/${developer.slug}`;
  const title = `${developer.name} UAE Projects and Developer Profile`;
  const description = `Explore ${developer.name}'s UAE development pipeline, active projects, communities and property types.`;
  return { title, description, keywords: [developer.name, `${developer.name} projects`, "UAE property developers", "UAE real estate"], alternates: { canonical: url }, openGraph: { type: "website", url, title, description, images: developer.image ? [{ url: developer.image, alt: `${developer.name} UAE development` }] : [] }, twitter: { card: "summary_large_image", title, description, images: developer.image ? [developer.image] : [] } };
}

export default async function DeveloperPage({ params }: { params: Promise<{ slug: string }> }) {
  const developer = getDeveloperProfile((await params).slug);
  if (!developer) notFound();
  const structuredData = { "@context": "https://schema.org", "@type": "Organization", name: developer.name, areaServed: developer.emirates, knowsAbout: developer.propertyTypes, subjectOf: { "@type": "ItemList", numberOfItems: developer.projects.length, name: `${developer.name} UAE project index` } };
  return <main><InternalHeader />
    <section className="taxonomy-hero developer-hero">{developer.image && <img src={developer.image} alt={`${developer.name} development in the UAE`} />}<div className="taxonomy-hero-shade" /><div><p>{developer.descriptor || "UAE developer profile"}</p><h1>{developer.name}</h1><span>{developer.activeProjects} active projects · {developer.emirates.length} emirates</span></div></section>
    <section className="taxonomy-overview section-pad"><div><p className="kicker">Developer profile</p><h2>Read the pipeline,<br /><em>not only the brand.</em></h2></div><div><p className="taxonomy-lead">{developer.overview || `${developer.name} is represented by ${developer.projects.length} indexed UAE project records across ${developer.emirates.join(", ")}.`}</p><p>This profile organises market records into a consistent view. It is designed for project discovery and comparison, not as a substitute for legal, financial or technical due diligence on a specific purchase.</p><div className="taxonomy-actions"><Link href={`/projects?developer=${encodeURIComponent(developer.name)}`} className="underlined">Filter the live catalogue</Link>{developer.website && <Link href={developer.website} target="_blank" rel="noreferrer" className="underlined">Developer website</Link>}</div></div></section>
    <section className="taxonomy-stats"><div><span>Active projects</span><strong>{developer.activeProjects}</strong></div><div><span>Total indexed</span><strong>{developer.projects.length}</strong></div><div><span>Emirates</span><strong>{developer.emirates.length}</strong></div><div><span>Communities</span><strong>{developer.communities.length}</strong></div></section>
    <section className="taxonomy-detail section-pad"><div><p className="kicker">Pipeline composition</p><h2>Where and what<br />they are building.</h2></div><div><article><span>Emirates</span><p>{developer.emirates.join(" · ")}</p></article><article><span>Key communities</span><p>{developer.communities.slice(0, 16).join(" · ")}</p></article><article><span>Residence types</span><p>{developer.propertyTypes.join(" · ") || "Available on request"}</p></article>{developer.focus && <article><span>Development focus</span><p>{developer.focus.join(" · ")}</p></article>}<article><span>Due-diligence lens</span><p>Review delivery record, specification consistency, current workload, operating partners, service structure and the individual escrow and sale documentation.</p></article></div></section>
    <section className="section-pad taxonomy-listing"><div className="section-heading"><div><p className="kicker">Indexed portfolio</p><h2>Projects by<br /><em>{developer.name}.</em></h2></div></div><RegistryProjectGrid projects={developer.projects} /><Link href={`/projects?developer=${encodeURIComponent(developer.name)}`} className="outline-action">View every matching project</Link></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><Footer />
  </main>;
}

import type { Metadata } from "next";
import Link from "@/components/SiteLink";
import { notFound } from "next/navigation";
import { Footer, InternalHeader } from "@/components/Chrome";
import { LeadForm } from "@/components/LeadForm";
import { MortgageCalculator } from "@/components/MortgageCalculator";
import { PaymentPlan } from "@/components/PaymentPlan";
import { ProjectLeadExperience } from "@/components/ProjectLeadExperience";
import { ProjectGallery } from "@/components/ProjectGallery";
import { RegistryProjectGrid } from "@/components/RegistryProjectGrid";
import { getImportedProject, getRelatedProjectRecords } from "@/lib/imported-projects";
import { parseMoney } from "@/lib/market-pricing";
import { SITE_ORIGIN } from "@/lib/seo";
import { communitySlugFor, slugify } from "@/lib/taxonomy";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getImportedProject(slug);
  if (!project) return {};
  const url = `${SITE_ORIGIN}/projects/${project.slug}`;
  const title = `${project.title} in ${project.location}`;
  const developerName = project.developerDisplay || project.developer;
  return {
    title,
    description: project.description,
    keywords: [project.title, developerName, project.location, `${project.emirate} property`, project.statusLabel || "UAE real estate"],
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description: project.description, images: project.hero ? [{ url: project.hero, alt: `${project.title} exterior` }] : [] },
    twitter: { card: "summary_large_image", title, description: project.description, images: project.hero ? [project.hero] : [] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params; const project = await getImportedProject(slug); if (!project) notFound(); const paymentMilestones = project.paymentPlan.split("/").map(Number).filter((part) => Number.isFinite(part) && part > 0 && part <= 100); const validMilestones = paymentMilestones.length >= 2 && paymentMilestones.reduce((sum, part) => sum + part, 0) === 100 ? paymentMilestones : [];
  const developerName = project.developerDisplay || project.developer;
  const relatedProjects = getRelatedProjectRecords(project, 3);
  const visiblePricePerSqft = project.pricePerSqft || project.areaPricePerSqft;
  const handoverYear = Number(project.handover.match(/20\d{2}/)?.[0] || 0);
  const mortgageStatus = handoverYear > 0 && handoverYear <= new Date().getFullYear() ? "ready" : "off-plan";
  const unitOptions = project.bedrooms.length ? project.bedrooms : project.propertyTypes;
  const unitPrices = (project.unitPricing || []).reduce<Record<string, number>>((prices, unit) => {
    const publishedPrice = parseMoney(unit.startingPrice);
    if (publishedPrice >= 250_000) prices[unit.residence] = publishedPrice;
    return prices;
  }, {});
  const brochurePath = `/api/brochures/${project.slug}`;
  const structuredData = { "@context": "https://schema.org", "@type": "Product", name: project.title, description: project.description, image: project.gallery.length ? project.gallery : project.hero ? [project.hero] : [], brand: { "@type": "Brand", name: developerName }, category: project.propertyTypes.join(", ") || "UAE real estate", ...(project.brochure ? { subjectOf: { "@type": "DigitalDocument", name: `${project.title} project brochure`, encodingFormat: "application/pdf", url: `${SITE_ORIGIN}${brochurePath}` } } : {}), additionalProperty: [{ "@type": "PropertyValue", name: "Location", value: project.location }, { "@type": "PropertyValue", name: "Handover", value: project.handover }, { "@type": "PropertyValue", name: "Payment plan", value: project.paymentPlan }, ...(project.statusLabel ? [{ "@type": "PropertyValue", name: "Release status", value: project.statusLabel }] : []), ...(visiblePricePerSqft ? [{ "@type": "PropertyValue", name: visiblePricePerSqft.label, value: visiblePricePerSqft.display }] : [])] };
  return <main className="project-detail"><InternalHeader />
    <section className="project-hero">{project.hero && <img src={project.hero} alt={`${project.title} exterior`} />}<div className="project-hero-shade" /><div className="project-hero-copy">{project.statusLabel && <span className="project-release-status">{project.statusLabel}</span>}<div className="project-taxonomy"><Link href={`/communities/${communitySlugFor(project.location)}`}>{project.location}</Link><span>·</span><Link href={`/developers/${slugify(project.developer)}`}>{developerName}</Link></div><h1>{project.title}</h1><div className="project-hero-actions"><a href="#enquire">Check live availability</a>{project.brochure && <Link href={brochurePath} target="_blank" rel="noreferrer">View project brochure</Link>}</div></div></section>
    <section className="project-facts"><div><span>Starting price</span><strong>{project.price}</strong></div><div className="gold-fact"><span>Payment plan</span><strong>{project.paymentPlan}</strong></div><div><span>Anticipated handover</span><strong>{project.handover}</strong></div><div><span>Development by</span><strong>{developerName}</strong></div>{visiblePricePerSqft && <div><span>{visiblePricePerSqft.label}</span><strong>{visiblePricePerSqft.display}</strong></div>}</section>
    <section className="project-overview section-pad"><div><p className="kicker">The investment case</p><h2>A new benchmark in<br /><em>{project.emirate} real estate.</em></h2><div className="project-detail-tags">{[...project.propertyTypes, ...project.bedrooms, ...project.lifestyles].map(tag => <span key={tag}>{tag}</span>)}</div></div><div><p className="project-lead">{project.description}</p>{project.overview.slice(0, 2).map(paragraph => <p key={paragraph}>{paragraph}</p>)}<dl className="project-spec-list"><div><dt>Location</dt><dd>{project.location}</dd></div><div><dt>Average size</dt><dd>{project.averageSize}</dd></div></dl></div></section>
    {project.unitPricing && project.unitPricing.length > 0 && <section className="launch-release section-pad">
      <div className="launch-release-heading"><div><p className="kicker">{project.statusLabel || "Release schedule"}</p><h2>Residence pricing,<br /><em>clearly staged.</em></h2></div><p>Compare the published entry point and release requirement for each residence before requesting the live unit statement.</p></div>
      <div className="launch-unit-matrix">
        {project.unitPricing.map((unit) => <article key={unit.residence}><div><span>Residence</span><strong>{unit.residence}</strong></div><div><span>Starting price</span><strong>{unit.startingPrice}</strong></div><div><span>{unit.eoi ? "Expression of interest" : "Indicative area"}</span><strong>{unit.eoi || unit.size || "On request"}</strong></div></article>)}
      </div>
      {project.releaseNote && <p className="launch-release-note">{project.releaseNote}</p>}
    </section>}
    <ProjectGallery title={project.title} gallery={project.gallery} exteriors={project.exteriors} interiors={project.interiors} floorplans={project.floorplans} />
    <section className="project-literature section-pad">
      <div><p className="kicker">Project literature</p><h2>Every detail,<br /><em>kept together.</em></h2><p>Review the development specification, residence mix and design narrative, then pair the brochure with live unit availability and the current payment statement.</p></div>
      <article className="brochure-card" data-available={project.brochure ? "" : undefined}>
        <div className="brochure-cover" aria-hidden="true"><span>H&amp;G</span><b>{project.title}</b><small>Project brief</small></div>
        <div className="brochure-card-copy">
          <span>{project.brochure ? "Project brochure available" : "Project document pack"}</span>
          <h3>{project.brochure ? "Architecture, residences and development specification." : "Request the current brochure and unit pack."}</h3>
          <p>{project.brochure ? "Open the complete PDF in a dedicated browser view. For current inventory, pricing and reservation terms, request the matching live availability sheet." : "A project advisor will provide the latest brochure, plans and availability documents privately when the public release is not available."}</p>
          <div>{project.brochure ? <><Link href={brochurePath} target="_blank" rel="noreferrer">View brochure</Link><a href="#enquire">Check live availability</a></> : <a href="#enquire">Request document pack</a>}</div>
        </div>
      </article>
    </section>
    {(project.amenities.length > 0 || project.investmentPoints.length > 0) && <section className="project-essentials section-pad"><div><p className="kicker">Lifestyle and performance</p><h2>Designed to live well.<br /><em>Positioned to perform.</em></h2></div><div>{project.amenities.length > 0 && <div className="amenity-grid">{project.amenities.map((amenity, index) => <div key={amenity}><span>{String(index + 1).padStart(2, "0")}</span><strong>{amenity}</strong></div>)}</div>}{project.investmentPoints.length > 0 && <div className="investment-points"><p className="kicker">Investment perspective</p>{project.investmentPoints.map(point => <p key={point}>{point}</p>)}</div>}</div></section>}
    <section className="payment-section section-pad"><div><p className="kicker light">Capital structure</p><h2>Capital,<br /><em>deployed clearly.</em></h2><p>Terms are shown as supplied for the development and remain subject to unit selection and final developer confirmation.</p></div><PaymentPlan milestones={validMilestones} handover={project.handover} /></section>
    <section className="floorplan-section section-pad"><div><p className="kicker">Residence intelligence</p><h2>Space,<br /><em>measured intelligently.</em></h2><p>Compare layouts, orientation and usable space with an advisor, not simply the headline square footage.</p></div><div className="floorplan-library">{project.floorplans.length ? <><span>Floor-plan collection</span><strong>{project.floorplans.length} {project.floorplans.length === 1 ? "layout" : "layouts"} available</strong><p>Every available plan is included in the organised media library above. Select Floor plans to review each residence layout at full size.</p><a href="#project-media">Review the media library</a></> : <><span>Floor-plan collection</span><strong>Available privately</strong><p>Ask the project desk for the current layout pack and matching unit availability.</p><a href="#enquire">Request floor plans</a></>}</div></section>
    <section className="travel-section section-pad"><div><p className="kicker light">Location advantage</p><h2>Connected to place.<br /><em>Connected to value.</em></h2></div><div className="travel-list">{project.travelTimes.length ? project.travelTimes.map(item => <div key={`${item.minutes}-${item.destination}`}><strong>{item.minutes}</strong><span>minutes to<br />{item.destination}</span></div>) : <><div><strong>UAE</strong><span>{project.location}</span></div><div><strong>Prime</strong><span>{project.emirate} location</span></div></>}</div></section>
    <section className="mortgage-section section-pad"><div><p className="kicker">UAE mortgage calculator and unit schedule</p><h2>Model the unit<br /><em>before reservation.</em></h2><p>Choose the residence configuration, review the updated planning price and test the mortgage against UAE lending limits. Replace the estimate with the selected unit&rsquo;s live price before relying on the result.</p>{visiblePricePerSqft && <small>{visiblePricePerSqft.note}</small>}</div><MortgageCalculator initialPrice={parseMoney(project.price)} context={project.title} propertyStatus={mortgageStatus} unitOptions={unitOptions} residenceTypes={project.propertyTypes} unitPrices={unitPrices} paymentMilestones={validMilestones} handover={project.handover} /></section>
    {relatedProjects.length > 0 && <section className="project-related section-pad"><div className="project-related-heading"><div><p className="kicker">Continue the shortlist</p><h2>Properties selected around this brief.</h2></div><p>Related by community, developer, residence type and investment profile—not simply by popularity.</p></div><RegistryProjectGrid projects={relatedProjects} limit={3} /></section>}
    <section id="enquire" className="project-enquire section-pad"><div><p className="kicker">Private investment brief</p><h2>Access the complete<br /><em>project intelligence.</em></h2><p>Live availability, verified floor plans, payment milestones and a personal shortlist, prepared by a HAUS & GRACE advisor.</p></div><LeadForm source={`project:${project.slug}`} propertyReference={project.slug} propertyTitle={project.title} /></section>
    <ProjectLeadExperience projectTitle={project.title} source={`project:${project.slug}`} propertyReference={project.slug} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><Footer />
  </main>;
}

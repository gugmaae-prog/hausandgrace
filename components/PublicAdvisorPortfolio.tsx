"use client";

import { useEffect, useState } from "react";
import Link from "@/components/SiteLink";
import { withBasePath } from "@/lib/base-path";

type PublicProject = {
  slug: string;
  custom?: true;
  name: string;
  developer: string;
  location: string;
  emirate: string;
  startingPrice: string;
  handover: string;
  positioning: string;
  imageUrl: string;
  projectUrl?: string;
};

type PublicSecondaryUnit = {
  id: string;
  title: string;
  community: string;
  emirate: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: number;
  sizeSqft: number;
  priceAed: number;
  reference: string;
  imageUrl: string;
  description: string;
  status: "available" | "under_offer" | "sold" | "leased";
  updatedAt: string;
};

type PublicPropertyFinderListing = {
  id: string;
  url: string;
  reference: string;
  title: string;
  location: string;
  propertyType: string;
  listingType: "sale" | "rent";
  bedrooms: string;
  bathrooms: number;
  sizeSqft: number;
  priceAed: number;
  imageUrl: string;
  listedAt: string;
  featured: boolean;
  fetchedAt: string;
};

type PublicAdvisor = {
  name: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  linkedinUrl: string;
  instagramUrl: string;
  title: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  specialties: string[];
  topDevelopers: string[];
  topProjects: PublicProject[];
  propertyFinder: {
    profileUrl: string;
    agencyUrl: string;
    brn: string;
    experience: string;
    languages: string[];
    areas: string[];
    verifiedAt: string;
    listings: PublicPropertyFinderListing[];
    sync: {
      status: "pending" | "success" | "failed";
      cachedCount: number;
      totalCount: number;
      lastSyncedAt: string;
    } | null;
  } | null;
  secondaryUnits: PublicSecondaryUnit[];
  portfolioSlug: string;
  updatedAt: string;
};

type ContactIconKind = "email" | "phone" | "whatsapp" | "linkedin" | "instagram";

function ContactIcon({ kind }: { kind: ContactIconKind }) {
  if (kind === "email") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6" /></svg>;
  if (kind === "phone") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.8 10 8.3 7.9 10c1.2 2.7 3.4 4.9 6.1 6.1l1.7-2.1 4.5 2.8-.9 3.4c-.3.9-1.2 1.5-2.2 1.3C9.7 20.2 3.8 14.3 2.5 6.9c-.2-1 .4-1.9 1.3-2.2z" /></svg>;
  if (kind === "whatsapp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a8.5 8.5 0 0 0-7.2 13L4 21l5-1.3A8.5 8.5 0 1 0 12 3Zm4.4 12.2c-.2.6-1.2 1.1-1.8 1.2-.5.1-1.2.2-3.5-.8-2.9-1.2-4.8-4.2-5-4.4-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.9-.4h.6c.2 0 .5-.1.7.5l.9 2.2c.1.4.1.6-.1.8l-.7.9c-.2.2-.3.4-.1.7.3.6 1.1 1.7 2.3 2.7 1.6 1.4 2.9 1.8 3.3 2 .3.1.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2 .9c.4.2.6.3.7.5.1.1.1.7-.1 1.3Z" /></svg>;
  if (kind === "linkedin") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.2v10.3M5 5.3v.2M9.3 18.5v-6c0-2.4 3.2-3.2 4.4-1.2.3.5.3 1.1.3 1.7v5.5M9.3 10v8.5M18.5 18.5v-6.2c0-3.8-4.6-4.7-6.6-2.1" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.7" r=".8" /></svg>;
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatAed(value: number) {
  return `AED ${Math.round(value).toLocaleString("en-AE")}`;
}

function statusLabel(status: PublicSecondaryUnit["status"]) {
  return ({ available: "Available", under_offer: "Under offer", sold: "Sold", leased: "Leased" })[status];
}

export function PublicAdvisorPortfolio({ slug }: { slug: string }) {
  const [advisor, setAdvisor] = useState<PublicAdvisor | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    fetch(withBasePath(`/api/agent/portfolio/${encodeURIComponent(slug)}`), { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("not-found");
        return await response.json() as { advisor: PublicAdvisor };
      })
      .then((result) => setAdvisor(result.advisor))
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) return <section className="public-advisor-missing"><p className="kicker">Advisor portfolio</p><h1>This portfolio is<br /><em>being prepared.</em></h1><p>Speak with the HAUS &amp; GRACE team for a curated property discussion.</p><Link href="/contact" className="button-light">Speak with an advisor</Link></section>;
  if (!advisor) return <div className="public-advisor-loading">Opening advisor portfolio</div>;
  const callHref = advisor.phone ? `tel:+${phoneDigits(advisor.phone)}` : "";
  const whatsappNumber = phoneDigits(advisor.whatsappPhone || advisor.phone);
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${advisor.name}, I would like to discuss a UAE property opportunity.`)}`
    : "";

  return <>
    <section className="public-advisor-hero">
      <div className="public-advisor-portrait">{advisor.avatarUrl ? <img src={withBasePath(advisor.avatarUrl)} alt={`${advisor.name}, ${advisor.title} at HAUS & GRACE`} /> : <span>{advisor.name.charAt(0)}</span>}</div>
      <div className="public-advisor-intro">
        <p className="kicker">{advisor.title} · HAUS &amp; GRACE</p>
        <h1>{advisor.name}</h1>
        <h2>{advisor.headline}</h2>
        <p>{advisor.bio}</p>
        <div className="public-advisor-actions">
          <a href={`mailto:${advisor.email}`}><ContactIcon kind="email" /><span>Email {advisor.name.split(" ")[0]}</span></a>
          {callHref && <a href={callHref}><ContactIcon kind="phone" /><span>Call {advisor.phone}</span></a>}
          {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><ContactIcon kind="whatsapp" /><span>WhatsApp</span></a>}
          {advisor.linkedinUrl && <a href={advisor.linkedinUrl} target="_blank" rel="noreferrer" aria-label={`${advisor.name} on LinkedIn`}><ContactIcon kind="linkedin" /><span>LinkedIn</span></a>}
          {advisor.instagramUrl && <a href={advisor.instagramUrl} target="_blank" rel="noreferrer" aria-label={`${advisor.name} on Instagram`}><ContactIcon kind="instagram" /><span>Instagram</span></a>}
        </div>
      </div>
    </section>
    <section className="public-advisor-expertise section-pad">
      <div><p className="kicker">Advisory focus</p><h2>A selected view of<br /><em>the UAE market.</em></h2></div>
      <div><p>Areas of active focus selected and maintained by {advisor.name}.</p><ul>{advisor.specialties.map((specialty) => <li key={specialty}>{specialty}</li>)}</ul><dl>
        <div><dt>Selected developers</dt><dd>{advisor.topDevelopers.join(" · ")}</dd></div>
        {advisor.propertyFinder && <>
          {advisor.propertyFinder.brn && <div><dt>Broker registration</dt><dd>BRN {advisor.propertyFinder.brn}</dd></div>}
          {advisor.propertyFinder.experience && <div><dt>Experience record</dt><dd>{advisor.propertyFinder.experience}</dd></div>}
          {advisor.propertyFinder.languages.length > 0 && <div><dt>Languages</dt><dd>{advisor.propertyFinder.languages.join(" · ")}</dd></div>}
          {advisor.propertyFinder.areas.length > 0 && <div><dt>Areas of activity</dt><dd>{advisor.propertyFinder.areas.join(" · ")}</dd></div>}
          <div><dt>External brokerage record</dt><dd><a href={advisor.propertyFinder.profileUrl || advisor.propertyFinder.agencyUrl} target="_blank" rel="noreferrer">View verified Property Finder record</a></dd></div>
        </>}
      </dl></div>
    </section>
    <section className="public-advisor-projects section-pad">
      <header><div><p className="kicker">Selected portfolio</p><h2>Projects worth<br /><em>a closer look.</em></h2></div><p>Availability, prices and terms change. Confirm the selected unit and current documents with your advisor before making a decision.</p></header>
      <div>{advisor.topProjects.map((project) => {
        const image = project.imageUrl ? <img src={project.imageUrl} alt={`${project.name} by ${project.developer}`} loading="lazy" /> : <span />;
        const internalHref = `/projects/${project.slug}`;
        return <article key={`${project.custom ? "custom" : "catalogue"}-${project.slug}`}>
          {project.custom
            ? project.projectUrl
              ? <a href={project.projectUrl} target="_blank" rel="noreferrer" className="public-advisor-project-image">{image}</a>
              : <div className="public-advisor-project-image">{image}</div>
            : <Link href={internalHref} className="public-advisor-project-image">{image}</Link>}
          <div><span>{project.location} · {project.emirate}</span><h3>{project.name}</h3><p>{project.developer}</p><dl><div><dt>Starting from</dt><dd>{project.startingPrice}</dd></div><div><dt>Handover</dt><dd>{project.handover}</dd></div></dl>
            {project.custom
              ? project.projectUrl && <a href={project.projectUrl} target="_blank" rel="noreferrer">View project information</a>
              : <Link href={internalHref}>View project</Link>}
          </div>
        </article>;
      })}</div>
    </section>
    {advisor.propertyFinder && advisor.propertyFinder.listings.length > 0 && <section className="public-advisor-live-listings section-pad">
      <header>
        <div><p className="kicker">Current listings</p><h2>Available through<br /><em>{advisor.name}.</em></h2></div>
        <div><p>Every property shown here is matched to {advisor.email} and refreshed from the advisor&apos;s verified brokerage record. Price and availability remain subject to final confirmation.</p><a href={advisor.propertyFinder.profileUrl} target="_blank" rel="noreferrer">View all {advisor.propertyFinder.sync?.totalCount || advisor.propertyFinder.listings.length} listings</a></div>
      </header>
      <div className="public-live-listing-grid">{advisor.propertyFinder.listings.map((listing) => <article key={listing.id}>
        <a href={listing.url} target="_blank" rel="noreferrer" className="public-live-listing-image">
          {listing.imageUrl ? <img src={listing.imageUrl} alt={`${listing.propertyType} in ${listing.location}`} loading="lazy" /> : <span>{listing.propertyType}</span>}
          <strong>{listing.listingType === "rent" ? "For rent" : "For sale"}</strong>
        </a>
        <div>
          <span>{listing.location}</span>
          <h3>{listing.title}</h3>
          <p>{formatAed(listing.priceAed)}{listing.listingType === "rent" ? " / year" : ""}</p>
          <dl>
            <div><dt>Type</dt><dd>{listing.propertyType}</dd></div>
            <div><dt>Bedrooms</dt><dd>{listing.bedrooms.toLowerCase() === "studio" ? "Studio" : listing.bedrooms}</dd></div>
            <div><dt>Bathrooms</dt><dd>{listing.bathrooms || "—"}</dd></div>
            <div><dt>Area</dt><dd>{listing.sizeSqft ? `${listing.sizeSqft.toLocaleString("en-AE")} sqft` : "On request"}</dd></div>
          </dl>
          <a href={listing.url} target="_blank" rel="noreferrer">View property</a>
        </div>
      </article>)}</div>
    </section>}
    {advisor.secondaryUnits.length > 0 && <section className="public-advisor-secondary section-pad">
      <header><div><p className="kicker">Secondary market portfolio</p><h2>Ready properties,<br /><em>personally maintained.</em></h2></div><p>Unit availability and commercial terms are maintained by {advisor.name}. Confirm the current title documents, condition and transaction terms before commitment.</p></header>
      <div>{advisor.secondaryUnits.map((unit) => {
        const enquiry = `Hello ${advisor.name}, I would like to ask about ${unit.title}${unit.reference ? ` (${unit.reference})` : ""}.`;
        const enquiryHref = whatsappNumber
          ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(enquiry)}`
          : `mailto:${advisor.email}?subject=${encodeURIComponent(`Enquiry: ${unit.title}`)}&body=${encodeURIComponent(enquiry)}`;
        return <article key={unit.id}>
          <div className="public-secondary-image">{unit.imageUrl ? <img src={unit.imageUrl} alt={`${unit.title} in ${unit.community}`} loading="lazy" /> : <span>{unit.propertyType}</span>}<strong data-status={unit.status}>{statusLabel(unit.status)}</strong></div>
          <div className="public-secondary-copy">
            <span>{unit.community} · {unit.emirate}</span>
            <h3>{unit.title}</h3>
            {unit.description && <p>{unit.description}</p>}
            <dl><div><dt>Price</dt><dd>{formatAed(unit.priceAed)}</dd></div><div><dt>Configuration</dt><dd>{unit.bedrooms} · {unit.bathrooms || "—"} bath</dd></div><div><dt>Internal area</dt><dd>{unit.sizeSqft.toLocaleString("en-AE")} sqft</dd></div><div><dt>Reference</dt><dd>{unit.reference || "On request"}</dd></div></dl>
            <a href={enquiryHref} target={whatsappNumber ? "_blank" : undefined} rel={whatsappNumber ? "noreferrer" : undefined}><ContactIcon kind={whatsappNumber ? "whatsapp" : "email"} /><span>Ask about this unit</span></a>
          </div>
        </article>;
      })}</div>
    </section>}
    <section className="public-advisor-contact">
      <p className="kicker">Start a conversation</p><h2>Build a shortlist around<br /><em>your objective.</em></h2><p>Share your budget, preferred location and intended outcome. {advisor.name} will help structure the next step.</p>
      <div className="public-advisor-actions public-advisor-actions-centered">
        <a href={`mailto:${advisor.email}`}><ContactIcon kind="email" /><span>Email {advisor.name.split(" ")[0]}</span></a>
        {callHref && <a href={callHref}><ContactIcon kind="phone" /><span>Call {advisor.phone}</span></a>}
        {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><ContactIcon kind="whatsapp" /><span>WhatsApp</span></a>}
      </div>
    </section>
  </>;
}

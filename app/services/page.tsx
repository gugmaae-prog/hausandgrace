import Link from "@/components/SiteLink";
import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("UAE Property Services", "Buying, selling, leasing and property investment advisory in Dubai and across the UAE.", "/services");

export default function ServicesPage() {
  const services = [
    ["01", "Buy", "A focused search, honest market context, viewing support, negotiation and a calm route to transfer."],
    ["02", "Sell", "Pricing strategy, elevated presentation, qualified viewings and clear offer management."],
    ["03", "Rent", "Homes matched to lifestyle and budget, with support through contracts, handover and move-in."],
    ["04", "Lease", "Positioning, tenant qualification, documentation and attentive landlord representation."],
    ["05", "Invest", "A disciplined view of ready and off-plan opportunities, shaped around horizon, yield and risk."],
    ["06", "Commercial", "Office, retail and investment guidance grounded in business requirements and location."],
  ];
  return <main><InternalHeader /><PageIntro kicker="What we do" title={<>Advisory built<br /><em>around the outcome.</em></>} copy="One accountable relationship across acquisition, ownership, performance and exit." /><section className="service-index section-pad">{services.map(([number,title,copy]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{copy}</p><Link href="/contact">Discuss the brief</Link></article>)}</section><Footer /></main>;
}

import { Footer, InternalHeader } from "@/components/Chrome";
import { LeadForm } from "@/components/LeadForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contact HAUS & GRACE", "Start a UAE property acquisition, investment, sale or leasing conversation with HAUS & GRACE in Dubai.", "/contact");

export default function ContactPage() {
  return <main><InternalHeader /><section className="contact-layout"><div className="contact-copy"><p className="kicker light">Start with the objective</p><h1>Tell us what<br /><em>you want to achieve.</em></h1><p>Acquire, invest, sell, lease or build a portfolio—share the brief and we will bring the market into focus.</p><div className="contact-details"><div><span>Call or WhatsApp</span><a href="tel:+971566215655">+971 56 621 5655</a></div><div><span>Visit</span><p>Office 1142, Xavier Business Center<br />Ibn Battuta Gate, Dubai, UAE</p></div><div><span>Office hours</span><p>Monday–Saturday · 9:00–18:00</p></div></div></div><div className="contact-form-panel"><p className="kicker">Your brief</p><h2>What should the asset deliver?</h2><LeadForm source="contact-page" /></div></section><Footer /></main>;
}

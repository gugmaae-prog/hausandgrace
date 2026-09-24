import Link from "@/components/SiteLink";
import { Footer, InternalHeader, PageIntro } from "@/components/Chrome";
import { TeamCarousel, type TeamMember } from "@/components/TeamCarousel";
import { withBasePath } from "@/lib/base-path";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("About HAUS & GRACE", "The HAUS & GRACE story: an independent Dubai brokerage shaped by long-term relationships, market knowledge and client value.", "/about");

const team: TeamMember[] = [
  {
    name: "Mehul Mistry",
    role: "Sales Director",
    email: "mehul@hausandgrace.ae",
    image: "/team/mehul.webp",
    copy: "Leads sales strategy and client advisory across UAE residential, investment and off-plan opportunities.",
    facts: ["BRN 47327", "English · Hindi · Gujarati"],
    portfolioSlug: "mehul",
  },
  {
    name: "Irfan Baismail",
    role: "Property Advisor",
    email: "irfan@hausandgrace.ae",
    image: "/team/irfan.webp",
    copy: "Supports buyers and investors across residential, off-plan and ready-property opportunities.",
    facts: ["10 years of experience", "BRN 95152 · English · Hindi"],
    portfolioSlug: "irfan",
  },
  {
    name: "Urvashi Saraiya",
    role: "Property Advisor",
    email: "urvashi@hausandgrace.ae",
    image: "/team/urvi.webp",
    copy: "Focuses on off-plan opportunities, developer selection and investment positioning for clients.",
    facts: ["BRN 87462", "English · Hindi · Gujarati"],
    portfolioSlug: "urvashi",
  },
  {
    name: "Priya Mistry",
    role: "Chief Executive Officer",
    email: "priya@hausandgrace.ae",
    image: "/team/priya.webp",
    copy: "Leads HAUS & GRACE while advising clients on sales, leasing and investment requirements with a relationship-led approach.",
    facts: ["BRN 53727", "English · Hindi · Gujarati"],
    portfolioSlug: "priya",
    badge: "CEO",
  },
  {
    name: "Vinat Bhatt",
    role: "Property Advisor",
    email: "vinay@hausandgrace.ae",
    image: "/team/vinay.webp",
    copy: "Supports client requirements and considered property decisions across the UAE market.",
    facts: [],
    portfolioSlug: "vinay",
  },
];

export default function AboutPage() {
  return <main>
    <InternalHeader />
    <PageIntro kicker="About HAUS & GRACE" title={<>A house is an asset.<br /><em>Grace gives it meaning.</em></>} copy="An independent Dubai real estate company built around informed decisions, personal accountability and relationships that continue beyond the transaction." />
    <section className="about-image">
      <img src={withBasePath("/about-jumeirah-burj-banner.webp")} alt="Burj Al Arab viewed from the Jumeirah shoreline at golden hour" width="1915" height="821" fetchPriority="high" />
      <div className="about-image-caption"><span>Jumeirah, Dubai</span><p>Local perspective. International standards.</p></div>
    </section>
    <section className="about-origin section-pad">
      <div><p className="kicker">The name behind the business</p><h2>Where property meets<br /><em>purpose.</em></h2></div>
      <div className="about-origin-copy">
        <p>In the company&apos;s original story, “HAUS” takes its meaning from the Germanic word for house. “GRACE” represents unmerited favour—the blessing and joy that can turn a property into a meaningful part of someone&apos;s life.</p>
        <p>That idea still defines the business today. HAUS &amp; GRACE Properties is an independent brokerage serving residential and commercial sales and leasing across Dubai, with advice designed around the client&apos;s objective rather than the transaction alone.</p>
        <dl><div><dt>Established journey</dt><dd>2008</dd></div><div><dt>Dubai brokerage</dt><dd>RERA registered</dd></div><div><dt>Office registration</dt><dd>ORN 1182853</dd></div></dl>
      </div>
    </section>
    <section className="about-journey section-pad">
      <p className="kicker">Our beginnings</p>
      <div className="about-journey-grid">
        <article><span>01</span><h3>Gujarat, 2008</h3><p>The journey began in Gujarat, working alongside local developers and helping clients acquire villas and townhouses. The early focus was simple: shape property decisions around real aspirations.</p></article>
        <article><span>02</span><h3>Experience into service</h3><p>Years of sales, marketing, banking, insurance and real estate operations developed a practical understanding of what clients need before, during and after a transaction.</p></article>
        <article><span>03</span><h3>Dubai, with full strength</h3><p>That experience became HAUS &amp; GRACE in Dubai—an advisory and brokerage team supporting investors, buyers, tenants and owners across residential and commercial real estate.</p></article>
      </div>
    </section>
    <section className="statement section-pad"><p className="kicker">What the work means</p><div><h2>More than property.<br />A decision that <em>builds legacy.</em></h2><p>Our work is to understand the market, protect the client from the wrong acquisition and stay accountable through negotiation, documentation and completion. We study pricing, market value, new supply and neighbourhood fundamentals so every recommendation adds practical value.</p><p>We sell homes, build relationships and solve problems. That was the promise in the former HAUS &amp; GRACE description, and it remains the standard carried into the business today.</p></div></section>
    <section className="values section-pad"><p className="kicker">What guides us</p><div className="value-grid">{[["01","Intent","Every search begins with the outcome the asset must deliver."],["02","Evidence","Direct advice grounded in verified information and current market context."],["03","Stewardship","Capital, time and trust are treated with equal responsibility."],["04","Perspective","Market knowledge matters only when it improves the decision."]].map(([number,title,copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="about-team section-pad">
      <header className="about-team-heading">
        <div><p className="kicker">The advisory team</p><h2>Experience made<br /><em>personal.</em></h2></div>
        <p>Meet the people who study the market, challenge assumptions and stay accountable throughout every property decision.</p>
      </header>
      <TeamCarousel members={team} />
    </section>
    <section className="about-access">
      <div><p className="kicker">HAUS &amp; GRACE team</p><h2>Private tools for<br /><em>better client work.</em></h2></div>
      <div><p>Authorised advisors can enter the private workspace for research, proposals, project comparisons and client-ready documents.</p><Link href="/agent" className="button-light">Agent login</Link></div>
    </section>
    <section className="detail-next"><p>Meet the people behind the advice.</p><h2>Serious about property.<br /><em>Focused on your outcome.</em></h2><Link href="/advisors" className="button-light">Meet our advisors</Link></section>
    <Footer />
  </main>;
}

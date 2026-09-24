import Link from "@/components/SiteLink";
import { ClientReviews } from "@/components/ClientReviews";
import { Footer, InternalHeader } from "@/components/Chrome";
import { InteractiveHero } from "@/components/InteractiveHero";
import { withBasePath } from "@/lib/base-path";
import { getProjectRegistry } from "@/lib/imported-projects";
import { formatAedPerSqft, getAreaPricePerSqft } from "@/lib/market-pricing";
import { getCommunityDirectory, getDeveloperDirectory } from "@/lib/taxonomy";
import { insights } from "@/lib/insights";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("UAE Real Estate and Property Investment", "Explore UAE developments, developer profiles, community intelligence and practical investment research with HAUS & GRACE.");

function formatPrice(raw: string) {
  const amount = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? `AED ${amount.toLocaleString("en-AE")}` : "Price on request";
}

export default function Home() {
  const registry = getProjectRegistry();
  const featuredProjectSlugs = [
    "wyndham-residences-al-marjan-island-rak-uae",
    "arancia-yards-2-beyond-city-of-arabia-dubai",
    "bashayer-final-phase-modon-hudayriyat-island-abu-dhabi",
    "fleurs-de-jardin-amis-jacob-co-meydan-dubai",
    "dawn-o1ne-district-avenew-kora-motor-city-dubai",
    "bay-villas-phase-3-dubai-islands-nakheel",
  ];
  const featured = featuredProjectSlugs
    .map((slug) => registry.projects.find((project) => project.slug === slug && !project.archived && project.image))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));
  const communities = getCommunityDirectory().filter((community) => ["dubai-marina", "palm-jumeirah", "dubai-hills-estate"].includes(community.slug));
  const developers = getDeveloperDirectory().slice(0, 8);
  const editorialSlugs = ["price-per-square-foot-uae-property-guide-2026", "uae-mortgage-planning-before-reservation", "benefits-of-investing-in-uae-real-estate", "how-to-evaluate-new-property-launches-uae", "monthly-uae-market-tracking-dashboard", "service-charges-net-yield-uae-property"];
  const homepageInsights = editorialSlugs.map((slug) => insights.find((insight) => insight.slug === slug)).filter((insight): insight is NonNullable<typeof insight> => Boolean(insight));
  return <main className="site-shell">
    <InternalHeader />

    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="kicker">UAE real estate and investment</p>
        <h1>
          <span className="hero-light-line" data-text="Real estate decisions.">Real estate decisions.</span>
          <br />
          <span className="hero-light-line hero-gold-line" data-text="Built around value.">Built around value.</span>
        </h1>
        <p>Investment-led property advisory for clients who expect stronger acquisition decisions, clearer market context and long-term value.</p>
        <div className="home-hero-actions"><Link href="/projects">Explore live projects</Link><Link href="/contact">Request a curated brief</Link></div>
      </div>
      <InteractiveHero />
      <form className="property-search compact-search" action={withBasePath("/projects")} method="get">
        <label><span>Search</span><input name="q" placeholder="Project, area or developer" /></label>
        <label><span>Emirate</span><select name="emirate" defaultValue=""><option value="">All emirates</option>{Object.keys(registry.emirates).map((emirate) => <option key={emirate}>{emirate}</option>)}</select></label>
        <label><span>Type</span><select name="type" defaultValue=""><option value="">All residences</option><option>Apartments</option><option>Villas</option><option>Townhouses</option><option>Penthouses</option></select></label>
        <button type="submit">Search</button>
      </form>
    </section>

    <section className="market-ticker" aria-label="UAE project index summary"><div><strong>{registry.currentUaeProjects.toLocaleString()}</strong><span>Current UAE projects</span></div><div><strong>{Object.keys(registry.emirates).length}</strong><span>Emirates covered</span></div><div><strong>{developers.length > 0 ? getDeveloperDirectory().length : registry.developers.length}</strong><span>Structured developer profiles</span></div><div><strong>{getCommunityDirectory().length}</strong><span>Community market guides</span></div></section>

    <section className="featured section-pad editorial-section">
      <div className="section-heading"><div><p className="kicker">Live project index</p><h2>Projects selected<br /><em>for closer review.</em></h2></div><p className="heading-note">Compare pricing, payment structure, developer context and the complete media collection for each development.</p></div>
      <div className="project-preview-grid">{featured.map((project) => {
        const areaPrice = getAreaPricePerSqft(project.area, project.propertyTypes, project.emirate);
        const pricePerSqft = project.pricePerSqft ? formatAedPerSqft(project.pricePerSqft) : areaPrice?.display || "";
        return <article className="project-preview-card" key={project.slug}>
        <Link href={`/projects/${project.slug}`} className="project-preview-image"><img src={project.image} alt={`${project.name} in ${project.area}`} loading="lazy" /><span>View project</span></Link>
        <p>{project.emirate} · {project.developer}</p><h3><Link href={`/projects/${project.slug}`}>{project.name}</Link></h3><div><strong>{formatPrice(project.startingPrice)}</strong><span>{pricePerSqft ? `AED/sqft ${pricePerSqft.replace("AED ", "")}` : project.area}</span></div>
      </article>;
      })}</div>
      <Link href="/projects" className="outline-action">View the complete UAE project index</Link>
    </section>

    <section className="section-pad community-section editorial-section">
      <div className="section-heading"><div><p className="kicker">Location intelligence</p><h2>See the market<br /><em>community by community.</em></h2></div><Link href="/communities" className="underlined">All community guides</Link></div>
      <div className="community-grid">{communities.map((community) => <Link href={`/communities/${community.slug}`} className="community-card" key={community.slug}>
        <img src={community.image} alt={`${community.name}, ${community.emirate}`} /><div><p>{community.emirate} · {community.activeProjects} active projects</p><h3>{community.name}</h3></div>
      </Link>)}</div>
    </section>

    <section className="developer-home section-pad editorial-section">
      <div className="section-heading"><div><p className="kicker">Developer intelligence</p><h2>Know who is<br /><em>building the asset.</em></h2></div><p className="heading-note">Profiles organise each developer’s indexed pipeline by emirate, community, property type and current status.</p></div>
      <div className="developer-home-grid">{developers.map((developer, index) => <Link href={`/developers/${developer.slug}`} key={developer.slug}><span>{String(index + 1).padStart(2, "0")}</span><h3>{developer.name}</h3><p>{developer.activeProjects} active · {developer.emirates.join(", ")}</p></Link>)}</div>
      <Link href="/developers" className="outline-action">Explore all developer profiles</Link>
    </section>

    <section className="insights-home section-pad editorial-section">
      <div className="section-heading"><div><p className="kicker">Research &amp; video briefings</p><h2>Market context,<br /><em>without the noise.</em></h2></div><Link href="/insights" className="underlined">All insights</Link></div>
      <div className="insight-home-grid">{homepageInsights.map((insight, index) => <Link href={`/insights/${insight.slug}`} className={index === 0 ? "lead" : ""} key={insight.slug}><div><img src={insight.image} alt={`${insight.title} editorial cover`} />{insight.category === "Video briefing" && <b>Video briefing</b>}</div><p>{insight.category} · {insight.readTime}</p><h3>{insight.title}</h3><span>Read briefing</span></Link>)}</div>
    </section>

    <ClientReviews />

    <section className="final-cta"><p className="kicker light">Private client advisory</p><h2>Move from browsing<br /><em>to a defensible decision.</em></h2><div><Link href="/contact" className="button-light">Build my shortlist</Link><Link href="/projects" className="underlined light-line">Explore projects</Link></div></section>
    <Footer />
  </main>;
}

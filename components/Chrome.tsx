import type { CSSProperties } from "react";
import Link from "@/components/SiteLink";
import { withBasePath } from "@/lib/base-path";

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  const logo = withBasePath("/brand/haus-grace-properties-logo-transparent.png");
  const style = { "--wordmark-src": `url("${logo}")` } as CSSProperties;
  return <span className={`wordmark${inverse ? " inverse" : ""}`} style={style}><img src={logo} alt="" width="1886" height="435" /></span>;
}

export function InternalHeader() {
  return <header className="site-header internal-header">
      <Link href="/" aria-label="HAUS & GRACE home"><Wordmark /></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link href="/projects">Projects</Link><Link href="/developers">Developers</Link><Link href="/communities">Communities</Link><Link href="/insights">Insights</Link><div className="nav-about"><Link href="/about">About</Link><div className="nav-about-menu"><Link href="/about">About us</Link><Link href="/agent">Agent login</Link></div></div>
      </nav>
      <div className="header-actions"><Link href="/list-your-property" className="text-link">List your property</Link><Link href="/contact" className="header-cta">Speak with an advisor</Link></div>
      <details className="mobile-menu"><summary aria-label="Open navigation"><span /><span /></summary><nav><Link href="/projects">Projects</Link><Link href="/developers">Developers</Link><Link href="/communities">Communities</Link><Link href="/insights">Insights</Link><Link href="/about">About us</Link><Link href="/agent" className="mobile-sub-link">Agent login</Link><Link href="/list-your-property">List your property</Link></nav></details>
    </header>;
}

export function Footer() {
  return <footer className="site-footer">
    <div className="footer-brand"><Wordmark inverse /><p>UAE real estate.<br />Performance-led advisory.</p></div>
    <div><p className="footer-label">Explore</p><Link href="/projects">Projects</Link><Link href="/developers">Developers</Link><Link href="/communities">Communities</Link><Link href="/insights">Market insights</Link></div>
    <div><p className="footer-label">Company</p><Link href="/about">About</Link><Link href="/advisors">Advisors</Link><Link href="/list-your-property">List with us</Link><Link href="/contact">Contact</Link><Link href="/agent">Agent workspace</Link></div>
    <div><p className="footer-label">Visit</p><p>Office 1142, Xavier Business Center<br />Ibn Battuta Gate, Dubai, UAE</p><a href="tel:+971566215655">+971 56 621 5655</a></div>
    <div className="footer-bottom"><span>Copyright 2026 HAUS &amp; GRACE Properties</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>RERA registered brokerage · ORN 1182853</span></div>
  </footer>;
}

export function PageIntro({ kicker, title, copy }: { kicker: string; title: React.ReactNode; copy?: string }) {
  return <section className="page-intro"><p className="kicker">{kicker}</p><h1>{title}</h1>{copy && <p>{copy}</p>}</section>;
}

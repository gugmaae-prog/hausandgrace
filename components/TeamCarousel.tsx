"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/SiteLink";
import { withBasePath } from "@/lib/base-path";

export type TeamMember = {
  name: string;
  role: string;
  email: string;
  image: string;
  copy: string;
  facts: string[];
  portfolioSlug: string;
  badge?: string;
};

export function TeamCarousel({ members }: { members: TeamMember[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const show = useCallback((index: number) => {
    const next = (index + members.length) % members.length;
    const track = trackRef.current;
    const card = trackRef.current?.children.item(next) as HTMLElement | null;
    if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActive(next);
  }, [members.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => show(active + 1), 5_500);
    return () => window.clearInterval(timer);
  }, [active, paused, show]);

  function syncActive() {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const nearest = cards.reduce((best, card, index) => (
      Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - track.offsetLeft - track.scrollLeft) ? index : best
    ), 0);
    setActive(nearest);
  }

  return <div
    className="about-team-carousel"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={() => setPaused(false)}
  >
    <div className="about-team-controls">
      <div aria-label="Advisor slide position">
        {members.map((member, index) => <button type="button" key={member.email} aria-label={`Show ${member.name}`} aria-current={active === index ? "true" : undefined} onClick={() => show(index)} />)}
      </div>
      <span><button type="button" onClick={() => show(active - 1)}>Previous</button><button type="button" onClick={() => show(active + 1)}>Next</button></span>
    </div>
    <div className="about-team-track" ref={trackRef} onScroll={syncActive}>
      {members.map((member, index) => <article
        className="about-team-card"
        data-active={active === index ? "true" : "false"}
        key={member.email}
        aria-label={`${member.name}, ${member.role}`}
      >
        <div className="about-team-photo">
          <img src={withBasePath(member.image)} alt={`${member.name}, ${member.role} at HAUS & GRACE`} width="800" height="1000" loading={index < 3 ? "eager" : "lazy"} />
          {member.badge && <span>{member.badge}</span>}
        </div>
        <div className="about-team-copy">
          <p className="kicker">{member.role}</p>
          <h3>{member.name}</h3>
          <p>{member.copy}</p>
          {member.facts.length > 0 && <ul>{member.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
          <div className="about-team-actions">
            <a href={`mailto:${member.email}`}>Contact {member.name.split(" ")[0]}</a>
            <Link href={`/advisors/${member.portfolioSlug}`}>View Agent Portfolio</Link>
          </div>
        </div>
      </article>)}
    </div>
  </div>;
}

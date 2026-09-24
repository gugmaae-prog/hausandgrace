"use client";

import { useState } from "react";
import Link from "@/components/SiteLink";
import type { CommunityProfile } from "@/lib/taxonomy";

type CommunityDirectoryItem = Pick<CommunityProfile, "slug" | "name" | "emirate" | "image" | "activeProjects" | "developers" | "pricePerSqft" | "descriptor">;

export function CommunityDirectory({ communities }: { communities: CommunityDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [emirate, setEmirate] = useState("");
  const emirates = [...new Set(communities.map((community) => community.emirate))].sort();
  const normalizedQuery = query.toLowerCase();
  const matches = communities.filter((community) => (!emirate || community.emirate === emirate) && `${community.name} ${community.emirate} ${community.developers.join(" ")}`.toLowerCase().includes(normalizedQuery));
  return <section className="directory-shell section-pad">
    <div className="directory-toolbar community-toolbar"><label><span>Find a community</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search community or developer" /></label><label><span>Emirate</span><select value={emirate} onChange={(event) => setEmirate(event.target.value)}><option value="">All emirates</option>{emirates.map((name) => <option key={name}>{name}</option>)}</select></label><p><strong>{matches.length}</strong> community guides</p></div>
    <div className="community-directory-grid">{matches.map((community) => <Link href={`/communities/${community.slug}`} className="community-directory-card" key={`${community.emirate}-${community.slug}`}>
      <div>{community.image ? <img src={community.image} alt={`${community.name}, ${community.emirate}`} loading="lazy" /> : <span className="media-fallback">H&amp;G</span>}<b>{community.activeProjects} active</b></div>
      <p>{community.emirate} · {community.descriptor}</p><h2>{community.name}</h2><span>{community.pricePerSqft ? `${community.pricePerSqft.display} · ${community.pricePerSqft.label}` : `${community.developers.length} developers · View market`}</span>
    </Link>)}</div>
  </section>;
}

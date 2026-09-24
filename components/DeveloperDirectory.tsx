"use client";

import { useState } from "react";
import Link from "@/components/SiteLink";
import type { DeveloperProfile } from "@/lib/taxonomy";

type DeveloperDirectoryItem = Pick<DeveloperProfile, "slug" | "name" | "image" | "activeProjects" | "emirates" | "communities"> & { indexedProjects: number };

export function DeveloperDirectory({ developers }: { developers: DeveloperDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const matches = developers.filter((developer) => `${developer.name} ${developer.emirates.join(" ")} ${developer.communities.join(" ")}`.toLowerCase().includes(normalizedQuery));
  return <section className="directory-shell section-pad">
    <div className="directory-toolbar"><label><span>Find a developer</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, emirate or community" /></label><p><strong>{matches.length}</strong> developer profiles</p></div>
    <div className="developer-directory-grid">{matches.map((developer) => <Link href={`/developers/${developer.slug}`} className="developer-directory-card" key={developer.slug}>
      <div>{developer.image ? <img src={developer.image} alt={`${developer.name} UAE development`} loading="lazy" /> : <span className="media-fallback">H&amp;G</span>}<b>{developer.activeProjects} active</b></div>
      <p>{developer.emirates.join(" · ")}</p><h2>{developer.name}</h2><span>{developer.indexedProjects} indexed projects · View profile</span>
    </Link>)}</div>
  </section>;
}

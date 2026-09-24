"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/SiteLink";
import { withBasePath } from "@/lib/base-path";

type Project = { slug: string; title: string; developer: string; emirate: string; area: string; image: string; price: string; pricePerSqft: string; pricePerSqftLabel: string; paymentPlan: string; handover: string; propertyTypes: string[]; bedrooms: string[] };
type Filters = { emirates: Record<string, number>; developers: string[]; propertyTypes: string[] };
type Initial = { query?: string; emirate?: string; developer?: string; propertyType?: string };
type ProjectsResponse = { projects: Project[]; pages: number; total: number; filters: Filters };

export default function ProjectCatalogue({ initial = {} }: { initial?: Initial }) {
  const [projects, setProjects] = useState<Project[]>([]); const [query, setQuery] = useState(initial.query || ""); const [activeQuery, setActiveQuery] = useState(initial.query || "");
  const [emirate, setEmirate] = useState(initial.emirate || ""); const [developer, setDeveloper] = useState(initial.developer || ""); const [propertyType, setPropertyType] = useState(initial.propertyType || "");
  const [filters, setFilters] = useState<Filters>({ emirates: {}, developers: [], propertyTypes: [] }); const [page, setPage] = useState(1); const [pages, setPages] = useState(1); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true);
  useEffect(() => { const controller = new AbortController(); const params = new URLSearchParams({ page: String(page) }); if (activeQuery) params.set("q", activeQuery); if (emirate) params.set("emirate", emirate); if (developer) params.set("developer", developer); if (propertyType) params.set("type", propertyType);
    fetch(`${withBasePath("/api/projects")}?${params}`, { signal: controller.signal }).then(async (response) => (await response.json()) as ProjectsResponse).then(data => { setProjects(data.projects); setPages(data.pages || 1); setTotal(data.total); setFilters(data.filters); }).finally(() => setLoading(false)); return () => controller.abort();
  }, [activeQuery, page, emirate, developer, propertyType]);
  function search(event: FormEvent) { event.preventDefault(); setLoading(true); setPage(1); setActiveQuery(query); }
  function changeFilter(setter: (value: string) => void, value: string) { setLoading(true); setPage(1); setter(value); }
  function reset() { setLoading(true); setQuery(""); setActiveQuery(""); setEmirate(""); setDeveloper(""); setPropertyType(""); setPage(1); }
  return <section className="project-catalogue section-pad">
    <div className="collection-signature"><span>Live UAE catalogue</span><strong>Growing</strong><p>A continuously expanding development universe, structured for faster and better-informed investment decisions.</p></div>
    <form className="project-search" onSubmit={search}><label className="project-query"><span>Search the collection</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Project, district or developer" /></label><label><span>Emirate</span><select value={emirate} onChange={e => changeFilter(setEmirate, e.target.value)}><option value="">All emirates</option>{Object.entries(filters.emirates).map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}</select></label><label><span>Developer</span><select value={developer} onChange={e => changeFilter(setDeveloper, e.target.value)}><option value="">All developers</option>{filters.developers.map(name => <option key={name} value={name}>{name}</option>)}</select></label><label><span>Property type</span><select value={propertyType} onChange={e => changeFilter(setPropertyType, e.target.value)}><option value="">All residences</option>{filters.propertyTypes.map(name => <option key={name} value={name}>{name}</option>)}</select></label><button>Discover</button></form>
    <div className="project-count"><span>{loading ? "Loading the live collection..." : `${total.toLocaleString()} matching developments`}</span><button type="button" onClick={reset}>Reset filters</button></div>
    <div className={`project-index-grid${loading ? " loading" : ""}`}>{projects.map((project, index) => <article key={project.slug} className="project-index-card"><Link href={`/projects/${project.slug}`} className="project-index-image">{project.image ? <img src={project.image} loading={index > 5 ? "lazy" : "eager"} alt={`${project.title} in ${project.area}`} /> : <div className="project-image-fallback"><span>H&amp;G</span></div>}<span>View project</span><div className="project-card-badges"><b>{project.emirate}</b>{project.handover && <b>{project.handover}</b>}</div></Link><p>{project.developer} · {project.area}</p><h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2><div className="project-card-meta"><strong>{project.price}</strong><span>{project.pricePerSqft ? `${project.pricePerSqftLabel} ${project.pricePerSqft}` : project.propertyTypes.join(" · ") || "Residences"}</span></div></article>)}</div>
    {!loading && !projects.length && <div className="project-empty"><span>0 results</span><h2>Broaden the search.</h2><p>Reset the filters or ask an advisor to build a private shortlist around your target return, budget and timing.</p><button onClick={reset}>View all projects</button></div>}
    {!loading && projects.length > 0 && <div className="pagination"><button disabled={page === 1} onClick={() => { setLoading(true); setPage(v => v - 1); window.scrollTo({ top: 500, behavior: "smooth" }); }}>Previous</button><span>{page} / {pages}</span><button disabled={page === pages} onClick={() => { setLoading(true); setPage(v => v + 1); window.scrollTo({ top: 500, behavior: "smooth" }); }}>Next</button></div>}
  </section>;
}

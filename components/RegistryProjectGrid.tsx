import Link from "@/components/SiteLink";
import type { RegistryProject } from "@/lib/imported-projects";
import { formatAedPerSqft, getAreaPricePerSqft } from "@/lib/market-pricing";

function price(raw: string) {
  const amount = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? `AED ${amount.toLocaleString("en-AE")}` : "Price on request";
}

export function RegistryProjectGrid({ projects, limit = 12 }: { projects: RegistryProject[]; limit?: number }) {
  return <div className="project-preview-grid taxonomy-project-grid">{projects.slice(0, limit).map((project) => {
    const areaPrice = getAreaPricePerSqft(project.area, project.propertyTypes, project.emirate);
    const pricePerSqft = project.pricePerSqft ? { label: project.statusLabel ? "Indicative AED/sqft" : "Project AED/sqft", display: formatAedPerSqft(project.pricePerSqft) } : areaPrice ? { label: areaPrice.label, display: areaPrice.display } : null;
    return <article className="project-preview-card" key={project.slug}>
      <Link href={`/projects/${project.slug}`} className="project-preview-image">{project.image ? <img src={project.image} alt={`${project.name} in ${project.area}`} loading="lazy" /> : <span className="media-fallback">H&amp;G</span>}<span>View project</span>{project.statusLabel && <b>{project.statusLabel}</b>}{project.archived && <b>Archive</b>}</Link>
      <p>{project.emirate} · {project.developerDisplay || project.developer}</p><h3><Link href={`/projects/${project.slug}`}>{project.name}</Link></h3><div><strong>{project.startingPriceLabel || price(project.startingPrice)}</strong><span>{pricePerSqft ? `${pricePerSqft.label} ${pricePerSqft.display}` : project.area}</span></div>
    </article>;
  })}</div>;
}

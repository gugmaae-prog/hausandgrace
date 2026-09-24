import { NextRequest, NextResponse } from "next/server";
import { getProjectRegistry } from "@/lib/imported-projects";
import { formatAedPerSqft, getAreaPricePerSqft } from "@/lib/market-pricing";

function formatPrice(raw: string) { const amount = Number(raw); return Number.isFinite(amount) && amount > 0 ? `AED ${amount.toLocaleString("en-AE")}` : "Price on request"; }
function developerKey(value: string) {
  const key = value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return /^imtiaz(?:-development|-developments)?$/.test(key) ? "imtiaz" : key;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams; const query = (params.get("q") || "").trim().toLowerCase(); const emirate = params.get("emirate") || ""; const developer = params.get("developer") || ""; const propertyType = params.get("type") || "";
  const requestedDeveloper = developerKey(developer);
  const page = Math.max(1, Number(params.get("page") || 1)); const perPage = 24; const registry = getProjectRegistry();
  const filtered = registry.projects.filter((project) => {
    const searchable = `${project.name} ${project.developerDisplay || ""} ${project.developer} ${project.area} ${project.emirate} ${project.statusLabel || ""}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!emirate || project.emirate === emirate) && (!developer || developerKey(project.developerDisplay || project.developer) === requestedDeveloper || developerKey(project.developer) === requestedDeveloper) && (!propertyType || project.propertyTypes.includes(propertyType));
  });
  const projects = filtered.slice((page - 1) * perPage, page * perPage).map((project) => {
    const areaPrice = getAreaPricePerSqft(project.area, project.propertyTypes, project.emirate);
    return { slug: project.slug, title: project.name, developer: project.developerDisplay || project.developer, emirate: project.emirate, area: project.area, image: project.image, price: project.startingPriceLabel || formatPrice(project.startingPrice), paymentPlan: project.paymentPlan.replace(/Payment Plan/gi, "").trim(), handover: project.handover, statusLabel: project.statusLabel || "", propertyTypes: project.propertyTypes, bedrooms: project.bedrooms, pricePerSqft: project.pricePerSqft ? formatAedPerSqft(project.pricePerSqft) : areaPrice?.display || "", pricePerSqftLabel: project.pricePerSqft ? (project.statusLabel ? "Indicative AED/sqft" : "Project AED/sqft") : areaPrice?.label || "" };
  });
  const propertyTypes = [...new Set(registry.projects.flatMap((project) => project.propertyTypes))].sort();
  const developers = [...new Set(registry.projects.map((project) => project.developerDisplay || project.developer).filter(Boolean))].sort();
  return NextResponse.json({ projects, total: filtered.length, page, pages: Math.max(1, Math.ceil(filtered.length / perPage)), filters: { emirates: registry.emirates, developers, propertyTypes }, registry: { total: registry.totalUaeProjects, updatedAt: registry.generatedAt } });
}

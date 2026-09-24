import { getProjectRegistry, type RegistryProject } from "@/lib/imported-projects";
import { getAreaPricePerSqft, type PricePerSqft } from "@/lib/market-pricing";

export type CommunityProfile = {
  slug: string;
  name: string;
  emirate: string;
  image: string;
  projects: RegistryProject[];
  activeProjects: number;
  developers: string[];
  propertyTypes: string[];
  pricePerSqft: PricePerSqft | null;
  descriptor: string;
  overview: string;
};

export type DeveloperProfile = {
  slug: string;
  name: string;
  image: string;
  projects: RegistryProject[];
  activeProjects: number;
  emirates: string[];
  communities: string[];
  propertyTypes: string[];
  descriptor?: string;
  overview?: string;
  focus?: string[];
  website?: string;
};

const editorialCommunities: Record<string, { descriptor: string; overview: string }> = {
  "palm-jumeirah": {
    descriptor: "Island living",
    overview: "Palm Jumeirah combines private beachfront living, internationally recognised hospitality and a limited supply of waterfront addresses. Compare position, aspect, beach access and service structure before comparing price alone.",
  },
  "dubai-marina": {
    descriptor: "Waterfront energy",
    overview: "Dubai Marina is a dense, walkable waterfront market shaped by tower quality, marina aspect, access and building management. The strongest opportunities balance view protection, practical layouts and proven end-user demand.",
  },
  "dubai-hills-estate": {
    descriptor: "Green city living",
    overview: "Dubai Hills Estate brings parks, schools, golf and retail into a connected master community. Apartment and villa submarkets behave differently, making phase, proximity and future supply essential parts of any investment review.",
  },
  "business-bay": {
    descriptor: "Central city market",
    overview: "Business Bay sits between Downtown Dubai, the canal and the city’s commercial core. Building quality varies significantly, so the investment case depends on developer delivery, immediate surroundings, layout efficiency and completion timing.",
  },
  "dubai-creek-harbour": {
    descriptor: "Emerging waterfront district",
    overview: "Dubai Creek Harbour is a large-scale waterfront district with a long development horizon. Buyers should assess the specific precinct, view corridor, delivery sequence and how each residence fits the broader master plan.",
  },
  "al-marjan-island-ras-al-khaimah": {
    descriptor: "Resort-led island growth",
    overview: "Al Marjan Island is a resort and branded-residence market in Ras Al Khaimah. Operator quality, beach relationship, service charges and realistic occupancy assumptions are central to evaluating each project.",
  },
  difc: {
    descriptor: "Global financial district",
    overview: "DIFC combines a mature commercial centre with a tightly supplied residential and hospitality market. Premiums are driven by walkability, service, view, branded operation and access to the district’s core.",
  },
};

const editorialDevelopers: Record<string, { name: string; descriptor: string; overview: string; focus: string[]; website: string }> = {
  imtiaz: {
    name: "Imtiaz Developments",
    descriptor: "Design-led Dubai developer",
    overview: "Imtiaz Developments’ UAE pipeline spans furnished urban residences and amenity-led apartment concepts across established and emerging Dubai districts. Each project should be reviewed on its individual delivery programme, specification, service structure and live unit schedule.",
    focus: ["Dubai apartment developments", "Furnished residence concepts", "DLRC pipeline", "Amenity-led urban living"],
    website: "https://imtiaz.ae/",
  },
};

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function cleanCommunityName(value: string) {
  return value.replace(/\s*\((?:Dubai|Abu Dhabi|Sharjah|Ajman|Fujairah|Ras Al Khaimah|Umm Al Quwain) Emirate\)\s*$/i, "").replace(/\s+/g, " ").trim();
}

export function communitySlugFor(value: string) { return slugify(cleanCommunityName(value)); }

function communityEditorial(name: string, emirate: string) {
  const known = editorialCommunities[slugify(name)];
  if (known) return known;
  return {
    descriptor: `${emirate} property market`,
    overview: `${name} is represented here through verified UAE development data. Review the active project mix, participating developers, residence types, delivery horizons and price positioning before selecting a specific opportunity.`,
  };
}

let communityDirectoryCache: CommunityProfile[] | null = null;
let communityBySlugCache: Map<string, CommunityProfile> | null = null;

export function getCommunityDirectory(): CommunityProfile[] {
  if (communityDirectoryCache) return communityDirectoryCache;
  const groups = new Map<string, RegistryProject[]>();
  for (const project of getProjectRegistry().projects) {
    const name = cleanCommunityName(project.area);
    if (!name || name.length < 3) continue;
    const key = `${project.emirate}|${slugify(name)}`;
    const group = groups.get(key);
    if (group) group.push(project);
    else groups.set(key, [project]);
  }
  const result = [...groups.entries()].map(([key, projects]) => {
    const [emirate, baseSlug] = key.split("|");
    const name = cleanCommunityName(projects[0].area);
    const editorial = communityEditorial(name, emirate);
    const active = projects.filter((project) => !project.archived);
    const image = (active.find((project) => project.image) || projects.find((project) => project.image))?.image || "";
    const propertyTypes = [...new Set(projects.flatMap((project) => project.propertyTypes))].sort();
    return {
      slug: baseSlug,
      name,
      emirate,
      image,
      projects: [...projects].sort((a, b) => Number(a.archived) - Number(b.archived)),
      activeProjects: active.length,
      developers: [...new Set(projects.map((project) => project.developer).filter(Boolean))].sort(),
      propertyTypes,
      pricePerSqft: getAreaPricePerSqft(name, propertyTypes, emirate),
      descriptor: editorial.descriptor,
      overview: editorial.overview,
    };
  }).sort((a, b) => b.activeProjects - a.activeProjects || a.name.localeCompare(b.name));
  communityDirectoryCache = result;
  return result;
}

export function getCommunityProfile(slug: string) {
  if (!communityBySlugCache) communityBySlugCache = new Map(getCommunityDirectory().map((community) => [community.slug, community]));
  return communityBySlugCache.get(slug) ?? null;
}

const excludedDeveloperNames = new Set(["al", "g", "w", "the", "new", "dubai", "district", "one"]);

function credibleDeveloper(name: string) {
  const normalized = name.trim().toLowerCase();
  return normalized.length >= 3 && !excludedDeveloperNames.has(normalized) && /[a-z]{3}/i.test(normalized);
}

function displayDeveloperName(names: string[]) {
  return [...names].sort((a, b) => {
    const aScore = Number(a === a.toUpperCase()) + Number(/[A-Z]/.test(a.slice(1)));
    const bScore = Number(b === b.toUpperCase()) + Number(/[A-Z]/.test(b.slice(1)));
    return bScore - aScore || b.length - a.length;
  })[0];
}

function developerSlugFor(value: string) {
  const slug = slugify(value);
  return /^imtiaz(?:-development|-developments)?$/.test(slug) ? "imtiaz" : slug;
}

let developerDirectoryCache: DeveloperProfile[] | null = null;
let developerBySlugCache: Map<string, DeveloperProfile> | null = null;

export function getDeveloperDirectory(): DeveloperProfile[] {
  if (developerDirectoryCache) return developerDirectoryCache;
  const groups = new Map<string, { names: string[]; projects: RegistryProject[] }>();
  for (const project of getProjectRegistry().projects) {
    if (!credibleDeveloper(project.developer)) continue;
    const slug = developerSlugFor(project.developer);
    if (!slug) continue;
    const group = groups.get(slug) || { names: [], projects: [] };
    group.names.push((project.developerDisplay || project.developer).trim());
    group.projects.push(project);
    groups.set(slug, group);
  }
  const result = [...groups.entries()].map(([slug, group]) => {
    const projects = [...group.projects].sort((a, b) => Number(a.archived) - Number(b.archived));
    const active = projects.filter((project) => !project.archived);
    const editorial = editorialDevelopers[slug];
    return {
      slug,
      name: editorial?.name || displayDeveloperName([...new Set(group.names)]),
      image: (active.find((project) => project.image) || projects.find((project) => project.image))?.image || "",
      projects,
      activeProjects: active.length,
      emirates: [...new Set(projects.map((project) => project.emirate))].sort(),
      communities: [...new Set(projects.map((project) => cleanCommunityName(project.area)).filter(Boolean))].sort(),
      propertyTypes: [...new Set(projects.flatMap((project) => project.propertyTypes))].sort(),
      descriptor: editorial?.descriptor,
      overview: editorial?.overview,
      focus: editorial?.focus,
      website: editorial?.website,
    };
  }).sort((a, b) => b.activeProjects - a.activeProjects || a.name.localeCompare(b.name));
  developerDirectoryCache = result;
  return result;
}

export function getDeveloperProfile(slug: string) {
  if (!developerBySlugCache) developerBySlugCache = new Map(getDeveloperDirectory().map((developer) => [developer.slug, developer]));
  return developerBySlugCache.get(slug) ?? null;
}

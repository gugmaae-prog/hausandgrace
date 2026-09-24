import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import registryData from "../data/projects.json";
import { getAreaPricePerSqft } from "../lib/market-pricing";

const MAX_IMAGE_BYTES = 6_000_000;
const IMAGE_HOSTS = /^(?:cdn\.opr\.ae|img[123]\.creatium\.ru|i\.1\.creatium\.io)$/i;

export type ReportProjectRecord = {
  slug: string;
  name: string;
  developer: string;
  emirate: string;
  area: string;
  startingPrice: string;
  paymentPlan: string;
  handover: string;
  image?: string;
  brochure?: string;
  bedrooms: string[];
  propertyTypes: string[];
  lifestyles: string[];
  coordinates?: string;
  description?: string;
  archived?: boolean;
  pricePerSqft?: number;
};

export type ConfirmedProjectInput = {
  slug: string;
  bedroom: string;
  unitReference: string;
  unitPrice: number;
  unitAreaSqft: number;
  annualRent: number;
  annualRentLow: number;
  annualRentHigh: number;
  occupancyRate: number;
  serviceChargePerSqft: number;
  otherAnnualCosts: number;
  acquisitionCosts: number;
  rentalEvidenceNotes: string;
  confirmationNotes: string;
};

export type AdvisorSnapshot = {
  name: string;
  email: string;
  phone: string;
  title: string;
};

export type NearbyPlace = {
  name: string;
  category: string;
  distanceKm: number;
};

export type UpcomingProject = {
  name: string;
  developer: string;
  handover: string;
  distanceKm: number | null;
};

export type CommunityResearch = {
  areaBenchmark: {
    value: number;
    display: string;
    label: string;
    period: string;
    sourceLabel: string;
    sourceUrl: string;
    note: string;
  } | null;
  nearby: NearbyPlace[];
  upcoming: UpcomingProject[];
  demandSegments: string[];
  demographicContext: {
    scope: string;
    display: string;
    note: string;
    sourceLabel: string;
    sourceUrl: string;
  } | null;
  rentalEvidence: {
    status: string;
    note: string;
    indexLabel: string;
    indexUrl: string;
    datasetLabel: string;
    datasetUrl: string;
  };
};

export type AdvisoryScoreFactor = {
  label: string;
  weight: number;
  score: number;
  rationale: string;
};

export type AdvisoryScreen = {
  total: number;
  label: string;
  statement: string;
  factors: AdvisoryScoreFactor[];
};

export type ReportChart = {
  title: string;
  subtitle: string;
  unit: string;
  kind: "columns" | "bars";
  data: Array<{ label: string; value: number; display: string }>;
  sourceLabel: string;
  sourceUrl: string;
};

export type CuratedProjectSnapshot = {
  slug: string;
  name: string;
  developer: string;
  location: string;
  emirate: string;
  startingPrice: string;
  paymentPlan: string;
  handover: string;
  pricePerSqft: string;
  residences: string;
  bedrooms: string;
  positioning: string;
  imageUrl: string;
  coordinates: string;
  paymentSchedule: Array<{ label: string; percentage: number; amount: number }>;
  unitReference: string;
  bedroom: string;
  unitPrice: number;
  unitAreaSqft: number;
  annualRent: number;
  annualRentLow: number;
  annualRentHigh: number;
  occupancyRate: number;
  effectiveAnnualRent: number;
  serviceChargePerSqft: number;
  annualServiceCharge: number;
  otherAnnualCosts: number;
  acquisitionCosts: number;
  allInCost: number;
  netAnnualIncome: number;
  effectiveNetAnnualIncome: number;
  unitPricePerSqft: number;
  annualRentPerSqft: number;
  grossYield: number;
  netYield: number;
  effectiveNetYield: number;
  areaBenchmark: {
    value: number;
    display: string;
    label: string;
    period: string;
    sourceLabel: string;
    sourceUrl: string;
    note: string;
  } | null;
  priceVsAreaPercent: number | null;
  nearby: NearbyPlace[];
  upcoming: UpcomingProject[];
  demandSegments: string[];
  demographicContext: CommunityResearch["demographicContext"];
  rentalEvidence: CommunityResearch["rentalEvidence"];
  rentalEvidenceNotes: string;
  advisoryScreen: AdvisoryScreen;
  confirmationNotes: string;
};

export type AiBriefNarrative = {
  executiveSummary: string;
  recommendation: string;
  marketPosition: string;
  locationStory: string;
  riskNotes: string[];
};

export type CuratedBriefContent = {
  executiveSummary: string;
  recommendation: string;
  marketPosition: string;
  locationStory: string;
  riskNotes: string[];
  advisoryScope: string[];
  nextSteps: string[];
  projects: CuratedProjectSnapshot[];
  notes: string;
  preparedAt: string;
  advisor: AdvisorSnapshot;
  confirmation: {
    confirmedAt: string;
    confirmedBy: string;
    statement: string;
  };
  marketContext: {
    scope: string;
    period: string;
    headline: Array<{ label: string; display: string; note: string }>;
    charts: ReportChart[];
    sources: Array<{ label: string; url: string }>;
  };
  residencyGuidance: {
    title: string;
    threshold: string;
    status: string;
    summary: string;
    sourceLabel: string;
    sourceUrl: string;
  };
};

export type CuratedBriefDocument = {
  id: string;
  type: "sales_offer" | "proposal" | "comparison";
  title: string;
  client_name: string;
  created_at: string;
  content: CuratedBriefContent;
};

type ReportEnv = {
  IMAGES?: ImagesBinding;
};

const registry = registryData as {
  projects: ReportProjectRecord[];
  generatedAt: string;
  totalUaeProjects: number;
};

const DESTINATIONS: Array<{
  emirate: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
}> = [
  { emirate: "Dubai", name: "Dubai International Airport", category: "Airport", lat: 25.2532, lon: 55.3657 },
  { emirate: "Dubai", name: "Al Maktoum International Airport", category: "Airport", lat: 24.8964, lon: 55.1614 },
  { emirate: "Dubai", name: "Dubai Mall and Downtown", category: "Retail and leisure", lat: 25.1972, lon: 55.2796 },
  { emirate: "Dubai", name: "Dubai International Financial Centre", category: "Business district", lat: 25.2114, lon: 55.2797 },
  { emirate: "Dubai", name: "Mall of the Emirates", category: "Retail and leisure", lat: 25.1181, lon: 55.2006 },
  { emirate: "Dubai", name: "Dubai Marina Mall", category: "Retail and leisure", lat: 25.0768, lon: 55.1398 },
  { emirate: "Dubai", name: "Expo City Dubai", category: "Business and events", lat: 24.9615, lon: 55.1503 },
  { emirate: "Dubai", name: "Dubai Hills Mall", category: "Retail and leisure", lat: 25.1004, lon: 55.2391 },
  { emirate: "Dubai", name: "King's College Hospital Dubai", category: "Healthcare", lat: 25.1001, lon: 55.2472 },
  { emirate: "Dubai", name: "Meydan Racecourse", category: "Leisure", lat: 25.1578, lon: 55.3002 },
  { emirate: "Abu Dhabi", name: "Zayed International Airport", category: "Airport", lat: 24.4331, lon: 54.6511 },
  { emirate: "Abu Dhabi", name: "Yas Mall", category: "Retail and leisure", lat: 24.4886, lon: 54.6077 },
  { emirate: "Abu Dhabi", name: "The Galleria Al Maryah Island", category: "Retail and business", lat: 24.5018, lon: 54.3872 },
  { emirate: "Abu Dhabi", name: "Cleveland Clinic Abu Dhabi", category: "Healthcare", lat: 24.4991, lon: 54.3881 },
  { emirate: "Abu Dhabi", name: "New York University Abu Dhabi", category: "Education", lat: 24.5233, lon: 54.4345 },
  { emirate: "Abu Dhabi", name: "Louvre Abu Dhabi", category: "Culture", lat: 24.5337, lon: 54.3985 },
  { emirate: "Ras Al Khaimah", name: "Ras Al Khaimah International Airport", category: "Airport", lat: 25.6135, lon: 55.9388 },
  { emirate: "Ras Al Khaimah", name: "Al Hamra Mall", category: "Retail and leisure", lat: 25.7021, lon: 55.7805 },
  { emirate: "Ras Al Khaimah", name: "Al Hamra Golf Club", category: "Leisure", lat: 25.6939, lon: 55.7822 },
  { emirate: "Ras Al Khaimah", name: "RAK Hospital", category: "Healthcare", lat: 25.7905, lon: 55.968 },
  { emirate: "Sharjah", name: "Sharjah International Airport", category: "Airport", lat: 25.3286, lon: 55.5172 },
  { emirate: "Sharjah", name: "City Centre Al Zahia", category: "Retail and leisure", lat: 25.318, lon: 55.537 },
  { emirate: "Sharjah", name: "University City of Sharjah", category: "Education", lat: 25.297, lon: 55.488 },
  { emirate: "Sharjah", name: "Al Majaz Waterfront", category: "Leisure", lat: 25.3288, lon: 55.3869 },
  { emirate: "Ajman", name: "Ajman City Centre", category: "Retail and leisure", lat: 25.399, lon: 55.4796 },
  { emirate: "Ajman", name: "Ajman University", category: "Education", lat: 25.4019, lon: 55.5066 },
  { emirate: "Ajman", name: "Sheikh Khalifa Medical City Ajman", category: "Healthcare", lat: 25.4058, lon: 55.513 },
  { emirate: "Fujairah", name: "Fujairah International Airport", category: "Airport", lat: 25.1122, lon: 56.3239 },
  { emirate: "Fujairah", name: "Fujairah City Centre", category: "Retail and leisure", lat: 25.1287, lon: 56.3102 },
  { emirate: "Umm Al Quwain", name: "Mall of UAQ", category: "Retail and leisure", lat: 25.5446, lon: 55.5853 },
  { emirate: "Umm Al Quwain", name: "Umm Al Quwain Hospital", category: "Healthcare", lat: 25.5686, lon: 55.5627 },
];

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : "";
}

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return value > 0 ? `AED ${Math.round(value).toLocaleString("en-AE")}` : "Not confirmed";
}

function percent(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "Not modelled";
}

function normalizeArea(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*emirate\)/gi, "")
    .replace(/\b(?:dubai|abu dhabi|sharjah|ajman|fujairah|ras al khaimah|umm al quwain)\b/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCoordinates(value = "") {
  const [lat, lon] = value.split(",").map((part) => Number(part.trim()));
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRadians = (value: number) => value * Math.PI / 180;
  const earth = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine = Math.sin(dLat / 2) ** 2
    + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earth * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function nearbyPlaces(project: ReportProjectRecord) {
  const origin = parseCoordinates(project.coordinates);
  if (!origin) return [];
  return DESTINATIONS
    .filter((place) => place.emirate === project.emirate)
    .map((place) => ({
      name: place.name,
      category: place.category,
      distanceKm: distanceKm(origin, { lat: place.lat, lon: place.lon }),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 5)
    .map((place) => ({ ...place, distanceKm: Math.round(place.distanceKm * 10) / 10 }));
}

function upcomingProjects(project: ReportProjectRecord, selectedSlugs: Set<string>) {
  const areaKey = normalizeArea(project.area);
  const origin = parseCoordinates(project.coordinates);
  return registry.projects
    .filter((candidate) =>
      !candidate.archived
      && candidate.slug !== project.slug
      && !selectedSlugs.has(candidate.slug)
      && candidate.emirate === project.emirate
      && Boolean(candidate.handover),
    )
    .map((candidate) => {
      const target = parseCoordinates(candidate.coordinates);
      const distance = origin && target ? distanceKm(origin, target) : null;
      const sameArea = areaKey && normalizeArea(candidate.area) === areaKey;
      return { candidate, distance, sameArea };
    })
    .filter(({ distance, sameArea }) => sameArea || (distance !== null && distance <= 10))
    .sort((left, right) => {
      if (left.sameArea !== right.sameArea) return left.sameArea ? -1 : 1;
      return (left.distance ?? 999) - (right.distance ?? 999);
    })
    .slice(0, 5)
    .map(({ candidate, distance }) => ({
      name: candidate.name,
      developer: candidate.developer,
      handover: candidate.handover || "To be confirmed",
      distanceKm: distance === null ? null : Math.round(distance * 10) / 10,
    }));
}

function demandSegments(project: ReportProjectRecord, nearby: NearbyPlace[]) {
  const categories = new Set(nearby.map((place) => place.category.toLowerCase()));
  const context = `${project.propertyTypes.join(" ")} ${project.lifestyles.join(" ")} ${project.description || ""}`.toLowerCase();
  const segments = new Set<string>();
  if ([...categories].some((category) => category.includes("business"))) segments.add("Professional occupiers");
  if ([...categories].some((category) => category.includes("education") || category.includes("healthcare"))) segments.add("Family and long-stay households");
  if ([...categories].some((category) => category.includes("airport"))) segments.add("International and frequent travellers");
  if ([...categories].some((category) => category.includes("retail") || category.includes("leisure") || category.includes("culture"))) segments.add("Lifestyle-led residents");
  if (/\b(?:villa|townhouse|family|golf|school)\b/.test(context)) segments.add("Owner-occupier and family demand");
  if (/\b(?:waterfront|beach|marina|resort|branded|luxury)\b/.test(context)) segments.add("Premium and second-home demand");
  if (!segments.size) segments.add("UAE residential occupiers");
  return [...segments].slice(0, 4);
}

function demographicContext(project: ReportProjectRecord): CommunityResearch["demographicContext"] {
  if (project.emirate !== "Dubai") return null;
  return {
    scope: "Dubai emirate-wide context, not a community estimate",
    display: "4,248,200 residents at end-2024",
    note: "Dubai Statistics Center reports 68.53% male and 31.47% female at emirate level. A building or community tenant profile requires a separate, current comparable-leasing sample.",
    sourceLabel: "Dubai Statistics Center, Population Bulletin 2024",
    sourceUrl: "https://www.dsc.gov.ae/Publication/Population%20Bulletin%20Emirate%20of%20Dubai%20-%202024.pdf",
  };
}

function rentalEvidence(project: ReportProjectRecord): CommunityResearch["rentalEvidence"] {
  if (project.emirate === "Dubai") {
    return {
      status: "Advisor input required before client use",
      note: "Validate the selected configuration against the Dubai Land Department Rental Index and recent registered Ejari contracts. The prefill is a planning scenario, not an achieved-rent claim.",
      indexLabel: "Dubai Land Department Rental Index",
      indexUrl: "https://dubailand.gov.ae/en/eservices/rental-index/",
      datasetLabel: "Dubai Pulse DLD rent contracts open data",
      datasetUrl: "https://gslb.dubaipulse.gov.ae/data/dld-registration/dld_rent_contracts-open",
    };
  }
  return {
    status: "Current comparable schedule required",
    note: `No live ${project.emirate} rent-contract series is embedded. Replace the planning scenario with dated, configuration-matched leasing evidence before presentation.`,
    indexLabel: "Advisor-confirmed rental evidence",
    indexUrl: "",
    datasetLabel: "Current leasing comparable schedule",
    datasetUrl: "",
  };
}

function paymentSchedule(plan: string, unitPrice: number) {
  const match = plan.match(/\b\d{1,3}(?:\s*\/\s*\d{1,3}){1,5}\b/);
  const percentages = match ? match[0].split("/").map((part) => Number(part.trim())) : [];
  if (percentages.length < 2 || percentages.some((value) => value <= 0 || value > 100) || percentages.reduce((sum, value) => sum + value, 0) !== 100) return [];
  return percentages.map((percentage, index) => ({
    label: percentages.length === 2
      ? (index === 0 ? "During construction" : "On handover")
      : index === 0
        ? "On booking"
        : index === percentages.length - 1
          ? "On handover"
          : `Construction stage ${index}`,
    percentage,
    amount: unitPrice * percentage / 100,
  }));
}

export function buildProjectResearch(project: ReportProjectRecord, selectedSlugs = new Set([project.slug])): CommunityResearch {
  const nearby = nearbyPlaces(project);
  const benchmark = getAreaPricePerSqft(project.area, project.propertyTypes, project.emirate);
  return {
    areaBenchmark: benchmark ? {
      value: benchmark.value,
      display: benchmark.display,
      label: benchmark.label,
      period: benchmark.period,
      sourceLabel: benchmark.sourceLabel,
      sourceUrl: benchmark.sourceUrl,
      note: benchmark.note,
    } : null,
    nearby,
    upcoming: upcomingProjects(project, selectedSlugs),
    demandSegments: demandSegments(project, nearby),
    demographicContext: demographicContext(project),
    rentalEvidence: rentalEvidence(project),
  };
}

function boundedScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function advisoryScreen(args: {
  priceVsAreaPercent: number | null;
  grossYield: number;
  effectiveNetYield: number;
  research: CommunityResearch;
  rentalEvidenceNotes: string;
}) {
  const { priceVsAreaPercent, grossYield, effectiveNetYield, research } = args;
  const valueScore = priceVsAreaPercent === null
    ? 50
    : boundedScore(80 - priceVsAreaPercent * 2);
  const incomeScore = boundedScore(25 + grossYield * 6 + effectiveNetYield * 4);
  const categoryCoverage = new Set(research.nearby.map((place) => place.category)).size;
  const averageDistance = research.nearby.length
    ? research.nearby.reduce((sum, place) => sum + place.distanceKm, 0) / research.nearby.length
    : 40;
  const accessScore = research.nearby.length
    ? boundedScore(48 + categoryCoverage * 10 + Math.max(0, 22 - averageDistance))
    : 25;
  const demandScore = boundedScore(45 + research.demandSegments.length * 11);
  const supplyScore = boundedScore(82 - research.upcoming.length * 7);
  const evidenceScore = boundedScore(
    (research.areaBenchmark ? 30 : 0)
    + (research.nearby.length ? 25 : 0)
    + (research.demographicContext ? 15 : 0)
    + (args.rentalEvidenceNotes.trim() ? 30 : 0),
  );
  const factors: AdvisoryScoreFactor[] = [
    {
      label: "Value versus area",
      weight: 25,
      score: valueScore,
      rationale: priceVsAreaPercent === null
        ? "No dated area AED/sqft benchmark is stored; neutral score applied."
        : `${Math.abs(priceVsAreaPercent).toFixed(1)}% ${priceVsAreaPercent <= 0 ? "below" : "above"} the stored area benchmark.`,
    },
    {
      label: "Rental return",
      weight: 25,
      score: incomeScore,
      rationale: `${percent(grossYield)} gross and ${percent(effectiveNetYield)} occupancy-adjusted net scenario.`,
    },
    {
      label: "Accessibility",
      weight: 20,
      score: accessScore,
      rationale: research.nearby.length
        ? `${categoryCoverage} establishment categories across ${research.nearby.length} coordinate-based proximity checks.`
        : "Project coordinates or destination coverage are not available.",
    },
    {
      label: "Demand depth",
      weight: 15,
      score: demandScore,
      rationale: `${research.demandSegments.length} potential demand segments identified from location and property context.`,
    },
    {
      label: "Supply balance",
      weight: 10,
      score: supplyScore,
      rationale: `${research.upcoming.length} indexed same-area or approximately 10 km pipeline records screened.`,
    },
    {
      label: "Evidence quality",
      weight: 5,
      score: evidenceScore,
      rationale: args.rentalEvidenceNotes.trim()
        ? "Advisor rental note, area pricing and location evidence included where available."
        : "Current rental comparable notes are still required.",
    },
  ];
  const total = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight / 100, 0));
  return {
    total,
    label: total >= 80 ? "Strong screen" : total >= 65 ? "Balanced screen" : total >= 50 ? "Selective review" : "Evidence or pricing review",
    statement: "Transparent advisory screen only. It is not a RERA valuation, lender valuation or return forecast.",
    factors,
  } satisfies AdvisoryScreen;
}

export function buildReportProjects(projects: ReportProjectRecord[], inputs: ConfirmedProjectInput[]) {
  const inputsBySlug = new Map(inputs.map((input) => [input.slug, input]));
  const selectedSlugs = new Set(projects.map((project) => project.slug));
  return projects.map((project): CuratedProjectSnapshot => {
    const input = inputsBySlug.get(project.slug);
    if (!input) throw new Error(`Confirmed unit facts are missing for ${project.name}.`);
    const unitPrice = number(input.unitPrice);
    const unitAreaSqft = number(input.unitAreaSqft);
    const annualRent = number(input.annualRent);
    const annualRentLow = number(input.annualRentLow);
    const annualRentHigh = number(input.annualRentHigh);
    const occupancyRate = Math.max(0, Math.min(100, number(input.occupancyRate)));
    const effectiveAnnualRent = annualRent * occupancyRate / 100;
    const serviceChargePerSqft = number(input.serviceChargePerSqft);
    const annualServiceCharge = unitAreaSqft * serviceChargePerSqft;
    const otherAnnualCosts = number(input.otherAnnualCosts);
    const acquisitionCosts = number(input.acquisitionCosts);
    const allInCost = unitPrice + acquisitionCosts;
    const netAnnualIncome = annualRent - annualServiceCharge - otherAnnualCosts;
    const effectiveNetAnnualIncome = effectiveAnnualRent - annualServiceCharge - otherAnnualCosts;
    const unitPricePerSqft = unitAreaSqft > 0 ? unitPrice / unitAreaSqft : 0;
    const annualRentPerSqft = unitAreaSqft > 0 ? annualRent / unitAreaSqft : 0;
    const grossYield = unitPrice > 0 ? annualRent / unitPrice * 100 : 0;
    const netYield = allInCost > 0 ? netAnnualIncome / allInCost * 100 : 0;
    const effectiveNetYield = allInCost > 0 ? effectiveNetAnnualIncome / allInCost * 100 : 0;
    const research = buildProjectResearch(project, selectedSlugs);
    const benchmark = research.areaBenchmark;
    const priceVsAreaPercent = benchmark?.value && unitPricePerSqft
      ? (unitPricePerSqft - benchmark.value) / benchmark.value * 100
      : null;
    const rawStartingPrice = number(project.startingPrice.replace(/[^\d.]/g, ""));
    const rentalEvidenceNotes = cleanText(input.rentalEvidenceNotes, 600);
    return {
      slug: project.slug,
      name: project.name,
      developer: project.developer,
      location: project.area,
      emirate: project.emirate,
      startingPrice: rawStartingPrice > 0 ? money(rawStartingPrice) : "On request",
      paymentPlan: project.paymentPlan || "On request",
      handover: project.handover || "To be confirmed",
      pricePerSqft: unitPricePerSqft > 0 ? `AED ${Math.round(unitPricePerSqft).toLocaleString("en-AE")}/sqft` : "Not confirmed",
      residences: project.propertyTypes.join(", ") || "Residential",
      bedrooms: project.bedrooms.join(", ") || "Confirm configuration",
      positioning: project.lifestyles.join(", ") || `${project.emirate} real estate`,
      imageUrl: project.image || "",
      coordinates: project.coordinates || "",
      paymentSchedule: paymentSchedule(project.paymentPlan || "", unitPrice),
      unitReference: cleanText(input.unitReference, 80) || "Selected unit",
      bedroom: cleanText(input.bedroom, 40) || "Selected configuration",
      unitPrice,
      unitAreaSqft,
      annualRent,
      annualRentLow,
      annualRentHigh,
      occupancyRate,
      effectiveAnnualRent,
      serviceChargePerSqft,
      annualServiceCharge,
      otherAnnualCosts,
      acquisitionCosts,
      allInCost,
      netAnnualIncome,
      effectiveNetAnnualIncome,
      unitPricePerSqft,
      annualRentPerSqft,
      grossYield,
      netYield,
      effectiveNetYield,
      areaBenchmark: benchmark ? {
        value: benchmark.value,
        display: benchmark.display,
        label: benchmark.label,
        period: benchmark.period,
        sourceLabel: benchmark.sourceLabel,
        sourceUrl: benchmark.sourceUrl,
        note: benchmark.note,
      } : null,
      priceVsAreaPercent,
      nearby: research.nearby,
      upcoming: research.upcoming,
      demandSegments: research.demandSegments,
      demographicContext: research.demographicContext,
      rentalEvidence: research.rentalEvidence,
      rentalEvidenceNotes,
      advisoryScreen: advisoryScreen({
        priceVsAreaPercent,
        grossYield,
        effectiveNetYield,
        research,
        rentalEvidenceNotes,
      }),
      confirmationNotes: cleanText(input.confirmationNotes, 600),
    };
  });
}

function marketContext(projects: CuratedProjectSnapshot[]) {
  const lead = projects[0];
  const isDubai = lead?.emirate === "Dubai";
  const localPipeline = projects.reduce((total, project) => total + project.upcoming.length, 0);
  const benchmark = lead?.areaBenchmark;
  const priceChart: ReportChart | null = lead && benchmark && lead.unitPricePerSqft > 0 ? {
    title: "Selected unit versus area benchmark",
    subtitle: `${lead.location} - ${benchmark.period}`,
    unit: "AED per sqft",
    kind: "bars",
    data: [
      { label: "Selected unit", value: Math.round(lead.unitPricePerSqft), display: Math.round(lead.unitPricePerSqft).toLocaleString("en-AE") },
      { label: benchmark.label, value: benchmark.value, display: benchmark.value.toLocaleString("en-AE") },
    ],
    sourceLabel: `${benchmark.sourceLabel}; agent-confirmed unit price and area`,
    sourceUrl: benchmark.sourceUrl,
  } : null;
  const charts: ReportChart[] = [];
  if (isDubai) {
    charts.push(
      {
        title: "Residential sales value",
        subtitle: "Q1 year-on-year comparison",
        unit: "AED billions",
        kind: "columns",
        data: [
          { label: "Q1 2025", value: 117.1, display: "117.1bn" },
          { label: "Q1 2026", value: 143.1, display: "143.1bn" },
        ],
        sourceLabel: "Dubai residential market research, Q1 2026",
        sourceUrl: "https://www.engelvoelkers.com/ae/en/research/residential-market-report-q1-2026",
      },
      {
        title: "Monthly transaction momentum",
        subtitle: "Q1 2026 residential sales",
        unit: "Transactions",
        kind: "columns",
        data: [
          { label: "Jan-Feb avg.", value: 16100, display: "16.1k" },
          { label: "March", value: 12900, display: "12.9k" },
        ],
        sourceLabel: "Emirates NBD Research",
        sourceUrl: "https://www.emiratesnbdresearch.com/en/articles/dubai-residential-review-q1-2026?category=fx-forecasts",
      },
    );
  }
  if (priceChart) charts.push(priceChart);
  return {
    scope: isDubai ? "Dubai residential market with selected-area pricing" : `${lead?.emirate || "UAE"} and selected-area pricing`,
    period: isDubai ? "Latest confirmed research through H1 2026" : benchmark?.period || "Current confirmed project index",
    headline: isDubai ? [
      { label: "H1 2026 residential sales", display: "79,281", note: "Dubai-wide completed and off-plan sales" },
      { label: "H1 2026 sales value", display: "AED 221.4bn", note: "Dubai-wide residential value" },
      { label: "Average gross rental yield", display: "6.58%", note: "Dubai residential market average" },
      { label: "Q1 2026 rental contracts", display: "AED 32.2bn", note: "Dubai-wide rental-contract value" },
    ] : [
      { label: "Selected emirate", display: lead?.emirate || "UAE", note: "Market scope for this brief" },
      { label: benchmark?.label || "Area benchmark", display: benchmark?.display || "Not published", note: benchmark?.period || "Requires current comparable set" },
      { label: "Nearby indexed pipeline", display: String(localPipeline), note: "Distinct nearby or same-area project records reviewed" },
    ],
    charts,
    sources: [
      ...(isDubai ? [
        { label: "Dubai Land Department Rental Index", url: "https://dubailand.gov.ae/en/eservices/rental-index/" },
        { label: "Dubai Land Department Q1 2026 rental-market release", url: "https://dubailand.gov.ae/en/news-media/dubai-s-rental-market-charts-stable-trajectory-reflecting-integrated-regulatory-environment-and-sustained-public-confidence/" },
        { label: "Dubai Pulse DLD rent contracts open data", url: "https://gslb.dubaipulse.gov.ae/data/dld-registration/dld_rent_contracts-open" },
        { label: "Dubai Statistics Center Population Bulletin 2024", url: "https://www.dsc.gov.ae/Publication/Population%20Bulletin%20Emirate%20of%20Dubai%20-%202024.pdf" },
        { label: "Dubai housing market H1 2026", url: "https://www.engelvoelkers.com/ae/en/resources/dubai-housing-market" },
        { label: "Emirates NBD Dubai Residential Review Q1 2026", url: "https://www.emiratesnbdresearch.com/en/articles/dubai-residential-review-q1-2026?category=fx-forecasts" },
      ] : []),
      ...(benchmark?.sourceUrl ? [{ label: benchmark.sourceLabel, url: benchmark.sourceUrl }] : []),
      { label: "UAE Government Golden Visa guidance", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa" },
      { label: `HAUS & GRACE UAE project index - ${registry.totalUaeProjects.toLocaleString("en-AE")} records`, url: "" },
    ],
  };
}

export function buildCuratedBriefContent(args: {
  projects: CuratedProjectSnapshot[];
  brief: string;
  narrative: Partial<AiBriefNarrative>;
  advisor: AdvisorSnapshot;
  confirmedAt: string;
}) {
  const lead = args.projects[0];
  const fallbackSummary = `This curated brief reviews ${args.projects.length} confirmed ${args.projects.length === 1 ? "opportunity" : "opportunities"} against the client's stated objective. Unit pricing, area, rent and recurring costs have been entered and confirmed by the advisor; projected returns remain scenarios rather than guarantees.`;
  const fallbackRecommendation = lead
    ? `${lead.name} should be evaluated against the client's holding period, cash-flow plan and tolerance for completion and leasing risk. The selected unit models a gross yield of ${percent(lead.grossYield)}, an occupancy-adjusted net scenario of ${percent(lead.effectiveNetYield)} and a transparent investment-fit screen of ${lead.advisoryScreen.total}/100.`
    : "Proceed only after unit-level pricing, area, costs and availability have been reconfirmed.";
  return {
    executiveSummary: cleanText(args.narrative.executiveSummary, 5_000) || fallbackSummary,
    recommendation: cleanText(args.narrative.recommendation, 5_000) || fallbackRecommendation,
    marketPosition: cleanText(args.narrative.marketPosition, 4_000) || "The selected unit should be read against its area AED/sqft benchmark, current competing pipeline and the depth of the eventual rental and resale market.",
    locationStory: cleanText(args.narrative.locationStory, 4_000) || "Accessibility is presented as approximate distance from the published project coordinates. Driving time and route quality should be checked at the intended travel time.",
    riskNotes: Array.isArray(args.narrative.riskNotes)
      ? args.narrative.riskNotes.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 6)
      : [
          "Returns depend on achieved rent, occupancy, operating costs and the selected exit date.",
          "Future supply can affect leasing velocity and resale competition.",
          "Developer statements, unit availability and payment dates require final documentary verification.",
        ],
    advisoryScope: [
      "Confirm live inventory, exact unit price, net saleable area, layout and orientation.",
      "Review the dated payment schedule, registration charges, finance timing and full acquisition cost.",
      "Benchmark achieved rents, current Rental Index output, recent registered leasing evidence, comparable sales, service charges and directly competing handovers.",
      "Coordinate reservation, documentation, snagging, handover and leasing strategy.",
    ],
    nextSteps: [
      "Request the current unit statement, floor plan and payment schedule.",
      "Recheck comparable sales and rent evidence immediately before reservation.",
      "Review the SPA, escrow and project-registration position with the appropriate specialists.",
      "Confirm the ownership-cost and exit scenario against the client's full portfolio.",
    ],
    projects: args.projects,
    notes: cleanText(args.brief, 3_000),
    preparedAt: args.confirmedAt,
    advisor: args.advisor,
    confirmation: {
      confirmedAt: args.confirmedAt,
      confirmedBy: args.advisor.email,
      statement: "The advisor confirmed the entered unit price, area, expected rent and sensitivity range, occupancy assumption, rental-evidence note, service-charge input, other annual costs and acquisition-cost estimate before generation.",
    },
    marketContext: marketContext(args.projects),
    residencyGuidance: {
      title: "UAE Golden Visa property pathway",
      threshold: "Published property-investment threshold: AED 2 million",
      status: args.projects.some((project) => project.unitPrice >= 2_000_000)
        ? "At least one selected unit price meets the published value threshold."
        : `The highest selected unit price is ${money(Math.max(0, ...args.projects.map((project) => project.unitPrice)))}; additional qualifying property value may be required.`,
      summary: "Official UAE guidance describes a five-year renewable Golden Visa route for qualifying real-estate investors at a minimum property investment of AED 2 million. Eligibility is not automatic: ownership, valuation, financing and documentary requirements must be checked with ICP or the relevant emirate authority before reservation.",
      sourceLabel: "The Official Platform of the UAE Government, updated 26 February 2026",
      sourceUrl: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa",
    },
  } satisfies CuratedBriefContent;
}

function ascii(value: string) {
  return String(value || "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, " ");
}

function wrapText(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of ascii(text).split(/\n+/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (!words.length) lines.push("");
  }
  return lines;
}

function drawWrapped(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  width: number,
  color = rgb(0.18, 0.18, 0.16),
  lineHeight = size * 1.4,
  maxLines = 100,
) {
  const lines = wrapText(text, font, size, width).slice(0, maxLines);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

async function readBounded(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes || !response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return bytes;
}

async function fetchProjectJpeg(env: ReportEnv, sourceUrl: string) {
  if (!env.IMAGES || !sourceUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !IMAGE_HOSTS.test(parsed.hostname)) return null;
  try {
    const source = await fetch(parsed.toString(), {
      headers: { accept: "image/avif,image/webp,image/jpeg,image/png" },
      redirect: "follow",
    });
    if (!source.ok || !source.body) return null;
    const declared = Number(source.headers.get("content-length") || 0);
    if (declared > 20_000_000) return null;
    const result = await env.IMAGES
      .input(source.body)
      .transform({ width: 1400, height: 840, fit: "cover" })
      .output({ format: "image/jpeg", quality: 82, anim: false });
    const response = result.response();
    if (!response.ok) return null;
    return await readBounded(response, MAX_IMAGE_BYTES);
  } catch (error) {
    console.error(JSON.stringify({
      event: "curated_brief_image_failed",
      host: parsed.hostname,
      message: error instanceof Error ? error.message.slice(0, 240) : "image transformation failed",
    }));
    return null;
  }
}

function drawImageOrGraphic(
  page: PDFPage,
  image: PDFImage | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  ink: ReturnType<typeof rgb>,
  gold: ReturnType<typeof rgb>,
) {
  if (image) {
    page.drawImage(image, { x, y, width, height });
    return;
  }
  page.drawRectangle({ x, y, width, height, color: ink });
  page.drawCircle({ x: x + width * .76, y: y + height * .46, size: height * .33, borderColor: gold, borderWidth: .8 });
  page.drawCircle({ x: x + width * .76, y: y + height * .46, size: height * .19, borderColor: gold, borderWidth: .5 });
  for (let index = 0; index < 9; index += 1) {
    const lineX = x + width * .12 + index * width * .065;
    page.drawLine({ start: { x: lineX, y: y + height * .12 }, end: { x: lineX + width * .05, y: y + height * .8 }, thickness: .35, color: gold, opacity: .65 });
  }
}

function drawMetricCard(
  page: PDFPage,
  label: string,
  value: string,
  note: string,
  x: number,
  y: number,
  width: number,
  height: number,
  regular: PDFFont,
  bold: PDFFont,
  colors: { ink: ReturnType<typeof rgb>; gold: ReturnType<typeof rgb>; muted: ReturnType<typeof rgb>; shell: ReturnType<typeof rgb> },
) {
  page.drawRectangle({ x, y, width, height, color: colors.shell, borderColor: rgb(.8, .76, .67), borderWidth: .5 });
  page.drawText(ascii(label).toUpperCase(), { x: x + 13, y: y + height - 19, size: 6.2, font: bold, color: colors.gold });
  drawWrapped(page, value, bold, 14, x + 13, y + height - 42, width - 26, colors.ink, 16, 2);
  drawWrapped(page, note, regular, 6.7, x + 13, y + 17, width - 26, colors.muted, 8.5, 2);
}

function drawChart(
  page: PDFPage,
  chart: ReportChart,
  x: number,
  y: number,
  width: number,
  height: number,
  regular: PDFFont,
  bold: PDFFont,
  colors: { ink: ReturnType<typeof rgb>; gold: ReturnType<typeof rgb>; muted: ReturnType<typeof rgb>; shell: ReturnType<typeof rgb> },
) {
  page.drawRectangle({ x, y, width, height, color: colors.shell, borderColor: rgb(.8, .76, .67), borderWidth: .5 });
  page.drawText(ascii(chart.title).slice(0, 52), { x: x + 16, y: y + height - 25, size: 10, font: bold, color: colors.ink });
  page.drawText(ascii(chart.subtitle).slice(0, 70), { x: x + 16, y: y + height - 39, size: 6.5, font: regular, color: colors.muted });
  const chartX = x + 18;
  const chartY = y + 48;
  const chartWidth = width - 36;
  const chartHeight = height - 104;
  const max = Math.max(...chart.data.map((item) => Math.max(0, item.value)), 1);
  if (chart.kind === "columns") {
    const gap = 12;
    const barWidth = Math.min(58, (chartWidth - gap * (chart.data.length - 1)) / chart.data.length);
    const totalWidth = barWidth * chart.data.length + gap * (chart.data.length - 1);
    const startX = chartX + (chartWidth - totalWidth) / 2;
    chart.data.forEach((item, index) => {
      const barHeight = Math.max(3, Math.max(0, item.value) / max * chartHeight);
      const barX = startX + index * (barWidth + gap);
      page.drawRectangle({ x: barX, y: chartY, width: barWidth, height: barHeight, color: index === chart.data.length - 1 ? colors.gold : colors.ink });
      page.drawText(ascii(item.display), { x: barX, y: chartY + barHeight + 7, size: 7, font: bold, color: colors.ink });
      drawWrapped(page, item.label, regular, 5.8, barX, chartY - 12, barWidth + 5, colors.muted, 7, 2);
    });
  } else {
    const rowHeight = chartHeight / Math.max(1, chart.data.length);
    chart.data.forEach((item, index) => {
      const rowY = chartY + chartHeight - (index + 1) * rowHeight + 7;
      const labelWidth = 82;
      const barWidth = Math.max(3, Math.max(0, item.value) / max * (chartWidth - labelWidth - 10));
      drawWrapped(page, item.label, regular, 5.8, chartX, rowY + 4, labelWidth - 5, colors.muted, 7, 2);
      page.drawRectangle({ x: chartX + labelWidth, y: rowY, width: barWidth, height: 12, color: index === 0 ? colors.gold : colors.ink });
      page.drawText(ascii(item.display), { x: chartX + labelWidth + 5, y: rowY + 3, size: 5.8, font: bold, color: rgb(1, 1, 1) });
    });
  }
  page.drawText(ascii(chart.sourceLabel).slice(0, 90), { x: x + 16, y: y + 17, size: 5.7, font: regular, color: colors.muted });
}

export async function renderCuratedBriefPdf(document: CuratedBriefDocument, env: ReportEnv) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const colors = {
    gold: rgb(0.76, 0.59, 0.25),
    ink: rgb(0.075, 0.078, 0.07),
    muted: rgb(0.39, 0.38, 0.35),
    paper: rgb(0.985, 0.975, 0.945),
    shell: rgb(0.94, 0.91, 0.85),
    white: rgb(1, 1, 1),
    green: rgb(0.25, 0.42, 0.29),
  };
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 46;
  const content = document.content;
  const projects = content.projects || [];
  const images = new Map<string, PDFImage>();
  const fetched = await Promise.all(projects.map(async (project) => ({
    slug: project.slug,
    bytes: await fetchProjectJpeg(env, project.imageUrl),
  })));
  for (const item of fetched) {
    if (!item.bytes) continue;
    try {
      images.set(item.slug, await pdf.embedJpg(item.bytes));
    } catch {
      // Keep the geometric fallback if an origin returned invalid image bytes.
    }
  }

  const totalPages = 6 + projects.length * 3;
  const projectStart = 5;
  const recommendationPage = projectStart + projects.length * 3;
  const appendixPage = recommendationPage + 1;
  let pageNumber = 0;

  const addPage = (eyebrow: string, title: string) => {
    const page = pdf.addPage(pageSize);
    pageNumber += 1;
    page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: colors.paper });
    page.drawText("HAUS & GRACE", { x: margin, y: 797, size: 15, font: bold, color: colors.gold });
    page.drawText("P R O P E R T I E S", { x: margin, y: 784, size: 5.8, font: bold, color: colors.ink });
    page.drawText("CURATED CLIENT BRIEF", { x: pageSize[0] - margin - 112, y: 790, size: 6.2, font: bold, color: colors.muted });
    page.drawLine({ start: { x: margin, y: 766 }, end: { x: pageSize[0] - margin, y: 766 }, thickness: .8, color: colors.gold });
    page.drawText(ascii(eyebrow).toUpperCase(), { x: margin, y: 734, size: 6.7, font: bold, color: colors.gold });
    drawWrapped(page, title, bold, 23, margin, 707, pageSize[0] - margin * 2, colors.ink, 27, 2);
    return page;
  };

  const addFooter = (page: PDFPage) => {
    page.drawLine({ start: { x: margin, y: 44 }, end: { x: pageSize[0] - margin, y: 44 }, thickness: .45, color: rgb(.75, .7, .6) });
    const advisorLine = `${content.advisor?.name || "HAUS & GRACE Advisor"} | ${content.advisor?.phone || content.advisor?.email || ""}`;
    page.drawText(ascii(advisorLine).slice(0, 82), { x: margin, y: 27, size: 6.2, font: regular, color: colors.muted });
    page.drawText(`${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, { x: pageSize[0] - margin - 34, y: 27, size: 6.2, font: bold, color: colors.gold });
  };

  // Cover
  let page = pdf.addPage(pageSize);
  pageNumber += 1;
  const comparisonCover = document.type === "comparison";
  page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: colors.ink });
  drawImageOrGraphic(page, comparisonCover ? undefined : images.get(projects[0]?.slug), 0, 356, pageSize[0], 486, colors.ink, colors.gold);
  page.drawRectangle({ x: 0, y: 356, width: pageSize[0], height: 486, color: colors.ink, opacity: comparisonCover ? .08 : .26 });
  if (comparisonCover) {
    page.drawText("PROJECT COMPARISON", { x: margin, y: 703, size: 7, font: bold, color: colors.gold });
    projects.slice(0, 6).forEach((project, index) => {
      const projectY = 657 - index * 42;
      page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y: projectY, size: 6.2, font: bold, color: colors.gold });
      page.drawText(ascii(project.name).slice(0, 54), { x: margin + 30, y: projectY, size: 12, font: regular, color: colors.white });
      page.drawText(`${ascii(project.developer)} | ${ascii(project.location)}`.slice(0, 72), { x: margin + 30, y: projectY - 13, size: 5.8, font: regular, color: rgb(.68, .67, .63) });
    });
  }
  page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: 362, color: colors.ink });
  page.drawText("HAUS & GRACE", { x: margin, y: 795, size: 18, font: bold, color: colors.gold });
  page.drawText("P R O P E R T I E S", { x: margin, y: 779, size: 6.5, font: bold, color: colors.white });
  page.drawLine({ start: { x: margin, y: 326 }, end: { x: margin + 58, y: 326 }, thickness: 1.2, color: colors.gold });
  page.drawText(comparisonCover ? "CURATED PROJECT COMPARISON" : "CURATED CLIENT BRIEF", { x: margin, y: 306, size: 7.2, font: bold, color: colors.gold });
  const coverBottom = drawWrapped(page, document.title, bold, 28, margin, 272, pageSize[0] - margin * 2, colors.white, 32, 3);
  page.drawText(`Prepared for ${ascii(document.client_name)}`, { x: margin, y: coverBottom - 8, size: 11, font: regular, color: rgb(.84, .82, .77) });
  page.drawText(`Prepared by ${ascii(content.advisor?.name || "HAUS & GRACE Advisor")}`, { x: margin, y: 94, size: 8, font: bold, color: colors.white });
  page.drawText(ascii(content.advisor?.title || "Property Advisor"), { x: margin, y: 79, size: 7, font: regular, color: colors.gold });
  page.drawText(ascii(content.advisor?.phone || ""), { x: margin, y: 64, size: 7, font: regular, color: rgb(.82, .8, .75) });
  page.drawText(ascii(content.advisor?.email || ""), { x: margin, y: 51, size: 7, font: regular, color: rgb(.82, .8, .75) });
  page.drawText(new Date(content.preparedAt || document.created_at).toLocaleDateString("en-AE", { day: "2-digit", month: "long", year: "numeric" }), { x: pageSize[0] - margin - 105, y: 51, size: 7, font: regular, color: colors.gold });

  // Contents
  page = addPage("Document map", "Contents");
  const contents = [
    ["Investment overview", 3],
    ["Market transaction context", 4],
    ...projects.map((project, index) => [
      `${project.name} - unit, rental and community analysis`,
      `${String(projectStart + index * 3).padStart(2, "0")}-${String(projectStart + index * 3 + 2).padStart(2, "0")}`,
    ]),
    ["Advisor recommendation and next actions", recommendationPage],
    ["Confirmation record, methodology and sources", appendixPage],
  ] as Array<[string, string | number]>;
  let contentsY = 650;
  contents.forEach(([label, numberLabel], index) => {
    const rowHeight = projects.length > 4 ? 31 : 37;
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y: contentsY, size: 7, font: bold, color: colors.gold });
    page.drawText(ascii(label).slice(0, 67), { x: margin + 34, y: contentsY, size: 9.2, font: regular, color: colors.ink });
    page.drawLine({ start: { x: margin + 34, y: contentsY - 8 }, end: { x: pageSize[0] - margin - 30, y: contentsY - 8 }, thickness: .35, color: rgb(.78, .74, .66) });
    page.drawText(typeof numberLabel === "number" ? String(numberLabel).padStart(2, "0") : numberLabel, { x: pageSize[0] - margin - 22, y: contentsY, size: 7, font: bold, color: colors.gold });
    contentsY -= rowHeight;
  });
  page.drawRectangle({ x: margin, y: 92, width: pageSize[0] - margin * 2, height: 86, color: colors.ink });
  page.drawText("CONFIRMED BEFORE GENERATION", { x: margin + 18, y: 151, size: 6.5, font: bold, color: colors.gold });
  drawWrapped(page, content.confirmation?.statement || "Unit inputs were confirmed by the advisor before generation.", regular, 8, margin + 18, 131, pageSize[0] - margin * 2 - 36, colors.white, 11, 4);
  addFooter(page);

  // Executive overview
  page = addPage("Client decision frame", "Investment overview");
  let y = drawWrapped(page, content.executiveSummary, regular, 10.2, margin, 655, pageSize[0] - margin * 2, colors.ink, 15, 9);
  y -= 22;
  const lead = projects[0];
  const overviewMetrics = lead ? [
    ["Confirmed unit price", money(lead.unitPrice), lead.unitReference],
    ["Unit AED per sqft", `AED ${Math.round(lead.unitPricePerSqft).toLocaleString("en-AE")}`, `${Math.round(lead.unitAreaSqft).toLocaleString("en-AE")} sqft`],
    ["Gross yield scenario", percent(lead.grossYield), `${money(lead.annualRent)} expected annual rent`],
    ["Net yield scenario", percent(lead.netYield), "After entered recurring and acquisition costs"],
  ] : [];
  overviewMetrics.forEach(([label, value, note], index) => {
    const cardWidth = 239;
    const x = margin + (index % 2) * 251;
    const cardY = y - Math.floor(index / 2) * 102 - 84;
    drawMetricCard(page, label, value, note, x, cardY, cardWidth, 84, regular, bold, colors);
  });
  y -= 220;
  page.drawText("SHORTLIST AT A GLANCE", { x: margin, y, size: 6.5, font: bold, color: colors.gold });
  y -= 22;
  projects.forEach((project, index) => {
    const rowHeight = 48;
    page.drawRectangle({ x: margin, y: y - rowHeight + 7, width: pageSize[0] - margin * 2, height: rowHeight, color: index % 2 ? colors.paper : colors.shell });
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin + 10, y: y - 12, size: 7, font: bold, color: colors.gold });
    page.drawText(ascii(project.name).slice(0, 42), { x: margin + 38, y: y - 9, size: 9, font: bold, color: colors.ink });
    page.drawText(`${ascii(project.location)} | ${ascii(project.handover)}`.slice(0, 62), { x: margin + 38, y: y - 23, size: 6.3, font: regular, color: colors.muted });
    page.drawText(percent(project.netYield), { x: pageSize[0] - margin - 58, y: y - 11, size: 9, font: bold, color: project.netYield >= 0 ? colors.green : rgb(.6, .2, .18) });
    page.drawText("NET SCENARIO", { x: pageSize[0] - margin - 58, y: y - 24, size: 5.2, font: bold, color: colors.muted });
    y -= rowHeight;
  });
  addFooter(page);

  // Market context
  page = addPage("Evidence layer", "Market transaction context");
  const headline = content.marketContext?.headline || [];
  const headlineWidth = (pageSize[0] - margin * 2 - 18) / Math.max(1, Math.min(4, headline.length));
  headline.slice(0, 4).forEach((item, index) => {
    drawMetricCard(page, item.label, item.display, item.note, margin + index * (headlineWidth + 6), 594, headlineWidth, 86, regular, bold, colors);
  });
  const charts = content.marketContext?.charts || [];
  if (charts[0]) drawChart(page, charts[0], margin, 330, 239, 235, regular, bold, colors);
  if (charts[1]) drawChart(page, charts[1], margin + 251, 330, 239, 235, regular, bold, colors);
  if (charts[2]) drawChart(page, charts[2], margin, 92, 490, 210, regular, bold, colors);
  if (!charts.length) {
    page.drawRectangle({ x: margin, y: 260, width: pageSize[0] - margin * 2, height: 260, color: colors.shell });
    page.drawText("NO VERIFIED TRANSACTION SERIES STORED FOR THIS EMIRATE", { x: margin + 24, y: 475, size: 7, font: bold, color: colors.gold });
    drawWrapped(page, "The brief therefore uses confirmed unit economics, the available area AED/sqft benchmark and the nearby indexed project pipeline. A current comparable-transactions schedule should be attached before reservation.", regular, 10, margin + 24, 445, pageSize[0] - margin * 2 - 48, colors.ink, 15, 8);
  }
  addFooter(page);

  // Three pages per selected project: economics, location and community/rental evidence.
  projects.forEach((project, projectIndex) => {
    page = addPage(`Opportunity ${String(projectIndex + 1).padStart(2, "0")}`, project.name);
    drawImageOrGraphic(page, images.get(project.slug), margin, 424, pageSize[0] - margin * 2, 250, colors.ink, colors.gold);
    page.drawRectangle({ x: margin, y: 424, width: pageSize[0] - margin * 2, height: 55, color: colors.ink, opacity: .84 });
    page.drawText(`${ascii(project.developer)} | ${ascii(project.location)}`.slice(0, 82), { x: margin + 15, y: 448, size: 7.5, font: bold, color: colors.white });
    page.drawText(`${ascii(project.unitReference)} | ${ascii(project.handover)}`.slice(0, 72), { x: margin + 15, y: 433, size: 6.3, font: regular, color: colors.gold });
    const cards = [
      ["Unit price", money(project.unitPrice), project.paymentPlan],
      ["Price per sqft", `AED ${Math.round(project.unitPricePerSqft).toLocaleString("en-AE")}`, `${Math.round(project.unitAreaSqft).toLocaleString("en-AE")} sqft`],
      ["Gross yield", percent(project.grossYield), `${money(project.annualRent)} annual rent`],
      ["Net yield", percent(project.netYield), `${money(project.netAnnualIncome)} net annual income`],
    ];
    cards.forEach(([label, value, note], index) => {
      drawMetricCard(page, label, value, note, margin + (index % 2) * 251, 312 - Math.floor(index / 2) * 96, 239, 80, regular, bold, colors);
    });
    page.drawText("PAYMENT SCHEDULE", { x: margin, y: 197, size: 6.5, font: bold, color: colors.gold });
    if (project.paymentSchedule.length) {
      project.paymentSchedule.slice(0, 5).forEach((item, index) => {
        const rowY = 174 - index * 25;
        page.drawLine({ start: { x: margin, y: rowY - 7 }, end: { x: margin + 232, y: rowY - 7 }, thickness: .35, color: rgb(.78, .74, .66) });
        page.drawText(`${item.percentage}% ${ascii(item.label).toUpperCase()}`.slice(0, 32), { x: margin, y: rowY, size: 5.5, font: bold, color: colors.muted });
        page.drawText(money(item.amount), { x: margin + 142, y: rowY, size: 6.8, font: bold, color: colors.ink });
      });
    } else {
      drawWrapped(page, "The published payment split is not structured enough to calculate. Confirm the current developer schedule.", regular, 7, margin, 174, 225, colors.muted, 10, 5);
    }
    page.drawText("OWNERSHIP COST MODEL", { x: margin + 251, y: 197, size: 6.5, font: bold, color: colors.gold });
    const costRows = [
      ["Annual service charge", money(project.annualServiceCharge)],
      ["Other annual costs", money(project.otherAnnualCosts)],
      ["One-time acquisition costs", money(project.acquisitionCosts)],
      ["All-in acquisition basis", money(project.allInCost)],
    ];
    costRows.forEach(([label, value], index) => {
      const rowY = 174 - index * 25;
      page.drawLine({ start: { x: margin + 251, y: rowY - 7 }, end: { x: pageSize[0] - margin, y: rowY - 7 }, thickness: .35, color: rgb(.78, .74, .66) });
      page.drawText(label.toUpperCase(), { x: margin + 251, y: rowY, size: 5.5, font: bold, color: colors.muted });
      page.drawText(value, { x: pageSize[0] - margin - 92, y: rowY, size: 6.8, font: bold, color: colors.ink });
    });
    addFooter(page);

    page = addPage("Location intelligence", `${project.location}: access and pipeline`);
    page.drawText("ACCESSIBILITY", { x: margin, y: 658, size: 6.5, font: bold, color: colors.gold });
    if (project.nearby.length) {
      project.nearby.forEach((place, index) => {
        const rowY = 628 - index * 47;
        page.drawCircle({ x: margin + 9, y: rowY + 3, size: 8, color: index === 0 ? colors.gold : colors.ink });
        page.drawText(String(index + 1), { x: margin + 7, y: rowY, size: 5.5, font: bold, color: colors.white });
        page.drawText(ascii(place.name).slice(0, 48), { x: margin + 30, y: rowY + 5, size: 8.5, font: bold, color: colors.ink });
        page.drawText(`${ascii(place.category)} | approx. ${place.distanceKm.toFixed(1)} km`, { x: margin + 30, y: rowY - 9, size: 6.2, font: regular, color: colors.muted });
        const barWidth = Math.max(18, Math.min(205, 205 * (1 - Math.min(place.distanceKm, 40) / 45)));
        page.drawRectangle({ x: 330, y: rowY - 3, width: barWidth, height: 5, color: index === 0 ? colors.gold : rgb(.3, .31, .28) });
      });
    } else {
      drawWrapped(page, "Published coordinates are not available for this project. Drive times and nearby establishments must be confirmed manually before the brief is sent.", regular, 9.5, margin, 625, pageSize[0] - margin * 2, colors.muted, 14, 5);
    }
    page.drawText("UPCOMING SUPPLY IN THE SAME AREA OR APPROXIMATELY 10 KM", { x: margin, y: 365, size: 6.5, font: bold, color: colors.gold });
    if (project.upcoming.length) {
      project.upcoming.forEach((item, index) => {
        const rowY = 334 - index * 43;
        page.drawRectangle({ x: margin, y: rowY - 24, width: pageSize[0] - margin * 2, height: 37, color: index % 2 ? colors.paper : colors.shell });
        page.drawText(ascii(item.name).slice(0, 43), { x: margin + 12, y: rowY, size: 8, font: bold, color: colors.ink });
        page.drawText(`${ascii(item.developer)} | ${ascii(item.handover)}`.slice(0, 50), { x: margin + 12, y: rowY - 12, size: 6, font: regular, color: colors.muted });
        page.drawText(item.distanceKm === null ? "SAME AREA" : `APPROX. ${item.distanceKm.toFixed(1)} KM`, { x: pageSize[0] - margin - 78, y: rowY - 4, size: 5.8, font: bold, color: colors.gold });
      });
    } else {
      drawWrapped(page, "No distinct upcoming project record matched the same-area or 10 km screen in the current HAUS & GRACE index. This does not prove that no other supply exists.", regular, 9.5, margin, 330, pageSize[0] - margin * 2, colors.muted, 14, 5);
    }
    const comparisonChart: ReportChart = {
      title: "Unit pricing position",
      subtitle: project.areaBenchmark ? `${project.areaBenchmark.label} - ${project.areaBenchmark.period}` : "No published area benchmark stored",
      unit: "AED per sqft",
      kind: "bars",
      data: project.areaBenchmark ? [
        { label: "Selected unit", value: Math.round(project.unitPricePerSqft), display: Math.round(project.unitPricePerSqft).toLocaleString("en-AE") },
        { label: project.areaBenchmark.label, value: project.areaBenchmark.value, display: project.areaBenchmark.value.toLocaleString("en-AE") },
      ] : [{ label: "Selected unit", value: Math.round(project.unitPricePerSqft), display: Math.round(project.unitPricePerSqft).toLocaleString("en-AE") }],
      sourceLabel: project.areaBenchmark?.sourceLabel || "Agent-confirmed unit inputs",
      sourceUrl: project.areaBenchmark?.sourceUrl || "",
    };
    drawChart(page, comparisonChart, margin, 72, pageSize[0] - margin * 2, 150, regular, bold, colors);
    addFooter(page);

    page = addPage("Advisory valuation frame", `${project.location}: community and rental evidence`);
    page.drawRectangle({ x: margin, y: 590, width: pageSize[0] - margin * 2, height: 84, color: colors.ink });
    page.drawText("INVESTMENT-FIT SCREEN", { x: margin + 18, y: 648, size: 6.5, font: bold, color: colors.gold });
    page.drawText(`${project.advisoryScreen.total}/100`, { x: margin + 18, y: 614, size: 26, font: bold, color: colors.white });
    page.drawText(ascii(project.advisoryScreen.label).toUpperCase(), { x: margin + 145, y: 638, size: 9, font: bold, color: colors.gold });
    drawWrapped(page, project.advisoryScreen.statement, regular, 7, margin + 145, 619, pageSize[0] - margin * 2 - 165, rgb(.8, .79, .74), 10, 3);

    page.drawText("WEIGHTED FACTORS", { x: margin, y: 564, size: 6.5, font: bold, color: colors.gold });
    project.advisoryScreen.factors.forEach((factor, index) => {
      const factorY = 540 - index * 31;
      page.drawText(ascii(factor.label).slice(0, 28), { x: margin, y: factorY, size: 7.2, font: bold, color: colors.ink });
      page.drawText(`${factor.weight}% weight`, { x: margin + 120, y: factorY, size: 5.6, font: regular, color: colors.muted });
      page.drawRectangle({ x: margin + 190, y: factorY - 1, width: 205, height: 6, color: rgb(.84, .82, .76) });
      page.drawRectangle({ x: margin + 190, y: factorY - 1, width: 205 * factor.score / 100, height: 6, color: colors.gold });
      page.drawText(String(factor.score), { x: pageSize[0] - margin - 25, y: factorY, size: 6.5, font: bold, color: colors.ink });
      page.drawText(ascii(factor.rationale).slice(0, 74), { x: margin, y: factorY - 12, size: 5.4, font: regular, color: colors.muted });
    });

    const rentalChart: ReportChart = {
      title: "Annual rent sensitivity",
      subtitle: `${project.bedroom} | advisor-editable cases`,
      unit: "AED",
      kind: "columns",
      data: [
        { label: "Low", value: project.annualRentLow, display: Math.round(project.annualRentLow).toLocaleString("en-AE") },
        { label: "Expected", value: project.annualRent, display: Math.round(project.annualRent).toLocaleString("en-AE") },
        { label: "High", value: project.annualRentHigh, display: Math.round(project.annualRentHigh).toLocaleString("en-AE") },
      ],
      sourceLabel: "Advisor-confirmed sensitivity inputs",
      sourceUrl: "",
    };
    drawChart(page, rentalChart, margin, 78, 239, 245, regular, bold, colors);

    page.drawText("RENTAL OPERATING CASE", { x: margin + 263, y: 321, size: 6.5, font: bold, color: colors.gold });
    const rentalRows = [
      ["Planning occupancy", `${project.occupancyRate.toFixed(1)}%`],
      ["Effective annual rent", money(project.effectiveAnnualRent)],
      ["Rent per sqft / year", `AED ${project.annualRentPerSqft.toFixed(0)}`],
      ["Occupancy-adjusted net", percent(project.effectiveNetYield)],
    ];
    rentalRows.forEach(([label, value], index) => {
      const rowY = 295 - index * 28;
      page.drawLine({ start: { x: margin + 263, y: rowY - 7 }, end: { x: pageSize[0] - margin, y: rowY - 7 }, thickness: .35, color: rgb(.78, .74, .66) });
      page.drawText(label.toUpperCase(), { x: margin + 263, y: rowY, size: 5.8, font: bold, color: colors.muted });
      page.drawText(value, { x: pageSize[0] - margin - 92, y: rowY, size: 7.2, font: bold, color: colors.ink });
    });
    page.drawText("DEMAND AND DEMOGRAPHIC CONTEXT", { x: margin + 263, y: 172, size: 6.2, font: bold, color: colors.gold });
    drawWrapped(
      page,
      `${project.demandSegments.join(" | ")}. ${project.demographicContext
        ? `${project.demographicContext.display}; ${project.demographicContext.scope}.`
        : "No official community-level demographic series is embedded."}`,
      regular,
      6.4,
      margin + 263,
      154,
      pageSize[0] - margin * 2 - 263,
      colors.muted,
      8.5,
      5,
    );
    page.drawText("RENTAL EVIDENCE NOTE", { x: margin + 263, y: 100, size: 6.2, font: bold, color: colors.gold });
    drawWrapped(
      page,
      project.rentalEvidenceNotes || project.rentalEvidence.note,
      regular,
      6.2,
      margin + 263,
      84,
      pageSize[0] - margin * 2 - 263,
      colors.muted,
      8,
      4,
    );
    addFooter(page);
  });

  // Recommendation and action page.
  page = addPage("Advisor perspective", "Recommendation and next actions");
  let recommendationY = drawWrapped(page, content.recommendation, regular, 10, margin, 655, pageSize[0] - margin * 2, colors.ink, 15, 10) - 20;
  page.drawText("MARKET POSITION", { x: margin, y: recommendationY, size: 6.5, font: bold, color: colors.gold });
  recommendationY = drawWrapped(page, content.marketPosition, regular, 9.2, margin, recommendationY - 24, pageSize[0] - margin * 2, colors.ink, 14, 7) - 18;
  page.drawText("DECISION RISKS", { x: margin, y: recommendationY, size: 6.5, font: bold, color: colors.gold });
  recommendationY -= 25;
  (content.riskNotes || []).slice(0, 3).forEach((item) => {
    page.drawCircle({ x: margin + 4, y: recommendationY + 3, size: 2.1, color: colors.gold });
    recommendationY = drawWrapped(page, item, regular, 8.6, margin + 15, recommendationY + 6, pageSize[0] - margin * 2 - 15, colors.ink, 12.5, 3) - 7;
  });
  page.drawText("NEXT ACTIONS", { x: margin, y: recommendationY - 3, size: 6.5, font: bold, color: colors.gold });
  recommendationY -= 31;
  content.nextSteps.slice(0, 4).forEach((item, index) => {
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y: recommendationY, size: 7, font: bold, color: colors.gold });
    recommendationY = drawWrapped(page, item, regular, 8.5, margin + 28, recommendationY + 3, pageSize[0] - margin * 2 - 28, colors.ink, 12, 3) - 8;
  });
  const residency = content.residencyGuidance;
  if (residency) {
    page.drawRectangle({ x: margin, y: 176, width: pageSize[0] - margin * 2, height: 104, color: colors.shell, borderColor: colors.gold, borderWidth: .6 });
    page.drawText("RESIDENCY PLANNING", { x: margin + 16, y: 258, size: 6.2, font: bold, color: colors.gold });
    page.drawText(ascii(residency.title), { x: margin + 16, y: 239, size: 10, font: bold, color: colors.ink });
    page.drawText(ascii(residency.threshold), { x: margin + 16, y: 224, size: 6.5, font: bold, color: colors.gold });
    page.drawText(ascii(residency.status).slice(0, 108), { x: margin + 16, y: 209, size: 6.7, font: regular, color: colors.ink });
    drawWrapped(page, residency.summary, regular, 6.2, margin + 16, 192, pageSize[0] - margin * 2 - 32, colors.muted, 8, 2);
  }
  page.drawRectangle({ x: margin, y: 72, width: pageSize[0] - margin * 2, height: 90, color: colors.ink });
  page.drawText(ascii(content.advisor?.name || "HAUS & GRACE Advisor"), { x: margin + 18, y: 132, size: 11, font: bold, color: colors.white });
  page.drawText(ascii(content.advisor?.title || "Property Advisor"), { x: margin + 18, y: 116, size: 6.5, font: regular, color: colors.gold });
  page.drawText(ascii(content.advisor?.phone || ""), { x: margin + 265, y: 130, size: 7, font: bold, color: colors.white });
  page.drawText(ascii(content.advisor?.email || ""), { x: margin + 265, y: 114, size: 7, font: regular, color: colors.gold });
  page.drawText("Reply directly to continue the unit review.", { x: margin + 18, y: 91, size: 6.5, font: regular, color: rgb(.78, .77, .72) });
  addFooter(page);

  // Confirmation, methodology and sources.
  page = addPage("Appendix", "Confirmation record, methodology and sources");
  page.drawText("CONFIRMATION RECORD", { x: margin, y: 660, size: 6.5, font: bold, color: colors.gold });
  page.drawRectangle({ x: margin, y: 555, width: pageSize[0] - margin * 2, height: 84, color: colors.shell });
  drawWrapped(page, content.confirmation?.statement || "", regular, 8.2, margin + 17, 613, pageSize[0] - margin * 2 - 34, colors.ink, 12, 5);
  page.drawText(`Confirmed by ${ascii(content.confirmation?.confirmedBy || content.advisor?.email || "")}`, { x: margin + 17, y: 570, size: 6.2, font: bold, color: colors.gold });
  page.drawText("METHODOLOGY", { x: margin, y: 522, size: 6.5, font: bold, color: colors.gold });
  const methodology = [
    "Yield calculations use advisor-confirmed inputs. Gross yield equals expected annual rent divided by unit price. Net yield deducts entered recurring costs from rent and divides by the all-in acquisition basis. The occupancy-adjusted case applies the entered occupancy percentage before recurring costs.",
    "The investment-fit screen weights value versus area 25%, rental return 25%, accessibility 20%, demand depth 15%, supply balance 10% and evidence quality 5%. It is a transparent advisory screen, not a formal, lender or RERA valuation.",
    "Distances use published project and destination coordinates. The supply screen uses active index records in the same area or approximately 10 km. Confirm routes, traffic, access gates and the complete planning-authority pipeline.",
    "Market charts retain their original period and definition. Citywide transactions must not be presented as transactions for the selected building or community.",
  ];
  let methodY = 496;
  methodology.forEach((item, index) => {
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y: methodY, size: 6.2, font: bold, color: colors.gold });
    methodY = drawWrapped(page, item, regular, 7.1, margin + 25, methodY + 2, pageSize[0] - margin * 2 - 25, colors.ink, 10, 5) - 9;
  });
  page.drawText("SOURCES", { x: margin, y: methodY - 1, size: 6.5, font: bold, color: colors.gold });
  let sourceY = methodY - 26;
  const sourceItems = content.marketContext?.sources || [];
  sourceItems.slice(0, 6).forEach((source, index) => {
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y: sourceY, size: 5.8, font: bold, color: colors.gold });
    sourceY = drawWrapped(page, source.url ? `${source.label}: ${source.url}` : source.label, regular, 6.2, margin + 24, sourceY + 1, pageSize[0] - margin * 2 - 24, colors.muted, 8.2, 3) - 6;
  });
  page.drawRectangle({ x: margin, y: 67, width: pageSize[0] - margin * 2, height: 61, borderColor: colors.gold, borderWidth: .7 });
  drawWrapped(page, "Important: This curated brief is an advisory presentation, not a binding offer, valuation, legal opinion or return guarantee. Reconfirm availability, price, area, fees, finance terms, rent evidence and completion dates against current transaction documents before commitment.", regular, 6.6, margin + 14, 109, pageSize[0] - margin * 2 - 28, colors.muted, 9, 5);
  addFooter(page);

  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function curatedBriefFilename(document: { title: string }) {
  const stem = document.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "haus-grace-curated-brief";
  return `${stem}.pdf`;
}

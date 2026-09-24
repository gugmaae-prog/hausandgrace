import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import registryData from "../data/projects.json";
import {
  buildCuratedBriefContent,
  buildProjectResearch,
  buildReportProjects,
  curatedBriefFilename,
  renderCuratedBriefPdf,
  type AiBriefNarrative,
  type CommunityResearch,
  type ConfirmedProjectInput,
  type CuratedBriefContent,
  type CuratedBriefDocument,
  type ReportProjectRecord,
} from "./curated-brief";
import {
  PROPERTY_FINDER_ORIGIN,
  boundedResponseText,
  parsePropertyFinderProfileHtml,
  validPropertyFinderAgentUrl,
  type PropertyFinderListing,
} from "./property-finder-listings";

const STAFF_DOMAIN = "hausandgrace.ae";
const SESSION_COOKIE = "hg_agent_session";
const SESSION_HOURS = 12;
const AI_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const MAX_JSON_BYTES = 128_000;
const MAX_PROJECTS = 6;
const MIN_PROFILE_DEVELOPERS = 3;
const MAX_PROFILE_DEVELOPERS = 8;
const MIN_PROFILE_PROJECTS = 3;
const MAX_PROFILE_PROJECTS = 12;
const PROPERTY_FINDER_AGENCY_URL = "https://www.propertyfinder.ae/en/broker/hausgrace-properties-7582";
const PROPERTY_FINDER_MAX_HTML_BYTES = 2_000_000;
const PROPERTY_FINDER_AUTO_RETRY_MINUTES = 30;
const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_BYTES = 32;

type AgentEnv = Env & {
  AI?: Ai;
  EMAIL?: SendEmail;
};

type ProjectRecord = ReportProjectRecord;

type ProjectSnapshot = {
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
  bedroomOptions: string[];
  positioning: string;
  imageUrl: string;
  research: CommunityResearch;
};

type AdvisorCustomProject = {
  id: string;
  slug: string;
  custom: true;
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
  bedroomOptions: string[];
  positioning: string;
  imageUrl: string;
  projectUrl: string;
  research: CommunityResearch | null;
};

type DocumentContent = CuratedBriefContent;

type SavedDocument = {
  id: string;
  agent_email: string;
  type: "sales_offer" | "proposal" | "comparison";
  title: string;
  client_name: string;
  content_json: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type AgentSession = {
  email: string;
  name: string;
  role: string;
  phone: string;
  title: string;
  avatarUrl: string;
  expiresAt: string;
  mustChangePassword: boolean;
  onboardingRequired: boolean;
};

type AiTextResult = { response?: string };
type AdvisorProfileRow = {
  top_developers_json: string;
  top_projects_json: string;
  custom_projects_json: string;
  ai_headline: string;
  ai_bio: string;
  ai_specialties_json: string;
  ai_recommendations_json: string;
  portfolio_headline: string;
  portfolio_bio: string;
  portfolio_specialties_json: string;
  portfolio_recommendations_json: string;
  portfolio_public: number;
  portfolio_slug: string;
  whatsapp_phone: string;
  linkedin_url: string;
  instagram_url: string;
  property_finder_profile_url: string;
  property_finder_brn: string;
  property_finder_experience: string;
  property_finder_languages_json: string;
  property_finder_areas_json: string;
  property_finder_verified_at: string;
  display_name: string;
  title: string;
  avatar_url: string;
  contact_phone: string;
  onboarding_complete: number;
  updated_at: string;
};
type SecondaryUnitRow = {
  id: string;
  agent_email: string;
  title: string;
  community: string;
  emirate: string;
  property_type: string;
  bedrooms: string;
  bathrooms: number;
  size_sqft: number;
  price_aed: number;
  reference: string;
  image_url: string;
  description: string;
  status: "available" | "under_offer" | "sold" | "leased";
  published: number;
  created_at: string;
  updated_at: string;
};
type PropertyFinderListingRow = {
  id: string;
  agent_email: string;
  external_id: string;
  external_url: string;
  reference: string;
  title: string;
  location: string;
  property_type: string;
  listing_type: "sale" | "rent";
  bedrooms: string;
  bathrooms: number;
  size_sqft: number;
  price_aed: number;
  image_url: string;
  listed_at: string;
  featured: number;
  status: string;
  fetched_at: string;
  updated_at: string;
};
type PropertyFinderSyncRow = {
  profile_url: string;
  status: "pending" | "success" | "failed";
  listing_count: number;
  total_count: number;
  error: string;
  last_attempted_at: string;
  last_synced_at: string;
};
type WorkerSubtleCrypto = SubtleCrypto & {
  timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean;
};

const registry = registryData as { projects: ProjectRecord[]; generatedAt: string; totalUaeProjects: number };
const projectMap = new Map(registry.projects.map((project) => [project.slug, project]));

function appPath(pathname: string) {
  const decoded = pathname.replace(/^\/h%26g\/properties(?=\/|$)/i, "/h&g/properties");
  return decoded.startsWith("/h&g/properties") ? decoded.slice("/h&g/properties".length) || "/" : decoded;
}

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, max) : "";
}

function cleanStringArray(value: unknown, limit = 8, itemLength = 100) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => clean(item, itemLength)).filter(Boolean))].slice(0, limit);
}

function storedStringArray(value: string, limit = 8, itemLength = 100) {
  try {
    return cleanStringArray(JSON.parse(value), limit, itemLength);
  } catch {
    return [];
  }
}

function advisorSlug(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "advisor";
}

async function ensureAdvisorProfile(env: AgentEnv, email: string, role = "agent") {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO hg_agent_advisor_profiles
     (agent_email, portfolio_slug, onboarding_complete)
     VALUES (?, ?, ?)`,
  ).bind(email, advisorSlug(email), role === "admin" || email === "info@hausandgrace.ae" ? 1 : 0).run();
}

async function onboardingRequired(env: AgentEnv, email: string, role: string) {
  await ensureAdvisorProfile(env, email, role);
  const row = await env.DB.prepare(
    "SELECT onboarding_complete FROM hg_agent_advisor_profiles WHERE agent_email = ? LIMIT 1",
  ).bind(email).first<{ onboarding_complete: number }>();
  return role !== "admin" && email !== "info@hausandgrace.ae" && !Boolean(row?.onboarding_complete);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function normalizeEmail(value: unknown) {
  const email = clean(value, 180).toLowerCase();
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@hausandgrace\.ae$/.test(email) ? email : "";
}

function normalizeUsername(value: unknown) {
  const username = clean(value, 180).toLowerCase();
  if (normalizeEmail(username)) return username;
  return /^[a-z0-9][a-z0-9._-]{1,63}$/.test(username) ? username : "";
}

function normalizePhone(value: unknown) {
  const phone = clean(value, 32);
  if (!/^[+()0-9.\-\s]+$/.test(phone)) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? phone : "";
}

function normalizeTitle(value: unknown) {
  return clean(value, 80) || "Property Advisor";
}

function normalizeAvatarUrl(value: unknown) {
  const avatarUrl = clean(value, 180);
  return /^\/team\/[a-z0-9-]+\.webp$/.test(avatarUrl) ? avatarUrl : "";
}

function normalizeHttpsUrl(value: unknown, max = 500) {
  const raw = clean(value, max);
  if (!raw) return "";
  try {
    const candidate = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
    if (candidate.protocol !== "https:") return "";
    return candidate.toString().slice(0, max);
  } catch {
    return "";
  }
}

function propertyFinderListingResponse(row: PropertyFinderListingRow) {
  return {
    id: row.external_id,
    url: row.external_url,
    reference: row.reference,
    title: row.title,
    location: row.location,
    propertyType: row.property_type,
    listingType: row.listing_type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sizeSqft: row.size_sqft,
    priceAed: row.price_aed,
    imageUrl: row.image_url,
    listedAt: row.listed_at,
    featured: Boolean(row.featured),
    fetchedAt: row.fetched_at,
  };
}

async function propertyFinderPortfolioData(env: AgentEnv, agentEmail: string) {
  const [listingResult, sync] = await Promise.all([
    env.DB.prepare(
      `SELECT id, agent_email, external_id, external_url, reference, title, location,
              property_type, listing_type, bedrooms, bathrooms, size_sqft, price_aed,
              image_url, listed_at, featured, status, fetched_at, updated_at
       FROM hg_agent_property_finder_listings
       WHERE agent_email = ? AND status = 'active'
       ORDER BY featured DESC, listed_at DESC, updated_at DESC
       LIMIT 20`,
    ).bind(agentEmail).all<PropertyFinderListingRow>(),
    env.DB.prepare(
      `SELECT profile_url, status, listing_count, total_count, error,
              last_attempted_at, last_synced_at
       FROM hg_agent_property_finder_sync
       WHERE agent_email = ? LIMIT 1`,
    ).bind(agentEmail).first<PropertyFinderSyncRow>(),
  ]);
  return {
    listings: listingResult.results.map(propertyFinderListingResponse),
    sync: sync ? {
      status: sync.status,
      cachedCount: sync.listing_count,
      totalCount: sync.total_count,
      lastAttemptedAt: sync.last_attempted_at,
      lastSyncedAt: sync.last_synced_at,
      error: sync.error,
    } : {
      status: "pending" as const,
      cachedCount: 0,
      totalCount: 0,
      lastAttemptedAt: "",
      lastSyncedAt: "",
      error: "",
    },
  };
}

function propertyFinderInsert(env: AgentEnv, agentEmail: string, listing: PropertyFinderListing) {
  return env.DB.prepare(
    `INSERT INTO hg_agent_property_finder_listings
     (id, agent_email, external_id, external_url, reference, title, location,
      property_type, listing_type, bedrooms, bathrooms, size_sqft, price_aed,
      image_url, listed_at, featured, status, fetched_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(agent_email, external_id) DO UPDATE SET
       external_url = excluded.external_url,
       reference = excluded.reference,
       title = excluded.title,
       location = excluded.location,
       property_type = excluded.property_type,
       listing_type = excluded.listing_type,
       bedrooms = excluded.bedrooms,
       bathrooms = excluded.bathrooms,
       size_sqft = excluded.size_sqft,
       price_aed = excluded.price_aed,
       image_url = excluded.image_url,
       listed_at = excluded.listed_at,
       featured = excluded.featured,
       status = 'active',
       fetched_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(
    `${agentEmail}:${listing.externalId}`,
    agentEmail,
    listing.externalId,
    listing.externalUrl,
    listing.reference,
    listing.title,
    listing.location,
    listing.propertyType,
    listing.listingType,
    listing.bedrooms,
    listing.bathrooms,
    listing.sizeSqft,
    listing.priceAed,
    listing.imageUrl,
    listing.listedAt,
    listing.featured ? 1 : 0,
  );
}

async function markPropertyFinderSyncFailed(env: AgentEnv, agentEmail: string, profileUrl: string, reason: string) {
  await env.DB.prepare(
    `INSERT INTO hg_agent_property_finder_sync
     (agent_email, profile_url, status, listing_count, total_count, error, last_attempted_at, last_synced_at, updated_at)
     VALUES (?, ?, 'failed', 0, 0, ?, CURRENT_TIMESTAMP, '', CURRENT_TIMESTAMP)
     ON CONFLICT(agent_email) DO UPDATE SET
       profile_url = excluded.profile_url,
       status = 'failed',
       error = excluded.error,
       last_attempted_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(agentEmail, profileUrl, reason.slice(0, 500)).run();
}

async function syncPropertyFinderForAgent(env: AgentEnv, agentEmail: string, profileUrlInput: string) {
  const profileUrl = validPropertyFinderAgentUrl(profileUrlInput);
  if (!profileUrl) throw new Error("A verified Property Finder agent profile has not been linked.");
  try {
    const response = await fetch(profileUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-AE,en;q=0.9",
        "user-agent": "HAUS-GRACE-Listings/1.0 (+https://hausandgrace.ae)",
      },
      redirect: "follow",
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`The external profile returned status ${response.status}.`);
    }
    const resolvedUrl = new URL(response.url || profileUrl);
    if (resolvedUrl.origin !== PROPERTY_FINDER_ORIGIN || !resolvedUrl.pathname.startsWith("/en/agent/")) {
      await response.body?.cancel();
      throw new Error("The external profile redirected to an unexpected destination.");
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      await response.body?.cancel();
      throw new Error("The external profile did not return a web page.");
    }
    const html = await boundedResponseText(response, PROPERTY_FINDER_MAX_HTML_BYTES);
    const snapshot = parsePropertyFinderProfileHtml(html, agentEmail);
    const statements = [
      env.DB.prepare(
        "UPDATE hg_agent_property_finder_listings SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE agent_email = ?",
      ).bind(agentEmail),
      ...snapshot.listings.map((listing) => propertyFinderInsert(env, agentEmail, listing)),
      env.DB.prepare(
        `INSERT INTO hg_agent_property_finder_sync
         (agent_email, profile_url, status, listing_count, total_count, error, last_attempted_at, last_synced_at, updated_at)
         VALUES (?, ?, 'success', ?, ?, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(agent_email) DO UPDATE SET
           profile_url = excluded.profile_url,
           status = 'success',
           listing_count = excluded.listing_count,
           total_count = excluded.total_count,
           error = '',
           last_attempted_at = CURRENT_TIMESTAMP,
           last_synced_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
      ).bind(agentEmail, profileUrl, snapshot.listings.length, snapshot.totalCount),
    ];
    await env.DB.batch(statements);
    console.log(JSON.stringify({
      event: "property_finder_sync",
      agentEmail,
      cachedListings: snapshot.listings.length,
      totalListings: snapshot.totalCount,
    }));
    return snapshot;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The listings could not be refreshed.";
    await markPropertyFinderSyncFailed(env, agentEmail, profileUrl, reason);
    console.error(JSON.stringify({ event: "property_finder_sync_failed", agentEmail, message: reason }));
    throw error;
  }
}

function propertyFinderRetryAvailable(lastAttemptedAt: string) {
  if (!lastAttemptedAt) return true;
  const attempted = Date.parse(`${lastAttemptedAt.replace(" ", "T")}Z`);
  return !Number.isFinite(attempted) || Date.now() - attempted >= PROPERTY_FINDER_AUTO_RETRY_MINUTES * 60_000;
}

function normalizeSocialUrl(value: unknown, network: "linkedin" | "instagram") {
  const raw = clean(value, 500);
  if (!raw) return "";
  const url = normalizeHttpsUrl(raw);
  if (!url) return "";
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const permitted = network === "linkedin"
    ? host === "linkedin.com" || host.endsWith(".linkedin.com")
    : host === "instagram.com" || host.endsWith(".instagram.com");
  return permitted ? url : "";
}

function customProjectId(value: unknown, name: string, index: number) {
  const supplied = clean(value, 100).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (supplied) return supplied;
  const fromName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return `custom-${fromName || "project"}-${index + 1}`;
}

function advisorCustomProjects(value: unknown): AdvisorCustomProject[] {
  let source: unknown = value;
  if (typeof value === "string") {
    try {
      source = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(source)) return [];
  const projects: AdvisorCustomProject[] = [];
  const seen = new Set<string>();
  for (const [index, raw] of source.entries()) {
    if (!raw || typeof raw !== "object" || projects.length >= MAX_PROFILE_PROJECTS) continue;
    const candidate = raw as Record<string, unknown>;
    const name = clean(candidate.name, 120);
    const developer = clean(candidate.developer, 100);
    const location = clean(candidate.location, 120);
    const emirate = clean(candidate.emirate, 50) || "Dubai";
    if (name.length < 2 || developer.length < 2 || location.length < 2) continue;
    const duplicateKey = `${name}|${developer}`.toLowerCase();
    if (seen.has(duplicateKey)) continue;
    seen.add(duplicateKey);
    const imageInput = clean(candidate.imageUrl, 500);
    const projectInput = clean(candidate.projectUrl, 500);
    const imageUrl = imageInput ? normalizeHttpsUrl(imageInput) : "";
    const projectUrl = projectInput ? normalizeHttpsUrl(projectInput) : "";
    projects.push({
      id: customProjectId(candidate.id, name, index),
      slug: customProjectId(candidate.id, name, index),
      custom: true,
      name,
      developer,
      location,
      emirate,
      startingPrice: clean(candidate.startingPrice, 80) || "On request",
      paymentPlan: clean(candidate.paymentPlan, 80) || "On request",
      handover: clean(candidate.handover, 80) || "To be confirmed",
      pricePerSqft: clean(candidate.pricePerSqft, 80) || "Confirm against selected unit",
      residences: clean(candidate.residences, 100) || "Residential",
      bedrooms: clean(candidate.bedrooms, 100) || "Ask for current configurations",
      bedroomOptions: [],
      positioning: clean(candidate.positioning, 160) || `${emirate} real estate`,
      imageUrl,
      projectUrl,
      research: null,
    });
  }
  return projects;
}

function passwordValue(value: unknown) {
  return typeof value === "string" ? value.slice(0, 128) : "";
}

function validNewPassword(password: string) {
  return /^\d{6}$/.test(password)
    || (
      password.length >= 12
      && password.length <= 128
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /\d/.test(password)
    );
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64ToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function randomOtp() {
  const values = crypto.getRandomValues(new Uint32Array(1));
  return String(100000 + (values[0] % 900000));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const stableSalt = new Uint8Array(salt.byteLength);
  stableSalt.set(salt);
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: stableSalt, iterations },
    material,
    PASSWORD_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_HOURS * 3600}; HttpOnly; Secure; SameSite=Lax`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function readJson<T>(request: Request): Promise<T> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_JSON_BYTES) throw new Error("Request body is too large.");
  if (!request.body) return {} as T;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_JSON_BYTES) {
      await reader.cancel();
      throw new Error("Request body is too large.");
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return (body ? JSON.parse(body) : {}) as T;
}

async function currentSession(request: Request, env: AgentEnv): Promise<AgentSession | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token || token.length < 32 || token.length > 160) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT s.email, p.display_name, p.role, p.phone, p.title, p.avatar_url, s.expires_at,
            COALESCE(c.must_change_password, 0) AS must_change_password,
            COALESCE(a.onboarding_complete, CASE WHEN p.role = 'admin' OR p.email = 'info@hausandgrace.ae' THEN 1 ELSE 0 END) AS onboarding_complete
     FROM hg_agent_sessions s
     JOIN hg_agent_profiles p ON p.email = s.email
     LEFT JOIN hg_agent_credentials c ON c.email = s.email
     LEFT JOIN hg_agent_advisor_profiles a ON a.agent_email = s.email
     WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND p.active = 1
     LIMIT 1`,
  ).bind(tokenHash).first<{ email: string; display_name: string; role: string; phone: string; title: string; avatar_url: string; expires_at: string; must_change_password: number; onboarding_complete: number }>();
  return row ? {
    email: row.email,
    name: row.display_name,
    role: row.role,
    phone: row.phone,
    title: row.title,
    avatarUrl: row.avatar_url,
    expiresAt: row.expires_at,
    mustChangePassword: Boolean(row.must_change_password),
    onboardingRequired: row.role !== "admin" && row.email !== "info@hausandgrace.ae" && !Boolean(row.onboarding_complete),
  } : null;
}

async function requireSession(request: Request, env: AgentEnv) {
  const session = await currentSession(request, env);
  if (!session) throw new Response(JSON.stringify({ error: "Staff sign-in required." }), {
    status: 401,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
  return session;
}

function requireAdmin(session: AgentSession) {
  if (session.role !== "admin") throw new Response(JSON.stringify({ error: "Administrator access is required." }), {
    status: 403,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function enforceLoginRateLimit(email: string, request: Request, env: AgentEnv) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha256(`${email}|${ip}`);
  const row = await env.DB.prepare(
    `SELECT count, window_started_at FROM hg_agent_rate_limits WHERE key = ?`,
  ).bind(key).first<{ count: number; window_started_at: string }>();
  const windowStart = row ? Date.parse(`${row.window_started_at.replace(" ", "T")}Z`) : 0;
  const activeWindow = Number.isFinite(windowStart) && Date.now() - windowStart < 15 * 60_000;
  if (activeWindow && row && row.count >= 5) throw new Error("Too many sign-in attempts. Please wait 15 minutes.");
  if (activeWindow) {
    await env.DB.prepare("UPDATE hg_agent_rate_limits SET count = count + 1 WHERE key = ?").bind(key).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO hg_agent_rate_limits (key, window_started_at, count)
       VALUES (?, CURRENT_TIMESTAMP, 1)
       ON CONFLICT(key) DO UPDATE SET window_started_at = CURRENT_TIMESTAMP, count = 1`,
    ).bind(key).run();
  }
}

async function createSession(env: AgentEnv, email: string) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO hg_agent_sessions (token_hash, email, expires_at)
       VALUES (?, ?, datetime('now', '+${SESSION_HOURS} hours'))`,
    ).bind(tokenHash, email),
    env.DB.prepare("DELETE FROM hg_agent_sessions WHERE expires_at <= CURRENT_TIMESTAMP"),
  ]);
  return token;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, Math.min(8, local.length - 2)))}@${domain}`;
}

async function requestOtp(request: Request, env: AgentEnv, purpose: "signin" | "password" = "signin") {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ email?: string }>(request);
  const email = normalizeEmail(payload.email);
  if (!email) return json({ error: `Use your @${STAFF_DOMAIN} staff email.` }, 400);
  const profile = await env.DB.prepare(
    "SELECT email FROM hg_agent_profiles WHERE email = ? AND active = 1 LIMIT 1",
  ).bind(email).first<{ email: string }>();
  if (!profile) return json({ error: "This staff account has not been activated. Ask an administrator to create it first." }, 403);
  if (!env.EMAIL) return json({ error: "Staff email delivery is not active yet. Ask an administrator to enable Cloudflare Email Sending." }, 503);
  try {
    await enforceLoginRateLimit(email, request, env);
  } catch {
    return json({ error: "Too many sign-in attempts. Please wait 15 minutes." }, 429);
  }

  const code = randomOtp();
  const nonce = randomToken(18);
  const codeHash = await sha256(`${nonce}:${email}:${code}`);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM hg_agent_login_codes WHERE expires_at <= CURRENT_TIMESTAMP OR email = ?").bind(email),
    env.DB.prepare(
      `INSERT INTO hg_agent_login_codes (email, nonce, code_hash, expires_at, attempts)
       VALUES (?, ?, ?, datetime('now', '+10 minutes'), 0)`,
    ).bind(email, nonce, codeHash),
  ]);

  const html = `<div style="margin:0;padding:40px;background:#f0ebe1;color:#191a18;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:auto;background:#faf8f3;border-top:4px solid #b8924f;padding:42px">
      <p style="margin:0 0 28px;color:#8a6a33;font-size:12px;letter-spacing:3px">HAUS &amp; GRACE PROPERTIES</p>
      <h1 style="margin:0 0 18px;font-size:30px;font-weight:500">${purpose === "password" ? "Set your workspace password" : "Your private workspace code"}</h1>
      <p style="line-height:1.7;color:#5e5b54">${purpose === "password" ? "Enter this code to create or reset your private agent-workspace password." : "Enter this code to access the agent workspace."} It expires in 10 minutes and can be used once.</p>
      <p style="margin:32px 0;padding:20px;background:#191a18;color:#e0bc63;font-size:34px;letter-spacing:8px;text-align:center">${code}</p>
      <p style="font-size:12px;color:#777269">If you did not request this code, you can ignore this email.</p>
    </div>
  </div>`;
  await env.EMAIL.send({
    to: email,
    from: { email: `access@${STAFF_DOMAIN}`, name: "HAUS & GRACE Properties" },
    subject: purpose === "password" ? "Set your HAUS & GRACE workspace password" : "Your HAUS & GRACE workspace code",
    html,
    text: `Your HAUS & GRACE verification code is ${code}. It expires in 10 minutes.`,
  });
  return json({ ok: true, email: maskEmail(email) }, 202);
}

async function verifyCode(env: AgentEnv, email: string, code: string) {
  const row = await env.DB.prepare(
    `SELECT nonce, code_hash, attempts FROM hg_agent_login_codes
     WHERE email = ? AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC LIMIT 1`,
  ).bind(email).first<{ nonce: string; code_hash: string; attempts: number }>();
  if (!row || row.attempts >= 5) return false;
  const candidate = await sha256(`${row.nonce}:${email}:${code}`);
  if (!constantTimeEqual(candidate, row.code_hash)) {
    await env.DB.prepare("UPDATE hg_agent_login_codes SET attempts = attempts + 1 WHERE email = ?").bind(email).run();
    return false;
  }
  return true;
}

async function verifyOtp(request: Request, env: AgentEnv) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ email?: string; code?: string }>(request);
  const email = normalizeEmail(payload.email);
  const code = clean(payload.code, 6);
  if (!email || !/^\d{6}$/.test(code)) return json({ error: "Enter the six-digit code sent to your staff email." }, 400);
  if (!(await verifyCode(env, email, code))) return json({ error: "This code is invalid or has expired." }, 401);
  const profile = await env.DB.prepare(
    "SELECT display_name, role, phone, title, avatar_url FROM hg_agent_profiles WHERE email = ? AND active = 1 LIMIT 1",
  ).bind(email).first<{ display_name: string; role: string; phone: string; title: string; avatar_url: string }>();
  if (!profile) return json({ error: "This staff account is not active." }, 403);
  await env.DB.prepare("UPDATE hg_agent_profiles SET updated_at = CURRENT_TIMESTAMP WHERE email = ?").bind(email).run();
  const token = await createSession(env, email);
  await env.DB.prepare("DELETE FROM hg_agent_login_codes WHERE email = ?").bind(email).run();
  const needsOnboarding = await onboardingRequired(env, email, profile.role);
  return json({
    ok: true,
    user: { email, name: profile.display_name, role: profile.role, phone: profile.phone, title: profile.title, avatarUrl: profile.avatar_url, mustChangePassword: false, onboardingRequired: needsOnboarding },
  }, 200, { "set-cookie": sessionCookie(token) });
}

async function passwordLogin(request: Request, env: AgentEnv) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ username?: string; password?: string }>(request);
  const identifier = normalizeUsername(payload.username);
  const password = passwordValue(payload.password);
  if (!identifier || !password) return json({ error: "Enter your username and password." }, 400);
  try {
    await enforceLoginRateLimit(`password:${identifier}`, request, env);
  } catch {
    return json({ error: "Too many sign-in attempts. Please wait 15 minutes." }, 429);
  }

  const emailIdentifier = normalizeEmail(identifier);
  const credential = await env.DB.prepare(
    `SELECT c.email, c.password_hash, c.password_salt, c.password_iterations,
            c.failed_attempts, c.locked_until, c.must_change_password,
            p.display_name, p.role, p.phone, p.title, p.avatar_url
     FROM hg_agent_credentials c
     JOIN hg_agent_profiles p ON p.email = c.email
     WHERE p.active = 1 AND (c.username = ? COLLATE NOCASE OR c.email = ?)
     LIMIT 1`,
  ).bind(identifier, emailIdentifier).first<{
    email: string;
    password_hash: string;
    password_salt: string;
    password_iterations: number;
    failed_attempts: number;
    locked_until: string | null;
    must_change_password: number;
    display_name: string;
    role: string;
    phone: string;
    title: string;
    avatar_url: string;
  }>();

  if (!credential) {
    await derivePassword(password, new Uint8Array(16), PASSWORD_ITERATIONS);
    return json({ error: "Username or password is incorrect." }, 401);
  }
  const lockedUntil = credential.locked_until ? Date.parse(`${credential.locked_until.replace(" ", "T")}Z`) : 0;
  if (lockedUntil > Date.now()) return json({ error: "Unable to sign in. Check your credentials or wait 15 minutes." }, 401);

  const candidate = await derivePassword(password, base64ToBytes(credential.password_salt), credential.password_iterations);
  const expected = base64ToBytes(credential.password_hash);
  const workerSubtle = crypto.subtle as WorkerSubtleCrypto;
  const matches = candidate.byteLength === expected.byteLength && workerSubtle.timingSafeEqual(candidate, expected);
  if (!matches) {
    await env.DB.prepare(
      `UPDATE hg_agent_credentials
       SET failed_attempts = failed_attempts + 1,
           locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN datetime('now', '+15 minutes') ELSE locked_until END
       WHERE email = ?`,
    ).bind(credential.email).run();
    return json({ error: "Username or password is incorrect." }, 401);
  }

  await env.DB.prepare(
    `UPDATE hg_agent_credentials
     SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
     WHERE email = ?`,
  ).bind(credential.email).run();
  const token = await createSession(env, credential.email);
  const needsOnboarding = await onboardingRequired(env, credential.email, credential.role);
  return json({
    ok: true,
    user: {
      email: credential.email,
      name: credential.display_name,
      role: credential.role,
      phone: credential.phone,
      title: credential.title,
      avatarUrl: credential.avatar_url,
      mustChangePassword: Boolean(credential.must_change_password),
      onboardingRequired: needsOnboarding,
    },
  }, 200, { "set-cookie": sessionCookie(token) });
}

async function completePasswordSetup(request: Request, env: AgentEnv) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ email?: string; code?: string; password?: string }>(request);
  const email = normalizeEmail(payload.email);
  const code = clean(payload.code, 6);
  const password = passwordValue(payload.password);
  if (!email || !/^\d{6}$/.test(code)) return json({ error: "Enter the six-digit code sent to your staff email." }, 400);
  if (!validNewPassword(password)) return json({ error: "Use a six-digit PIN or at least 12 characters with uppercase, lowercase and a number." }, 400);
  if (!(await verifyCode(env, email, code))) return json({ error: "This code is invalid or has expired." }, 401);
  const profile = await env.DB.prepare(
    "SELECT display_name, role, phone, title, avatar_url FROM hg_agent_profiles WHERE email = ? AND active = 1 LIMIT 1",
  ).bind(email).first<{ display_name: string; role: string; phone: string; title: string; avatar_url: string }>();
  if (!profile) return json({ error: "This staff account is not active." }, 403);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  const username = email.split("@")[0];
  await env.DB.batch([
    env.DB.prepare("UPDATE hg_agent_profiles SET updated_at = CURRENT_TIMESTAMP WHERE email = ?").bind(email),
    env.DB.prepare(
      `INSERT INTO hg_agent_credentials
       (email, username, password_hash, password_salt, password_iterations, failed_attempts, locked_until, must_change_password, password_changed_at)
       VALUES (?, ?, ?, ?, ?, 0, NULL, 0, CURRENT_TIMESTAMP)
       ON CONFLICT(email) DO UPDATE SET
         username = excluded.username,
         password_hash = excluded.password_hash,
         password_salt = excluded.password_salt,
         password_iterations = excluded.password_iterations,
         failed_attempts = 0,
         locked_until = NULL,
         must_change_password = 0,
         password_changed_at = CURRENT_TIMESTAMP`,
    ).bind(email, username, bytesToBase64(hash), bytesToBase64(salt), PASSWORD_ITERATIONS),
    env.DB.prepare("DELETE FROM hg_agent_login_codes WHERE email = ?").bind(email),
  ]);
  const token = await createSession(env, email);
  const needsOnboarding = await onboardingRequired(env, email, profile.role);
  return json({
    ok: true,
    user: {
      email,
      name: profile.display_name,
      role: profile.role,
      phone: profile.phone,
      title: profile.title,
      avatarUrl: profile.avatar_url,
      mustChangePassword: false,
      onboardingRequired: needsOnboarding,
    },
    username,
  }, 200, { "set-cookie": sessionCookie(token) });
}

async function changePassword(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ password?: string }>(request);
  const password = passwordValue(payload.password);
  if (!validNewPassword(password)) return json({ error: "Use a six-digit PIN or at least 12 characters with uppercase, lowercase and a number." }, 400);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  const result = await env.DB.prepare(
    `UPDATE hg_agent_credentials
     SET password_hash = ?, password_salt = ?, password_iterations = ?,
         failed_attempts = 0, locked_until = NULL, must_change_password = 0,
         password_changed_at = CURRENT_TIMESTAMP
     WHERE email = ?`,
  ).bind(bytesToBase64(hash), bytesToBase64(salt), PASSWORD_ITERATIONS, session.email).run();
  if (!result.meta.changes) return json({ error: "No password credential exists for this account." }, 409);

  await env.DB.prepare("DELETE FROM hg_agent_sessions WHERE email = ?").bind(session.email).run();
  const token = await createSession(env, session.email);
  const needsOnboarding = await onboardingRequired(env, session.email, session.role);
  return json({
    ok: true,
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      phone: session.phone,
      title: session.title,
      avatarUrl: session.avatarUrl,
      mustChangePassword: false,
      onboardingRequired: needsOnboarding,
    },
  }, 200, { "set-cookie": sessionCookie(token) });
}

function workspaceLoginUrl(request: Request) {
  const url = new URL(request.url);
  const prefix = /^\/h(?:&|%26)g\/properties(?=\/|$)/i.test(url.pathname) ? "/h&g/properties" : "";
  return `${url.origin}${prefix}/agent`;
}

async function sendStaffInvitation(request: Request, env: AgentEnv, email: string, name: string, temporaryAccess = false) {
  if (!env.EMAIL) return false;
  const loginUrl = workspaceLoginUrl(request);
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(loginUrl);
  const accessInstruction = temporaryAccess
    ? "Sign in with the temporary PIN provided by your administrator. You will be asked to replace it before the workspace opens."
    : "Open the workspace and choose First sign-in or forgot password to create your secure password.";
  const html = `<div style="margin:0;padding:40px;background:#f0ebe1;color:#191a18;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:auto;background:#faf8f3;border-top:4px solid #b8924f;padding:42px">
      <p style="margin:0 0 28px;color:#8a6a33;font-size:12px;letter-spacing:3px">HAUS &amp; GRACE PROPERTIES</p>
      <h1 style="margin:0 0 18px;font-size:30px;font-weight:500">Your private workspace is ready</h1>
      <p style="line-height:1.7;color:#5e5b54">Hello ${safeName}, an administrator has activated your HAUS &amp; GRACE staff account.</p>
      <p style="line-height:1.7;color:#5e5b54">${escapeHtml(accessInstruction)}</p>
      <p style="margin:30px 0"><a href="${safeUrl}" style="display:inline-block;padding:15px 22px;background:#191a18;color:#e0bc63;text-decoration:none">Open agent workspace</a></p>
      <p style="font-size:12px;color:#777269">This access is private and restricted to authorised staff.</p>
    </div>
  </div>`;
  try {
    await env.EMAIL.send({
      to: email,
      from: { email: `access@${STAFF_DOMAIN}`, name: "HAUS & GRACE Properties" },
      subject: "Your HAUS & GRACE agent workspace is ready",
      html,
      text: `Hello ${name}, your HAUS & GRACE staff account is ready. ${accessInstruction} Open ${loginUrl}`,
    });
    return true;
  } catch (error) {
    console.error(JSON.stringify({
      event: "agent_invitation_failed",
      target: email,
      message: error instanceof Error ? error.message.slice(0, 300) : "Email delivery failed",
    }));
    return false;
  }
}

async function listAdminUsers(env: AgentEnv) {
  const result = await env.DB.prepare(
    `SELECT p.email, p.display_name, p.phone, p.title, p.avatar_url, p.role, p.active, p.created_at,
            c.username, c.last_login_at, c.password_changed_at,
            COALESCE(c.must_change_password, 0) AS must_change_password,
            CASE WHEN c.email IS NULL THEN 0 ELSE 1 END AS has_password,
            (SELECT COUNT(*) FROM hg_agent_documents d WHERE d.agent_email = p.email) AS document_count
     FROM hg_agent_profiles p
     LEFT JOIN hg_agent_credentials c ON c.email = p.email
     ORDER BY CASE WHEN p.role = 'admin' THEN 0 ELSE 1 END, p.active DESC, p.display_name COLLATE NOCASE`,
  ).all<{
    email: string;
    display_name: string;
    phone: string;
    title: string;
    avatar_url: string;
    role: string;
    active: number;
    created_at: string;
    username: string | null;
    last_login_at: string | null;
    password_changed_at: string | null;
    must_change_password: number;
    has_password: number;
    document_count: number;
  }>();
  return result.results.map((row) => ({
    email: row.email,
    name: row.display_name,
    phone: row.phone,
    title: row.title,
    avatarUrl: row.avatar_url,
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at,
    username: row.username || "",
    lastLoginAt: row.last_login_at,
    passwordChangedAt: row.password_changed_at,
    mustChangePassword: Boolean(row.must_change_password),
    hasPassword: Boolean(row.has_password),
    documentCount: row.document_count,
  }));
}

async function createAdminUser(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{
    email?: string;
    name?: string;
    phone?: string;
    title?: string;
    avatarUrl?: string;
    temporaryPassword?: string;
  }>(request);
  const email = normalizeEmail(payload.email);
  const name = clean(payload.name, 100);
  const suppliedPhone = clean(payload.phone, 32);
  const phone = suppliedPhone ? normalizePhone(suppliedPhone) : "";
  const title = normalizeTitle(payload.title);
  const avatarUrl = normalizeAvatarUrl(payload.avatarUrl);
  const temporaryPassword = passwordValue(payload.temporaryPassword);
  if (!email) return json({ error: `Use a valid @${STAFF_DOMAIN} staff email.` }, 400);
  if (name.length < 2) return json({ error: "Enter the staff member's full name." }, 400);
  if (suppliedPhone && !phone) return json({ error: "Enter a valid advisor contact number or leave it blank." }, 400);
  if (temporaryPassword && !/^\d{6}$/.test(temporaryPassword)) {
    return json({ error: "The temporary password must be exactly six digits." }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT role FROM hg_agent_profiles WHERE email = ? LIMIT 1",
  ).bind(email).first<{ role: string }>();
  if (existing?.role === "admin") return json({ error: "The administrator account is already active." }, 409);

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO hg_agent_profiles (email, display_name, phone, title, avatar_url, role, active, updated_at)
       VALUES (?, ?, ?, ?, ?, 'agent', 1, CURRENT_TIMESTAMP)
       ON CONFLICT(email) DO UPDATE SET
         display_name = excluded.display_name,
         phone = excluded.phone,
         title = excluded.title,
         avatar_url = CASE WHEN excluded.avatar_url <> '' THEN excluded.avatar_url ELSE hg_agent_profiles.avatar_url END,
         active = 1,
         updated_at = CURRENT_TIMESTAMP`,
    ).bind(email, name, phone, title, avatarUrl),
    env.DB.prepare(
      `INSERT INTO hg_agent_admin_audit (id, admin_email, action, target_email, details)
       VALUES (?, ?, 'user_created', ?, ?)`,
    ).bind(crypto.randomUUID(), session.email, email, JSON.stringify({
      name,
      phoneRecorded: Boolean(phone),
      title,
      avatarAssigned: Boolean(avatarUrl),
      temporaryAccess: Boolean(temporaryPassword),
      reactivated: Boolean(existing),
    })),
  ];
  if (temporaryPassword) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derivePassword(temporaryPassword, salt, PASSWORD_ITERATIONS);
    statements.splice(1, 0,
      env.DB.prepare(
        `INSERT INTO hg_agent_credentials
         (email, username, password_hash, password_salt, password_iterations, failed_attempts, locked_until, must_change_password, password_changed_at)
         VALUES (?, ?, ?, ?, ?, 0, NULL, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(email) DO UPDATE SET
           username = excluded.username,
           password_hash = excluded.password_hash,
           password_salt = excluded.password_salt,
           password_iterations = excluded.password_iterations,
           failed_attempts = 0,
           locked_until = NULL,
           must_change_password = 1,
           password_changed_at = CURRENT_TIMESTAMP`,
      ).bind(email, email.split("@")[0], bytesToBase64(hash), bytesToBase64(salt), PASSWORD_ITERATIONS),
      env.DB.prepare("DELETE FROM hg_agent_sessions WHERE email = ?").bind(email),
    );
  }
  await env.DB.batch(statements);
  const invitationSent = await sendStaffInvitation(request, env, email, name, Boolean(temporaryPassword));
  return json({
    ok: true,
    invitationSent,
    user: (await listAdminUsers(env)).find((user) => user.email === email),
  }, existing ? 200 : 201);
}

async function updateAdminUser(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ email?: string; active?: boolean }>(request);
  const email = normalizeEmail(payload.email);
  if (!email || typeof payload.active !== "boolean") return json({ error: "Choose a valid staff account and status." }, 400);
  if (email === session.email) return json({ error: "The signed-in administrator account cannot be suspended." }, 409);
  const target = await env.DB.prepare(
    "SELECT role, active FROM hg_agent_profiles WHERE email = ? LIMIT 1",
  ).bind(email).first<{ role: string; active: number }>();
  if (!target) return json({ error: "Staff account not found." }, 404);
  if (target.role === "admin") return json({ error: "Administrator accounts cannot be changed from this control." }, 409);

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE hg_agent_profiles SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?",
    ).bind(payload.active ? 1 : 0, email),
    env.DB.prepare(
      `INSERT INTO hg_agent_admin_audit (id, admin_email, action, target_email, details)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      session.email,
      payload.active ? "user_activated" : "user_suspended",
      email,
      JSON.stringify({ previousActive: Boolean(target.active) }),
    ),
  ]);
  if (!payload.active) await env.DB.prepare("DELETE FROM hg_agent_sessions WHERE email = ?").bind(email).run();
  return json({ ok: true, user: (await listAdminUsers(env)).find((user) => user.email === email) });
}

async function deleteAdminUser(request: Request, env: AgentEnv, session: AgentSession, emailValue: string) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const email = normalizeEmail(emailValue);
  if (!email) return json({ error: "Choose a valid staff account." }, 400);
  if (email === session.email) return json({ error: "The signed-in administrator account cannot be deleted." }, 409);
  const target = await env.DB.prepare(
    `SELECT p.role, p.display_name, p.active,
            (SELECT COUNT(*) FROM hg_agent_documents d WHERE d.agent_email = p.email) AS document_count
     FROM hg_agent_profiles p
     WHERE p.email = ? LIMIT 1`,
  ).bind(email).first<{ role: string; display_name: string; active: number; document_count: number }>();
  if (!target) return json({ error: "Staff account not found." }, 404);
  if (target.role === "admin") return json({ error: "Administrator accounts are protected from deletion." }, 409);

  await env.DB.batch([
    env.DB.prepare("DELETE FROM hg_agent_login_codes WHERE email = ?").bind(email),
    env.DB.prepare("DELETE FROM hg_agent_profiles WHERE email = ? AND role <> 'admin'").bind(email),
    env.DB.prepare(
      `INSERT INTO hg_agent_admin_audit (id, admin_email, action, target_email, details)
       VALUES (?, ?, 'user_deleted', ?, ?)`,
    ).bind(crypto.randomUUID(), session.email, email, JSON.stringify({
      name: target.display_name,
      previousActive: Boolean(target.active),
      deletedDocuments: target.document_count,
    })),
  ]);
  return json({ ok: true, deletedEmail: email });
}

async function updateProfile(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ name?: string; phone?: string; title?: string }>(request);
  const name = clean(payload.name, 100) || session.name;
  const phone = normalizePhone(payload.phone);
  const title = normalizeTitle(payload.title);
  if (name.length < 2) return json({ error: "Enter the advisor's display name." }, 400);
  if (!phone) return json({ error: "Enter a valid contact number before generating a client brief." }, 400);
  await env.DB.prepare(
    `UPDATE hg_agent_profiles
     SET display_name = ?, phone = ?, title = ?, updated_at = CURRENT_TIMESTAMP
     WHERE email = ?`,
  ).bind(name, phone, title, session.email).run();
  return json({
    ok: true,
    user: { ...session, name, phone, title },
  });
}

async function logout(request: Request, env: AgentEnv) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM hg_agent_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}

function projectSnapshot(project: ProjectRecord): ProjectSnapshot {
  const price = Number(project.startingPrice.replace(/[^\d.]/g, ""));
  return {
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    location: project.area,
    emirate: project.emirate,
    startingPrice: Number.isFinite(price) && price > 0 ? `AED ${Math.round(price).toLocaleString("en-AE")}` : "On request",
    paymentPlan: project.paymentPlan || "On request",
    handover: project.handover || "To be confirmed",
    pricePerSqft: project.pricePerSqft ? `AED ${Math.round(project.pricePerSqft).toLocaleString("en-AE")}/sqft` : "Confirm against selected unit",
    residences: project.propertyTypes.join(", ") || "Residential",
    bedrooms: project.bedrooms.join(", ") || "Ask for current configurations",
    bedroomOptions: project.bedrooms.length ? project.bedrooms : ["Configuration to confirm"],
    positioning: project.lifestyles.join(", ") || `${project.emirate} real estate`,
    imageUrl: project.image || "",
    research: buildProjectResearch(project),
  };
}

function searchProjects(query: string, limit = 18) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 1);
  return registry.projects
    .filter((project) => !terms.length || terms.every((term) => `${project.name} ${project.developer} ${project.area} ${project.emirate} ${project.propertyTypes.join(" ")}`.toLowerCase().includes(term)))
    .slice(0, limit)
    .map(projectSnapshot);
}

const developerOptions = [...new Set(registry.projects.map((project) => project.developer).filter(Boolean))]
  .sort((left, right) => left.localeCompare(right));

function selectedProjectSnapshots(slugs: string[]) {
  return slugs.map((slug) => projectMap.get(slug)).filter((project): project is ProjectRecord => Boolean(project)).map(projectSnapshot);
}

async function advisorProfileResponse(env: AgentEnv, session: Pick<AgentSession, "email" | "role">) {
  await ensureAdvisorProfile(env, session.email, session.role);
  const row = await env.DB.prepare(
    `SELECT top_developers_json, top_projects_json, custom_projects_json, ai_headline, ai_bio,
            ai_specialties_json, ai_recommendations_json, portfolio_headline,
            portfolio_bio, portfolio_specialties_json, portfolio_recommendations_json,
            portfolio_public, portfolio_slug, whatsapp_phone, linkedin_url,
            instagram_url, property_finder_profile_url, property_finder_brn,
            property_finder_experience, property_finder_languages_json,
            property_finder_areas_json, property_finder_verified_at,
            onboarding_complete, a.updated_at, p.display_name, p.title,
            p.avatar_url, p.phone AS contact_phone
     FROM hg_agent_advisor_profiles a
     JOIN hg_agent_profiles p ON p.email = a.agent_email
     WHERE a.agent_email = ? LIMIT 1`,
  ).bind(session.email).first<AdvisorProfileRow>();
  if (!row) throw new Error("Advisor profile could not be prepared.");
  const projectSlugs = storedStringArray(row.top_projects_json, MAX_PROFILE_PROJECTS, 140);
  const customProjects = advisorCustomProjects(row.custom_projects_json);
  const propertyFinderData = row.property_finder_profile_url
    ? await propertyFinderPortfolioData(env, session.email)
    : null;
  return {
    displayName: row.display_name,
    title: row.title,
    avatarUrl: row.avatar_url,
    topDevelopers: storedStringArray(row.top_developers_json, MAX_PROFILE_DEVELOPERS, 100),
    topProjectSlugs: projectSlugs,
    topProjects: selectedProjectSnapshots(projectSlugs),
    customProjects,
    headline: row.portfolio_headline || row.ai_headline,
    bio: row.portfolio_bio || row.ai_bio,
    specialties: storedStringArray(row.portfolio_specialties_json || row.ai_specialties_json, 8, 80),
    recommendations: storedStringArray(row.portfolio_recommendations_json || row.ai_recommendations_json, 8, 240),
    portfolioPublic: Boolean(row.portfolio_public),
    portfolioSlug: row.portfolio_slug,
    contactPhone: row.contact_phone,
    whatsappPhone: row.whatsapp_phone,
    linkedinUrl: row.linkedin_url,
    instagramUrl: row.instagram_url,
    propertyFinder: row.property_finder_brn || row.property_finder_profile_url ? {
      profileUrl: row.property_finder_profile_url,
      agencyUrl: PROPERTY_FINDER_AGENCY_URL,
      brn: row.property_finder_brn,
      experience: row.property_finder_experience,
      languages: storedStringArray(row.property_finder_languages_json, 8, 60),
      areas: storedStringArray(row.property_finder_areas_json, 10, 100),
      verifiedAt: row.property_finder_verified_at,
      listings: propertyFinderData?.listings || [],
      sync: propertyFinderData?.sync || null,
    } : null,
    onboardingComplete: Boolean(row.onboarding_complete),
    updatedAt: row.updated_at,
  };
}

async function refreshPropertyFinderListings(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  await ensureAdvisorProfile(env, session.email, session.role);
  const row = await env.DB.prepare(
    "SELECT property_finder_profile_url FROM hg_agent_advisor_profiles WHERE agent_email = ? LIMIT 1",
  ).bind(session.email).first<{ property_finder_profile_url: string }>();
  if (!row?.property_finder_profile_url) {
    return json({ error: "No verified external agent profile is linked to this account." }, 409);
  }
  try {
    await syncPropertyFinderForAgent(env, session.email, row.property_finder_profile_url);
    return json({
      ok: true,
      profile: await advisorProfileResponse(env, session),
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "The listings could not be refreshed.",
    }, 502);
  }
}

type AdvisorAiProfile = {
  headline: string;
  bio: string;
  specialties: string[];
  recommendations: string[];
};

async function generateAdvisorAiProfile(
  env: AgentEnv,
  session: AgentSession,
  developers: string[],
  projectSlugs: string[],
  customProjects: AdvisorCustomProject[] = [],
): Promise<AdvisorAiProfile> {
  const projects = [...selectedProjectSnapshots(projectSlugs), ...customProjects];
  const fallback: AdvisorAiProfile = {
    headline: `${session.title || "Property Advisor"} focused on considered UAE property decisions`,
    bio: `${session.name} helps clients assess selected UAE property opportunities with a focus on ${developers.join(", ")} and projects including ${projects.map((project) => project.name).join(", ")}. Every recommendation remains subject to current price, availability and transaction-document confirmation.`,
    specialties: [...developers.slice(0, 3), ...projects.map((project) => project.location)].filter(Boolean).slice(0, 8),
    recommendations: [
      `Maintain current availability and unit-level pricing for ${projects[0]?.name || "the selected portfolio"}.`,
      "Add two community-level market updates each month to strengthen client conversations.",
      "Record confirmed transaction and rental evidence before making return comparisons.",
    ],
  };
  if (!env.AI) return fallback;
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: { type: "string" },
      bio: { type: "string" },
      specialties: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
      recommendations: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    },
    required: ["headline", "bio", "specialties", "recommendations"],
  };
  const result = await env.AI.run(AI_MODEL, {
    messages: [
      {
        role: "system",
        content: "Create a concise professional profile and private development recommendations for a HAUS & GRACE UAE property advisor. Use only the supplied identity and declared preferences. Do not invent awards, sales records, years of experience, languages, credentials, transactions or market leadership. The headline must be under 90 characters. The bio must be 70-120 words, client-facing, polished and factual. Recommendations are private, practical next steps the advisor can amend.",
      },
      {
        role: "user",
        content: JSON.stringify({
          advisor: { name: session.name, title: session.title || "Property Advisor" },
          topDevelopers: developers,
          selectedProjects: projects.map((project) => ({ name: project.name, developer: project.developer, location: project.location, emirate: project.emirate })),
        }),
      },
    ],
    max_tokens: 900,
    temperature: 0.2,
    repetition_penalty: 1.08,
    response_format: { type: "json_schema", json_schema: schema },
  }) as AiTextResult;
  const response = clean(result?.response, 12_000);
  if (!response) return fallback;
  try {
    const withoutFence = response.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence) as Partial<AdvisorAiProfile>;
    return {
      headline: clean(parsed.headline, 100) || fallback.headline,
      bio: clean(parsed.bio, 1_600) || fallback.bio,
      specialties: cleanStringArray(parsed.specialties, 6, 80).length ? cleanStringArray(parsed.specialties, 6, 80) : fallback.specialties,
      recommendations: cleanStringArray(parsed.recommendations, 5, 240).length ? cleanStringArray(parsed.recommendations, 5, 240) : fallback.recommendations,
    };
  } catch {
    return fallback;
  }
}

async function saveAdvisorPreferences(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ topDevelopers?: string[]; topProjects?: string[]; customProjects?: unknown[] }>(request);
  const developers = cleanStringArray(payload.topDevelopers, MAX_PROFILE_DEVELOPERS, 100);
  const projectSlugs = cleanStringArray(payload.topProjects, MAX_PROFILE_PROJECTS, 140);
  const customProjects = advisorCustomProjects(payload.customProjects);
  const validDevelopers = developers.filter((developer) => developerOptions.includes(developer));
  const validProjectSlugs = projectSlugs.filter((slug) => projectMap.has(slug));
  const projectTotal = validProjectSlugs.length + customProjects.length;
  if (validDevelopers.length < MIN_PROFILE_DEVELOPERS) {
    return json({ error: `Select at least ${MIN_PROFILE_DEVELOPERS} developers.` }, 400);
  }
  if (projectTotal < MIN_PROFILE_PROJECTS || projectTotal > MAX_PROFILE_PROJECTS) {
    return json({ error: `Keep between ${MIN_PROFILE_PROJECTS} and ${MAX_PROFILE_PROJECTS} selected or custom projects.` }, 400);
  }
  const generated = await generateAdvisorAiProfile(env, session, validDevelopers, validProjectSlugs, customProjects);
  await ensureAdvisorProfile(env, session.email, session.role);
  await env.DB.prepare(
    `UPDATE hg_agent_advisor_profiles SET
       top_developers_json = ?, top_projects_json = ?, custom_projects_json = ?,
       ai_headline = ?, ai_bio = ?, ai_specialties_json = ?, ai_recommendations_json = ?,
       portfolio_headline = ?, portfolio_bio = ?, portfolio_specialties_json = ?,
       portfolio_recommendations_json = ?, onboarding_complete = 1, updated_at = CURRENT_TIMESTAMP
     WHERE agent_email = ?`,
  ).bind(
    JSON.stringify(validDevelopers),
    JSON.stringify(validProjectSlugs),
    JSON.stringify(customProjects),
    generated.headline,
    generated.bio,
    JSON.stringify(generated.specialties),
    JSON.stringify(generated.recommendations),
    generated.headline,
    generated.bio,
    JSON.stringify(generated.specialties),
    JSON.stringify(generated.recommendations),
    session.email,
  ).run();
  return json({ ok: true, profile: await advisorProfileResponse(env, session) });
}

async function amendAdvisorProfile(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{
    displayName?: string;
    title?: string;
    headline?: string;
    bio?: string;
    specialties?: string[];
    recommendations?: string[];
    portfolioPublic?: boolean;
    contactPhone?: string;
    whatsappPhone?: string;
    linkedinUrl?: string;
    instagramUrl?: string;
  }>(request);
  const displayName = clean(payload.displayName, 100);
  const title = normalizeTitle(payload.title);
  const headline = clean(payload.headline, 100);
  const bio = clean(payload.bio, 1_600);
  const specialties = cleanStringArray(payload.specialties, 8, 80);
  const recommendations = cleanStringArray(payload.recommendations, 8, 240);
  const contactPhone = normalizePhone(payload.contactPhone);
  const whatsappInput = clean(payload.whatsappPhone, 32);
  const whatsappPhone = whatsappInput ? normalizePhone(whatsappInput) : "";
  const linkedinInput = clean(payload.linkedinUrl, 500);
  const linkedinUrl = linkedinInput ? normalizeSocialUrl(linkedinInput, "linkedin") : "";
  const instagramInput = clean(payload.instagramUrl, 500);
  const instagramUrl = instagramInput ? normalizeSocialUrl(instagramInput, "instagram") : "";
  if (displayName.length < 2) return json({ error: "Add your full professional name." }, 400);
  if (headline.length < 12 || bio.length < 50) return json({ error: "Add a clear headline and a complete advisor introduction." }, 400);
  if (specialties.length < 3) return json({ error: "Keep at least three portfolio specialties." }, 400);
  if (!contactPhone) return json({ error: "Add a valid calling number for your public profile." }, 400);
  if (whatsappInput && !whatsappPhone) return json({ error: "Enter a valid WhatsApp number, including the country code." }, 400);
  if (linkedinInput && !linkedinUrl) return json({ error: "Use a valid LinkedIn profile URL." }, 400);
  if (instagramInput && !instagramUrl) return json({ error: "Use a valid Instagram profile URL." }, 400);
  await ensureAdvisorProfile(env, session.email, session.role);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE hg_agent_profiles
       SET display_name = ?, phone = ?, title = ?, updated_at = CURRENT_TIMESTAMP
       WHERE email = ?`,
    ).bind(displayName, contactPhone, title, session.email),
    env.DB.prepare(
      `UPDATE hg_agent_advisor_profiles SET
         portfolio_headline = ?, portfolio_bio = ?, portfolio_specialties_json = ?,
         portfolio_recommendations_json = ?, portfolio_public = ?, whatsapp_phone = ?,
         linkedin_url = ?, instagram_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE agent_email = ?`,
    ).bind(
      headline,
      bio,
      JSON.stringify(specialties),
      JSON.stringify(recommendations),
      payload.portfolioPublic ? 1 : 0,
      whatsappPhone,
      linkedinUrl,
      instagramUrl,
      session.email,
    ),
  ]);
  return json({ ok: true, profile: await advisorProfileResponse(env, session) });
}

type SecondaryUnitInput = {
  title?: string;
  community?: string;
  emirate?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: number | string;
  sizeSqft?: number | string;
  priceAed?: number | string;
  reference?: string;
  imageUrl?: string;
  description?: string;
  status?: string;
  published?: boolean;
};

type ValidSecondaryUnit = {
  title: string;
  community: string;
  emirate: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: number;
  sizeSqft: number;
  priceAed: number;
  reference: string;
  imageUrl: string;
  description: string;
  status: SecondaryUnitRow["status"];
  published: boolean;
};

function wholeNumber(value: unknown, minimum: number, maximum: number) {
  const numeric = typeof value === "number" ? value : Number(clean(value, 24).replaceAll(",", ""));
  return Number.isFinite(numeric) && Number.isInteger(numeric) && numeric >= minimum && numeric <= maximum ? numeric : -1;
}

function secondaryUnitInput(payload: SecondaryUnitInput): { unit?: ValidSecondaryUnit; error?: string } {
  const title = clean(payload.title, 120);
  const community = clean(payload.community, 100);
  const emirate = clean(payload.emirate, 50) || "Dubai";
  const propertyType = clean(payload.propertyType, 60);
  const bedrooms = clean(payload.bedrooms, 40);
  const bathrooms = wholeNumber(payload.bathrooms ?? 0, 0, 30);
  const sizeSqft = wholeNumber(payload.sizeSqft, 1, 1_000_000);
  const priceAed = wholeNumber(payload.priceAed, 1, 1_000_000_000);
  const reference = clean(payload.reference, 80);
  const imageInput = clean(payload.imageUrl, 500);
  const imageUrl = imageInput ? normalizeHttpsUrl(imageInput) : "";
  const description = clean(payload.description, 1_000);
  const status = clean(payload.status, 30) as SecondaryUnitRow["status"];
  const allowedStatuses: SecondaryUnitRow["status"][] = ["available", "under_offer", "sold", "leased"];
  if (title.length < 3 || community.length < 2 || propertyType.length < 2 || !bedrooms) {
    return { error: "Add the unit title, community, property type and bedroom configuration." };
  }
  if (bathrooms < 0 || sizeSqft < 1 || priceAed < 1) {
    return { error: "Enter a valid price, internal area and bathroom count." };
  }
  if (imageInput && !imageUrl) return { error: "Use a secure HTTPS image URL." };
  if (!allowedStatuses.includes(status)) return { error: "Choose a valid unit status." };
  return {
    unit: {
      title,
      community,
      emirate,
      propertyType,
      bedrooms,
      bathrooms,
      sizeSqft,
      priceAed,
      reference,
      imageUrl,
      description,
      status,
      published: Boolean(payload.published),
    },
  };
}

function secondaryUnitResponse(row: SecondaryUnitRow) {
  return {
    id: row.id,
    title: row.title,
    community: row.community,
    emirate: row.emirate,
    propertyType: row.property_type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sizeSqft: row.size_sqft,
    priceAed: row.price_aed,
    reference: row.reference,
    imageUrl: row.image_url,
    description: row.description,
    status: row.status,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listSecondaryUnits(env: AgentEnv, agentEmail: string, publishedOnly = false) {
  const rows = await env.DB.prepare(
    `SELECT id, agent_email, title, community, emirate, property_type, bedrooms,
            bathrooms, size_sqft, price_aed, reference, image_url, description,
            status, published, created_at, updated_at
     FROM hg_agent_secondary_units
     WHERE agent_email = ? ${publishedOnly ? "AND published = 1" : ""}
     ORDER BY CASE status WHEN 'available' THEN 0 WHEN 'under_offer' THEN 1 ELSE 2 END,
              updated_at DESC
     LIMIT 60`,
  ).bind(agentEmail).all<SecondaryUnitRow>();
  return rows.results.map(secondaryUnitResponse);
}

async function createSecondaryUnit(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM hg_agent_secondary_units WHERE agent_email = ?",
  ).bind(session.email).first<{ total: number }>();
  if ((count?.total || 0) >= 60) return json({ error: "Archive or remove an older unit before adding another." }, 409);
  const parsed = secondaryUnitInput(await readJson<SecondaryUnitInput>(request));
  if (!parsed.unit) return json({ error: parsed.error || "Check the unit details." }, 400);
  const unit = parsed.unit;
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO hg_agent_secondary_units
     (id, agent_email, title, community, emirate, property_type, bedrooms,
      bathrooms, size_sqft, price_aed, reference, image_url, description, status, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    session.email,
    unit.title,
    unit.community,
    unit.emirate,
    unit.propertyType,
    unit.bedrooms,
    unit.bathrooms,
    unit.sizeSqft,
    unit.priceAed,
    unit.reference,
    unit.imageUrl,
    unit.description,
    unit.status,
    unit.published ? 1 : 0,
  ).run();
  const row = await env.DB.prepare(
    "SELECT * FROM hg_agent_secondary_units WHERE id = ? AND agent_email = ? LIMIT 1",
  ).bind(id, session.email).first<SecondaryUnitRow>();
  return json({ ok: true, unit: row ? secondaryUnitResponse(row) : null }, 201);
}

async function updateSecondaryUnit(request: Request, env: AgentEnv, session: AgentSession, id: string) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const owned = await env.DB.prepare(
    "SELECT id FROM hg_agent_secondary_units WHERE id = ? AND agent_email = ? LIMIT 1",
  ).bind(id, session.email).first<{ id: string }>();
  if (!owned) return json({ error: "Secondary unit not found." }, 404);
  const parsed = secondaryUnitInput(await readJson<SecondaryUnitInput>(request));
  if (!parsed.unit) return json({ error: parsed.error || "Check the unit details." }, 400);
  const unit = parsed.unit;
  await env.DB.prepare(
    `UPDATE hg_agent_secondary_units SET
       title = ?, community = ?, emirate = ?, property_type = ?, bedrooms = ?,
       bathrooms = ?, size_sqft = ?, price_aed = ?, reference = ?, image_url = ?,
       description = ?, status = ?, published = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND agent_email = ?`,
  ).bind(
    unit.title,
    unit.community,
    unit.emirate,
    unit.propertyType,
    unit.bedrooms,
    unit.bathrooms,
    unit.sizeSqft,
    unit.priceAed,
    unit.reference,
    unit.imageUrl,
    unit.description,
    unit.status,
    unit.published ? 1 : 0,
    id,
    session.email,
  ).run();
  const row = await env.DB.prepare(
    "SELECT * FROM hg_agent_secondary_units WHERE id = ? AND agent_email = ? LIMIT 1",
  ).bind(id, session.email).first<SecondaryUnitRow>();
  return json({ ok: true, unit: row ? secondaryUnitResponse(row) : null });
}

async function deleteSecondaryUnit(request: Request, env: AgentEnv, session: AgentSession, id: string) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const row = await env.DB.prepare(
    "SELECT title FROM hg_agent_secondary_units WHERE id = ? AND agent_email = ? LIMIT 1",
  ).bind(id, session.email).first<{ title: string }>();
  if (!row) return json({ error: "Secondary unit not found." }, 404);
  await env.DB.prepare(
    "DELETE FROM hg_agent_secondary_units WHERE id = ? AND agent_email = ?",
  ).bind(id, session.email).run();
  return json({ ok: true, deletedId: id, title: row.title });
}

async function publicAdvisorPortfolio(env: AgentEnv, slug: string) {
  const row = await env.DB.prepare(
    `SELECT p.display_name, p.email, p.phone, p.title, p.avatar_url,
            a.top_developers_json, a.top_projects_json, a.custom_projects_json, a.portfolio_headline,
            a.portfolio_bio, a.portfolio_specialties_json, a.portfolio_slug,
            a.whatsapp_phone, a.linkedin_url, a.instagram_url,
            a.property_finder_profile_url, a.property_finder_brn,
            a.property_finder_experience, a.property_finder_languages_json,
            a.property_finder_areas_json, a.property_finder_verified_at, a.updated_at
     FROM hg_agent_advisor_profiles a
     JOIN hg_agent_profiles p ON p.email = a.agent_email
     WHERE a.portfolio_slug = ? AND a.portfolio_public = 1
       AND a.onboarding_complete = 1 AND p.active = 1
     LIMIT 1`,
  ).bind(slug).first<{
    display_name: string; email: string; phone: string; title: string; avatar_url: string;
    top_developers_json: string; top_projects_json: string; custom_projects_json: string; portfolio_headline: string;
    portfolio_bio: string; portfolio_specialties_json: string; portfolio_slug: string;
    whatsapp_phone: string; linkedin_url: string; instagram_url: string;
    property_finder_profile_url: string; property_finder_brn: string;
    property_finder_experience: string; property_finder_languages_json: string;
    property_finder_areas_json: string; property_finder_verified_at: string; updated_at: string;
  }>();
  if (!row) return json({ error: "Advisor portfolio not found." }, 404);
  const projectSlugs = storedStringArray(row.top_projects_json, MAX_PROFILE_PROJECTS, 140);
  const customProjects = advisorCustomProjects(row.custom_projects_json);
  const secondaryUnits = await listSecondaryUnits(env, row.email, true);
  let propertyFinderData = await propertyFinderPortfolioData(env, row.email);
  if (
    row.property_finder_profile_url
    && propertyFinderData.listings.length === 0
    && propertyFinderRetryAvailable(propertyFinderData.sync.lastAttemptedAt)
  ) {
    try {
      await syncPropertyFinderForAgent(env, row.email, row.property_finder_profile_url);
      propertyFinderData = await propertyFinderPortfolioData(env, row.email);
    } catch {
      propertyFinderData = await propertyFinderPortfolioData(env, row.email);
    }
  }
  return Response.json({
    advisor: {
      name: row.display_name,
      email: row.email,
      phone: row.phone,
      whatsappPhone: row.whatsapp_phone,
      linkedinUrl: row.linkedin_url,
      instagramUrl: row.instagram_url,
      title: row.title,
      avatarUrl: row.avatar_url,
      headline: row.portfolio_headline,
      bio: row.portfolio_bio,
      specialties: storedStringArray(row.portfolio_specialties_json, 8, 80),
      topDevelopers: storedStringArray(row.top_developers_json, MAX_PROFILE_DEVELOPERS, 100),
      topProjects: [...selectedProjectSnapshots(projectSlugs), ...customProjects],
      propertyFinder: row.property_finder_brn || row.property_finder_profile_url ? {
        profileUrl: row.property_finder_profile_url,
        agencyUrl: PROPERTY_FINDER_AGENCY_URL,
        brn: row.property_finder_brn,
        experience: row.property_finder_experience,
        languages: storedStringArray(row.property_finder_languages_json, 8, 60),
        areas: storedStringArray(row.property_finder_areas_json, 10, 100),
        verifiedAt: row.property_finder_verified_at,
        listings: propertyFinderData.listings,
        sync: {
          status: propertyFinderData.sync.status,
          cachedCount: propertyFinderData.sync.cachedCount,
          totalCount: propertyFinderData.sync.totalCount,
          lastSyncedAt: propertyFinderData.sync.lastSyncedAt,
        },
      } : null,
      secondaryUnits,
      portfolioSlug: row.portfolio_slug,
      updatedAt: row.updated_at,
    },
  }, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function syncAllPropertyFinderListings(env: AgentEnv) {
  const rows = await env.DB.prepare(
    `SELECT agent_email, property_finder_profile_url
     FROM hg_agent_advisor_profiles
     WHERE property_finder_profile_url <> ''
     ORDER BY agent_email`,
  ).all<{ agent_email: string; property_finder_profile_url: string }>();
  let succeeded = 0;
  let failed = 0;
  for (const row of rows.results.slice(0, 20)) {
    try {
      await syncPropertyFinderForAgent(env, row.agent_email, row.property_finder_profile_url);
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }
  console.log(JSON.stringify({
    event: "property_finder_scheduled_sync_complete",
    attempted: rows.results.length,
    succeeded,
    failed,
  }));
  return { attempted: rows.results.length, succeeded, failed };
}

function projectContext(query: string, limit = 8) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  return registry.projects
    .map((project) => {
      const haystack = `${project.name} ${project.developer} ${project.area} ${project.emirate} ${project.propertyTypes.join(" ")} ${project.lifestyles.join(" ")}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { project, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ project }) => projectSnapshot(project));
}

async function aiText(env: AgentEnv, messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, maxTokens = 1200) {
  if (!env.AI) return "";
  const result = await env.AI.run(AI_MODEL, {
    messages,
    max_tokens: maxTokens,
    temperature: 0.25,
    repetition_penalty: 1.08,
  }) as AiTextResult;
  return clean(result?.response, 16_000);
}

async function aiBriefNarrative(env: AgentEnv, facts: string) {
  if (!env.AI) return {} as Partial<AiBriefNarrative>;
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      executiveSummary: { type: "string" },
      recommendation: { type: "string" },
      marketPosition: { type: "string" },
      locationStory: { type: "string" },
      riskNotes: { type: "array", items: { type: "string" }, maxItems: 6 },
    },
    required: ["executiveSummary", "recommendation", "marketPosition", "locationStory", "riskNotes"],
  };
  const result = await env.AI.run(AI_MODEL, {
    messages: [
      {
        role: "system",
        content: "You create customer-facing curated property briefs for HAUS & GRACE Properties in the UAE. Use only the supplied facts. Write persuasive but balanced advisory copy. Never invent a transaction, facility, distance, return, fee, availability, date or guarantee. Treat projected rent and returns as advisor-confirmed scenarios, not promises. Keep each prose field between 70 and 150 words and each risk note under 28 words.",
      },
      {
        role: "user",
        content: facts,
      },
    ],
    max_tokens: 1_400,
    temperature: 0.2,
    repetition_penalty: 1.08,
    response_format: { type: "json_schema", json_schema: schema },
  }) as AiTextResult;
  const response = clean(result?.response, 20_000);
  if (!response) return {} as Partial<AiBriefNarrative>;
  try {
    const withoutFence = response.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence) as Partial<AiBriefNarrative>;
    return {
      executiveSummary: clean(parsed.executiveSummary, 5_000),
      recommendation: clean(parsed.recommendation, 5_000),
      marketPosition: clean(parsed.marketPosition, 4_000),
      locationStory: clean(parsed.locationStory, 4_000),
      riskNotes: Array.isArray(parsed.riskNotes)
        ? parsed.riskNotes.map((item) => clean(item, 500)).filter(Boolean).slice(0, 6)
        : [],
    };
  } catch {
    const executiveSummary = await aiText(env, [
      {
        role: "system",
        content: "Write a 120-180 word customer-facing executive summary for a HAUS & GRACE UAE property brief. Use only the supplied facts. Be persuasive but balanced. Do not invent facts, guarantees, dates, returns or availability. Treat calculated returns as dated scenarios.",
      },
      { role: "user", content: facts },
    ], 650);
    return executiveSummary ? { executiveSummary } : {};
  }
}

function confirmedNumber(value: unknown, minimum: number, maximum: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

async function createDocument(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{
    type?: string;
    title?: string;
    clientName?: string;
    brief?: string;
    projectSlugs?: string[];
    projectFacts?: ConfirmedProjectInput[];
    factsConfirmed?: boolean;
  }>(request);
  const type = payload.type === "sales_offer" || payload.type === "proposal" || payload.type === "comparison" ? payload.type : "";
  if (!type) return json({ error: "Select a document type." }, 400);
  const slugs = [...new Set((payload.projectSlugs || []).map((slug) => clean(slug, 160)))].slice(0, MAX_PROJECTS);
  const projects = slugs.map((slug) => projectMap.get(slug)).filter((project): project is ProjectRecord => Boolean(project));
  const minimum = type === "comparison" ? 2 : 1;
  if (projects.length < minimum) return json({ error: `Select at least ${minimum} valid ${minimum === 1 ? "project" : "projects"}.` }, 400);
  if (!session.phone) return json({ error: "Add your advisor contact number before generating a client brief." }, 409);
  if (payload.factsConfirmed !== true) return json({ error: "Confirm the unit facts before generation." }, 400);

  const rawInputs = Array.isArray(payload.projectFacts) ? payload.projectFacts : [];
  const suppliedBySlug = new Map(rawInputs.map((input) => [clean(input?.slug, 160), input]));
  const confirmedInputs: ConfirmedProjectInput[] = [];
  for (const project of projects) {
    const input = suppliedBySlug.get(project.slug);
    if (!input) return json({ error: `Complete the confirmed unit facts for ${project.name}.` }, 400);
    const unitPrice = confirmedNumber(input.unitPrice, 100_000, 1_000_000_000);
    const unitAreaSqft = confirmedNumber(input.unitAreaSqft, 100, 100_000);
    const annualRent = confirmedNumber(input.annualRent, 1_000, 100_000_000);
    const annualRentLow = confirmedNumber(input.annualRentLow ?? Number(input.annualRent) * .9, 1_000, 100_000_000);
    const annualRentHigh = confirmedNumber(input.annualRentHigh ?? Number(input.annualRent) * 1.1, 1_000, 100_000_000);
    const occupancyRate = confirmedNumber(input.occupancyRate ?? 95, 0, 100);
    const serviceChargePerSqft = confirmedNumber(input.serviceChargePerSqft, 0, 500);
    const otherAnnualCosts = confirmedNumber(input.otherAnnualCosts, 0, 100_000_000);
    const acquisitionCosts = confirmedNumber(input.acquisitionCosts, 0, 100_000_000);
    if ([unitPrice, unitAreaSqft, annualRent, annualRentLow, annualRentHigh, occupancyRate, serviceChargePerSqft, otherAnnualCosts, acquisitionCosts].some((value) => value === null)) {
      return json({ error: `Review the price, area, rent and cost figures for ${project.name}.` }, 400);
    }
    if (annualRentLow! > annualRentHigh!) {
      return json({ error: `The low-rent case must not exceed the high-rent case for ${project.name}.` }, 400);
    }
    confirmedInputs.push({
      slug: project.slug,
      bedroom: clean(input.bedroom, 40) || project.bedrooms[0] || "Selected configuration",
      unitReference: clean(input.unitReference, 80) || "Selected unit",
      unitPrice: unitPrice!,
      unitAreaSqft: unitAreaSqft!,
      annualRent: annualRent!,
      annualRentLow: annualRentLow!,
      annualRentHigh: annualRentHigh!,
      occupancyRate: occupancyRate!,
      serviceChargePerSqft: serviceChargePerSqft!,
      otherAnnualCosts: otherAnnualCosts!,
      acquisitionCosts: acquisitionCosts!,
      rentalEvidenceNotes: clean(input.rentalEvidenceNotes, 600),
      confirmationNotes: clean(input.confirmationNotes, 600),
    });
  }

  const clientName = clean(payload.clientName, 120) || "Client";
  const brief = clean(payload.brief, 3_000);
  const title = clean(payload.title, 180) || (
    type === "sales_offer"
      ? `Curated offer for ${clientName}`
      : type === "proposal"
        ? `Curated property brief for ${clientName}`
        : `Curated project comparison for ${clientName}`
  );
  const reportProjects = buildReportProjects(projects, confirmedInputs);
  const confirmedAt = new Date().toISOString();
  const facts = reportProjects.map((project) => [
    `${project.name} by ${project.developer}, ${project.location}, ${project.emirate}`,
    `selected ${project.unitReference}`,
    `unit price AED ${project.unitPrice}`,
    `area ${project.unitAreaSqft} sqft`,
    `unit price AED ${Math.round(project.unitPricePerSqft)}/sqft`,
    `expected annual rent AED ${project.annualRent}`,
    `rent sensitivity AED ${project.annualRentLow} to AED ${project.annualRentHigh}`,
    `occupancy stress assumption ${project.occupancyRate}%`,
    `occupancy-adjusted rent AED ${project.effectiveAnnualRent}`,
    `service charge AED ${project.serviceChargePerSqft}/sqft/year`,
    `other annual costs AED ${project.otherAnnualCosts}`,
    `acquisition costs AED ${project.acquisitionCosts}`,
    `gross yield scenario ${project.grossYield.toFixed(2)}%`,
    `net yield scenario ${project.netYield.toFixed(2)}%`,
    `occupancy-adjusted net yield ${project.effectiveNetYield.toFixed(2)}%`,
    `advisory screen ${project.advisoryScreen.total}/100, ${project.advisoryScreen.label}`,
    `screen factors: ${project.advisoryScreen.factors.map((factor) => `${factor.label} ${factor.score}/100 at ${factor.weight}% weight`).join(", ")}`,
    project.areaBenchmark ? `area benchmark ${project.areaBenchmark.display}, ${project.areaBenchmark.period}` : "no area benchmark available",
    `rental evidence note: ${project.rentalEvidenceNotes || "not supplied"}`,
    `potential demand segments: ${project.demandSegments.join(", ")}`,
    project.demographicContext ? `demographic context: ${project.demographicContext.scope}; ${project.demographicContext.display}` : "no official demographic context embedded",
    `nearby: ${project.nearby.map((place) => `${place.name} approx. ${place.distanceKm}km`).join(", ") || "none calculated"}`,
    `upcoming local screen: ${project.upcoming.map((item) => `${item.name}, ${item.handover}${item.distanceKm === null ? "" : `, ${item.distanceKm}km`}`).join("; ") || "none in current index"}`,
  ].join(" | ")).join("\n");
  let narrative: Partial<AiBriefNarrative> = {};
  try {
    narrative = await aiBriefNarrative(
      env,
      `Document: ${type}\nClient: ${clientName}\nClient objective: ${brief || "Not supplied"}\nAdvisor-confirmed and system-calculated facts:\n${facts}`,
    );
  } catch (error) {
    console.error(JSON.stringify({ event: "agent_ai_draft_failed", message: error instanceof Error ? error.message : "unknown" }));
  }
  const content = buildCuratedBriefContent({
    projects: reportProjects,
    brief,
    narrative,
    advisor: {
      name: session.name,
      email: session.email,
      phone: session.phone,
      title: session.title,
    },
    confirmedAt,
  });
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO hg_agent_documents (id, agent_email, type, title, client_name, content_json, status)
     VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
  ).bind(id, session.email, type, title, clientName, JSON.stringify(content)).run();
  const document = await getDocument(env, session.email, id);
  return json({ ok: true, document }, 201);
}

async function getDocument(env: AgentEnv, email: string, id: string) {
  const row = await env.DB.prepare(
    `SELECT id, agent_email, type, title, client_name, content_json, status, created_at, updated_at
     FROM hg_agent_documents WHERE id = ? AND agent_email = ? LIMIT 1`,
  ).bind(id, email).first<SavedDocument>();
  if (!row) return null;
  return { ...row, content: JSON.parse(row.content_json) as DocumentContent, content_json: undefined };
}

async function listDocuments(env: AgentEnv, session: AgentSession) {
  const rows = session.role === "admin"
    ? await env.DB.prepare(
      `SELECT id, agent_email, type, title, client_name, status, created_at, updated_at
       FROM hg_agent_documents ORDER BY updated_at DESC LIMIT 200`,
    ).all()
    : await env.DB.prepare(
      `SELECT id, agent_email, type, title, client_name, status, created_at, updated_at
       FROM hg_agent_documents WHERE agent_email = ? ORDER BY updated_at DESC LIMIT 100`,
    ).bind(session.email).all();
  return rows.results;
}

async function deleteDocument(request: Request, env: AgentEnv, session: AgentSession, id: string) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const target = await env.DB.prepare(
    "SELECT agent_email, title FROM hg_agent_documents WHERE id = ? LIMIT 1",
  ).bind(id).first<{ agent_email: string; title: string }>();
  if (!target) return json({ error: "Document not found." }, 404);
  const isOwner = target.agent_email === session.email;
  if (!isOwner && session.role !== "admin") return json({ error: "You can only delete your own files." }, 403);

  const statements: D1PreparedStatement[] = [
    isOwner
      ? env.DB.prepare("DELETE FROM hg_agent_documents WHERE id = ? AND agent_email = ?").bind(id, session.email)
      : env.DB.prepare("DELETE FROM hg_agent_documents WHERE id = ?").bind(id),
  ];
  if (session.role === "admin") {
    statements.push(
      env.DB.prepare(
        `INSERT INTO hg_agent_admin_audit (id, admin_email, action, target_email, details)
         VALUES (?, ?, 'document_deleted', ?, ?)`,
      ).bind(crypto.randomUUID(), session.email, target.agent_email, JSON.stringify({
        documentId: id,
        title: target.title,
        ownDocument: isOwner,
      })),
    );
  }
  await env.DB.batch(statements);
  return json({ ok: true, deletedId: id });
}

async function updateDocument(request: Request, env: AgentEnv, session: AgentSession, id: string) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const existing = await getDocument(env, session.email, id);
  if (!existing) return json({ error: "Document not found." }, 404);
  const payload = await readJson<{ title?: string; clientName?: string; executiveSummary?: string; recommendation?: string; notes?: string }>(request);
  const content = existing.content;
  content.executiveSummary = clean(payload.executiveSummary ?? content.executiveSummary, 8_000);
  content.recommendation = clean(payload.recommendation ?? content.recommendation, 8_000);
  content.notes = clean(payload.notes ?? content.notes, 4_000);
  const title = clean(payload.title ?? existing.title, 180);
  const clientName = clean(payload.clientName ?? existing.client_name, 120);
  await env.DB.prepare(
    `UPDATE hg_agent_documents
     SET title = ?, client_name = ?, content_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND agent_email = ?`,
  ).bind(title, clientName, JSON.stringify(content), id, session.email).run();
  return json({ ok: true, document: await getDocument(env, session.email, id) });
}

function ascii(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
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

function drawWrapped(page: PDFPage, text: string, font: PDFFont, size: number, x: number, y: number, width: number, color = rgb(0.18, 0.18, 0.16), lineHeight = size * 1.45) {
  const lines = wrapText(text, font, size, width);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

async function renderDocumentPdf(document: Awaited<ReturnType<typeof getDocument>>, agent: AgentSession) {
  if (!document) throw new Error("Document not found.");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const gold = rgb(0.64, 0.45, 0.2);
  const ink = rgb(0.1, 0.105, 0.095);
  const muted = rgb(0.39, 0.38, 0.35);
  const paper = rgb(0.98, 0.97, 0.94);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 52;
  let page = pdf.addPage(pageSize);
  let y = 0;

  const header = () => {
    page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: paper });
    page.drawText("HAUS & GRACE", { x: margin, y: 792, size: 17, font: bold, color: gold });
    page.drawText("P R O P E R T I E S", { x: margin, y: 777, size: 7, font: bold, color: ink });
    page.drawLine({ start: { x: margin, y: 761 }, end: { x: pageSize[0] - margin, y: 761 }, thickness: 1, color: gold });
    page.drawText("PRIVATE CLIENT DOCUMENT", { x: pageSize[0] - margin - 120, y: 780, size: 7, font: bold, color: muted });
    y = 728;
  };
  const footer = () => {
    const pageNumber = pdf.getPageCount();
    page.drawLine({ start: { x: margin, y: 48 }, end: { x: pageSize[0] - margin, y: 48 }, thickness: .5, color: rgb(.76, .72, .64) });
    page.drawText(`Prepared by ${ascii(agent.name)} | ${agent.email}`, { x: margin, y: 30, size: 7, font: regular, color: muted });
    page.drawText(String(pageNumber).padStart(2, "0"), { x: pageSize[0] - margin - 12, y: 30, size: 7, font: bold, color: gold });
  };
  const nextPage = () => {
    footer();
    page = pdf.addPage(pageSize);
    header();
  };
  const ensure = (height: number) => {
    if (y - height < 74) nextPage();
  };
  const sectionTitle = (label: string, title: string) => {
    ensure(78);
    page.drawText(label.toUpperCase(), { x: margin, y, size: 7, font: bold, color: gold });
    y -= 25;
    y = drawWrapped(page, title, bold, 18, margin, y, pageSize[0] - margin * 2, ink, 22);
    y -= 13;
  };

  header();
  page.drawText(document.type.replace("_", " ").toUpperCase(), { x: margin, y, size: 8, font: bold, color: gold });
  y -= 38;
  y = drawWrapped(page, document.title, bold, 29, margin, y, 455, ink, 34);
  y -= 14;
  page.drawText(`Prepared for ${ascii(document.client_name)}`, { x: margin, y, size: 11, font: regular, color: muted });
  y -= 40;
  sectionTitle("Executive view", "Acquisition brief");
  y = drawWrapped(page, document.content.executiveSummary, regular, 10.5, margin, y, 485, ink, 16);
  y -= 24;

  sectionTitle("Selected opportunities", `${document.content.projects.length} project${document.content.projects.length === 1 ? "" : "s"} reviewed`);
  for (const [index, project] of document.content.projects.entries()) {
    ensure(156);
    page.drawRectangle({ x: margin, y: y - 123, width: 491, height: 128, borderColor: rgb(.78, .72, .61), borderWidth: .7, color: rgb(.955, .94, .9) });
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin + 15, y: y - 18, size: 8, font: bold, color: gold });
    page.drawText(ascii(project.name).slice(0, 52), { x: margin + 48, y: y - 20, size: 15, font: bold, color: ink });
    page.drawText(`${ascii(project.developer)} | ${ascii(project.location)}`.slice(0, 88), { x: margin + 48, y: y - 38, size: 8, font: regular, color: muted });
    const facts = [
      ["Starting price", project.startingPrice],
      ["Payment plan", project.paymentPlan],
      ["Handover", project.handover],
      ["Price per sqft", project.pricePerSqft],
      ["Residences", project.residences],
      ["Bedrooms", project.bedrooms],
    ];
    facts.forEach(([label, value], factIndex) => {
      const column = factIndex % 2;
      const row = Math.floor(factIndex / 2);
      const x = margin + 48 + column * 220;
      const factY = y - 64 - row * 24;
      page.drawText(label.toUpperCase(), { x, y: factY, size: 6.3, font: bold, color: gold });
      page.drawText(ascii(value).slice(0, 35), { x, y: factY - 11, size: 8.2, font: regular, color: ink });
    });
    y -= 146;
  }

  sectionTitle("Advisor perspective", "Recommendation");
  y = drawWrapped(page, document.content.recommendation, regular, 10.5, margin, y, 485, ink, 16);
  y -= 22;
  sectionTitle("HAUS & GRACE", "Advisory scope");
  for (const item of document.content.advisoryScope) {
    ensure(30);
    page.drawCircle({ x: margin + 4, y: y + 3, size: 2.2, color: gold });
    y = drawWrapped(page, item, regular, 9.5, margin + 16, y + 7, 470, ink, 14) - 6;
  }
  y -= 12;
  sectionTitle("Action plan", "Next steps");
  document.content.nextSteps.forEach((item, index) => {
    ensure(34);
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y, size: 8, font: bold, color: gold });
    y = drawWrapped(page, item, regular, 9.5, margin + 28, y + 4, 455, ink, 14) - 8;
  });
  ensure(80);
  y -= 12;
  page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: .7, color: gold });
  y -= 20;
  y = drawWrapped(page, "Important: This document is an advisory draft, not a binding offer. Availability, prices, areas, fees, finance terms, returns and completion dates must be reconfirmed against the selected unit and current transaction documents before commitment.", regular, 7.5, margin, y, 485, muted, 11);
  footer();

  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function documentFilename(document: { title: string }) {
  const stem = document.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "haus-grace-document";
  return `${stem}.pdf`;
}

async function chat(request: Request, env: AgentEnv, session: AgentSession) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const payload = await readJson<{ message?: string; conversationId?: string; mode?: string }>(request);
  const message = clean(payload.message, 6_000);
  if (message.length < 2) return json({ error: "Write a research or advisory question." }, 400);
  const mode = payload.mode === "research" ? "research" : "advisory";
  let conversationId = clean(payload.conversationId, 64);
  if (conversationId) {
    const owned = await env.DB.prepare("SELECT id FROM hg_agent_conversations WHERE id = ? AND agent_email = ?").bind(conversationId, session.email).first();
    if (!owned) conversationId = "";
  }
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO hg_agent_conversations (id, agent_email, title, mode) VALUES (?, ?, ?, ?)`,
    ).bind(conversationId, session.email, message.slice(0, 90), mode).run();
  }
  await env.DB.prepare(
    `INSERT INTO hg_agent_messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)`,
  ).bind(crypto.randomUUID(), conversationId, message).run();

  const historyRows = await env.DB.prepare(
    `SELECT role, content FROM hg_agent_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 14`,
  ).bind(conversationId).all<{ role: string; content: string }>();
  const history = [...historyRows.results].reverse()
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));
  const relevant = projectContext(message);
  const facts = relevant.length ? relevant.map((project) => [
    `${project.name} | ${project.developer} | ${project.location}, ${project.emirate}`,
    `starting scenario ${project.startingPrice} | payment plan ${project.paymentPlan} | handover ${project.handover}`,
    `catalogue price per sqft ${project.pricePerSqft}`,
    project.research.areaBenchmark
      ? `area benchmark ${project.research.areaBenchmark.display} | ${project.research.areaBenchmark.period} | ${project.research.areaBenchmark.note}`
      : "no dated area AED/sqft benchmark stored",
    `coordinate-based access: ${project.research.nearby.map((place) => `${place.name}, ${place.category}, approx. ${place.distanceKm} km`).join("; ") || "coordinates or destination coverage unavailable"}`,
    `nearby indexed pipeline: ${project.research.upcoming.map((item) => `${item.name}, ${item.handover}${item.distanceKm === null ? ", same area" : `, approx. ${item.distanceKm} km`}`).join("; ") || "no matching record; does not prove no supply"}`,
    `potential demand segments: ${project.research.demandSegments.join(", ")}`,
    project.research.demographicContext
      ? `demographic context: ${project.research.demographicContext.scope}; ${project.research.demographicContext.display}; ${project.research.demographicContext.note}`
      : "no official demographic context embedded",
    `rental evidence method: ${project.research.rentalEvidence.note}`,
  ].join("\n")).join("\n\n") : "No project record matched the query exactly.";
  let answer = "";
  try {
    answer = await aiText(env, [
      {
        role: "system",
        content: `You are the private research assistant for HAUS & GRACE Properties. Support UAE real-estate agents with acquisition analysis, rental and community research, client preparation, market framing and project comparison. Use only the supplied catalogue evidence for project-specific facts. Distinguish project, community and emirate-wide evidence. Clearly label assumptions and anything requiring live verification. Never promise returns, legal outcomes, finance approval or availability. You may name official government sources, but never name competing brokerages or upstream catalogue sources. Keep the HAUS & GRACE tone: refined, direct, analytical and client-value focused. ${mode === "research" ? "Structure research as Findings, Evidence, Rental and demand view, Risks and Next checks." : "Answer as concise advisory guidance with practical next actions."}`,
      },
      { role: "system", content: `Current HAUS & GRACE catalogue snapshot (${registry.generatedAt}; ${registry.totalUaeProjects} UAE projects). Relevant records:\n${facts}` },
      ...history,
    ], 1500);
  } catch (error) {
    console.error(JSON.stringify({ event: "agent_ai_chat_failed", message: error instanceof Error ? error.message : "unknown" }));
  }
  if (!answer) answer = `I could not complete the AI response at this moment. The relevant catalogue contains ${relevant.length} matching project record${relevant.length === 1 ? "" : "s"}. Refine the location, developer or project name and try again.`;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO hg_agent_messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)`,
    ).bind(crypto.randomUUID(), conversationId, answer),
    env.DB.prepare("UPDATE hg_agent_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(conversationId),
  ]);
  return json({
    ok: true,
    conversationId,
    message: { role: "assistant", content: answer },
    sources: [
      ...relevant.map((project) => ({ label: `${project.name}, ${project.location}`, href: `/projects/${project.slug}` })),
      ...(relevant.some((project) => project.emirate === "Dubai") ? [
        { label: "Dubai Land Department Rental Index", href: "https://dubailand.gov.ae/en/eservices/rental-index/" },
        { label: "Dubai Statistics Center Population Bulletin 2024", href: "https://www.dsc.gov.ae/Publication/Population%20Bulletin%20Emirate%20of%20Dubai%20-%202024.pdf" },
      ] : []),
    ],
  });
}

async function chatHistory(env: AgentEnv, session: AgentSession, conversationId: string) {
  if (!conversationId) {
    const conversations = await env.DB.prepare(
      `SELECT id, title, mode, created_at, updated_at FROM hg_agent_conversations WHERE agent_email = ? ORDER BY updated_at DESC LIMIT 50`,
    ).bind(session.email).all();
    return json({ conversations: conversations.results });
  }
  const owned = await env.DB.prepare("SELECT id, title, mode FROM hg_agent_conversations WHERE id = ? AND agent_email = ?").bind(conversationId, session.email).first();
  if (!owned) return json({ error: "Conversation not found." }, 404);
  const messages = await env.DB.prepare(
    `SELECT id, role, content, created_at FROM hg_agent_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 200`,
  ).bind(conversationId).all();
  return json({ conversation: owned, messages: messages.results });
}

async function downloadDocument(env: AgentEnv, session: AgentSession, id: string) {
  const document = await getDocument(env, session.email, id);
  if (!document) return json({ error: "Document not found." }, 404);
  if (!document.content.preparedAt || !document.content.confirmation) {
    return json({ error: "This older draft predates confirmed inputs. Regenerate it as a curated brief before download." }, 409);
  }
  const pdf = await renderCuratedBriefPdf(document as CuratedBriefDocument, env);
  return new Response(pdf, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="${curatedBriefFilename(document)}"`,
      "content-type": "application/pdf",
      "x-content-type-options": "nosniff",
    },
  });
}

async function sendDocument(request: Request, env: AgentEnv, session: AgentSession, id: string) {
  if (!validOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  if (!env.EMAIL) return json({ error: "Client email delivery is not active yet. Download the PDF while the sending domain is being enabled." }, 503);
  const document = await getDocument(env, session.email, id);
  if (!document) return json({ error: "Document not found." }, 404);
  if (!session.phone) return json({ error: "Add your advisor contact number before sending a client brief." }, 409);
  if (!document.content.preparedAt || !document.content.confirmation) {
    return json({ error: "This older draft predates confirmed inputs. Regenerate it as a curated brief before sending." }, 409);
  }
  const payload = await readJson<{ to?: string; subject?: string; message?: string }>(request);
  const to = clean(payload.to, 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: "Enter a valid client email." }, 400);
  const subject = clean(payload.subject, 180) || document.title;
  const message = clean(payload.message, 3_000) || `Please find the HAUS & GRACE curated brief prepared for ${document.client_name}.`;
  const pdf = await renderCuratedBriefPdf(document as CuratedBriefDocument, env);
  try {
    await env.EMAIL.send({
      to,
      from: { email: session.email, name: `${session.name} | HAUS & GRACE` },
      replyTo: session.email,
      subject,
      html: `<div style="margin:0;padding:38px;background:#f0ebe1;color:#191a18;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#faf8f3;border-top:4px solid #b8924f;padding:42px"><p style="color:#8a6a33;font-size:11px;letter-spacing:2px">HAUS &amp; GRACE PROPERTIES · CURATED BRIEF</p><h1 style="font-size:27px;font-weight:500">${escapeHtml(ascii(document.title))}</h1><p style="line-height:1.75">${escapeHtml(ascii(message)).replaceAll("\n", "<br>")}</p><p style="margin-top:32px;color:#5e5b54">${escapeHtml(ascii(session.name))}<br>${escapeHtml(ascii(session.title))}<br>${escapeHtml(ascii(session.phone))}<br>${escapeHtml(session.email)}<br>HAUS &amp; GRACE Properties</p></div></div>`,
      text: `${message}\n\n${session.name}\n${session.title}\n${session.phone}\n${session.email}\nHAUS & GRACE Properties`,
      attachments: [{ content: pdf, filename: curatedBriefFilename(document), type: "application/pdf", disposition: "attachment" }],
    });
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO hg_agent_email_log (id, document_id, agent_email, recipient_email, subject, status)
         VALUES (?, ?, ?, ?, ?, 'sent')`,
      ).bind(crypto.randomUUID(), id, session.email, to, subject),
      env.DB.prepare("UPDATE hg_agent_documents SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND agent_email = ?").bind(id, session.email),
    ]);
    return json({ ok: true, message: "Curated brief sent from your HAUS & GRACE email." });
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
    await env.DB.prepare(
      `INSERT INTO hg_agent_email_log (id, document_id, agent_email, recipient_email, subject, status, error)
       VALUES (?, ?, ?, ?, ?, 'failed', ?)`,
    ).bind(crypto.randomUUID(), id, session.email, to, subject, reason).run();
    console.error(JSON.stringify({ event: "agent_email_failed", documentId: id, agent: session.email, message: reason }));
    return json({ error: "The email could not be delivered. Download the PDF and try again after the sending service is checked." }, 502);
  }
}

export async function handleAgentRequest(request: Request, env: AgentEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = appPath(url.pathname);
  if (!path.startsWith("/api/agent")) return null;
  try {
    if (path === "/api/agent/auth/request" && request.method === "POST") return await requestOtp(request, env);
    if (path === "/api/agent/auth/verify" && request.method === "POST") return await verifyOtp(request, env);
    if (path === "/api/agent/auth/login" && request.method === "POST") return await passwordLogin(request, env);
    if (path === "/api/agent/auth/password/request" && request.method === "POST") return await requestOtp(request, env, "password");
    if (path === "/api/agent/auth/password/complete" && request.method === "POST") return await completePasswordSetup(request, env);
    if (path === "/api/agent/logout" && request.method === "POST") return await logout(request, env);
    const publicPortfolioMatch = path.match(/^\/api\/agent\/portfolio\/([a-z0-9-]+)$/);
    if (publicPortfolioMatch && request.method === "GET") return await publicAdvisorPortfolio(env, publicPortfolioMatch[1]);

    const session = await requireSession(request, env);
    if (path === "/api/agent/session" && request.method === "GET") return json({ user: session });
    if (path === "/api/agent/auth/password/change" && request.method === "POST") return await changePassword(request, env, session);
    if (session.mustChangePassword) return json({ error: "Change the temporary password before opening the workspace." }, 403);
    if (path === "/api/agent/advisor-profile") {
      if (request.method === "GET") return json({
        profile: await advisorProfileResponse(env, session),
        developerOptions,
        featuredProjects: searchProjects("", 18),
      });
      if (request.method === "POST") return await saveAdvisorPreferences(request, env, session);
      if (request.method === "PATCH") return await amendAdvisorProfile(request, env, session);
    }
    if (path === "/api/agent/property-finder/sync" && request.method === "POST") {
      return await refreshPropertyFinderListings(request, env, session);
    }
    if (path === "/api/agent/profile" && request.method === "PATCH") return await updateProfile(request, env, session);
    if (path === "/api/agent/secondary-units") {
      if (request.method === "GET") return json({ units: await listSecondaryUnits(env, session.email) });
      if (request.method === "POST") return await createSecondaryUnit(request, env, session);
    }
    const secondaryUnitMatch = path.match(/^\/api\/agent\/secondary-units\/([a-f0-9-]{36})$/i);
    if (secondaryUnitMatch) {
      if (request.method === "PATCH") return await updateSecondaryUnit(request, env, session, secondaryUnitMatch[1]);
      if (request.method === "DELETE") return await deleteSecondaryUnit(request, env, session, secondaryUnitMatch[1]);
    }
    if (path === "/api/agent/admin/users") {
      requireAdmin(session);
      if (request.method === "GET") return json({ users: await listAdminUsers(env) });
      if (request.method === "POST") return await createAdminUser(request, env, session);
      if (request.method === "PATCH") return await updateAdminUser(request, env, session);
    }
    const adminUserMatch = path.match(/^\/api\/agent\/admin\/users\/([^/]+)$/);
    if (adminUserMatch) {
      requireAdmin(session);
      if (request.method === "DELETE") {
        return await deleteAdminUser(request, env, session, decodeURIComponent(adminUserMatch[1]));
      }
    }
    if (path === "/api/agent/projects" && request.method === "GET") return json({ projects: searchProjects(clean(url.searchParams.get("q"), 120)), total: registry.totalUaeProjects, updatedAt: registry.generatedAt });
    if (path === "/api/agent/chat" && request.method === "POST") return await chat(request, env, session);
    if (path === "/api/agent/chats" && request.method === "GET") return await chatHistory(env, session, clean(url.searchParams.get("conversationId"), 64));
    if (path === "/api/agent/documents" && request.method === "GET") return json({ documents: await listDocuments(env, session) });
    if (path === "/api/agent/documents" && request.method === "POST") return await createDocument(request, env, session);

    const match = path.match(/^\/api\/agent\/documents\/([a-f0-9-]{36})(?:\/(download|send))?$/i);
    if (match) {
      const [, id, action] = match;
      if (!action && request.method === "GET") {
        const document = await getDocument(env, session.email, id);
        return document ? json({ document }) : json({ error: "Document not found." }, 404);
      }
      if (!action && request.method === "PATCH") return await updateDocument(request, env, session, id);
      if (!action && request.method === "DELETE") return await deleteDocument(request, env, session, id);
      if (action === "download" && request.method === "GET") return await downloadDocument(env, session, id);
      if (action === "send" && request.method === "POST") return await sendDocument(request, env, session, id);
    }
    return json({ error: "Agent workspace endpoint not found." }, 404);
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Unable to complete this request.";
    const status = /too large|JSON/i.test(message) ? 400 : 500;
    console.error(JSON.stringify({ event: "agent_api_error", path, message }));
    return json({ error: status === 500 ? "The workspace could not complete this request." : message }, status);
  }
}

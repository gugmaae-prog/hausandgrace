const PROPERTY_FINDER_ORIGIN = "https://www.propertyfinder.ae";
const PROPERTY_FINDER_IMAGE_HOST = "static.shared.propertyfinder.ae";

export type PropertyFinderListing = {
  externalId: string;
  externalUrl: string;
  reference: string;
  title: string;
  location: string;
  propertyType: string;
  listingType: "sale" | "rent";
  bedrooms: string;
  bathrooms: number;
  sizeSqft: number;
  priceAed: number;
  imageUrl: string;
  listedAt: string;
  featured: boolean;
};

export type PropertyFinderProfileSnapshot = {
  agentName: string;
  agentEmail: string;
  totalCount: number;
  listings: PropertyFinderListing[];
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, maximum) : "";
}

function positiveNumber(value: unknown, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= maximum ? number : 0;
}

function secureUrl(value: unknown, expectedHost?: string) {
  const candidate = text(value, 700);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || (expectedHost && url.hostname !== expectedHost)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function listingUrl(value: unknown) {
  const url = secureUrl(value, "www.propertyfinder.ae");
  if (!url) return "";
  const path = new URL(url).pathname;
  return /^\/en\/plp\/(?:buy|rent)\//.test(path) && path.endsWith(".html") ? url : "";
}

function listingKind(raw: UnknownRecord, url: string): "sale" | "rent" {
  const price = record(raw.price);
  const period = text(price?.period, 30).toLowerCase();
  const offeringType = text(raw.offering_type, 30).toLowerCase();
  return url.includes("/plp/rent/") || period !== "sell" || offeringType.includes("rent") ? "rent" : "sale";
}

function scriptJson(html: string, id: string) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<script[^>]+id=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"));
  if (!match?.[1]) throw new Error(`The ${id} data block was not found.`);
  return JSON.parse(match[1]) as unknown;
}

function rawProperties(nextData: UnknownRecord) {
  const props = record(nextData.props);
  const pageProps = record(props?.pageProps);
  const property = record(pageProps?.property);
  const direct = Array.isArray(property?.properties) ? property.properties : [];
  if (direct.length) return { property, listings: direct };
  const wrapped = Array.isArray(property?.listings) ? property.listings : [];
  return {
    property,
    listings: wrapped.map((item) => record(item)?.property).filter(Boolean),
  };
}

function mapListing(value: unknown, expectedEmail: string): PropertyFinderListing | null {
  const raw = record(value);
  if (!raw) return null;
  const agent = record(raw.agent);
  const broker = record(raw.broker);
  const agentEmail = text(agent?.email, 180).toLowerCase();
  const brokerName = text(broker?.name, 160).toLowerCase().replace(/[^a-z]/g, "");
  if (agentEmail !== expectedEmail || !brokerName.includes("hausgraceproperties")) return null;

  const externalUrl = listingUrl(raw.share_url);
  const externalId = text(raw.id ?? raw.listing_id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
  const price = record(raw.price);
  const size = record(raw.size);
  const images = Array.isArray(raw.images) ? raw.images : [];
  const firstImage = record(images[0]);
  const imageUrl = secureUrl(firstImage?.medium || firstImage?.small, PROPERTY_FINDER_IMAGE_HOST);
  const location = record(raw.location);
  const priceAed = text(price?.currency, 12).toUpperCase() === "AED"
    ? positiveNumber(price?.value, 1_000_000_000)
    : 0;
  if (!externalUrl || !externalId || !priceAed) return null;

  return {
    externalId,
    externalUrl,
    reference: text(raw.reference, 100),
    title: text(raw.title, 180) || "UAE property",
    location: text(location?.full_name, 220),
    propertyType: text(raw.property_type, 80) || "Residence",
    listingType: listingKind(raw, externalUrl),
    bedrooms: text(raw.bedrooms, 40) || "—",
    bathrooms: Math.round(positiveNumber(raw.bathrooms, 30)),
    sizeSqft: Math.round(positiveNumber(size?.value, 1_000_000)),
    priceAed: Math.round(priceAed),
    imageUrl,
    listedAt: text(raw.listed_date, 40),
    featured: Boolean(raw.is_featured || raw.is_premium || raw.is_spotlight_listing),
  };
}

export function parsePropertyFinderProfileHtml(html: string, expectedAgentEmail: string): PropertyFinderProfileSnapshot {
  const expectedEmail = expectedAgentEmail.trim().toLowerCase();
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@hausandgrace\.ae$/.test(expectedEmail)) {
    throw new Error("A valid HAUS & GRACE advisor email is required.");
  }
  const nextData = record(scriptJson(html, "__NEXT_DATA__"));
  if (!nextData) throw new Error("The Property Finder profile data is invalid.");
  const props = record(nextData.props);
  const pageProps = record(props?.pageProps);
  const profileAgent = record(pageProps?.agent);
  const { property, listings: rawListings } = rawProperties(nextData);
  const meta = record(property?.meta);
  const mapped = rawListings
    .map((listing) => mapListing(listing, expectedEmail))
    .filter((listing): listing is PropertyFinderListing => Boolean(listing));
  const listings = [...new Map(mapped.map((listing) => [listing.externalId, listing])).values()].slice(0, 20);
  if (!listings.length) throw new Error("No listings owned by this advisor were found on the linked profile.");

  const firstRaw = record(rawListings.find((listing) => {
    const agent = record(record(listing)?.agent);
    return text(agent?.email, 180).toLowerCase() === expectedEmail;
  }));
  const owner = record(firstRaw?.agent);
  const agentEmail = text(owner?.email, 180).toLowerCase();
  if (agentEmail !== expectedEmail) throw new Error("The linked profile does not belong to this advisor.");
  const profileEmail = text(profileAgent?.email, 180).toLowerCase();
  if (profileEmail && profileEmail !== expectedEmail) throw new Error("The linked profile does not belong to this advisor.");

  return {
    agentName: text(profileAgent?.name, 120) || text(owner?.name, 120),
    agentEmail,
    totalCount: Math.max(
      listings.length,
      Math.round(positiveNumber(meta?.total_count, 10_000)),
      Math.round(positiveNumber(profileAgent?.totalProperties, 10_000)),
    ),
    listings,
  };
}

export function validPropertyFinderAgentUrl(value: string) {
  const url = secureUrl(value, "www.propertyfinder.ae");
  if (!url) return "";
  const candidate = new URL(url);
  return /^\/en\/agent\/[a-z0-9-]+-\d+$/.test(candidate.pathname) ? candidate.toString() : "";
}

export async function boundedResponseText(response: Response, maximumBytes: number) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maximumBytes) {
    await response.body?.cancel();
    throw new Error("The profile response exceeded the safe size limit.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let output = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maximumBytes) {
        await reader.cancel();
        throw new Error("The profile response exceeded the safe size limit.");
      }
      output += decoder.decode(value, { stream: true });
    }
    output += decoder.decode();
    return output;
  } finally {
    reader.releaseLock();
  }
}

export { PROPERTY_FINDER_ORIGIN };

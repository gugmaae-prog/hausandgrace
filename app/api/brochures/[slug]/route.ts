import { verifiedPdfResponse } from "@/lib/verified-pdf";
import { unavailableBrochureSlugs } from "@/lib/catalogue-corrections";
import { getProjectRecord } from "@/lib/imported-projects";

type RouteContext = { params: Promise<{ slug: string }> };

const TRUSTED_BROCHURE_HOSTS = new Set(["cdn.opr.ae", "new-projects-media.propertyfinder.com"]);

function brochureUrlFor(slug: string) {
  const record = getProjectRecord(slug);
  if (!record?.brochure || unavailableBrochureSlugs.has(slug)) return null;

  try {
    const url = new URL(record.brochure);
    const isPdf = /\.pdf$/i.test(decodeURIComponent(url.pathname));
    return url.protocol === "https:" && TRUSTED_BROCHURE_HOSTS.has(url.hostname) && isPdf ? url : null;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const brochureUrl = brochureUrlFor(slug);
  if (!brochureUrl) return new Response("Project brochure is not available.", { status: 404, headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" } });

  const requestHeaders = new Headers({
    accept: "application/pdf",
    "user-agent": "HAUS-GRACE-Brochure-Service/1.0",
  });
  const upstream = await fetch(brochureUrl, { headers: requestHeaders });
  const body = await verifiedPdfResponse(upstream);
  if (!body) {
    return new Response("Project brochure is temporarily unavailable.", { status: 502, headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" } });
  }

  const headers = new Headers({
    "accept-ranges": "none",
    "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "content-disposition": `inline; filename="${slug}-brochure.pdf"`,
    "content-type": "application/pdf",
    "x-content-type-options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  const modified = upstream.headers.get("last-modified");
  const etag = upstream.headers.get("etag");
  if (length) headers.set("content-length", length);
  if (modified) headers.set("last-modified", modified);
  if (etag) headers.set("etag", etag);

  return new Response(body, { status: 200, headers });
}

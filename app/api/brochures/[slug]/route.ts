import { getProjectRecord } from "@/lib/imported-projects";

type RouteContext = { params: Promise<{ slug: string }> };

const TRUSTED_BROCHURE_HOSTS = new Set(["cdn.opr.ae", "new-projects-media.propertyfinder.com"]);

function brochureUrlFor(slug: string) {
  const record = getProjectRecord(slug);
  if (!record?.brochure) return null;

  try {
    const url = new URL(record.brochure);
    const isPdf = /\.pdf$/i.test(decodeURIComponent(url.pathname));
    return url.protocol === "https:" && TRUSTED_BROCHURE_HOSTS.has(url.hostname) && isPdf ? url : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const brochureUrl = brochureUrlFor(slug);
  if (!brochureUrl) return new Response("Project brochure is not available.", { status: 404 });

  const requestHeaders = new Headers({
    accept: "application/pdf",
    "user-agent": "HAUS-GRACE-Brochure-Service/1.0",
  });
  const range = request.headers.get("range");
  if (range) requestHeaders.set("range", range);
  const upstream = await fetch(brochureUrl, { headers: requestHeaders });
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel();
    return new Response("Project brochure is temporarily unavailable.", { status: 502 });
  }

  const headers = new Headers({
    "accept-ranges": upstream.headers.get("accept-ranges") || "bytes",
    "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "content-disposition": `inline; filename="${slug}-brochure.pdf"`,
    "content-type": "application/pdf",
    "x-content-type-options": "nosniff",
  });
  const length = upstream.headers.get("content-length");
  const modified = upstream.headers.get("last-modified");
  const contentRange = upstream.headers.get("content-range");
  const etag = upstream.headers.get("etag");
  if (length) headers.set("content-length", length);
  if (modified) headers.set("last-modified", modified);
  if (contentRange) headers.set("content-range", contentRange);
  if (etag) headers.set("etag", etag);

  return new Response(upstream.body, { status: upstream.status === 206 ? 206 : 200, headers });
}

/** Cloudflare Worker entry point for the HAUS & GRACE application. */
import handler from "vinext/server/app-router-entry";
import { handleAgentRequest, syncAllPropertyFinderListings } from "./agent-backend";

const STATIC_ASSET = /\.(?:avif|css|gif|ico|jpe?g|js|json|png|svg|webp|woff2?)$/i;

function isStaticAsset(pathname: string) {
  return pathname.includes("/_next/static/") || STATIC_ASSET.test(pathname);
}

function withProductionHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === "www.hausandgrace.ae") {
      url.hostname = "hausandgrace.ae";
      url.protocol = "https:";
      return withProductionHeaders(Response.redirect(url.toString(), 301));
    }
    const agentResponse = await handleAgentRequest(request, env);
    if (agentResponse) return withProductionHeaders(agentResponse);
    if ((request.method === "GET" || request.method === "HEAD") && isStaticAsset(url.pathname)) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return withProductionHeaders(asset);
    }
    return withProductionHeaders(await handler.fetch(request, env, ctx));
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(syncAllPropertyFinderListings(env));
  },
};

export default worker;

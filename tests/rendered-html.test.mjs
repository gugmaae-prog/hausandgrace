import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("renders production HAUS & GRACE metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request(`http://localhost${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>UAE Real Estate and Property Investment \| HAUS &amp; GRACE<\/title>/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/hausandgrace\.ae"\/>/i);
  assert.match(html, /UAE real estate/i);
  assert.match(html, /Real estate decisions/i);
  assert.match(html, /Built around value/i);
  assert.match(html, /museum-sequence-light\/01-stage\.jpg/i);
  assert.match(html, /museum-sequence-light\/09-stage\.jpg/i);
  assert.doesNotMatch(html, /Dubai, drawn into being|Move or touch to reveal the completed skyline/i);
  assert.match(html, /Explore live projects/i);
  assert.doesNotMatch(html, /\b1,312\b|\b1312\b/i);
  assert.match(html, /Developers/i);
  assert.match(html, /Communities/i);
  assert.match(html, /Insights/i);
  assert.match(html, /Agent login/i);
  assert.doesNotMatch(html, /<nav[^>]*>[\s\S]*?href="[^"]*mortgage-calculator"[\s\S]*?<\/nav>/i);
  assert.match(html, /58 five-star Google reviews/i);
  assert.doesNotMatch(html, /with poise|preview property|preview selection|PRIVATE CLIENT REAL ESTATE · INVESTMENT ADVISORY/i);
  assert.doesNotMatch(html, /Source project imagery|OPR UAE|OPR-linked|Correct imagery/i);
  assert.doesNotMatch(html, /[↗↘↑→←▶Ⅱ×©]|\p{Extended_Pictographic}/u);
  assert.doesNotMatch(html, /images\.unsplash\.com|images\.pexels\.com/i);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("UAE project registry is complete and internally consistent", async () => {
  const registry = JSON.parse(await readFile(new URL("../data/projects.json", import.meta.url), "utf8"));
  const slugs = registry.projects.map((project) => project.slug);
  assert.equal(registry.totalUaeProjects, registry.projects.length);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(registry.currentUaeProjects + registry.archivedUaeProjects, registry.totalUaeProjects);
  assert.ok(registry.totalUaeProjects >= 1300);
  assert.ok(registry.projects.every((project) => project.slug && project.name && project.developer && project.emirate && project.area));
  assert.ok(registry.projects.every((project) => !project.image || /^https:\/\/(?:cdn\.opr\.ae|img[123]\.creatium\.ru|i\.1\.creatium\.io)\//.test(project.image)));
  assert.ok(registry.projects.every((project) => !/(?:^|[/_.-])(logo|favicon|whatsapp|telegram|qr(?:code)?|barcode|scan[-_]?me)(?:[/_.-]|$)/i.test(project.image)));
  const brochures = registry.projects.filter((project) => project.brochure);
  assert.ok(brochures.length >= 850);
  assert.ok(brochures.every((project) => /^https:\/\/cdn\.opr\.ae\/.+\.pdf(?:[?#].*)?$/i.test(project.brochure)));
  const visibleText = registry.projects.map((project) => `${project.name} ${project.developer} ${project.area} ${project.description}`).join(" ");
  assert.equal(visibleText.match(/Metropolitan Premium Properties|\bOPR(?:\.AE)?\b/gi), null);
  assert.deepEqual(Object.keys(registry.emirates).sort(), ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"]);
});

test("renders every valid payment milestone without empty circles", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("payment-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request(`http://localhost${process.env.NEXT_PUBLIC_BASE_PATH || ""}/projects/marea-residences-sharafi-dubai-islands`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal((html.match(/class="payment-milestone"/g) || []).length, 3);
  assert.match(html, /<strong>40\/30\/30<\/strong>/i);
  assert.match(html, /On booking/i);
  assert.match(html, /During construction/i);
  assert.match(html, /On handover/i);
  assert.match(html, /Project AED\/sqft/i);
  assert.match(html, /AED 1,967\/sqft/i);
  assert.match(html, /Mortgage calculator/i);
  assert.match(html, /CBUAE maximum LTV/i);
  assert.match(html, /Regulatory finance ceiling/i);
  assert.match(html, /Hide calculator/i);
  assert.match(html, /Selecting a configuration updates an indicative planning price/i);
  assert.match(html, /Editable unit price/i);
  assert.match(html, /typical UAE size bands/i);
  assert.match(html, /Editable developer payment schedule/i);
  assert.match(html, /Plan total/i);
  assert.match(html, /the plan must total exactly 100%/i);
  assert.match(html, /Project literature/i);
  assert.match(html, /Project brochure available/i);
  assert.match(html, /api\/brochures\/marea-residences-sharafi-dubai-islands/i);
  assert.doesNotMatch(html, /cdn\.opr\.ae\/upload\/brochures/i);
  assert.match(html, /<span class="payment-divider" aria-hidden="true"><\/span>/i);
  assert.doesNotMatch(html, /<div class="payment-divider"/i);
  assert.match(html, /Continue the shortlist/i);
  assert.equal((html.match(/class="project-preview-card"/g) || []).length, 3);
  assert.doesNotMatch(html, /qr[-_ ]?code|scan[-_]?me|whatsapp[-_ ]?qr/i);
});

test("renders the curated upcoming releases and Imtiaz DLRC launch", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("launch-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  async function render(path) {
    const response = await worker.fetch(new Request(`http://localhost${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`, { headers: { accept: "text/html" } }), env, context);
    assert.equal(response.status, 200);
    return response.text();
  }

  const [linar, ellington, imtiaz, imtiazDeveloper, searchResponse] = await Promise.all([
    render("/projects/linar-towers-d-e-al-mamzar-sharjah"),
    render("/projects/ellington-villa-townhouse-community-al-yalayis-dubai"),
    render("/projects/imtiaz-dlrc-tower"),
    render("/developers/imtiaz"),
    worker.fetch(new Request(`http://localhost${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/projects?q=Linar`, { headers: { accept: "application/json" } }), env, context),
  ]);

  assert.match(linar, /Upcoming release/i);
  assert.match(linar, /AED 945,000/i);
  assert.match(linar, /AED 1,450,000/i);
  assert.match(linar, /AED 2,450,000/i);
  assert.match(linar, /AED 20,000/i);
  assert.match(linar, /AED 30,000/i);
  assert.match(linar, /AED 40,000/i);
  assert.match(linar, /Published configuration prices are used where available/i);
  assert.match(linar, /api\/brochures\/linar-towers-d-e-al-mamzar-sharjah/i);
  assert.match(linar, /project-enquiry-float/i);
  assert.match(linar, /Check live availability/i);
  assert.match(linar, /project-lead-modal/i);
  assert.match(linar, /Close enquiry form/i);
  assert.match(linar, /Request the live/i);
  assert.doesNotMatch(linar, /qr[-_ ]?code|scan[-_]?me|whatsapp[-_ ]?qr/i);

  assert.match(ellington, /Ellington Villa &amp; Townhouse Community/i);
  assert.match(ellington, /Upcoming release/i);
  assert.match(ellington, /1,900–4,800 sq ft/i);
  assert.match(ellington, /Approx\. AED 2,500,000/i);
  assert.match(ellington, /Indicative AED\/sqft/i);
  assert.match(ellington, /AED 1,600\/sqft/i);
  assert.match(ellington, /70\/30/i);
  assert.match(ellington, /Al Yalayis/i);
  assert.match(ellington, /Exterior-1-scaled\.jpg/i);
  assert.match(ellington, /project-enquiry-float/i);
  assert.match(ellington, /project-lead-modal/i);
  assert.match(ellington, /Request the live/i);

  assert.match(imtiaz, /Imtiaz DLRC Tower/i);
  assert.match(imtiaz, /AED 625,000/i);
  assert.match(imtiaz, /20\/40\/40/i);
  assert.match(imtiaz, /Q2 2027/i);
  assert.match(imtiazDeveloper, /Imtiaz Developments/i);
  assert.match(imtiazDeveloper, /DLRC pipeline/i);
  assert.match(imtiazDeveloper, /Imtiaz DLRC Tower/i);

  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json();
  assert.ok(search.projects.some((project) => project.slug === "linar-towers-d-e-al-mamzar-sharjah"));
});

test("renders visible directories, legal copy and the complete research observatory", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("surface-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  async function render(path) {
    const response = await worker.fetch(new Request(`http://localhost${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`, { headers: { accept: "text/html" } }), env, context);
    assert.equal(response.status, 200);
    return response.text();
  }

  const [developers, communities, insightIndex, privacy, researchArticle, priceGuideArticle, mortgage, listing, about, favicon] = await Promise.all([
    render("/developers"),
    render("/communities"),
    render("/insights"),
    render("/privacy"),
    render("/insights/dubai-market-pulse-monthly-quarterly-historical-2026"),
    render("/insights/price-per-square-foot-uae-property-guide-2026"),
    render("/mortgage-calculator"),
    render("/list-your-property"),
    render("/about"),
    readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
  ]);

  assert.match(developers, /developer profiles/i);
  assert.match(communities, /community guides/i);
  assert.match(insightIndex, /Market observatory/i);
  assert.match(insightIndex, /Monthly pulse/i);
  assert.match(insightIndex, /Quarterly comparison/i);
  assert.match(insightIndex, /Historical depth/i);
  assert.match(insightIndex, /Global hotspot comparison/i);
  assert.match(insightIndex, /Real estate resilience after conflict/i);
  assert.match(insightIndex, /Price per square foot in UAE property/i);
  assert.match(insightIndex, /Mortgage planning before reservation/i);
  assert.match(insightIndex, /Service charges and net yield/i);
  assert.match(researchArticle, /Evidence dashboard/i);
  assert.match(researchArticle, /Research sources/i);
  assert.match(researchArticle, /16\.1k/i);
  assert.match(priceGuideArticle, /AED 1,916\/sq\.ft/i);
  assert.match(priceGuideArticle, /AED 3,011\/sq\.ft/i);
  assert.match(priceGuideArticle, /AED 1,783\/sq\.ft/i);
  assert.match(mortgage, /Mortgage calculator/i);
  assert.match(mortgage, /Estimated monthly payment/i);
  assert.match(mortgage, /CBUAE maximum LTV/i);
  assert.match(mortgage, /Hide calculator/i);
  assert.match(listing, /List your unit with HAUS &amp; GRACE/i);
  assert.match(listing, /The marketing system/i);
  assert.match(listing, /Request a private appraisal/i);
  assert.match(listing, /58 five-star Google reviews/i);
  assert.match(about, /The name behind the business/i);
  assert.match(about, /Gujarat, 2008/i);
  assert.match(about, /residential and commercial sales and leasing/i);
  assert.match(about, /ORN 1182853/i);
  assert.match(about, /Agent login/i);
  assert.match(about, /about-jumeirah-burj-banner\.webp/i);
  assert.match(about, /Mehul Mistry/i);
  assert.match(about, /Irfan Baismail/i);
  assert.match(about, /Urvashi Saraiya/i);
  assert.match(about, /Priya Mistry/i);
  assert.match(privacy, /class="legal-page"/i);
  assert.match(privacy, /Information we collect/i);
  assert.match(favicon, /#68C4FF/i);
  assert.match(favicon, /#0C79D8/i);
});

test("protects and renders the branded private agent workspace", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("agent-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const page = await worker.fetch(
    new Request(`http://localhost${basePath}/agent`, { headers: { accept: "text/html" } }),
    env,
    context,
  );
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Private Agent Workspace/i);
  assert.match(html, /Secure HAUS &amp; GRACE workspace for property research, client proposals, sales offers and project comparisons/i);
  assert.match(html, /Opening private workspace/i);
  assert.match(html, /noindex/i);
  assert.doesNotMatch(html, /\p{Extended_Pictographic}/u);

  const session = await worker.fetch(
    new Request(`http://localhost${basePath}/api/agent/session`, { headers: { accept: "application/json" } }),
    env,
    context,
  );
  assert.equal(session.status, 401);
  assert.deepEqual(await session.json(), { error: "Staff sign-in required." });
});

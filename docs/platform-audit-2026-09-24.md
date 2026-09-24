# Haus & Grace Platform Audit — 24 September 2026

## Executive summary

- GitHub repository: `gugmaae-prog/hausandgrace`
- Visibility: **public**
- Audited main commit: `8808f7be2634cda3610388ee1b978297979535cb`
- Repository files: **134**
- GitHub Actions workflows before this audit: **none**
- Primary production domain: `hausandgrace.ae`
- Primary Worker manifest: `wrangler.hausandgrace.jsonc`
- Primary Worker: `haus-grace-primary`
- Secondary/mirror manifest: `wrangler.cloudflare.jsonc`
- Secondary Worker: `haus-grace-properties`
- AI/agent ownership: **Grace only**

The repository contains a full application tree and is significantly closer to GitHub-driven deployment readiness than PSR.

## Cloudflare configuration captured in Git

### Primary

`wrangler.hausandgrace.jsonc` declares:

- `hausandgrace.ae/*`
- `www.hausandgrace.ae/*`
- D1 binding `DB` → `espacios_contact_db`
- Workers AI binding `AI`
- Images binding `IMAGES`
- email binding `EMAIL`
- six-hour cron trigger
- static assets under `./dist/client`
- observability enabled

### Secondary legacy/mirror mount

`wrangler.cloudflare.jsonc` declares:

- `espacios.me/h&g/properties*`
- `espacios.me/h%26g/properties*`
- Worker `haus-grace-properties`

This should remain secondary. The primary Haus & Grace source/deployment identity is the dedicated `hausandgrace.ae` domain.

## Public-repository review

No obvious committed secret-value file was found by the path-level scan. The repository correctly ignores `.env*`, PEM files, build outputs, Wrangler state, and temporary output directories.

The file `drizzle-agent/0001_agent_password_credentials.sql` defines the credential schema only; it does not contain password values.

### Hard-coded operational contact

`app/api/leads/route.ts` contains a hard-coded notification recipient email address and public sender address. These are not authentication secrets, but the notification recipient is operational configuration and should eventually move to a runtime variable for easier rotation and cleaner public source.

## Lead handling

The public lead endpoint includes several good controls:

- request size limit
- honeypot field
- rate limiting using hashed client IP
- email and phone validation
- explicit consent requirement
- HTML escaping
- no GET-based data exposure

The route writes to D1 and sends an email through the Cloudflare email binding.

## Database boundary

Haus & Grace currently uses Cloudflare D1 according to the checked-in manifests. The audited Supabase `entity` project does **not** need to become Haus & Grace's database merely because it exists. Keep H&G database ownership independent unless there is an explicit migration project.

## Grace ownership

Grace is Haus & Grace only.

Target:

```text
gugmaae-prog/hausandgrace
          ↓
review + CI
          ↓
Cloudflare Worker
haus-grace-primary
          ↓
hausandgrace.ae
          ↓
Grace
```

Sonu remains PSR-only. Espacios AI/Aether remains Espacios-only.

## Deployment readiness

Before enabling automatic production deployment:

1. re-audit the actual Cloudflare account and compare bindings/routes with both Wrangler manifests;
2. run the repository build and tests on GitHub CI;
3. decide whether the Espacios mirror remains supported;
4. move the lead-notification recipient to runtime configuration;
5. confirm D1 migration state matches `drizzle-agent`;
6. record the deployed Git SHA in a production deployment ledger.

## Cloudflare audit limitation

The Cloudflare connector returned `FORBIDDEN` before live account API requests could execute during this audit. Therefore the checked-in manifests are the current evidence source, not a fresh Cloudflare API inventory.

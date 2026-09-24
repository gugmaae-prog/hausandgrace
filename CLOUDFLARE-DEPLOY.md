# Cloudflare deployment

## Primary deployment

The canonical production site is `https://hausandgrace.ae` (and `www.hausandgrace.ae`) using `wrangler.hausandgrace.jsonc` and Worker `haus-grace-primary`.

```bash
npm install
npm run build:primary
npm run deploy:primary
```

## Secondary Espacios mirror

The optional/legacy mounted surface is:

`https://espacios.me/h&g/properties`

It uses `wrangler.cloudflare.jsonc` and Worker `haus-grace-properties`.

It deploys as a full-stack Cloudflare Worker with static assets and a D1 lead
database. The `espacios.me` DNS zone must already be active in the Cloudflare
account used by Wrangler.

The Cloudflare build also mirrors static assets beneath the mounted path so the
custom Worker route can serve CSS, JavaScript, and the HD logo directly.

## First deployment

Run these commands from the extracted project folder:

```bash
npm install
npx wrangler login
npx wrangler d1 create haus-grace-leads --location apac --binding DB --update-config --config wrangler.cloudflare.jsonc
npx wrangler d1 execute haus-grace-leads --remote --file drizzle/0000_certain_captain_midlands.sql --config wrangler.cloudflare.jsonc
npm run build:cloudflare
npm run deploy:cloudflare
```

The D1 creation command writes the new database ID and `DB` binding into
`wrangler.cloudflare.jsonc`. Do not skip it: project enquiry forms use that
binding.

## Later deployments

```bash
npm install
npx wrangler login
npm run build:cloudflare
npm run deploy:cloudflare
```

## Local verification

```bash
npm run build:cloudflare
npm run start -- --host 127.0.0.1 --port 4175
```

Then open `http://127.0.0.1:4175/h&g/properties`.

## Important

- Keep the route in `wrangler.cloudflare.jsonc` quoted because the URL contains
  an ampersand.
- If another Worker already owns this exact route, remove or narrow that route
  in the Cloudflare dashboard before deploying.
- The route is intentionally limited to `/h&g/properties*`; it does not replace
  the rest of `espacios.me`.

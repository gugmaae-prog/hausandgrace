# Security Policy

This repository is public. Treat committed source, history, issue content, and pull-request diffs as internet-visible.

## Never commit

- Cloudflare API tokens, Wrangler credentials, D1 credentials, private email credentials, or other runtime secrets
- agent plaintext passwords, password exports, credential databases, password reset material, or session tokens
- customer leads, enquiry exports, private CRM data, KYC data, inbox/message exports, or internal staff datasets
- private Grace memory, private prompts containing customer information, or staff-only documents
- `.env` files or production backups

Schema/migration files that define password-hash columns are allowed; actual credential rows are not.

## Grace tenant boundary

Grace is the Haus & Grace agent. Grace private runtime data must remain within Haus & Grace systems.

Do not copy Grace private memory, leads, credentials, or staff data into PSR Homes or Espacios repositories/databases.

## Public repository review

Before merging:

1. confirm no secret values or private datasets were added;
2. run tests/build;
3. verify Cloudflare binding names against production;
4. review any route change for impact to both the primary `hausandgrace.ae` deployment and the optional Espacios mirror.

## Reporting

Do not paste discovered secrets or private customer data into a public issue. Contact the repository owner privately and rotate/revoke exposed credentials immediately.

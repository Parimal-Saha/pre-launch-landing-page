# DNS migration checklist — sugarshade.pk

> **Nothing in this file has been executed.** No DNS record has been inspected or changed.
> Every step needs the domain owner's explicit approval first.

## Phase 0 — before touching DNS

- [ ] Confirm the domain is under your control (registrar login works).
- [ ] Export/photograph the **current** DNS zone so nothing is lost.
- [ ] Inventory existing records — **especially anything mail-related**:
      MX records (Google Workspace / Zoho / transactional email), SPF (`TXT`),
      DKIM, DMARC, verification TXT records. These must survive every phase.
- [ ] Decide the email provider first if the domain already sends mail — its
      records dictate what must be preserved.

## Phase 1 — pre-launch site on the apex (approval required)

Add the custom domain to the Vercel project first, then use the exact DNS
records shown for that project in Vercel. The values below are examples only;
Vercel may show a project-specific target and can change its recommendations.

Typical record types are an A record for the apex (`@`) and a CNAME for
`www`. Do not copy a generic value from an old checklist or remove existing
records unless Vercel explicitly requires it and the mail-related records
have been preserved.

- [ ] Add both `sugarshade.pk` and `www.sugarshade.pk` in the Vercel project
      Domains tab; record the exact values and validation status it shows.
- [ ] Do **not** touch MX/TXT records in this phase.
- [ ] Wait for propagation + Vercel's certificate provisioning; verify
      `https://sugarshade.pk` and `https://www.sugarshade.pk` both serve HTTPS.
- [ ] Confirm `www` → apex (or vice versa) redirect behaviour is what you want.

## Phase 2 — verify the pre-launch site

- [ ] Fresh-browser visit over HTTPS shows the site (no cert warnings).
- [ ] Submit a test signup; row appears in Supabase.
- [ ] `https://sugarshade.pk/robots.txt` + `/sitemap.xml` resolve.
- [ ] Canonical URLs in page source show `https://sugarshade.pk`, never a
      Vercel preview hostname.

## Phase 3 — Shopify migration (later, approval required)

- [ ] Build/verify the Shopify store first (separate project).
- [ ] In Shopify: add `sugarshade.pk` + `www.sugarshade.pk`, choose **replace
      root domain** behaviour per Shopify's current flow.
- [ ] Shopify will prescribe its own records — change only what Shopify lists.
- [ ] Preserve every mail-related record (MX/SPF/DKIM/DMARC) verbatim.
- [ ] Decide this app's fate: retire it, or move to `waitlist.sugarshade.pk`
      (re-point CNAME; update `metadataBase`/`SITE.url` if retired differently).
- [ ] Post-migration: root serves Shopify, waitlist export completed, consent
      records migrated (`consent_marketing`, `consent_at`).

## Rollback

- [ ] Phase 1 rollback: restore the exported zone file.
- [ ] Phase 3 rollback: re-apply the Phase 1 records; Shopify keeps the domain
      listed but inactive records fail validation harmlessly.

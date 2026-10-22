# SUGAR SHADE — pre-launch waitlist

Brand-accurate pre-launch landing page for **SUGAR SHADE** (sugarshade.pk): introduce the brand,
present the five-product collection, let visitors pick **one** launch perk (15% off / free delivery /
mystery box), collect explicit-consent waitlist signups, and record referral signups server-side.

Built with **Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · Zod · Supabase**.

**Why this stack:** the core requirement is a *secure server-side form endpoint* plus persistent
storage with DB constraints, future Shopify/email/referral integrations, and Vercel deployment.
Next.js route handlers give colocated API logic with first-class Vercel support; Astro would ship
less JS but adds a second toolchain for the same single client island. No state-management,
animation, or component libraries — CSS-only motion.

## Project structure

```
├── public/
│   ├── assets/            # brand art extracted from the identity PDF (see below)
│   ├── fonts/             # self-hosted OFL fonts (+ licenses)
│   └── og.jpg             # Open Graph image (1200×630)
├── src/
│   ├── app/
│   │   ├── api/waitlist/route.ts   # POST signup · GET referral counts
│   │   ├── privacy/page.tsx        # privacy notice
│   │   ├── robots.ts · sitemap.ts  # pre-launch indexing config
│   │   ├── layout.tsx · page.tsx · globals.css
│   ├── components/        # Header, Hero, Marquee, Join, Collection, Story,
│   │                      # WaitlistCard (client flow), Referral, LaunchBand, Footer
│   ├── lib/
│   │   ├── perks.ts       # ← single source of truth for the 3 perk ids
│   │   ├── referral.ts    # tier rewards + invite-code format
│   │   ├── validation.ts  # Zod schema shared by form + API
│   │   ├── supabase.ts · env.ts · rate-limit.ts · email.ts · products.ts · site.ts
├── supabase/schema.sql    # table + RLS lockdown + unique indexes + CHECKs
├── docs/                  # DNS checklist, future integrations
└── tools/                 # extract-brand-assets.py · mock_supabase.py (local dev)
```

## Local development

```bash
npm install
cp .env.example .env.local     # fill in Supabase values
# run supabase/schema.sql in the Supabase SQL editor
npm run dev                    # http://localhost:3000
```

Without `.env.local` the site renders fully, but **submissions return 503** — that's deliberate:
failures never masquerade as success.

### Environment variables

| Name | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | Supabase → Settings → API | waitlist database URL |
| `SUPABASE_SERVICE_ROLE_KEY` | same | server-only write access (never client-side) |

Email: **no provider selected** — `src/lib/email.ts` is a no-op seam by design.

## Referral program

Real mechanics, honest limits:

1. Every signup gets a unique 8-character code (`referral_code`, unique-indexed).
2. `?ref=CODE` invite links are captured at submit time and stored as `referred_by`.
3. `GET /api/waitlist?code=CODE` returns the stored friend-signup count for that code only; it
   does not verify email ownership or a qualifying purchase.
4. `+10%` per stored friend signup, capped at `+30%` (three friends). This stacks with the
   15% Price Cut perk for up to 45% off an eligible order. The store must enforce final order
   limits, expiry, qualifying purchase, and abuse rules before launch.

There is no points system and no fake progress: a friend only counts once their signup is stored.

## Local development with the mock database

No Supabase project needed to exercise the full flow:

```bash
python tools/mock_supabase.py 8321        # PostgREST-shaped mock (POST + filtered GET)
# .env.local: SUPABASE_URL=http://localhost:8321 · SUPABASE_SERVICE_ROLE_KEY=local-mock
```

## Checks run

| Check | Command | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | ✅ clean |
| Production build | `npm run build` | ✅ all routes generate |
| Lint | `npx eslint src --max-warnings 0` | ✅ clean |
| API flows (signup, duplicate, honeypot, rate limit, referral count, invalid codes) | curl against mock | ✅ verified |
| Browser (360–1440px, perk select, validation, success panel, referral link) | manual | ✅ verified |

## Security posture

- Server-side validation of every field (identical Zod schema on client + server)
- Emails normalized to lowercase; unique index makes duplicates idempotent
- Honeypot + per-IP in-memory rate limit (5 signups / 10 min; reads get a separate 60 budget)
- Referral codes are random, unique-indexed, and only their own holder can read a count
- RLS enabled with **zero policies**: anon/authenticated can't read or write the table
- No credential ever reaches the browser; errors return generic messages (details go to logs)
- Consent is an explicit checkbox; `consent_marketing = true` is DB-CHECK-enforced

### Production hardening (documented, not yet done)

1. Swap the in-memory limiter for Upstash/Redis or Vercel WAF rules (multi-region correctness).
2. Connect an email provider behind `src/lib/email.ts`.
3. Add a Supabase DB password rotation reminder / least-privilege review.

## Deployment (Vercel)

1. Import the repo; framework preset: Next.js (no overrides needed).
2. Add `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as server-side Vercel
   environment variables. Use the production database only for Production;
   use a separate test Supabase project for Preview. Never reuse the production
   service-role key in preview deployments.
3. Deploy a preview URL → run the acceptance checks (below) on it using the
   isolated test database.
4. Add `sugarshade.pk` per `docs/dns-migration-checklist.md` — **only with the owner's approval**.

**Indexing:** production is indexable by choice (`robots.ts` documents the one-line flip to
disallow). Vercel previews are auto-`noindex` and `metadataBase` pins canonical URLs to
`https://sugarshade.pk`, so preview hosts never leak into SEO.

## Brand assets & fonts

All imagery is extracted from `Sugar Shade - Brand Identity.pdf` via
`tools/extract-brand-assets.py` (re-runnable, coordinates documented in-file): logos, five
product renders, 18 stickers, packaging, pattern, favicon, starburst. Product copy mirrors the
real packaging labels; images are authentic brand material — replace at will before launch.

The type was re-cut to match the approved design reference: **Montserrat Black** (alias of the
display face — heavy uppercase grotesque with a true italic for accent lines) and **Plus Jakarta
Sans** for body copy. Both are OFL and self-hosted (`public/fonts/`, licenses alongside). Swap in
licensed brand fonts by replacing the files and the `next/font/local` entries in `layout.tsx`.

Product cut-outs (`*-cutout.png`) are generated by the same pipeline — alpha-keyed from the
identity book's flat backdrops and trimmed to the product bounds — so the hero lineup stands
directly on the page like the reference.

## Rollback

- Deployments: Vercel keeps every deployment — promote any previous one.
- DNS: restore the zone export taken in Phase 0 of the DNS checklist.

## Further reading

- `docs/future-integrations.md` — Shopify, email, referral contracts
- `docs/dns-migration-checklist.md` — sugarshade.pk migration plan (nothing executed)
- `supabase/schema.sql` — database contract

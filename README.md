# SUGAR SHADE — pre-launch waitlist

Brand-accurate pre-launch landing page for **SUGAR SHADE** (sugarshade.pk): introduce the brand,
present the five-product collection, let visitors pick **one** launch perk (15% off / free delivery /
mystery box), collect explicit-consent waitlist signups, and record referral signups server-side.

Built with **Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · Zod · Supabase**.

**Why this stack:** the core requirement is a *secure server-side form endpoint* plus persistent
storage, email OTP verification, and DB constraints for a short pre-launch run. Netlify Free
supports Next.js App Router and custom domains with SSL; it is a lower-cost fit than a paid Vercel
plan for a 1–2 month campaign. Supabase Free avoids a database migration and is adequate for a
small waitlist, but low activity can pause the project and production OTP requires custom SMTP.

## Project structure

```
├── public/
│   ├── assets/            # brand art extracted from the identity PDF (see below)
│   ├── fonts/             # self-hosted OFL fonts (+ licenses)
│   └── og.jpg             # Open Graph image (1200×630)
├── src/
│   ├── app/
│   │   ├── api/otp/route.ts        # rate-limited OTP send
│   │   ├── api/waitlist/route.ts   # verified POST signup · GET qualified referral counts
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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | browser OTP endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | public Auth key; table remains protected by RLS |
| `REFERRAL_ALLOWED_DOMAINS` | deployment environment | comma-separated eligible referral email domains |
| `NEXT_PUBLIC_SITE_URL` | Netlify assigned host | canonical URL and sitemap origin |
| `NEXT_PUBLIC_CONTACT_EMAIL` | brand configuration | public contact email |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TIKTOK_URL`, `NEXT_PUBLIC_FACEBOOK_URL` | deployment environment | optional official social URLs; blank values keep “coming soon” |

Email OTP: configure custom SMTP under Supabase Auth → SMTP Settings. The sender is configurable
there; the initial sender is `aadhanaan2@gmail.com`. Never commit SMTP credentials or the service
role key.

## Referral program

Real mechanics, honest limits:

1. Every signup gets a unique 8-character code (`referral_code`, unique-indexed).
2. `?ref=CODE` invite links are captured at submit time and stored as `referred_by`.
3. Joining requires email OTP verification. Only verified referrals from configured eligible
   domains count toward rewards; the progress endpoint exposes only a referral's count.
4. `+10%` per qualified referral, capped at `+30%`, applies to the first qualifying order only.
   It stacks with the 15% Price Cut perk on that first order (maximum 45%). For the Delivery Treat,
   the maximum referral discount is 30% on order one; free delivery covers the first five
   qualifying orders. Shopify checkout/order enforcement is not included in this app.

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
| API / browser OTP end-to-end | Requires live SMTP and deployed credentials | ⏳ not yet verified |
| Supabase table access | Read-only dashboard check | ✅ RLS on; anon/authenticated have no table access |

## Security posture

- Server-side validation of every field (identical Zod schema on client + server)
- Emails normalized to lowercase; unique index makes duplicates idempotent
- Honeypot + per-IP in-memory rate limit (5 signups / 10 min; reads get a separate 60 budget)
- Referral codes are random, unique-indexed, and only their own holder can read a count
- RLS enabled with **zero policies**: anon/authenticated can't read or write the table
- No credential ever reaches the browser; errors return generic messages (details go to logs)
- Consent is an explicit checkbox; `consent_marketing = true` is DB-CHECK-enforced

### Production hardening (documented, not yet done)

1. Swap the in-memory limiter for a shared store or platform-level protection (multi-instance correctness).
2. Connect an email provider behind `src/lib/email.ts`.
3. Add a Supabase DB password rotation reminder / least-privilege review.

## Deployment (Netlify)

1. Import the public GitHub repo; Netlify auto-detects the Next.js App Router.
2. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and `REFERRAL_ALLOWED_DOMAINS` as
   Netlify environment variables. Do not expose production secrets to Deploy Previews.
3. Keep Netlify auto-recharge off. Free has a hard limit and pauses sites rather than charging
   overages; monitor usage during the campaign.
4. Test OTP delivery, verification, eligible-domain referral counts, privacy copy and mobile layout
   on the assigned `*.netlify.app` host. Do not connect `sugarshade.pk` until separately authorized.

**Indexing:** `robots.ts` permits indexing only when Netlify sets `CONTEXT=production`; deploy
previews are explicitly disallowed. Canonical metadata remains configurable and should be set to
the assigned production `*.netlify.app` URL until a custom domain is authorized and connected.

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

- Deployments: use Netlify deploy history for rollback.
- DNS: restore the zone export taken in Phase 0 of the DNS checklist.

## Further reading

- `docs/future-integrations.md` — Shopify, email, referral contracts
- `docs/dns-migration-checklist.md` — sugarshade.pk migration plan (nothing executed)
- `supabase/schema.sql` — database contract

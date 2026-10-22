# Future integration requirements

This site is a pre-launch waitlist. The Shopify store, email marketing platform, and referral
system are built separately. This document is the contract between what exists now and what
gets wired up later.

## Data model: what a row means today

| Column | Meaning today | Meaning later |
|---|---|---|
| `email` | OTP-verified waitlist address (normalized lowercase) | Seed for Shopify customer + email subscriber |
| `email_verified_at` + `email_domain` | Email proof timestamp and normalized domain | Eligibility evidence for referral qualification |
| `perk_id` | **Stated preference only** — nothing is granted | Offered at first order, subject to final terms |
| `consent_marketing` + `consent_at` | Proof of explicit email consent | Migrated as consent proof to the email platform |
| `referral_code` | Unique invite code generated per signup | Personal code for launch-day referral linking |
| `referred_by` | Code of the friend whose link brought this signup | Provenance for referral stacks at launch |
| `created_at` | Queue position (roughly) | Segment: "founding list" |

Still **not** stored here (they only exist once commerce is live): qualifying order counts,
verified post-order attribution, reward eligibility state, and redemption state. The referral
reward (+10/20/30%) is a one-time discount for the referred user's first qualifying order; the
store must verify eligibility and enforce one-shot redemption. Three qualified referrals stack
with the 15% Price Cut perk to 45% on order one. Option 2 receives a maximum 30% referral discount
on order one plus free delivery on its first five qualifying orders.

## 1. Shopify

- Create customers from waitlist rows **server-side** (Admin API or a one-time import) with
  `accepts_marketing: true` **only** where `consent_marketing = true`.
- Map `perk_id` → a customer tag (`perk:price-cut`, `perk:delivery-treat`, `perk:mystery-box`)
  so launch-day discount / shipping / packaging rules can target tagged customers.
- Redemption logic lives in Shopify (discount codes / functions), never in this frontend.
- When Shopify takes over the root domain, this app moves to a subdomain or is retired —
  see `dns-migration-checklist.md`.

## 2. Email platform

- Supabase Auth sends the signup OTP through configured custom SMTP. Sender address/name are
  configurable in Supabase Auth settings; the initial sender is `aadhanaan2@gmail.com`.
- Import signups respecting `consent_at` as the consent timestamp.
- Welcome/launch-day flow: 1 launch announcement + 1 perk reminder at most; unsubscribe honored
  on every send.
- Keep this app's writes as the source of truth until a sync exists (avoid double opt-in drift).

## 3. Referral program

**Implemented at waitlist level** (this repo):

- Every signup gets a unique 8-char `referral_code`; invite links carry `?ref=CODE` and are
  stored as `referred_by` when the friend signs up (captured at submit time).
- `GET /api/waitlist?code=CODE` counts only stored signups with verified OTP and an allowed email
  domain. It does not count orders or establish purchase attribution.
- Rewards are one-time on the referrer's first qualifying order, not a recurring benefit. The
  store must define and enforce expiry, purchase verification, and abuse rules before launch.

**Still owned by the store** (not this repo):

1. `perk_id` → tag mapping (above),
2. post-order attribution and fraud checks (self-referral, duplicates, paid-qualifying-order),
3. reward eligibility + one-shot, auditable redemption for the +10/20/30% stack,
4. disqualifying refunded/cancelled orders from a friend's count.

Anti-abuse so far: codes are random and unique-indexed; only a code's holder can read its count;
reads are rate-limited; `referred_by` must match the invite-code format or is dropped.
Recommended host for order-verified attribution: a Shopify-side app (ReferralCandy, GoAffPro) or a
small backend reading order webhooks — decision pending.

## 4. What must NOT happen

- No fake cart/checkout/inventory on this site (Shopify owns commerce).
- No activating discounts or installing referral apps without explicit approval.
- No claiming referral rewards are *redeemable* before order verification exists — the UI says
  rewards apply at launch on qualifying orders, and that friend counts are signups, not orders.

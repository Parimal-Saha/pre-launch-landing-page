-- SUGAR SHADE waitlist — run in the Supabase SQL editor (or via supabase db push).
-- Design: the public has NO access. Only the server (service role) writes.

create table if not exists public.waitlist_signups (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  perk_id           text not null
                    check (perk_id in ('price-cut', 'delivery-treat', 'mystery-box')),
  consent_marketing boolean not null default false,
  consent_at        timestamptz not null,
  email_verified_at timestamptz not null,
  email_domain      text not null,
  created_at        timestamptz not null default now(),

  -- Referral program: every signup gets a unique invite code; friend signups
  -- record which code brought them. Rewards are applied by the store at
  -- launch; this table only proves who referred whom, and how many.
  referral_code     text not null unique
                    check (referral_code ~ '^[A-Z0-9]{8}$'),
  referred_by       text
                    check (referred_by is null or referred_by ~ '^[A-Z0-9]{8}$'),
  constraint waitlist_signups_consent_check check (consent_marketing = true)
);

-- Emails are normalized to lowercase by the API; this unique index makes
-- duplicate signups idempotent (API maps 23505 to "already on the list").
create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (lower(email));

-- Fast referral counting: "how many friends joined via this code?"
create index if not exists waitlist_signups_referred_by_key
  on public.waitlist_signups (referred_by);

create index if not exists waitlist_signups_qualified_referral_key
  on public.waitlist_signups (referred_by, email_domain)
  where email_verified_at is not null;

-- RLS on with ZERO policies: anon/authenticated get nothing, ever.
alter table public.waitlist_signups enable row level security;

revoke all on public.waitlist_signups from anon, authenticated;


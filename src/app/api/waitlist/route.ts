import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { SignupSchema } from "@/lib/validation";
import { REFERRAL_CODE_RE } from "@/lib/referral";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabase, type WaitlistRow } from "@/lib/supabase";
import { clientKey, rateLimit, readBudget, READ_LIMIT } from "@/lib/rate-limit";
import { deliverSignupEmail } from "@/lib/email";

type ErrorBody = { ok: false; error: string; field?: "email" | "perk" | "consent" };

function fail(status: number, error: string, field?: ErrorBody["field"]) {
  const body: ErrorBody = { ok: false, error, ...(field ? { field } : {}) };
  return NextResponse.json(body, { status });
}

/** 8-char uppercase alphanumeric code, e.g. "K3XQ9ZTA". */
function makeReferralCode(): string {
  // randomUUID is strong; take its hex prefix and stretch into the full
  // alphanumeric alphabet via a second UUID for more symbol variety.
  const raw = (randomUUID() + randomUUID()).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[parseInt(raw.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
  }
  return code;
}

export async function POST(request: Request) {
  // 1. Spam brake (best effort, in-memory) — layered with a honeypot below.
  if (!rateLimit(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts from this device. Try again in a few minutes." },
      { status: 429 },
    );
  }

  // 2. Parse + validate against the same schema the form uses.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "Invalid request body.");
  }

  const parsed = SignupSchema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field =
      issue?.path[0] === "perk"
        ? ("perk" as const)
        : issue?.path[0] === "consent"
          ? ("consent" as const)
          : ("email" as const);
    return fail(400, issue?.message ?? "Invalid form data.", field);
  }

  // 3. Honeypot: bots fill hidden fields — pretend success, store nothing.
  if (parsed.data.company !== "") {
    return NextResponse.json({ ok: true });
  }

  // 4. Configuration check — never report success when storage is offline.
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Waitlist storage is not configured yet. Please try again shortly or contact support@sugarshade.pk.",
      },
      { status: 503 },
    );
  }

  // A verified Supabase Auth session is required before any signup is stored.
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return fail(401, "Verify your email with the code we sent before joining.");
  const { data: authData, error: authError } = await getSupabase().auth.getUser(bearer);
  if (authError || authData.user?.email?.toLowerCase() !== parsed.data.email) {
    return fail(401, "That verification code is invalid or expired. Request a new code and try again.");
  }
  const verifiedAt = authData.user.email_confirmed_at;
  if (!verifiedAt) return fail(401, "Please verify your email before joining.");

  const { email, perk, consent, referral } = parsed.data;
  const emailDomain = email.split("@")[1] ?? "";
  const row: WaitlistRow = {
    email,
    perk_id: perk,
    consent_marketing: consent,
    consent_at: new Date().toISOString(),
    email_verified_at: verifiedAt,
    email_domain: emailDomain,
    referral_code: makeReferralCode(),
    referred_by: referral === "" ? null : referral,
  };

  // 5. Persist. Unique index on lower(email) makes duplicates idempotent;
  //    a (astronomically rare) referral-code collision retries once.
  const { error } = await getSupabase().from("waitlist_signups").insert(row);
  if (error) {
    if (error.code === "23505") {
      // PostgREST names the violated column in message or details — an email
      // conflict means "already on the list"; anything else is a code collision.
      const conflictText = `${error.message ?? ""} ${error.details ?? ""}`;
      if (/email/i.test(conflictText)) {
        // Existing signup: return its stored code so the panel still works.
        const { data: existing } = await getSupabase()
          .from("waitlist_signups")
          .select("referral_code")
          .eq("email", email)
          .limit(1);
        return NextResponse.json({
          ok: true,
          duplicate: true,
          referralCode: existing?.[0]?.referral_code ?? null,
          message: "You're already on the list — we've got you covered.",
        });
      }
      // Referral-code collision, not an email duplicate — retry with a fresh code.
      row.referral_code = makeReferralCode();
      const retry = await getSupabase().from("waitlist_signups").insert(row);
      if (!retry.error) {
        return finishSignup(email, perk, row.consent_at, row.referral_code);
      }
      console.error("[waitlist] insert retry failed:", retry.error.code, retry.error.message);
      return NextResponse.json(
        { ok: false, error: "We couldn't save your signup just now. Please try again." },
        { status: 500 },
      );
    }
    console.error("[waitlist] insert failed:", error.code, error.message);
    return NextResponse.json(
      { ok: false, error: "We couldn't save your signup just now. Please try again." },
      { status: 500 },
    );
  }

  return finishSignup(email, perk, row.consent_at, row.referral_code);
}

async function finishSignup(email: string, perk: string, consentAt: string, referralCode: string) {
  // Optional welcome email — failure here never fails the signup.
  try {
    await deliverSignupEmail({ email, perkId: perk, consentAt });
  } catch (err) {
    console.error("[waitlist] welcome email failed:", err);
  }
  return NextResponse.json({ ok: true, referralCode });
}

/**
 * GET /api/waitlist?code=XXXXXXXX — how many friends joined via a code.
 * Only the holder of a valid code can read its own count; nothing else is
 * exposed (no emails, no list contents).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").toUpperCase();

  if (!REFERRAL_CODE_RE.test(code)) {
    return NextResponse.json({ ok: false, error: "Invalid referral code." }, { status: 400 });
  }
  if (!rateLimit(readBudget(request), READ_LIMIT)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Waitlist storage is not configured yet." }, { status: 503 });
  }

  // The code must belong to a real signup before we count anything for it.
  const { data: owner, error: ownerError } = await getSupabase()
    .from("waitlist_signups")
    .select("id")
    .eq("referral_code", code)
    .limit(1);
  if (ownerError) {
    console.error("[referrals] owner lookup failed:", ownerError.code, ownerError.message);
    return NextResponse.json({ ok: false, error: "We couldn't check your progress just now." }, { status: 500 });
  }
  if (!owner || owner.length === 0) {
    return NextResponse.json({ ok: false, error: "Unknown referral code." }, { status: 404 });
  }

  const { count, error: countError } = await getSupabase()
    .from("waitlist_signups")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", code)
    .not("email_verified_at", "is", null)
    .in("email_domain", (process.env.REFERRAL_ALLOWED_DOMAINS ?? "gmail.com,hotmail.com,outlook.com,proton.me")
      .split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean));
  if (countError) {
    console.error("[referrals] count failed:", countError.code, countError.message);
    return NextResponse.json({ ok: false, error: "We couldn't check your progress just now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: count ?? 0 });
}

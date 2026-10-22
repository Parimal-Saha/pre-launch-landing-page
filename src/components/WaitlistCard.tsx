"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import Image from "next/image";
import Link from "next/link";
import { perks, perkAccentClasses, type PerkId } from "@/lib/perks";
import { REFERRAL_MAX_FRIENDS, referralTiers } from "@/lib/referral";
import { SITE } from "@/lib/site";
import { SignupSchema, HONEYPOT_FIELD } from "@/lib/validation";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; duplicate?: boolean; code: string | null }
  | { kind: "error"; message: string };

type FieldErrors = { email?: string; perk?: string; consent?: string };

const howItWorks = [
  { n: "1", title: "Select your perk", body: "Choose the benefit you like most." },
  { n: "2", title: "Join the list", body: "Enter your email address." },
  { n: "3", title: "Get launch updates", body: "Be the first to know." },
  { n: "4", title: "Earn more with friends", body: "Get an extra 10% off per referral." },
];

function scrollToEl(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.top >= 0 && rect.top < window.innerHeight * 0.55) return; // already in view
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function WaitlistCard() {
  const [perk, setPerk] = useState<PerkId | "">("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [copied, setCopied] = useState<"" | "copied" | "failed">("");

  const code = status.kind === "success" ? status.code : null;
  const inviteLink = code ? `${window.location.origin}/?ref=${code}` : "";

  // Live friend count for the progress panel.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    fetch(`/api/waitlist?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ok?: boolean; count?: number } | null) => {
        if (!cancelled && data?.ok && typeof data.count === "number") setFriendCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code]);

  function choosePerk(id: PerkId) {
    setPerk(id);
    setErrors((e) => ({ ...e, perk: undefined }));
    scrollToEl("almost-there");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "loading") return;

    // Friend code from a `?ref=` invite link — read at submit time so the
    // initial render stays server-safe and no effect is needed.
    const referral = new URLSearchParams(window.location.search).get("ref") ?? "";
    const parsed = SignupSchema.safeParse({ email, perk, consent, referral, company });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "email" || key === "perk" || key === "consent") && !next[key]) {
          next[key] = issue.message;
        }
      }
      setErrors(next);
      setStatus({
        kind: "error",
        message: "Check the highlighted fields and try again.",
      });
      if (next.perk) scrollToEl("perk-cards");
      return;
    }
    setErrors({});
    setStatus({ kind: "loading" });

    try {
      if (!otpSent) {
        const sendResponse = await fetch("/api/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: parsed.data.email }),
        });
        if (!sendResponse.ok) throw new Error("Could not send code");
        setOtpSent(true);
        setStatus({ kind: "idle" });
        return;
      }

      const auth = getBrowserSupabase();
      const { data: verified, error: verifyError } = await auth.auth.verifyOtp({
        email: parsed.data.email,
        token: otp.trim(),
        type: "email",
      });
      if (verifyError || !verified.session) {
        throw new Error(verifyError?.message ?? "That code has expired. Request another code.");
      }
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${verified.session.access_token}`,
        },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; duplicate?: boolean; referralCode?: string | null; error?: string }
        | null;

      if (res.ok && data?.ok) {
        setStatus({
          kind: "success",
          duplicate: data.duplicate === true,
          code: data.referralCode ?? null,
        });
        setFriendCount(null);
        setCopied("");
      } else {
        setStatus({
          kind: "error",
          message: data?.error ?? "Something went wrong on our side. Please try again.",
        });
      }
    } catch {
      setStatus({
        kind: "error",
        message: otpSent
          ? "We couldn't verify that code. Check it and try again, or request a fresh code."
          : "We couldn't send a verification code. Please try again shortly.",
      });
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied(""), 2400);
  }

  /* ------------------------------ success ------------------------------ */
  if (status.kind === "success") {
    const chosen = perk ? perks.find((p) => p.id === perk) : null;
    const shownCount = Math.min(friendCount ?? 0, REFERRAL_MAX_FRIENDS);

    return (
      <div
        role="status"
        className="mt-10 rounded-3xl border-2 border-ink bg-white p-6 shadow-[0_24px_60px_-24px_rgba(30,30,30,0.4)] sm:p-9"
      >
        <div className="grid gap-8 md:grid-cols-2">
          {/* left: headline + invite link + share */}
          <div>
            <p className="eyebrow text-pink">Welcome to the list</p>
            <h3 className="display mt-3 text-3xl text-electric sm:text-4xl">
              You&apos;re in.
              <br />
              <em>Now spread the shade.</em>
            </h3>

            {status.duplicate ? (
              <>
                <p className="mt-3 text-ink/75">
                  You&apos;re already on the insider list — no need to sign up twice. Your original
                  perk choice stays on file.
                </p>
                <p className="mt-3 text-sm text-ink/60">
                  Need to change it? Email{" "}
                  <a href={`mailto:${SITE.contactEmail}`} className="font-bold text-electric underline">
                    {SITE.contactEmail}
                  </a>
                  .
                </p>
              </>
            ) : (
              <p className="mt-3 text-ink/75">
                Your invitation is ready. Share it with friends who&apos;d love to discover SUGAR
                SHADE. Each eligible friend who verifies their email through your link adds +10%
                off your first qualifying order, up to +30%. With The Price Cut perk, that can
                reach 45% off your first order only.
              </p>
            )}

            {code && (
              <>
                <div className="mt-6">
                  <label htmlFor="invite-link" className="eyebrow text-ink/60">
                    Your unique link
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      id="invite-link"
                      readOnly
                      value={inviteLink}
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-4 py-3 text-sm text-ink/80"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="rounded-full border-2 border-ink bg-electric px-6 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1e1e1e] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {copied === "copied" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p aria-live="polite" className="mt-1.5 text-xs text-ink/55">
                    {copied === "copied" && "Link copied to your clipboard."}
                    {copied === "failed" && "Copy failed — select the link and copy it manually."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `I'm on the SUGAR SHADE insider list 🌟 Join with my link: ${inviteLink}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-[#25D366] px-5 py-2.5 text-sm font-extrabold text-ink transition-transform hover:-translate-y-0.5"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-ink">
                      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.5 14c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .1-1.7-.1a12 12 0 0 1-5.6-4.9c-.4-.7-.9-1.6-.9-2.4 0-.9.5-1.4.7-1.6.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.2.1.7-.1 1.4Z" />
                    </svg>
                    Share on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-pink px-5 py-2.5 text-sm font-extrabold text-ink transition-transform hover:-translate-y-0.5"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 stroke-ink" fill="none" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1.2" className="fill-ink stroke-none" />
                    </svg>
                    Copy for Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator
                          .share({
                            title: "SUGAR SHADE",
                            text: "I'm on the SUGAR SHADE insider list. Join with my link:",
                            url: inviteLink,
                          })
                          .catch(() => {});
                      } else {
                        copyLink();
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-5 py-2.5 text-sm font-extrabold text-ink transition-transform hover:-translate-y-0.5"
                  >
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 stroke-ink" fill="none" strokeWidth="2.2">
                      <circle cx="6" cy="12" r="2.4" />
                      <circle cx="17" cy="6" r="2.4" />
                      <circle cx="17" cy="18" r="2.4" />
                      <path d="M8.2 11 14.8 7.2M8.2 13l6.6 3.8" strokeLinecap="round" />
                    </svg>
                    More
                  </button>
                </div>
              </>
            )}
          </div>

          {/* right: progress panel */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-6 text-paper">
            <Image
              src="/assets/starburst-alpha.png"
              alt=""
              aria-hidden
              width={480}
              height={480}
              className="absolute -top-8 -right-8 w-28 opacity-90"
            />
            <p className="eyebrow text-neon">Your progress</p>
            <p className="display mt-2 text-5xl text-paper">
              {friendCount ?? 0} <span className="text-2xl text-paper/60">/ {REFERRAL_MAX_FRIENDS}</span>
            </p>
            <p className="mt-1 text-sm font-bold text-paper/70">Qualified friends verified</p>

            <div className="mt-4 flex items-center gap-2" aria-hidden>
              {Array.from({ length: REFERRAL_MAX_FRIENDS }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded-full border-2 ${
                    i < shownCount ? "border-neon bg-neon" : "border-paper/40 bg-transparent"
                  }`}
                />
              ))}
            </div>

            <ol className="mt-5 space-y-3">
              {referralTiers.map((t) => {
                const done = (friendCount ?? 0) >= t.friends;
                const nextUp = !done && (friendCount ?? 0) === t.friends - 1;
                return (
                  <li
                    key={t.n}
                    className="flex items-center gap-3 rounded-xl border-2 border-paper/15 bg-white/5 px-3.5 py-3"
                  >
                    <span className={`display text-xl ${done ? "text-neon" : "text-pink"}`}>{t.n}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-paper">{t.title}</span>
                      <span className="block text-xs leading-snug text-paper/70">
                        {done
                          ? "Confirmed — reward locked for launch."
                          : nextUp
                            ? `${t.friends - (friendCount ?? 0)} more friend to unlock ${t.reward}.`
                            : t.body}
                      </span>
                    </span>
                    {done ? (
                      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-neon" fill="none" strokeWidth="3">
                        <path d="m5 13 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : nextUp ? (
                      <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border-2 border-paper/50" />
                    ) : (
                      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 stroke-paper/50" fill="none" strokeWidth="2">
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {chosen && (
          <p className="mt-7 rounded-2xl border-2 border-ink bg-neon px-5 py-4 text-sm font-medium text-ink/85">
            <span className="eyebrow mr-2 text-ink/60">Your perk</span>
            <span className="font-extrabold">{chosen.title}</span> — {chosen.reward}{" "}
            <a href="#perk-cards" className="font-bold text-electric underline">
              Edit
            </a>
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-ink/55">
          Referral discounts are for the first qualifying order only. The Price Cut perk applies
          to the first three qualifying orders; the Delivery Treat covers the first five. Referral
          counts include only verified signups from eligible email domains. You can change your mind or ask us to
          delete your data anytime —
          email{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="underline hover:text-electric">
            {SITE.contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  /* ------------------------------- form ------------------------------- */
  return (
    <div className="mt-10">
      {/* ------------------------- perk cards ------------------------- */}
      <fieldset id="perk-cards" className="scroll-mt-24">
        <legend className="sr-only">Pick your launch perk (one only)</legend>
        <div className="grid gap-5 md:grid-cols-3">
          {perks.map((p) => {
            const selected = perk === p.id;
            return (
              <label
                key={p.id}
                className={`relative flex cursor-pointer flex-col rounded-[1.5rem] border-2 border-ink p-6 transition-all ${perkAccentClasses[p.accent].card} ${
                  selected
                    ? "shadow-[0_0_0_4px_#1e1e1e,0_18px_40px_-18px_rgba(30,30,30,0.55)] -translate-y-1"
                    : "shadow-[0_10px_26px_-16px_rgba(30,30,30,0.4)] hover:-translate-y-0.5"
                }`}
              >
                <input
                  type="radio"
                  name="perk"
                  value={p.id}
                  checked={selected}
                  onChange={() => choosePerk(p.id)}
                  className="peer sr-only"
                  aria-describedby={`perk-hint-${p.id}`}
                />
                <span className="eyebrow text-ink/70">{p.option}</span>
                <span className="mt-1 block text-sm font-extrabold uppercase tracking-wide text-ink">
                  {p.title}
                </span>
                <span className="display mt-3 text-3xl text-electric sm:text-[2.1rem]">
                  {p.headline}
                  {p.tail ? (
                    <>
                      {" "}
                      <em>{p.tail}</em>
                    </>
                  ) : null}
                </span>
                <span id={`perk-hint-${p.id}`} className="mt-3 block text-sm leading-relaxed text-ink/80">
                  {p.reward}
                </span>

                <span className="mt-6 flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-white transition-colors ${
                      selected ? "bg-ink" : ""
                    }`}
                  >
                    {selected && (
                      <Image src="/assets/starburst-alpha.png" alt="" width={14} height={14} className="h-3 w-3" />
                    )}
                  </span>
                  <span
                    className={`rounded-full border-2 border-ink px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                      selected ? "bg-ink text-neon" : "bg-white text-ink"
                    }`}
                  >
                    {selected ? "Perk selected ✓" : "Choose this perk →"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.perk && (
          <p role="alert" className="mt-3 text-sm font-bold text-blaze">
            {errors.perk}
          </p>
        )}
      </fieldset>

      {/* ------------------------- how it works ------------------------- */}
      <div className="mt-12">
        <h3 className="display text-2xl text-ink not-italic">How it works</h3>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s) => (
            <li key={s.n} className="flex items-start gap-3">
              <span className="display grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-electric text-lg text-neon">
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-extrabold text-ink">{s.title}</span>
                <span className="block text-xs leading-relaxed text-ink/70">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* --------------------------- the form --------------------------- */}
      <form
        onSubmit={handleSubmit}
        noValidate
        id="almost-there"
        className="relative mt-12 scroll-mt-24 rounded-3xl border-2 border-ink bg-white p-6 shadow-[0_24px_60px_-24px_rgba(30,30,30,0.4)] sm:p-9"
      >
        <div className="grid gap-8 md:grid-cols-12">
          {/* selected perk recap */}
          <div className="md:col-span-5">
            <p className="eyebrow text-ink/60">Your selected perk</p>
            {perk ? (
              <div
                className={`mt-3 rounded-2xl border-2 border-ink p-5 ${perkAccentClasses[perks.find((p) => p.id === perk)!.accent].card}`}
              >
                <p className="text-sm font-extrabold uppercase tracking-wide text-ink">
                  {perks.find((p) => p.id === perk)!.title}
                </p>
                <p className="display mt-2 text-2xl text-electric">
                  {perks.find((p) => p.id === perk)!.headline}{" "}
                  {perks.find((p) => p.id === perk)!.tail ? (
                    <em>{perks.find((p) => p.id === perk)!.tail}</em>
                  ) : null}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/80">
                  {perks.find((p) => p.id === perk)!.reward}
                </p>
                <a href="#perk-cards" className="mt-3 inline-block text-sm font-extrabold text-electric underline">
                  Edit
                </a>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-5">
                <p className="text-sm leading-relaxed text-ink/60">
                  No perk picked yet — choose one of the three options above to lock it in with
                  your email.
                </p>
                <a href="#perk-cards" className="mt-3 inline-block text-sm font-extrabold text-electric underline">
                  Pick a perk ↑
                </a>
              </div>
            )}
          </div>

          {/* email + consent */}
          <div className="md:col-span-7">
            <h3 className="display text-3xl text-electric">Almost there!</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              Enter your email to join the SUGAR SHADE insider list and lock in your selected
              perk.
            </p>

            <label htmlFor="email" className="sr-only">
              Your email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Your email address"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (otpSent) {
                  setOtpSent(false);
                  setOtp("");
                }
                if (errors.email) setErrors((s) => ({ ...s, email: undefined }));
              }}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : "email-hint"}
              className={`mt-4 w-full rounded-xl border-2 bg-paper px-4 py-3.5 text-base text-ink placeholder:text-ink/40 transition-colors focus:border-electric focus:bg-white focus:outline-none ${
                errors.email ? "border-blaze" : "border-ink"
              }`}
            />
            {errors.email ? (
              <p id="email-error" role="alert" className="mt-2 text-sm font-bold text-blaze">
                {errors.email}
              </p>
            ) : (
              <p id="email-hint" className="mt-2 text-xs text-ink/55">
                SUGAR SHADE launch updates, offers and news. Withdraw consent anytime.
              </p>
            )}

            {otpSent && (
              <div className="mt-4 rounded-xl border-2 border-ink bg-neon/30 p-4">
                <label htmlFor="email-otp" className="block text-sm font-extrabold text-ink">
                  Enter the verification code we emailed you
                </label>
                <input
                  id="email-otp"
                  name="email-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\s/g, ""))}
                  className="mt-2 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 text-base tracking-[0.3em] text-ink focus:border-electric focus:outline-none"
                  aria-describedby="otp-hint"
                />
                <p id="otp-hint" className="mt-2 text-xs text-ink/65">
                  Check your inbox and spam folder. The code expires for your security.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/otp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: email.trim().toLowerCase() }),
                      });
                      if (!response.ok) throw new Error("Could not resend code");
                      setOtp("");
                      setStatus({ kind: "idle" });
                    } catch {
                      setStatus({ kind: "error", message: "We couldn't resend the code. Please try again shortly." });
                    }
                  }}
                  className="mt-2 text-xs font-bold text-electric underline"
                >
                  Resend code
                </button>
              </div>
            )}

            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="consent"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (errors.consent) setErrors((s) => ({ ...s, consent: undefined }));
                }}
                aria-describedby={errors.consent ? "consent-error" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 accent-electric"
              />
              <span className="text-sm leading-relaxed text-ink/80">
                I agree to receive launch updates, offers and news from SUGAR SHADE. You can
                unsubscribe anytime. View our{" "}
                <Link href="/privacy" className="font-bold text-electric underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" role="alert" className="mt-2 text-sm font-bold text-blaze">
                {errors.consent}
              </p>
            )}

            {/* honeypot — invisible to humans, tempting for bots */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
              <input
                id={HONEYPOT_FIELD}
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={status.kind === "loading"}
                className="rounded-full border-2 border-ink bg-electric px-8 py-3.5 font-extrabold text-white shadow-[0_4px_0_0_#1e1e1e] transition-transform hover:-translate-y-0.5 hover:bg-ink hover:text-neon active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
              >
                {status.kind === "loading"
                  ? otpSent ? "Verifying…" : "Sending code…"
                  : otpSent ? "Verify & join →" : "Email me a verification code →"}
              </button>
              {status.kind === "error" && (
                <p role="alert" className="text-sm font-bold text-blaze">
                  {status.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* polite live region announces state changes */}
        <p aria-live="polite" className="sr-only">
          {status.kind === "loading" ? "Submitting your signup" : ""}
          {status.kind === "error" ? status.message : ""}
        </p>
      </form>
    </div>
  );
}

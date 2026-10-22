import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${SITE.name} handles waitlist data — what we collect, why, and your rights.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-paper">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-24">
        <Link
          href="/"
          className="eyebrow text-electric transition-colors hover:text-pink"
        >
          ← Back to the waitlist
        </Link>

        <h1 className="display mt-6 text-display-sm text-ink">Privacy</h1>
        <p className="mt-2 text-sm text-ink/55">Last updated: October 2026</p>

        <div className="mt-8 space-y-8 text-[0.975rem] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-lg font-extrabold text-ink">What we collect</h2>
            <p className="mt-2">
              When you join the waitlist we store your email address, the launch perk you selected,
              a timestamp of your marketing consent, and a personal invite code for the referral
              program. If you joined through a friend&apos;s link, we also record which invite code
              brought you — never their name or email, and never yours to them. That&apos;s it — no
              names, phone numbers, or location data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">Why we collect it</h2>
            <p className="mt-2">
              To email you when the {SITE.name} store launches, to record which launch perk you
              chose, to prove we had your consent to contact you, and to count how many friends
              joined through your invite link (the referral rewards stack applies at launch).
              We don&apos;t sell, rent, or share your email with third parties for their own
              marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">Tracking & cookies</h2>
            <p className="mt-2">
              This site runs no analytics pixels, ad trackers, or non-essential cookies. Basic
              anti-spam protection may briefly rate-limit signup attempts by IP address; that data
              is not stored with your signup.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">How long we keep it</h2>
            <p className="mt-2">
              Until you ask us to delete it, or until the waitlist purpose ends — whichever comes
              first. Pre-launch signups won&apos;t be kept indefinitely just in case.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">Your rights</h2>
            <p className="mt-2">You can, at any time:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>Ask what data we hold about you</li>
              <li>Request a copy (export) of your data</li>
              <li>Ask us to delete your record</li>
              <li>Withdraw marketing consent by emailing us at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-ink">Contact</h2>
            <p className="mt-2">
              Data requests and questions:{" "}
              <a href={`mailto:${SITE.contactEmail}`} className="font-bold text-electric underline">
                {SITE.contactEmail}
              </a>
              . We aim to respond within 7 days. If we send marketing emails, they will include an
              unsubscribe option.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

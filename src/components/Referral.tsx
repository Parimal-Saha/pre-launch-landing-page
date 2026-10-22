import { referralTiers, REFERRAL_MAX_FRIENDS } from "@/lib/referral";

const tierCard = [
  "bg-neon text-ink",
  "bg-sky text-ink",
  "bg-pink text-ink",
];

export function Referral() {
  return (
    <section id="referral" className="scroll-mt-20 border-t-2 border-ink bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <p className="eyebrow text-electric">Invite your people</p>
            <h2 className="display mt-4 text-display-sm text-ink">
              Good taste is <em className="text-pink">better shared.</em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed font-medium text-ink/75">
            Each friend who verifies an eligible email through your personal link adds 10% off,
            up to 30% off your first qualifying order only. With the 15% Price Cut perk, three
            qualified referrals can bring that first order to 45% off. Referral discounts do not
            apply to later orders.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {referralTiers.map((t, i) => (
            <li
              key={t.n}
              className={`relative overflow-hidden rounded-[1.5rem] border-2 border-ink p-6 shadow-[0_12px_30px_-18px_rgba(30,30,30,0.45)] transition-transform hover:-translate-y-1 sm:p-7 ${tierCard[i]}`}
            >
              <span className="display text-5xl text-electric">{t.n}</span>
              <h3 className="mt-2 text-lg font-extrabold uppercase tracking-wide">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{t.body}</p>
              <span className="mt-6 inline-block rounded-full border-2 border-ink bg-ink px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-neon shadow-[0_3px_0_0_rgba(105,0,255,0.9)]">
                {t.reward}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-ink/15 bg-white px-6 py-5">
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink/70">
            <strong className="font-extrabold text-ink">How it works:</strong> join the waitlist
            to get your personal invite link — the moment you&apos;re on the list. Every friend
              who joins through it and verifies an eligible email counts toward your referral
              reward, up to {REFERRAL_MAX_FRIENDS} friends (30% off your first qualifying order
              only). At the top tier, this can combine with the 15% Price Cut perk for up to 45%
              off that first order. Option 2 receives up to 30% off its first order; free delivery
              remains available on its first five qualifying orders.
          </p>
          <a
            href="#join"
            className="rounded-full border-2 border-ink bg-electric px-6 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_#1e1e1e] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Get your link
          </a>
        </div>
      </div>
    </section>
  );
}

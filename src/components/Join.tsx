import { WaitlistCard } from "./WaitlistCard";

export function Join() {
  return (
    <section id="join" className="relative scroll-mt-20 overflow-hidden border-t-2 border-ink bg-neon">
      <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-wide text-ink uppercase sm:text-2xl">
            <span aria-hidden className="h-1.5 w-10 shrink-0 bg-pink sm:w-14" />
            Choose your perk
          </h2>
          <p className="max-w-sm text-sm leading-relaxed font-medium text-ink/75">
            All subscribers get early access. Pick the extra perk that feels most you.
          </p>
        </div>

        <WaitlistCard />
      </div>
    </section>
  );
}

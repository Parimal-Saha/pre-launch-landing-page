import Image from "next/image";

const items = [
  "Waitlist open",
  "Launching in Pakistan",
  "Five products",
  "One loud family",
  "Pick your perk",
];

/** Decorative ticker between hero and story. Hidden from screen readers. */
export function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {items.map((t) => (
        <span key={t} className="flex items-center gap-10">
          <span className="whitespace-nowrap text-lg font-extrabold tracking-wide text-neon uppercase sm:text-xl">
            {t}
          </span>
          <Image src="/assets/starburst-alpha.png" alt="" width={22} height={22} className="h-5 w-5" />
        </span>
      ))}
    </div>
  );

  return (
    <div aria-hidden className="overflow-hidden border-y-2 border-ink bg-ink py-4">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

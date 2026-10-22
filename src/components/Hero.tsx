import Image from "next/image";
import { products } from "@/lib/products";

/** Per-item pose for the standing lineup — mirrors the demo's collage stagger. */
const poses = [
  { width: "24%", rotate: "-5deg", z: "z-10", align: "mb-0" },
  { width: "27%", rotate: "2deg", z: "z-20", align: "mb-10" },
  { width: "24%", rotate: "0deg", z: "z-30", align: "mb-0" },
  { width: "26%", rotate: "3deg", z: "z-20", align: "mb-7" },
  { width: "25%", rotate: "-3deg", z: "z-10", align: "mb-2" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-neon">
      <div className="relative mx-auto w-full max-w-6xl px-5 pt-12 pb-16 sm:px-8 md:min-h-[660px] md:pt-14 md:pb-10">
        {/* small brand starburst beside the headline */}
        <Image
          src="/assets/starburst-alpha.png"
          alt=""
          aria-hidden
          width={480}
          height={480}
          className="absolute top-8 right-6 hidden w-14 rotate-12 md:block lg:right-16 lg:w-20"
        />

        <div className="relative z-0 md:max-w-[94%]">
          <p className="eyebrow text-ink">The pre-launch perk bar</p>

          <h1 className="display mt-5 text-[clamp(1.75rem,8.8vw,6.3rem)] md:text-[clamp(2.6rem,7.1vw,6.3rem)] text-electric">
            We like
            <br />
            options.
            <br />
            <em>You should too.</em>
          </h1>

          <p className="mt-8 max-w-[19rem] text-base leading-relaxed font-medium text-ink/90">
            Join the SUGAR SHADE insider list.
            <br />
            Pick the launch perk that feels most you.
          </p>
        </div>

        {/* standing product lineup — cut-outs from the identity book, starburst behind */}
        <div className="relative z-10 mx-auto mt-10 w-full max-w-xl md:absolute md:right-0 md:bottom-0 md:mt-0 md:w-[60%] md:max-w-none">
          <Image
            src="/assets/starburst-alpha.png"
            alt=""
            aria-hidden
            width={480}
            height={480}
            className="pointer-events-none absolute -top-6 right-0 w-[82%] rotate-12 md:-top-2 md:w-[86%]"
          />
          <div className="relative flex items-end justify-center md:justify-end">
            {products.map((p, i) => (
              <div
                key={p.id}
                className={`relative shrink-0 ${poses[i].z} ${poses[i].align} ${i === 0 ? "" : "-ml-[6%]"}`}
                style={{ width: poses[i].width }}
              >
                <Image
                  src={p.cutout}
                  alt={`${p.name} — ${p.type}`}
                  width={p.cutoutWidth}
                  height={p.cutoutHeight}
                  priority
                  sizes="(max-width: 768px) 24vw, 14vw"
                  className="h-auto w-full drop-shadow-[0_18px_22px_rgba(30,30,30,0.18)]"
                  style={{ transform: `rotate(${poses[i].rotate})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

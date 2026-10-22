import Image from "next/image";

export function Story() {
  return (
    <section id="story" className="scroll-mt-20 bg-paper">
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-12 md:py-28">
        {/* sticker column — the scrapbook side */}
        <div className="md:col-span-5">
          <div className="relative inline-flex flex-wrap items-end gap-5" aria-hidden>
            <Image
              src="/assets/stickers/mmw-monster.png"
              alt=""
              width={620}
              height={860}
              className="sticker w-32 rotate-[-6deg]"
            />
            <Image
              src="/assets/stickers/dtrt-blob.png"
              alt=""
              width={600}
              height={456}
              className="sticker w-36 rotate-[4deg]"
            />
            <p className="display mt-2 w-full -rotate-3 border-y-4 border-ink bg-neon px-4 py-3 text-center text-2xl text-ink sm:text-3xl">
              Good beauty, good people.
              <br />
              <span className="text-pink">No weird games.</span>
            </p>
          </div>
        </div>

        <div className="md:col-span-7 md:pt-8">
          <p className="eyebrow text-blaze">Our story</p>
          <h2 className="display mt-4 text-display-sm text-electric">
            We like our beauty
            <br />
            <em>with a little attitude.</em>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/85 sm:text-xl">
            SUGAR SHADE is building a more playful kind of skincare: bold, effective, conscious
            formulas that earn their slot — and talk like a person, not a lecture.
          </p>
          <p className="mt-5 text-base leading-relaxed text-ink/70 sm:text-lg">
            The whole line runs on one rule: skincare should be fun to use and honest about
            what&apos;s inside. Bright packs, actives that earn their slot, textures you&apos;ll
            actually look forward to. Five products that do exactly what they say on the bottle.
          </p>

          <a
            href="#collection"
            className="mt-8 inline-block rounded-full border-2 border-ink px-7 py-3.5 font-extrabold text-ink transition-colors hover:bg-ink hover:text-neon"
          >
            Meet the originals
          </a>
        </div>
      </div>
    </section>
  );
}

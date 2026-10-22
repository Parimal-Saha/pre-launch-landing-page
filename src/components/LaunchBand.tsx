import Image from "next/image";

export function LaunchBand() {
  return (
    <section className="border-y-2 border-ink bg-electric text-white">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
        <div className="relative mx-auto w-full max-w-sm rotate-[2.5deg] md:mx-0">
          <Image
            src="/assets/packaging-box.jpg"
            alt="SUGAR SHADE No Dirt Given tube on brand-pink packaging"
            width={1000}
            height={1393}
            loading="lazy"
            className="w-full rounded-[1.5rem] border-2 border-ink shadow-[0_28px_60px_-24px_rgba(0,0,0,0.55)]"
          />
          <Image
            src="/assets/starburst-alpha.png"
            alt=""
            aria-hidden
            width={480}
            height={480}
            className="absolute -bottom-6 -right-6 w-20"
          />
        </div>

        <div>
          <p className="eyebrow text-neon">Launch window</p>
          <h2 className="display mt-4 text-display-sm">
            Opening shop
            <br />
            <span className="text-neon">soon-ish.</span>
          </h2>
          <p className="lede mt-5 max-w-md text-white/85">
            The full SUGAR SHADE store opens at <strong className="font-extrabold">sugarshade.pk</strong>{" "}
            — cart, checkout and the whole lot. This page is just the front door, and the waitlist
            is the queue.
          </p>
          <a
            href="#join"
            className="mt-8 inline-block rounded-full border-2 border-ink bg-neon px-7 py-3.5 font-extrabold text-ink shadow-[0_4px_0_0_#1e1e1e] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Get in the queue
          </a>
        </div>
      </div>
    </section>
  );
}

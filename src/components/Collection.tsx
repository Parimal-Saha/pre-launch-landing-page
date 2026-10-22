import Image from "next/image";
import { products, type Product } from "@/lib/products";

const accentClasses: Record<Product["accent"], { number: string; chip: string }> = {
  neon: { number: "text-neon", chip: "bg-neon" },
  sky: { number: "text-sky", chip: "bg-sky" },
  blaze: { number: "text-blaze", chip: "bg-blaze" },
  pink: { number: "text-pink", chip: "bg-pink" },
  sun: { number: "text-sun", chip: "bg-sun" },
};

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-paper/10 bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-1 hover:border-neon">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ececec]">
        <Image
          src={product.image}
          alt={`${product.name} — ${product.type}`}
          width={760}
          height={950}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          loading={index < 3 ? "eager" : "lazy"}
        />
        <span
          className={`display absolute top-3 left-4 text-4xl ${accentClasses[product.accent].number}`}
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="sr-only">{`Item ${index + 1}`}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5 sm:p-6">
        <h3 className="display-mixed text-2xl text-ink">{product.name}</h3>
        <p className="text-sm font-extrabold uppercase tracking-wide text-ink/55">{product.type}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">{product.blurb}</p>
        <span
          className={`mt-3 inline-flex w-fit rounded-full border-2 border-ink px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-wider text-ink ${accentClasses[product.accent].chip}`}
        >
          {product.tag}
        </span>
      </div>
    </article>
  );
}

export function Collection() {
  return (
    <section id="collection" className="scroll-mt-20 border-b-2 border-ink bg-ink text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-neon">Meet the SUGAR SHADE originals</p>
            <h2 className="display mt-4 text-display-sm text-paper">Five skincare originals.</h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-paper/60">
            Real routines. Real life. A more playful kind of skincare, made for you — final
            launch details confirmed at the full store.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}

          {/* perk call-out fills the sixth grid slot */}
          <a
            href="#join"
            className="flex flex-col justify-between rounded-2xl border-2 border-neon bg-neon p-6 text-ink transition-transform hover:-translate-y-1 sm:p-7"
          >
            <div>
              <Image src="/assets/starburst-alpha.png" alt="" aria-hidden width={480} height={480} className="w-12" />
              <h3 className="display mt-4 text-2xl">Your perk is waiting.</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                Pick one of three launch perks when you join the insider list — 15% off, free
                delivery, or a mystery first order.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-extrabold text-electric">
              Choose your perk <span aria-hidden>↓</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

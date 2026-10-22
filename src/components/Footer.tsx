import Image from "next/image";
import Link from "next/link";
import { SITE, SOCIAL_LINKS } from "@/lib/site";

// Frozen at module load so the page stays deterministically prerenderable.
const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Image
              src="/assets/logo-lime-bluestar.png"
              alt="SUGAR SHADE"
              width={1000}
              height={643}
              className="h-10 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">
              Pre-launch site for the SUGAR SHADE skincare drop. The full store opens at{" "}
              {SITE.url.replace("https://", "")}.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col text-sm font-bold">
            <Link
              href="/privacy"
              className="-mx-2 rounded-lg px-2 py-2.5 text-paper/80 transition-colors hover:text-neon"
            >
              Privacy Policy
            </Link>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="-mx-2 rounded-lg px-2 py-2.5 text-paper/80 transition-colors hover:text-neon"
            >
              Contact
            </a>
            <a
              href={`mailto:${SITE.contactEmail}?subject=Unsubscribe`}
              className="-mx-2 rounded-lg px-2 py-2.5 text-paper/80 transition-colors hover:text-neon"
            >
              Unsubscribe
            </a>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="-mx-2 rounded-lg px-2 py-2.5 break-all text-paper/55 transition-colors hover:text-neon"
            >
              {SITE.contactEmail}
            </a>
          </nav>

          <nav aria-label="Social media" className="flex flex-col text-sm font-bold">
            {SOCIAL_LINKS.length ? (
              SOCIAL_LINKS.map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="-mx-2 rounded-lg px-2 py-2.5 text-paper/80 transition-colors hover:text-neon"
                >
                  {label}
                </a>
              ))
            ) : (
              <p className="px-2 py-2.5 text-paper/60">Social links coming soon.</p>
            )}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-paper/15 pt-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} {SITE.name}. All rights reserved.</p>
          <p>Made loud in Pakistan · Launching at {SITE.url.replace("https://", "")}</p>
        </div>
      </div>
    </footer>
  );
}

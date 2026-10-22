"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "#collection", label: "The originals" },
  { href: "#story", label: "Our story" },
  { href: "#join", label: "Join the list" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-neon/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="#top"
          aria-label="SUGAR SHADE — back to top"
          className="shrink-0"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/assets/logo-wordmark.png"
            alt="SUGAR SHADE"
            width={1400}
            height={656}
            priority
            className="h-9 w-auto md:h-11"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:text-electric"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#join"
            className="rounded-full border-2 border-ink bg-ink px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-neon shadow-[0_3px_0_0_rgba(105,0,255,0.9)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Join early
          </a>

          {/* mobile disclosure menu */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-neon md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 stroke-ink" strokeWidth="2.5" fill="none">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-t-2 border-ink bg-neon px-5 pb-4 md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-ink/15 py-3 text-sm font-extrabold uppercase tracking-wide text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

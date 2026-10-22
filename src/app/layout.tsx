import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/site";

/* Display: Montserrat Black (OFL) — heavy grotesque caps, italic accents */
const display = localFont({
  src: [
    { path: "../../public/fonts/montserrat-black-latin.woff2", weight: "900", style: "normal" },
    { path: "../../public/fonts/montserrat-black-italic-latin.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-display-face",
  display: "swap",
});

/* Just Sans substitute: Plus Jakarta Sans (OFL) — clean, readable body */
const pjs = localFont({
  src: [
    { path: "../../public/fonts/pjs-latin.woff2", weight: "200 800", style: "normal" },
    { path: "../../public/fonts/pjs-italic-latin.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-pjs",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    locale: "en_PK",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${SITE.name} — neon lime wordmark with pink starburst` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#D7FF06",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${pjs.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}

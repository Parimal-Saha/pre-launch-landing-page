/** Brand configuration. Set NEXT_PUBLIC_SITE_URL to the assigned live host. */
export const SITE = {
  name: "SUGAR SHADE",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sugarshade.pk",
  tagline: "Skincare with something to say",
  description:
    "SUGAR SHADE is a five-product skincare drop landing in Pakistan. Join the waitlist, pick your launch perk, and be first in line when the store opens.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "aadhanaan2@gmail.com",
} as const;

const configuredSocialLinks = [
  { label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK_URL },
  { label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL },
];

/** Only expose explicitly configured HTTPS social URLs. */
export const SOCIAL_LINKS = configuredSocialLinks.flatMap(({ label, url }) => {
  if (!url) return [];
  try {
    return new URL(url).protocol === "https:" ? [{ label, url }] : [];
  } catch {
    return [];
  }
});

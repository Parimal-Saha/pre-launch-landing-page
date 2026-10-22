/**
 * Single source of truth for the three launch perks.
 * The perk picker, the signup form payload, the API schema, and the database
 * CHECK constraint all validate against the ids defined here.
 *
 * Perks are a *waitlist preference*: choosing one stores intent only.
 * Discount / shipping / mystery-box benefits are not enforced anywhere in
 * this codebase — see docs/future-integrations.md for how redemption will
 * work at launch.
 */
export const perks = [
  {
    id: "price-cut",
    option: "Option 1",
    title: "The Price Cut",
    headline: "Take 15% off",
    tail: "",
    reward: "15% off each of your first three qualifying orders.",
    accent: "neon" as const,
  },
  {
    id: "delivery-treat",
    option: "Option 2",
    title: "The Delivery Treat",
    headline: "Delivery?",
    tail: "Our treat.",
    reward: "Free delivery for your first five qualifying orders.",
    accent: "sky" as const,
  },
  {
    id: "mystery-box",
    option: "Option 3",
    title: "The Mystery Box",
    headline: "Your first order,",
    tail: "with a twist.",
    reward: "Get your first order in a special SUGAR SHADE mystery box.",
    accent: "pink" as const,
  },
] as const;

export type Perk = (typeof perks)[number];
export type PerkId = Perk["id"];
export type PerkAccent = Perk["accent"];

export const perkIds = perks.map((p) => p.id) as readonly PerkId[];

export function isPerkId(value: unknown): value is PerkId {
  return typeof value === "string" && (perkIds as readonly string[]).includes(value);
}

export function getPerk(id: PerkId): Perk {
  return perks.find((p) => p.id === id)!;
}

/** Card skin per accent — kept here so every perk surface stays in sync. */
export const perkAccentClasses: Record<PerkAccent, { card: string; chip: string }> = {
  neon: { card: "bg-neon", chip: "bg-neon" },
  sky: { card: "bg-sky", chip: "bg-sky" },
  pink: { card: "bg-pink", chip: "bg-pink" },
};

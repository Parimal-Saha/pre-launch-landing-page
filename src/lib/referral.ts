/**
 * Referral program constants.
 *
 * The program is real on this page: every signup gets a unique code, invite
 * links carry `?ref=CODE`, and friend signups are recorded server-side via
 * `referred_by`. Rewards themselves (the +10/20/30% stack) are applied by
 * the store at launch — nothing here grants a discount by itself.
 */

/** A referral code is 8 uppercase alphanumerics. */
export const REFERRAL_CODE_RE = /^[A-Z0-9]{8}$/;

/** How many stored friend signups unlock the full reward stack. */
export const REFERRAL_MAX_FRIENDS = 3;

export const referralTiers = [
  {
    n: "01",
    friends: 1,
    title: "One friend",
    body: "One verified eligible friend unlocks 10% off your first qualifying order.",
    reward: "+10% off",
  },
  {
    n: "02",
    friends: 2,
    title: "Two friends",
    body: "Two verified eligible friends unlock 20% off your first qualifying order.",
    reward: "+20% off",
  },
  {
    n: "03",
    friends: 3,
    title: "Three friends",
    body: "Three verified eligible friends unlock 30% off your first qualifying order only.",
    reward: "+30% off",
  },
] as const;

export function isValidReferralCode(value: unknown): value is string {
  return typeof value === "string" && REFERRAL_CODE_RE.test(value);
}

/** Friendly reward label for a friend count (capped at the top tier). */
export function rewardForFriends(count: number): string {
  const tier = [...referralTiers].reverse().find((t) => t.friends <= count);
  return tier ? tier.reward : "";
}

import { z } from "zod";
import { perkIds } from "./perks";
import { REFERRAL_CODE_RE } from "./referral";

/** Deliberately loose email check — deliverability is the mail server's job. */
const EmailSchema = z
  .string()
  .trim()
  .min(3, "Enter your email address.")
  .max(254, "That email address is too long.")
  .refine(
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    "That doesn't look like a valid email address.",
  )
  .transform((v) => v.toLowerCase());

/**
 * Signup payload shared by the client form and the API route so both sides
 * validate against identical rules.
 * `company` is the honeypot — real visitors never see it and it must be empty.
 * It is intentionally NOT length-restricted here: the route detects a filled
 * honeypot and fakes success instead of returning an error bots can learn from.
 *
 * `referral` is the friend-code carried by `?ref=` invite links. Malformed
 * values are silently dropped to "" — a tampered URL must never block a
 * legitimate signup, and unknown-but-wellformed codes simply never count.
 */
export const SignupSchema = z.object({
  email: EmailSchema,
  perk: z.enum(perkIds as unknown as [string, ...string[]], {
    message: "Pick a launch perk first.",
  }),
  consent: z.literal(true, {
    message: "We need your permission before we can email you.",
  }),
  referral: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      const code = (v ?? "").toUpperCase();
      return REFERRAL_CODE_RE.test(code) ? code : "";
    }),
  /** Honeypot field — must be an empty string for real visitors. */
  company: z.string().optional().default(""),
});

export type SignupInput = z.input<typeof SignupSchema>;

export const HONEYPOT_FIELD = "company";

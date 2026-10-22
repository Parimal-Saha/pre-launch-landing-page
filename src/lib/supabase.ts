import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let client: SupabaseClient | null = null;

/**
 * Lazily create the server-side Supabase client (service role).
 *
 * The service role key bypasses Row Level Security — it must never be exposed
 * to the browser. All writes happen here, server-side; the anon key is not
 * used by this app because the public never reads or writes the table directly.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Public key for browser-side email OTP; safe to expose (RLS protects data). */
export function getPublicSupabaseConfig() {
  const { url, anonKey } = getSupabaseConfig();
  return { url, anonKey };
}

export type WaitlistRow = {
  email: string;
  perk_id: string;
  consent_marketing: boolean;
  consent_at: string;
  email_verified_at: string;
  email_domain: string;
  /** Unique invite code generated server-side for every signup. */
  referral_code: string;
  /** Friend-code carried by the `?ref=` invite link, if any. */
  referred_by: string | null;
};

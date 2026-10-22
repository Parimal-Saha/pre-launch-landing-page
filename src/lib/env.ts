/**
 * Server-side environment access with validation.
 * These values must only ever be read in Route Handlers / server code —
 * never in client components. See .env.example for documentation.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing server environment variable ${name}. Copy .env.example and configure it (see README).`,
    );
  }
  return value;
}

export type SupabaseConfig = { url: string; serviceRoleKey: string; anonKey: string };

/** Throws a descriptive error when the waitlist database is not configured. */
export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

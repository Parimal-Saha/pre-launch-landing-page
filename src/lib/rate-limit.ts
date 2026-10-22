/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * Suitable for a single serverless instance as a proportionate spam brake,
 * layered with a honeypot and server-side validation. For strict global
 * limits across all regions, back this with Upstash/Redis or Vercel WAF —
 * documented in README ("Production hardening").
 */

type Window = { hits: number[] };

const buckets = new Map<string, Window>();
const MAX_BUCKETS = 10_000;

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SIGNUPS = 5; // 5 signups per window per key
const MAX_READS = 60; // 60 lightweight reads per window per key

/** Returns true when the key is still allowed to make a request. */
export function rateLimit(key: string, limit = MAX_SIGNUPS, now = Date.now()): boolean {
  const cutoff = now - WINDOW_MS;

  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
    // Defensive reset if an attacker fans out keys — keeps memory bounded.
    buckets.clear();
  }

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

/** Extract a stable client key (IP) from request headers. */
export function clientKey(request: Request): string {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Budget for lightweight GETs (referral counts) — same window, higher cap. */
export function readBudget(request: Request): string {
  return `read:${clientKey(request)}`;
}

export const READ_LIMIT = MAX_READS;

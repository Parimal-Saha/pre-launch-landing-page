import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SignupSchema } from "@/lib/validation";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/env";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`otp:${clientKey(request)}`, 3)) {
    return NextResponse.json({ ok: false, error: "Too many code requests. Try again later." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const email = SignupSchema.shape.email.safeParse((body as { email?: unknown })?.email);
  if (!email.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Email verification is not configured yet." }, { status: 503 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await auth.auth.signInWithOtp({ email: email.data, options: { shouldCreateUser: true } });
  if (error) {
    console.error("[otp] send failed:", error.message);
    return NextResponse.json({ ok: false, error: "We couldn't send a code right now. Check the address and try again shortly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

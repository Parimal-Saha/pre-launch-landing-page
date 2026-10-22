/**
 * Email notification seam.
 *
 * No email provider has been selected or configured for this project, so the
 * default implementation is a deliberate no-op. When a provider is chosen
 * (Resend, Loops, Klaviyo, Supabase email …), implement `deliver()` behind
 * the same interface — callers in the signup route never change.
 *
 * Never assume a provider exists: `isEmailConfigured()` gates any attempt.
 */

export type SignupNotification = {
  email: string;
  perkId: string;
  consentAt: string;
};

export function isEmailConfigured(): boolean {
  // Deliberately empty: no provider selected. Extend here when one is.
  return false;
}

/** Fire-and-forget welcome/confirmation hook. Default: no-op. */
export async function deliverSignupEmail(notification: SignupNotification): Promise<void> {
  if (!isEmailConfigured()) return;
  // Provider integration goes here, using `notification`. Failures must never
  // fail the signup: the database row is the source of truth.
  void notification;
}

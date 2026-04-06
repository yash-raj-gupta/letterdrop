import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[LetterDrop] RESEND_API_KEY is not set. Email sending will be simulated."
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "noreply@letterdrop.com";

/**
 * Check if Resend is properly configured for real sending.
 */
export function isResendConfigured(): boolean {
  return (
    !!process.env.RESEND_API_KEY &&
    process.env.RESEND_API_KEY !== "re_placeholder" &&
    !process.env.RESEND_API_KEY.startsWith("re_your")
  );
}

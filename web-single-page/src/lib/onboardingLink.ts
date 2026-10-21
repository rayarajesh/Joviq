const emailKey = "joviq-onboarding-email";
const manualKey = "joviq-onboarding-manual";

export function openOnboarding(email: string, manual = false) {
  try {
    sessionStorage.setItem(emailKey, email);
    // When the learner closed the onboarding form (X), land them on the email-entry screen and let
    // them press Continue themselves instead of auto-resuming straight back into the form.
    if (manual) sessionStorage.setItem(manualKey, "1");
    else sessionStorage.removeItem(manualKey);
  } catch { /* Sign-in can collect it again. */ }
  window.location.assign("/onboarding");
}

export function readOnboardingEmail() {
  try { return sessionStorage.getItem(emailKey) ?? ""; } catch { return ""; }
}

/** One-shot: true when /onboarding was opened from a form close, so it must not auto-resume. */
export function consumeManualResumeFlag() {
  try {
    const manual = sessionStorage.getItem(manualKey) === "1";
    sessionStorage.removeItem(manualKey);
    return manual;
  } catch { return false; }
}

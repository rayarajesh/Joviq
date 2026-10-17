const emailKey = "joviq-onboarding-email";

export function openOnboarding(email: string) {
  try { sessionStorage.setItem(emailKey, email); } catch { /* Sign-in can collect it again. */ }
  window.location.assign("/onboarding");
}

export function readOnboardingEmail() {
  try { return sessionStorage.getItem(emailKey) ?? ""; } catch { return ""; }
}

import { request } from "../../../lib/api/httpClient";
import type { AuthTokenResponse, CheckoutAccountRequest, PasswordResetVerificationResponse, UserSummary } from "./authTypes";
import { env } from "../../../config/env";

// The enrollment subset of the /web auth API: same endpoints, same payloads.
export const authApi = {
  oauthStartUrl(options: { phoneNumber?: string; returnUrl?: string; acceptedTerms?: boolean; allowSignUp?: boolean; email?: string } = {}) {
    const search = new URLSearchParams({
      returnUrl: options.returnUrl ?? "/dashboard",
      acceptedTerms: String(options.acceptedTerms ?? true),
      allowSignUp: String(options.allowSignUp ?? true),
      rememberMe: "true",
      termsVersion: "2026-08-20",
      privacyPolicyVersion: "2026-08-20"
    });
    if (options.phoneNumber) search.set("phoneNumber", options.phoneNumber);
    // The paid-onboarding email: pre-selects the Google account (login_hint) and is enforced
    // server-side so a different Google account cannot be linked to this enrollment.
    if (options.email) search.set("email", options.email);
    return `${env.apiBaseUrl}/api/v1/auth/oauth/google/start?${search.toString()}`;
  },

  // Whether Google sign-in is configured on the server (client id/secret present).
  providers() {
    return request<{ google: boolean }>("/api/v1/auth/providers", { accessToken: null, skipAuthRetry: true });
  },

  createCheckoutAccount(body: CheckoutAccountRequest) {
    return request<AuthTokenResponse>("/api/v1/auth/checkout-account", {
      method: "POST",
      body,
      accessToken: null,
      skipAuthRetry: true
    });
  },

  login(body: { email: string; password: string; rememberMe: boolean; deviceName?: string }) {
    return request<AuthTokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body,
      accessToken: null,
      skipAuthRetry: true
    });
  },

  // Email-only resume: signs the student in when their email has a verified payment, with no
  // password or OTP. The API rejects any email without a verified payment.
  resumeOnboarding(email: string) {
    return request<AuthTokenResponse>("/api/v1/auth/resume-onboarding", {
      method: "POST",
      body: { email },
      accessToken: null,
      skipAuthRetry: true
    });
  },

  refresh() {
    return request<AuthTokenResponse>("/api/v1/auth/refresh", {
      method: "POST",
      accessToken: null,
      skipAuthRetry: true
    });
  },

  logout() {
    return request<void>("/api/v1/auth/logout", { method: "POST" });
  },

  me() {
    return request<UserSummary>("/api/v1/auth/me");
  },

  forgotPassword(email: string) {
    return request<void>("/api/v1/auth/forgot-password", { method: "POST", body: { email } });
  },

  verifyForgotPassword(email: string, otp: string) {
    return request<PasswordResetVerificationResponse>("/api/v1/auth/forgot-password/verify", {
      method: "POST",
      body: { email, otp }
    });
  },

  resetPassword(body: { userId: string; resetToken: string; newPassword: string; confirmPassword: string }) {
    return request<void>("/api/v1/auth/reset-password", { method: "POST", body });
  }
};

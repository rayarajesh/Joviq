import { request } from "../../../lib/api/httpClient";
import type { AuthTokenResponse, CheckoutAccountRequest, PasswordResetVerificationResponse, UserSummary } from "./authTypes";

// The enrollment subset of the /web auth API: same endpoints, same payloads.
export const authApi = {
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

import { env } from "../../../config/env";
import { request } from "../../../lib/api/httpClient";
import type {
  AdminUserResponse,
  AdminUserSummaryResponse,
  AuthTokenResponse,
  CreateAdminUserRequest,
  OtpPurpose,
  PagedResult,
  PasswordResetVerificationResponse,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
  UserSummary
} from "./authTypes";

export const authApi = {
  oauthStartUrl(
    provider: "google",
    options: {
      returnUrl?: string;
      acceptedTerms?: boolean;
      allowSignUp?: boolean;
      phoneNumber?: string;
      rememberMe?: boolean;
      termsVersion?: string;
      privacyPolicyVersion?: string;
      refundPolicyVersion?: string;
    } = {}
  ) {
    const search = new URLSearchParams();
    search.set("returnUrl", options.returnUrl ?? "/dashboard");
    search.set("acceptedTerms", String(options.acceptedTerms ?? false));
    search.set("allowSignUp", String(options.allowSignUp ?? false));
    search.set("rememberMe", String(options.rememberMe ?? false));

    if (options.phoneNumber) {
      search.set("phoneNumber", options.phoneNumber);
    }

    if (options.termsVersion) {
      search.set("termsVersion", options.termsVersion);
    }

    if (options.privacyPolicyVersion) {
      search.set("privacyPolicyVersion", options.privacyPolicyVersion);
    }

    if (options.refundPolicyVersion) {
      search.set("refundPolicyVersion", options.refundPolicyVersion);
    }

    return `${env.apiBaseUrl}/api/v1/auth/oauth/${provider}/start?${search.toString()}`;
  },

  register(body: RegisterRequest) {
    return request<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
      body,
      accessToken: null,
      skipAuthRetry: true
    });
  },

  login(body: {
    email: string;
    password: string;
    rememberMe: boolean;
    deviceName?: string;
  }) {
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

  logoutAll() {
    return request<void>("/api/v1/auth/logout-all", { method: "POST" });
  },

  me() {
    return request<UserSummary>("/api/v1/auth/me");
  },

  sendEmailVerification(email: string) {
    return request<void>("/api/v1/auth/email-verification/send", {
      method: "POST",
      body: { email }
    });
  },

  verifyEmail(email: string, otp: string) {
    return request<void>("/api/v1/auth/email-verification/verify", {
      method: "POST",
      body: { email, otp }
    });
  },

  sendPhoneOtp(phoneNumber: string, purpose: OtpPurpose) {
    return request<void>("/api/v1/auth/phone-otp/send", {
      method: "POST",
      body: { phoneNumber, purpose }
    });
  },

  verifyPhoneOtp(phoneNumber: string, purpose: OtpPurpose, otp: string) {
    return request<void>("/api/v1/auth/phone-otp/verify", {
      method: "POST",
      body: { phoneNumber, purpose, otp }
    });
  },

  requestOtpLogin(phoneNumber: string) {
    return request<void>("/api/v1/auth/login/otp/request", {
      method: "POST",
      body: { phoneNumber }
    });
  },

  verifyOtpLogin(body: {
    phoneNumber: string;
    otp: string;
    rememberMe: boolean;
    deviceName?: string;
  }) {
    return request<AuthTokenResponse>("/api/v1/auth/login/otp/verify", { method: "POST", body });
  },

  forgotPassword(emailOrPhone: string) {
    return request<void>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { emailOrPhone }
    });
  },

  verifyForgotPassword(emailOrPhone: string, otp: string) {
    return request<PasswordResetVerificationResponse>("/api/v1/auth/forgot-password/verify", {
      method: "POST",
      body: { emailOrPhone, otp }
    });
  },

  resetPassword(body: {
    userId: string;
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return request<void>("/api/v1/auth/reset-password", { method: "POST", body });
  },

  changePassword(body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return request<void>("/api/v1/auth/change-password", { method: "POST", body });
  },

  getSessions() {
    return request<SessionResponse[]>("/api/v1/auth/sessions");
  },

  revokeSession(sessionId: string) {
    return request<void>(`/api/v1/auth/sessions/${sessionId}`, { method: "DELETE" });
  },

  revokeOtherSessions() {
    return request<void>("/api/v1/auth/sessions", { method: "DELETE" });
  }
};

export const accountApi = {
  requestDelete() {
    return request<void>("/api/v1/account/delete/request", { method: "POST" });
  },

  confirmDelete(otp: string, reason?: string) {
    return request<void>("/api/v1/account/delete/confirm", {
      method: "POST",
      body: { otp, reason }
    });
  }
};

export const adminUsersApi = {
  getSummary() {
    return request<AdminUserSummaryResponse>("/api/v1/admin/users/summary");
  },

  getUsers(params: {
    search?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    });

    const query = search.toString();
    return request<PagedResult<AdminUserResponse>>(`/api/v1/admin/users${query ? `?${query}` : ""}`);
  },

  getUser(userId: string) {
    return request<AdminUserResponse>(`/api/v1/admin/users/${userId}`);
  },

  createUser(body: CreateAdminUserRequest) {
    return request<AdminUserResponse>("/api/v1/admin/users", { method: "POST", body });
  },

  updateStatus(userId: string, body: UpdateUserStatusRequest) {
    return request<AdminUserResponse>(`/api/v1/admin/users/${userId}/status`, {
      method: "PATCH",
      body
    });
  },

  updateRoles(userId: string, body: UpdateUserRolesRequest) {
    return request<AdminUserResponse>(`/api/v1/admin/users/${userId}/roles`, {
      method: "PATCH",
      body
    });
  },

  lockUser(userId: string) {
    return request<void>(`/api/v1/admin/users/${userId}/lock`, { method: "POST" });
  },

  unlockUser(userId: string) {
    return request<void>(`/api/v1/admin/users/${userId}/unlock`, { method: "POST" });
  },

  sendResetPasswordLink(userId: string) {
    return request<void>(`/api/v1/admin/users/${userId}/reset-password-link`, { method: "POST" });
  },

  getSessions(userId: string) {
    return request<SessionResponse[]>(`/api/v1/admin/users/${userId}/sessions`);
  },

  revokeSession(userId: string, sessionId: string) {
    return request<void>(`/api/v1/admin/users/${userId}/sessions/${sessionId}`, {
      method: "DELETE"
    });
  },

  logoutAll(userId: string) {
    return request<void>(`/api/v1/admin/users/${userId}/logout-all`, { method: "POST" });
  }
};

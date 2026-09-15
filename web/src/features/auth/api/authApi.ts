import { env } from "../../../config/env";
import { getClientDeviceId, request } from "../../../lib/api/httpClient";
import type {
  AdminUserResponse,
  AdminUserSummaryResponse,
  AccountProfile,
  AuthTokenResponse,
  CreateAdminUserRequest,
  PagedResult,
  PasswordResetVerificationResponse,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
  UpdateAccountProfileRequest,
  UpdateAdminUserRequest,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
  UserSummary
} from "./authTypes";

export const authApi = {
  providers() {
    return request<{ google: boolean }>("/api/v1/auth/providers", { accessToken: null, skipAuthRetry: true });
  },
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
    } = {}
  ) {
    const search = new URLSearchParams();
    search.set("returnUrl", options.returnUrl ?? "/dashboard");
    search.set("acceptedTerms", String(options.acceptedTerms ?? false));
    search.set("allowSignUp", String(options.allowSignUp ?? false));
    search.set("rememberMe", String(options.rememberMe ?? false));

    const deviceId = getClientDeviceId();
    if (deviceId) {
      search.set("deviceId", deviceId);
    }

    if (options.phoneNumber) {
      search.set("phoneNumber", options.phoneNumber);
    }

    if (options.termsVersion) {
      search.set("termsVersion", options.termsVersion);
    }

    if (options.privacyPolicyVersion) {
      search.set("privacyPolicyVersion", options.privacyPolicyVersion);
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

  getProfile() {
    return request<AccountProfile>("/api/v1/account/profile");
  },

  updateProfile(body: UpdateAccountProfileRequest) {
    return request<AccountProfile>("/api/v1/account/profile", { method: "PUT", body });
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

  forgotPassword(email: string) {
    return request<void>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  },

  verifyForgotPassword(email: string, otp: string) {
    return request<PasswordResetVerificationResponse>("/api/v1/auth/forgot-password/verify", {
      method: "POST",
      body: { email, otp }
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
    status?: string;
    sortBy?: string;
    sortDirection?: string;
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

  updateUser(userId: string, body: UpdateAdminUserRequest) {
    return request<AdminUserResponse>(`/api/v1/admin/users/${userId}`, {
      method: "PUT",
      body
    });
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

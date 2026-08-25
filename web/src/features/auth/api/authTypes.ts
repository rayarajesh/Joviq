export type RoleName = "Admin" | "Mentor" | "Student";
export type AssignableRoleName = "Mentor" | "Student";

export type OtpPurpose =
  | "EmailVerification"
  | "PhoneVerification"
  | "Login"
  | "ForgotPassword"
  | "ChangePassword"
  | "DeleteAccount";

export type RegisterRequest = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  termsVersion: string;
  privacyPolicyVersion: string;
  refundPolicyVersion: string;
};

export type RegisterResponse = {
  userId: string;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
  deviceName?: string;
};

export type UserSummary = {
  id: string;
  fullName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  phoneNumberConfirmed: boolean;
  roles: RoleName[];
  accountStatus: string;
  onboardingStatus: string;
};

export type AuthTokenResponse = {
  accessToken?: string;
  expiresIn: number;
  user: UserSummary;
};

export type SessionResponse = {
  id: string;
  deviceName?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  createdAt: string;
  lastSeenAt?: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type PasswordResetVerificationResponse = {
  userId: string;
  resetToken: string;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type AdminUserResponse = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  emailConfirmed: boolean;
  roles: RoleName[];
  accountStatus: string;
  onboardingStatus: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type AdminUserSummaryResponse = {
  totalUsers: number;
  students: number;
  mentors: number;
  admins: number;
  active: number;
  locked: number;
  pendingEmailVerification: number;
};

export type CreateAdminUserRequest = {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: AssignableRoleName;
  temporaryPassword: string;
};

export type UpdateUserStatusRequest = {
  accountStatus: string;
};

export type UpdateUserRolesRequest = {
  roles: RoleName[];
};

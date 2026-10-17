import { request } from "../../../lib/api/httpClient";
import type {
  CreateEnrollmentRequest,
  ChangeEnrollmentProgramRequest,
  CreatePaymentCheckoutRequest,
  EnrollmentResponse,
  PaymentCheckoutResponse,
  PaymentTransactionResponse,
  ProgramDetailsResponse,
  SavePostPaymentRegistrationRequest,
  VerifyPaymentRequest
} from "./lmsTypes";

// The public catalog and checkout subset of the /web LMS API.
export const publicLmsApi = {
  getProgram(slug: string) {
    return request<ProgramDetailsResponse>(`/api/v1/public/programs/${slug}`);
  }
};

export const studentOnboardingApi = {
  get() {
    return request<{ academic: { college?: string }; registration: { executiveName?: string } }>("/api/v1/student/onboarding");
  },
  saveRegistration(body: SavePostPaymentRegistrationRequest) {
    return request<unknown>("/api/v1/student/onboarding/registration", { method: "PUT", body });
  }
};

export const studentLmsApi = {
  getPayments() {
    return request<PaymentTransactionResponse[]>("/api/v1/student/lms/payments");
  },
  createEnrollment(body: CreateEnrollmentRequest) {
    return request<EnrollmentResponse>("/api/v1/student/lms/enrollments", { method: "POST", body });
  },

  completePaidEnrollmentRegistration(paymentId: string, body: ChangeEnrollmentProgramRequest) {
    return request<EnrollmentResponse>(`/api/v1/student/lms/payments/${paymentId}/enrollment`, { method: "PATCH", body });
  },

  createPaymentCheckout(body: CreatePaymentCheckoutRequest) {
    return request<PaymentCheckoutResponse>("/api/v1/student/lms/payments/checkout", { method: "POST", body });
  },

  verifyPayment(body: VerifyPaymentRequest) {
    return request<PaymentTransactionResponse>("/api/v1/student/lms/payments/verify", { method: "POST", body });
  },

  markPaymentFailed(paymentId: string, body: { failureReason?: string } = {}) {
    return request<PaymentTransactionResponse>(`/api/v1/student/lms/payments/${paymentId}/failed`, { method: "POST", body });
  }
};

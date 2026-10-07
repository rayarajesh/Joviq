import { request } from "../../../lib/api/httpClient";
import type {
  CreateEnrollmentRequest,
  CreatePaymentCheckoutRequest,
  EnrollmentResponse,
  PaymentCheckoutResponse,
  PaymentTransactionResponse,
  ProgramDetailsResponse,
  VerifyPaymentRequest
} from "./lmsTypes";

// The public catalog and checkout subset of the /web LMS API.
export const publicLmsApi = {
  getProgram(slug: string) {
    return request<ProgramDetailsResponse>(`/api/v1/public/programs/${slug}`);
  }
};

export const studentLmsApi = {
  createEnrollment(body: CreateEnrollmentRequest) {
    return request<EnrollmentResponse>("/api/v1/student/lms/enrollments", { method: "POST", body });
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

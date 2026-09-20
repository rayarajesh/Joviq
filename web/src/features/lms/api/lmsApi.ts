import { request } from "../../../lib/api/httpClient";
import type {
  AdminNotificationResponse,
  AdminLmsSummaryResponse,
  AuditLogPage,
  CertificateResponse,
  CouponResponse,
  CreateAdminNotificationRequest,
  CreateCategoryRequest,
  CreateCouponRequest,
  CreateEnrollmentRequest,
  CreateLessonRequest,
  CreateModuleRequest,
  CreatePaymentCheckoutRequest,
  CreatePlanRequest,
  CreateProjectRequest,
  CreateProgramRequest,
  CurriculumModuleResponse,
  CouponValidationResponse,
  EnrollmentResponse,
  IssueCertificateRequest,
  LessonResponse,
  PaymentCheckoutResponse,
  PaymentReceiptResponse,
  PaymentTransactionResponse,
  ProgramCategoryResponse,
  ProgramDetailsResponse,
  ProgramListParams,
  ProgramPlanResponse,
  ProgramSummaryResponse,
  ProjectResponse,
  ProjectSubmissionReviewResponse,
  ProjectStudentResponse,
  PublishProjectRequest,
  ReorderItemsRequest,
  StudentLmsDashboardResponse,
  StudentMyProgramsResponse,
  StudentProgramWorkspaceResponse,
  SubmissionResponse,
  UpdateCertificateStatusRequest,
  UpdateEnrollmentStatusRequest,
  UpdatePaymentStatusRequest,
  VerifyPaymentRequest,
} from "./lmsTypes";

function toQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const publicLmsApi = {
  getCategories() {
    return request<ProgramCategoryResponse[]>("/api/v1/public/categories");
  },

  getPrograms(params: ProgramListParams = {}) {
    return request<ProgramSummaryResponse[]>(
      `/api/v1/public/programs${toQuery(params)}`,
    );
  },

  getProgram(slug: string) {
    return request<ProgramDetailsResponse>(`/api/v1/public/programs/${slug}`);
  },

  verifyCertificate(certificateId: string) {
    return request<import("./lmsTypes").CertificateVerificationResponse>(
      `/api/v1/public/certificates/verify/${certificateId}`,
    );
  },
};

export const studentLmsApi = {
  getDashboard() {
    return request<StudentLmsDashboardResponse>(
      "/api/v1/student/lms/dashboard",
    );
  },

  getWorkspace() {
    return request<StudentProgramWorkspaceResponse>(
      "/api/v1/student/lms/workspace",
    );
  },

  getMyProgram() {
    return request<ProgramDetailsResponse>("/api/v1/student/lms/my-program");
  },

  getMyPrograms() {
    return request<StudentMyProgramsResponse>(
      "/api/v1/student/lms/my-programs",
    );
  },

  createEnrollment(body: CreateEnrollmentRequest) {
    return request<EnrollmentResponse>("/api/v1/student/lms/enrollments", {
      method: "POST",
      body,
    });
  },

  createPaymentCheckout(body: CreatePaymentCheckoutRequest) {
    return request<PaymentCheckoutResponse>(
      "/api/v1/student/lms/payments/checkout",
      { method: "POST", body },
    );
  },

  validateCoupon(body: import("./lmsTypes").ValidateCouponRequest) {
    return request<CouponValidationResponse>(
      "/api/v1/student/lms/payments/coupon/validate",
      { method: "POST", body },
    );
  },

  verifyPayment(body: VerifyPaymentRequest) {
    return request<PaymentTransactionResponse>(
      "/api/v1/student/lms/payments/verify",
      { method: "POST", body },
    );
  },

  markPaymentFailed(paymentId: string, body: { failureReason?: string } = {}) {
    return request<PaymentTransactionResponse>(
      `/api/v1/student/lms/payments/${paymentId}/failed`,
      { method: "POST", body },
    );
  },

  getPaymentReceipt(paymentId: string) {
    return request<PaymentReceiptResponse>(
      `/api/v1/student/lms/payments/${paymentId}/receipt`,
    );
  },

  getProjects() {
    return request<ProjectResponse[]>("/api/v1/student/lms/projects");
  },

  submitProject(
    projectId: string,
    body: {
      fileAssetId?: string;
      gitHubUrl?: string;
      demoUrl?: string;
      documentationUrl?: string;
      presentationUrl?: string;
      notes?: string;
    },
  ) {
    return request<SubmissionResponse>(
      `/api/v1/student/lms/projects/${projectId}/submit`,
      {
        method: "POST",
        body,
      },
    );
  },

  markNotificationRead(notificationId: string) {
    return request(`/api/v1/student/lms/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },
};

export const adminLmsApi = {
  getSummary() {
    return request<AdminLmsSummaryResponse>("/api/v1/admin/lms/summary");
  },

  getPrograms() {
    return request<ProgramSummaryResponse[]>("/api/v1/admin/lms/programs");
  },

  getProgram(programId: string) {
    return request<ProgramDetailsResponse>(
      `/api/v1/admin/lms/programs/${programId}`,
    );
  },

  getCategories() {
    return request<ProgramCategoryResponse[]>("/api/v1/admin/lms/categories");
  },

  createCategory(body: CreateCategoryRequest) {
    return request<ProgramCategoryResponse>("/api/v1/admin/lms/categories", {
      method: "POST",
      body,
    });
  },

  updateCategory(categoryId: string, body: CreateCategoryRequest) {
    return request<ProgramCategoryResponse>(
      `/api/v1/admin/lms/categories/${categoryId}`,
      { method: "PUT", body },
    );
  },

  createProgram(body: CreateProgramRequest) {
    return request<ProgramDetailsResponse>("/api/v1/admin/lms/programs", {
      method: "POST",
      body,
    });
  },

  updateProgram(programId: string, body: CreateProgramRequest) {
    return request<ProgramDetailsResponse>(
      `/api/v1/admin/lms/programs/${programId}`,
      { method: "PUT", body },
    );
  },

  createPlan(programId: string, body: CreatePlanRequest) {
    return request<ProgramPlanResponse>(
      `/api/v1/admin/lms/programs/${programId}/plans`,
      { method: "POST", body },
    );
  },

  updatePlan(planId: string, body: CreatePlanRequest) {
    return request<ProgramPlanResponse>(`/api/v1/admin/lms/plans/${planId}`, {
      method: "PUT",
      body,
    });
  },

  deleteProgram(programId: string) {
    return request(`/api/v1/admin/lms/programs/${programId}`, {
      method: "DELETE",
    });
  },

  getCurriculum(programId?: string) {
    return request<CurriculumModuleResponse[]>(
      `/api/v1/admin/lms/curriculum${toQuery({ programId })}`,
    );
  },

  createModule(programId: string, body: CreateModuleRequest) {
    return request<CurriculumModuleResponse>(
      `/api/v1/admin/lms/programs/${programId}/modules`,
      { method: "POST", body },
    );
  },

  updateModule(moduleId: string, body: CreateModuleRequest) {
    return request<CurriculumModuleResponse>(
      `/api/v1/admin/lms/modules/${moduleId}`,
      { method: "PUT", body },
    );
  },

  deleteModule(moduleId: string) {
    return request(`/api/v1/admin/lms/modules/${moduleId}`, {
      method: "DELETE",
    });
  },

  reorderModules(programId: string, body: ReorderItemsRequest) {
    return request<CurriculumModuleResponse[]>(
      `/api/v1/admin/lms/programs/${programId}/modules/order`,
      { method: "PUT", body },
    );
  },

  createLesson(moduleId: string, body: CreateLessonRequest) {
    return request<LessonResponse>(
      `/api/v1/admin/lms/modules/${moduleId}/lessons`,
      { method: "POST", body },
    );
  },

  updateLesson(lessonId: string, body: CreateLessonRequest) {
    return request<LessonResponse>(`/api/v1/admin/lms/lessons/${lessonId}`, {
      method: "PUT",
      body,
    });
  },

  deleteLesson(lessonId: string) {
    return request(`/api/v1/admin/lms/lessons/${lessonId}`, {
      method: "DELETE",
    });
  },

  reorderLessons(moduleId: string, body: ReorderItemsRequest) {
    return request<CurriculumModuleResponse[]>(
      `/api/v1/admin/lms/modules/${moduleId}/lessons/order`,
      { method: "PUT", body },
    );
  },

  getProjects() {
    return request<ProjectResponse[]>("/api/v1/admin/lms/projects");
  },

  getProjectSubmissions(projectId?: string) {
    return request<ProjectSubmissionReviewResponse[]>(
      `/api/v1/admin/lms/project-submissions${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`,
    );
  },

  reviewProjectSubmission(
    submissionId: string,
    body: {
      status: "NeedsRevision" | "Approved";
      score?: number;
      feedback?: string;
    },
  ) {
    return request<SubmissionResponse>(
      `/api/v1/admin/lms/project-submissions/${submissionId}`,
      { method: "PATCH", body },
    );
  },

  createProject(body: CreateProjectRequest) {
    return request<ProjectResponse>("/api/v1/admin/lms/projects", {
      method: "POST",
      body,
    });
  },

  updateProject(projectId: string, body: CreateProjectRequest) {
    return request<ProjectResponse>(`/api/v1/admin/lms/projects/${projectId}`, {
      method: "PUT",
      body,
    });
  },

  deleteProject(projectId: string) {
    return request(`/api/v1/admin/lms/projects/${projectId}`, {
      method: "DELETE",
    });
  },

  getProjectStudents(programId: string) {
    return request<ProjectStudentResponse[]>(
      `/api/v1/admin/lms/programs/${programId}/active-students`,
    );
  },

  publishProject(projectId: string, body: PublishProjectRequest) {
    return request<ProjectResponse>(
      `/api/v1/admin/lms/projects/${projectId}/publish`,
      { method: "POST", body },
    );
  },

  getEnrollments() {
    return request<EnrollmentResponse[]>("/api/v1/admin/lms/enrollments");
  },

  updateEnrollmentStatus(
    enrollmentId: string,
    body: UpdateEnrollmentStatusRequest,
  ) {
    return request<EnrollmentResponse>(
      `/api/v1/admin/lms/enrollments/${enrollmentId}/status`,
      { method: "PATCH", body },
    );
  },

  getPayments() {
    return request<PaymentTransactionResponse[]>("/api/v1/admin/lms/payments");
  },

  updatePaymentStatus(paymentId: string, body: UpdatePaymentStatusRequest) {
    return request<PaymentTransactionResponse>(
      `/api/v1/admin/lms/payments/${paymentId}/verify`,
      { method: "PATCH", body },
    );
  },

  getPaymentReceipt(paymentId: string) {
    return request<PaymentReceiptResponse>(
      `/api/v1/admin/lms/payments/${paymentId}/receipt`,
    );
  },

  getCoupons() {
    return request<CouponResponse[]>("/api/v1/admin/lms/coupons");
  },

  createCoupon(body: CreateCouponRequest) {
    return request<CouponResponse>("/api/v1/admin/lms/coupons", {
      method: "POST",
      body,
    });
  },

  updateCoupon(couponId: string, body: CreateCouponRequest) {
    return request<CouponResponse>(`/api/v1/admin/lms/coupons/${couponId}`, {
      method: "PUT",
      body,
    });
  },

  getCertificates() {
    return request<CertificateResponse[]>("/api/v1/admin/lms/certificates");
  },

  issueCertificate(body: IssueCertificateRequest) {
    return request<CertificateResponse>(
      "/api/v1/admin/lms/certificates/issue",
      { method: "POST", body },
    );
  },

  updateCertificateStatus(
    certificateId: string,
    body: UpdateCertificateStatusRequest,
  ) {
    return request<CertificateResponse>(
      `/api/v1/admin/lms/certificates/${certificateId}/status`,
      { method: "PATCH", body },
    );
  },

  getNotifications() {
    return request<AdminNotificationResponse[]>(
      "/api/v1/admin/lms/notifications",
    );
  },

  createNotification(body: CreateAdminNotificationRequest) {
    return request<AdminNotificationResponse[]>(
      "/api/v1/admin/lms/notifications",
      { method: "POST", body },
    );
  },

  getAuditLogs(page = 1, pageSize = 20, search = "") {
    return request<AuditLogPage>(
      `/api/v1/admin/audit-logs${toQuery({ page, pageSize, search })}`,
    );
  },
};

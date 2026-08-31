import { request } from "../../../lib/api/httpClient";
import type {
  AdminAiFeatureSummaryResponse,
  AdminContentItemResponse,
  AdminContentType,
  AdminLeadResponse,
  AdminNotificationResponse,
  AdminReportResponse,
  AdminSettingResponse,
  AdminLmsSummaryResponse,
  AssessmentAttemptResponse,
  AssessmentResponse,
  AssignmentResponse,
  AuditLogPage,
  AiInterviewAttemptResponse,
  CareerSupportResponse,
  CertificateResponse,
  CouponResponse,
  CreateAdminContentItemRequest,
  CreateAdminNotificationRequest,
  CreateAssessmentRequest,
  CreateAssignmentRequest,
  CreateCategoryRequest,
  CreateCouponRequest,
  CreateEnrollmentRequest,
  CreateLessonRequest,
  CreateLiveClassRequest,
  CreateModuleRequest,
  CreatePaymentCheckoutRequest,
  CreatePlanRequest,
  CreateProjectRequest,
  CreateProgramRequest,
  CreateSupportTicketRequest,
  CurriculumModuleResponse,
  EnrollmentResponse,
  IssueCertificateRequest,
  LiveClassResponse,
  LmsSupportTicketPage,
  MentorDashboardResponse,
  MentorLearnerResponse,
  MentorReviewQueueResponse,
  PaymentTransactionResponse,
  ProgramCategoryResponse,
  ProgramDetailsResponse,
  ProgramListParams,
  ProgramPlanResponse,
  ProgramSummaryResponse,
  ProjectResponse,
  RecordedClassResponse,
  RefundPaymentRequest,
  ReviewSubmissionRequest,
  StartAiInterviewRequest,
  StudentLmsDashboardResponse,
  StudentProgramWorkspaceResponse,
  SubmitAssessmentAttemptRequest,
  SubmissionResponse,
  SupportTicketResponse,
  UpdateLeadStatusRequest,
  UpdateCertificateStatusRequest,
  UpdateEnrollmentStatusRequest,
  UpdatePaymentStatusRequest,
  UpsertAdminSettingRequest,
  VerifyPaymentRequest
} from "./lmsTypes";

function toQuery(params: Record<string, string | number | boolean | undefined>) {
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
    return request<ProgramSummaryResponse[]>(`/api/v1/public/programs${toQuery(params)}`);
  },

  getProgram(slug: string) {
    return request<ProgramDetailsResponse>(`/api/v1/public/programs/${slug}`);
  }
};

export const studentLmsApi = {
  getDashboard() {
    return request<StudentLmsDashboardResponse>("/api/v1/student/lms/dashboard");
  },

  getWorkspace() {
    return request<StudentProgramWorkspaceResponse>("/api/v1/student/lms/workspace");
  },

  getMyProgram() {
    return request<ProgramDetailsResponse>("/api/v1/student/lms/my-program");
  },

  createEnrollment(body: CreateEnrollmentRequest) {
    return request<EnrollmentResponse>("/api/v1/student/lms/enrollments", { method: "POST", body });
  },

  createPaymentCheckout(body: CreatePaymentCheckoutRequest) {
    return request<PaymentTransactionResponse>("/api/v1/student/lms/payments/checkout", { method: "POST", body });
  },

  verifyPayment(body: VerifyPaymentRequest) {
    return request<PaymentTransactionResponse>("/api/v1/student/lms/payments/verify", { method: "POST", body });
  },

  getCurriculum() {
    return request<CurriculumModuleResponse[]>("/api/v1/student/lms/curriculum");
  },

  updateLessonProgress(lessonId: string, progressPercentage: number) {
    return request("/api/v1/student/lms/lessons/" + lessonId + "/progress", {
      method: "POST",
      body: { progressPercentage }
    });
  },

  getAssignments() {
    return request<AssignmentResponse[]>("/api/v1/student/lms/assignments");
  },

  submitAssignment(assignmentId: string, body: { submissionUrl?: string; fileUrl?: string; notes?: string }) {
    return request<SubmissionResponse>(`/api/v1/student/lms/assignments/${assignmentId}/submit`, {
      method: "POST",
      body
    });
  },

  getProjects() {
    return request<ProjectResponse[]>("/api/v1/student/lms/projects");
  },

  submitProject(
    projectId: string,
    body: {
      gitHubUrl?: string;
      demoUrl?: string;
      documentationUrl?: string;
      presentationUrl?: string;
      notes?: string;
    }
  ) {
    return request<SubmissionResponse>(`/api/v1/student/lms/projects/${projectId}/submit`, {
      method: "POST",
      body
    });
  },

  createSupportTicket(body: CreateSupportTicketRequest) {
    return request<SupportTicketResponse>("/api/v1/student/lms/support/tickets", { method: "POST", body });
  },

  getLiveClasses() {
    return request<LiveClassResponse[]>("/api/v1/student/lms/live-classes");
  },

  getRecordedClasses() {
    return request<RecordedClassResponse[]>("/api/v1/student/lms/recorded-classes");
  },

  getAssessments() {
    return request<AssessmentResponse[]>("/api/v1/student/lms/assessments");
  },

  startAssessmentAttempt(assessmentId: string) {
    return request<AssessmentAttemptResponse>(`/api/v1/student/lms/assessments/${assessmentId}/attempts`, { method: "POST" });
  },

  submitAssessmentAttempt(attemptId: string, body: SubmitAssessmentAttemptRequest) {
    return request<AssessmentAttemptResponse>(`/api/v1/student/lms/assessments/attempts/${attemptId}/submit`, {
      method: "POST",
      body
    });
  },

  getAiAssessments() {
    return request<AssessmentResponse[]>("/api/v1/student/lms/ai-assessments");
  },

  startAiAssessmentAttempt(assessmentId: string) {
    return request<AssessmentAttemptResponse>(`/api/v1/student/lms/ai-assessments/${assessmentId}/start`, { method: "POST" });
  },

  getAiInterviews() {
    return request<AiInterviewAttemptResponse[]>("/api/v1/student/lms/ai-interviews");
  },

  startAiInterview(body: StartAiInterviewRequest) {
    return request<AiInterviewAttemptResponse>("/api/v1/student/lms/ai-interviews/start", { method: "POST", body });
  },

  getMentorSupport() {
    return request<SupportTicketResponse[]>("/api/v1/student/lms/mentor-support");
  },

  createMentorSupportRequest(body: CreateSupportTicketRequest) {
    return request<SupportTicketResponse>("/api/v1/student/lms/mentor-support/requests", { method: "POST", body });
  },

  getCareerSupport() {
    return request<CareerSupportResponse>("/api/v1/student/lms/career-support");
  },

  createResumeReviewRequest(body: CreateSupportTicketRequest) {
    return request<SupportTicketResponse>("/api/v1/student/lms/career-support/resume-review", { method: "POST", body });
  },

  markNotificationRead(notificationId: string) {
    return request(`/api/v1/student/lms/notifications/${notificationId}/read`, { method: "PATCH" });
  }
};

export const adminLmsApi = {
  getSummary() {
    return request<AdminLmsSummaryResponse>("/api/v1/admin/lms/summary");
  },

  getPrograms() {
    return request<ProgramSummaryResponse[]>("/api/v1/admin/lms/programs");
  },

  getProgram(programId: string) {
    return request<ProgramDetailsResponse>(`/api/v1/admin/lms/programs/${programId}`);
  },

  getCategories() {
    return request<ProgramCategoryResponse[]>("/api/v1/admin/lms/categories");
  },

  createCategory(body: CreateCategoryRequest) {
    return request<ProgramCategoryResponse>("/api/v1/admin/lms/categories", { method: "POST", body });
  },

  updateCategory(categoryId: string, body: CreateCategoryRequest) {
    return request<ProgramCategoryResponse>(`/api/v1/admin/lms/categories/${categoryId}`, { method: "PUT", body });
  },

  createProgram(body: CreateProgramRequest) {
    return request<ProgramDetailsResponse>("/api/v1/admin/lms/programs", { method: "POST", body });
  },

  createPlan(programId: string, body: CreatePlanRequest) {
    return request<ProgramPlanResponse>(`/api/v1/admin/lms/programs/${programId}/plans`, { method: "POST", body });
  },

  updatePlan(planId: string, body: CreatePlanRequest) {
    return request<ProgramPlanResponse>(`/api/v1/admin/lms/plans/${planId}`, { method: "PUT", body });
  },

  deleteProgram(programId: string) {
    return request(`/api/v1/admin/lms/programs/${programId}`, { method: "DELETE" });
  },

  getCurriculum(programId?: string) {
    return request<CurriculumModuleResponse[]>(`/api/v1/admin/lms/curriculum${toQuery({ programId })}`);
  },

  createModule(programId: string, body: CreateModuleRequest) {
    return request<CurriculumModuleResponse>(`/api/v1/admin/lms/programs/${programId}/modules`, { method: "POST", body });
  },

  updateModule(moduleId: string, body: CreateModuleRequest) {
    return request<CurriculumModuleResponse>(`/api/v1/admin/lms/modules/${moduleId}`, { method: "PUT", body });
  },

  createLesson(moduleId: string, body: CreateLessonRequest) {
    return request(`/api/v1/admin/lms/modules/${moduleId}/lessons`, { method: "POST", body });
  },

  updateLesson(lessonId: string, body: CreateLessonRequest) {
    return request(`/api/v1/admin/lms/lessons/${lessonId}`, { method: "PUT", body });
  },

  getLiveClasses() {
    return request<LiveClassResponse[]>("/api/v1/admin/lms/live-classes");
  },

  createLiveClass(body: CreateLiveClassRequest) {
    return request<LiveClassResponse>("/api/v1/admin/lms/live-classes", { method: "POST", body });
  },

  updateLiveClass(liveClassId: string, body: CreateLiveClassRequest) {
    return request<LiveClassResponse>(`/api/v1/admin/lms/live-classes/${liveClassId}`, { method: "PUT", body });
  },

  getAssignments() {
    return request<AssignmentResponse[]>("/api/v1/admin/lms/assignments");
  },

  createAssignment(body: CreateAssignmentRequest) {
    return request<AssignmentResponse>("/api/v1/admin/lms/assignments", { method: "POST", body });
  },

  updateAssignment(assignmentId: string, body: CreateAssignmentRequest) {
    return request<AssignmentResponse>(`/api/v1/admin/lms/assignments/${assignmentId}`, { method: "PUT", body });
  },

  getProjects() {
    return request<ProjectResponse[]>("/api/v1/admin/lms/projects");
  },

  createProject(body: CreateProjectRequest) {
    return request<ProjectResponse>("/api/v1/admin/lms/projects", { method: "POST", body });
  },

  updateProject(projectId: string, body: CreateProjectRequest) {
    return request<ProjectResponse>(`/api/v1/admin/lms/projects/${projectId}`, { method: "PUT", body });
  },

  getAssessments() {
    return request<AssessmentResponse[]>("/api/v1/admin/lms/assessments");
  },

  createAssessment(body: CreateAssessmentRequest) {
    return request<AssessmentResponse>("/api/v1/admin/lms/assessments", { method: "POST", body });
  },

  updateAssessment(assessmentId: string, body: CreateAssessmentRequest) {
    return request<AssessmentResponse>(`/api/v1/admin/lms/assessments/${assessmentId}`, { method: "PUT", body });
  },

  getEnrollments() {
    return request<EnrollmentResponse[]>("/api/v1/admin/lms/enrollments");
  },

  updateEnrollmentStatus(enrollmentId: string, body: UpdateEnrollmentStatusRequest) {
    return request<EnrollmentResponse>(`/api/v1/admin/lms/enrollments/${enrollmentId}/status`, { method: "PATCH", body });
  },

  getPayments() {
    return request<PaymentTransactionResponse[]>("/api/v1/admin/lms/payments");
  },

  updatePaymentStatus(paymentId: string, body: UpdatePaymentStatusRequest) {
    return request<PaymentTransactionResponse>(`/api/v1/admin/lms/payments/${paymentId}/verify`, { method: "PATCH", body });
  },

  refundPayment(paymentId: string, body: RefundPaymentRequest) {
    return request<PaymentTransactionResponse>(`/api/v1/admin/lms/refunds${toQuery({ paymentId })}`, { method: "POST", body });
  },

  getRefunds() {
    return request<PaymentTransactionResponse[]>("/api/v1/admin/lms/refunds");
  },

  getAiFeatures() {
    return request<AdminAiFeatureSummaryResponse>("/api/v1/admin/lms/ai-features");
  },

  getCoupons() {
    return request<CouponResponse[]>("/api/v1/admin/lms/coupons");
  },

  createCoupon(body: CreateCouponRequest) {
    return request<CouponResponse>("/api/v1/admin/lms/coupons", { method: "POST", body });
  },

  updateCoupon(couponId: string, body: CreateCouponRequest) {
    return request<CouponResponse>(`/api/v1/admin/lms/coupons/${couponId}`, { method: "PUT", body });
  },

  getCertificates() {
    return request<CertificateResponse[]>("/api/v1/admin/lms/certificates");
  },

  issueCertificate(body: IssueCertificateRequest) {
    return request<CertificateResponse>("/api/v1/admin/lms/certificates/issue", { method: "POST", body });
  },

  updateCertificateStatus(certificateId: string, body: UpdateCertificateStatusRequest) {
    return request<CertificateResponse>(`/api/v1/admin/lms/certificates/${certificateId}/status`, { method: "PATCH", body });
  },

  getSupportTickets(page = 1, pageSize = 8) {
    return request<LmsSupportTicketPage>(`/api/v1/admin/lms/support/tickets${toQuery({ page, pageSize })}`);
  },

  updateSupportTicket(ticketId: string, body: { status: number; adminNotes?: string }) {
    return request<SupportTicketResponse>(`/api/v1/admin/lms/support/tickets/${ticketId}`, { method: "PATCH", body });
  },

  getContent(contentType?: AdminContentType) {
    return request<AdminContentItemResponse[]>(`/api/v1/admin/lms/content${toQuery({ contentType })}`);
  },

  createContent(body: CreateAdminContentItemRequest) {
    return request<AdminContentItemResponse>("/api/v1/admin/lms/content", { method: "POST", body });
  },

  updateContent(contentId: string, body: CreateAdminContentItemRequest) {
    return request<AdminContentItemResponse>(`/api/v1/admin/lms/content/${contentId}`, { method: "PUT", body });
  },

  getLeads(leadType?: string) {
    return request<AdminLeadResponse[]>(`/api/v1/admin/lms/leads${toQuery({ leadType })}`);
  },

  updateLeadStatus(leadType: string, leadId: string, body: UpdateLeadStatusRequest) {
    return request<AdminLeadResponse>(`/api/v1/admin/lms/leads/${leadType}/${leadId}/status`, { method: "PATCH", body });
  },

  getNotifications() {
    return request<AdminNotificationResponse[]>("/api/v1/admin/lms/notifications");
  },

  createNotification(body: CreateAdminNotificationRequest) {
    return request<AdminNotificationResponse[]>("/api/v1/admin/lms/notifications", { method: "POST", body });
  },

  getSettings(category?: string) {
    return request<AdminSettingResponse[]>(`/api/v1/admin/lms/settings${toQuery({ category })}`);
  },

  upsertSetting(category: string, key: string, body: UpsertAdminSettingRequest) {
    return request<AdminSettingResponse>(
      `/api/v1/admin/lms/settings/${encodeURIComponent(category)}/${encodeURIComponent(key)}`,
      { method: "PUT", body }
    );
  },

  getReports() {
    return request<AdminReportResponse>("/api/v1/admin/lms/reports");
  },

  getAuditLogs(page = 1, pageSize = 20, search = "") {
    return request<AuditLogPage>(`/api/v1/admin/audit-logs${toQuery({ page, pageSize, search })}`);
  }
};

export const mentorLmsApi = {
  getDashboard() {
    return request<MentorDashboardResponse>("/api/v1/mentor/lms/dashboard");
  },

  getReviewQueue() {
    return request<MentorReviewQueueResponse>("/api/v1/mentor/lms/review-queue");
  },

  getLearners() {
    return request<MentorLearnerResponse[]>("/api/v1/mentor/lms/learners");
  },

  getLiveClasses() {
    return request<LiveClassResponse[]>("/api/v1/mentor/lms/live-classes");
  },

  createLiveClass(body: CreateLiveClassRequest) {
    return request<LiveClassResponse>("/api/v1/mentor/lms/live-classes", { method: "POST", body });
  },

  getAssessmentReviewQueue() {
    return request<AssessmentAttemptResponse[]>("/api/v1/mentor/lms/assessments/review-queue");
  },

  reviewAssignmentSubmission(submissionId: string, body: ReviewSubmissionRequest) {
    return request<SubmissionResponse>(`/api/v1/mentor/lms/assignment-submissions/${submissionId}/feedback`, {
      method: "POST",
      body
    });
  },

  reviewProjectSubmission(submissionId: string, body: ReviewSubmissionRequest) {
    return request<SubmissionResponse>(`/api/v1/mentor/lms/project-submissions/${submissionId}/feedback`, {
      method: "POST",
      body
    });
  },

  reviewAssessmentAttempt(attemptId: string, body: SubmitAssessmentAttemptRequest) {
    return request<AssessmentAttemptResponse>(`/api/v1/mentor/lms/assessment-attempts/${attemptId}/feedback`, {
      method: "POST",
      body
    });
  },

  getSupportRequests() {
    return request<SupportTicketResponse[]>("/api/v1/mentor/lms/support-requests");
  }
};

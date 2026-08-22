import { request } from "../../../lib/api/httpClient";
import type {
  AdminLmsSummaryResponse,
  AssignmentResponse,
  CreateEnrollmentRequest,
  CreatePaymentCheckoutRequest,
  CreateProgramRequest,
  CreateSupportTicketRequest,
  CurriculumModuleResponse,
  EnrollmentResponse,
  LmsSupportTicketPage,
  MentorDashboardResponse,
  MentorReviewQueueResponse,
  PaymentTransactionResponse,
  ProgramCategoryResponse,
  ProgramDetailsResponse,
  ProgramListParams,
  ProgramSummaryResponse,
  ProjectResponse,
  ReviewSubmissionRequest,
  StudentLmsDashboardResponse,
  StudentProgramWorkspaceResponse,
  SubmissionResponse,
  SupportTicketResponse,
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
  }
};

export const adminLmsApi = {
  getSummary() {
    return request<AdminLmsSummaryResponse>("/api/v1/admin/lms/summary");
  },

  getPrograms() {
    return request<ProgramSummaryResponse[]>("/api/v1/admin/lms/programs");
  },

  createProgram(body: CreateProgramRequest) {
    return request<ProgramDetailsResponse>("/api/v1/admin/lms/programs", { method: "POST", body });
  },

  getSupportTickets(page = 1, pageSize = 8) {
    return request<LmsSupportTicketPage>(`/api/v1/admin/lms/support/tickets${toQuery({ page, pageSize })}`);
  }
};

export const mentorLmsApi = {
  getDashboard() {
    return request<MentorDashboardResponse>("/api/v1/mentor/lms/dashboard");
  },

  getReviewQueue() {
    return request<MentorReviewQueueResponse>("/api/v1/mentor/lms/review-queue");
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
  }
};

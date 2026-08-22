import type { PagedResult } from "../../auth/api/authTypes";

export type FaqItemResponse = {
  question: string;
  answer: string;
};

export type ProgramCategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  programs: ProgramSummaryResponse[];
};

export type ProgramSummaryResponse = {
  id: string;
  categoryId: string;
  categoryName: string;
  slug: string;
  title: string;
  shortDescription: string;
  level: string;
  duration: string;
  learningMode: string;
  thumbnailUrl: string;
  status: string;
  startingPrice: number;
  skills: string[];
};

export type ProgramDetailsResponse = ProgramSummaryResponse & {
  overview: string;
  mentorSummary: string;
  certificationName: string;
  outcomes: string[];
  faqs: FaqItemResponse[];
  plans: ProgramPlanResponse[];
  curriculum: CurriculumModuleResponse[];
  projects: ProjectResponse[];
  assignments: AssignmentResponse[];
  assessments: AssessmentResponse[];
};

export type ProgramPlanResponse = {
  id: string;
  programId: string;
  name: string;
  code: string;
  actualPrice: number;
  offerPrice: number;
  reserveAmount: number;
  features: string[];
  isActive: boolean;
};

export type CurriculumModuleResponse = {
  id: string;
  programId: string;
  title: string;
  description: string;
  sortOrder: number;
  lessons: LessonResponse[];
};

export type LessonResponse = {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  videoUrl?: string;
  notesUrl?: string;
  durationMinutes: number;
  accessLevel: string;
  isLocked: boolean;
  progressPercentage: number;
  isCompleted: boolean;
  resources: LessonResourceResponse[];
};

export type LessonResourceResponse = {
  id: string;
  title: string;
  resourceType: string;
  url: string;
};

export type EnrollmentResponse = {
  id: string;
  studentId: string;
  programId: string;
  programTitle: string;
  programPlanId?: string;
  programPlanName?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  enrolledAt: string;
  fullAccessUnlockedAt?: string;
  lockedReason?: string;
};

export type StudentLmsDashboardResponse = {
  enrollment?: EnrollmentResponse;
  programStatus: string;
  learningProgressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  pendingAssignments: number;
  pendingProjects: number;
  upcomingAssessments: number;
  upcomingClass?: LiveClassResponse;
  pendingAssignment?: AssignmentResponse;
  upcomingAssessment?: AssessmentResponse;
  latestCertificate?: CertificateResponse;
  balanceDue: number;
  notifications: NotificationResponse[];
};

export type StudentProgramWorkspaceResponse = {
  enrollment?: EnrollmentResponse;
  curriculum: CurriculumModuleResponse[];
  liveClasses: LiveClassResponse[];
  assignments: AssignmentResponse[];
  projects: ProjectResponse[];
  assessments: AssessmentResponse[];
  certificates: CertificateResponse[];
  payments: PaymentTransactionResponse[];
};

export type RecordedClassResponse = {
  lessonId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  summary: string;
  videoUrl?: string;
  notesUrl?: string;
  durationMinutes: number;
  isLocked: boolean;
  progressPercentage: number;
  isCompleted: boolean;
};

export type PaymentTransactionResponse = {
  id: string;
  enrollmentId?: string;
  programId: string;
  programPlanId?: string;
  gateway: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  mode: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  verifiedAt?: string;
};

export type LiveClassResponse = {
  id: string;
  programId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  joinUrl?: string;
  recordingUrl?: string;
  status: string;
};

export type AssignmentResponse = {
  id: string;
  programId: string;
  title: string;
  instructions: string;
  dueAt?: string;
  maxScore: number;
  isPublished: boolean;
  latestSubmission?: SubmissionResponse;
};

export type ProjectResponse = {
  id: string;
  programId: string;
  title: string;
  description: string;
  requiredArtifacts: string[];
  maxScore: number;
  isPublished: boolean;
  latestSubmission?: SubmissionResponse;
};

export type SubmissionResponse = {
  id: string;
  itemId: string;
  itemType: string;
  status: string;
  score?: number;
  feedback?: string;
  submissionUrl?: string;
  fileUrl?: string;
  gitHubUrl?: string;
  demoUrl?: string;
  documentationUrl?: string;
  presentationUrl?: string;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type AssessmentResponse = {
  id: string;
  programId: string;
  title: string;
  assessmentType: string;
  instructions: string;
  durationMinutes: number;
  passingPercentage: number;
  isAiPowered: boolean;
  isPublished: boolean;
};

export type AssessmentAttemptResponse = {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  enrollmentId?: string;
  status: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  resultJson?: string;
};

export type AiInterviewAttemptResponse = {
  id: string;
  studentId: string;
  enrollmentId?: string;
  jobRole: string;
  domain: string;
  interviewType: string;
  technicalScore?: number;
  communicationScore?: number;
  overallScore?: number;
  transcriptJson?: string;
  recommendationsJson?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
};

export type CertificateResponse = {
  id: string;
  studentId: string;
  programId: string;
  programTitle: string;
  type: string;
  status: string;
  certificateId: string;
  issuedAt?: string;
  verificationSlug: string;
  verificationUrl?: string;
  qrCodeUrl?: string;
  authorizedSignatory?: string;
};

export type SupportTicketResponse = {
  id: string;
  userId?: string;
  programId?: string;
  name: string;
  email: string;
  studentIdText?: string;
  issue: string;
  description: string;
  attachmentUrl?: string;
  priority: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type NotificationResponse = {
  id: string;
  title: string;
  body: string;
  actionUrl?: string;
  status: string;
  createdAt: string;
  readAt?: string;
};

export type CareerSupportResponse = {
  resumeStatus: string;
  linkedInStatus: string;
  gitHubStatus: string;
  portfolioStatus: string;
  interviewFocusAreas: string[];
  requests: SupportTicketResponse[];
};

export type AdminLmsSummaryResponse = {
  programs: number;
  publishedPrograms: number;
  enrollments: number;
  activeEnrollments: number;
  verifiedRevenue: number;
  pendingAssignmentReviews: number;
  pendingProjectReviews: number;
  openSupportTickets: number;
  newCallbackRequests: number;
};

export type MentorDashboardResponse = {
  assignedLiveClasses: number;
  pendingAssignmentReviews: number;
  pendingProjectReviews: number;
  reviewedSubmissions: number;
};

export type MentorReviewQueueResponse = {
  assignmentSubmissions: SubmissionResponse[];
  projectSubmissions: SubmissionResponse[];
};

export type MentorLearnerResponse = {
  studentId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  enrollmentId: string;
  programTitle: string;
  enrollmentStatus: string;
  progressPercentage: number;
  enrolledAt: string;
};

export type CouponResponse = {
  id: string;
  code: string;
  description: string;
  discountValue: number;
  isPercentage: boolean;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
};

export type AdminReportResponse = {
  summary: AdminLmsSummaryResponse;
  programs: ProgramSummaryResponse[];
  recentEnrollments: EnrollmentResponse[];
  recentPayments: PaymentTransactionResponse[];
  openSupportTickets: SupportTicketResponse[];
};

export type LeadCaptureResponse = {
  id: string;
  status: string;
  createdAt: string;
};

export type ProgramListParams = {
  search?: string;
  categorySlug?: string;
};

export type CreateEnrollmentRequest = {
  programId: string;
  programPlanId?: string;
};

export type CreatePaymentCheckoutRequest = {
  programId: string;
  programPlanId?: string;
  enrollmentId?: string;
  mode: 1 | 2 | 3;
};

export type VerifyPaymentRequest = {
  paymentTransactionId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
};

export type CreateProgramRequest = {
  categoryId: string;
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  level: string;
  duration: string;
  learningMode: string;
  mentorSummary: string;
  certificationName: string;
  thumbnailUrl?: string;
  skills: string[];
  outcomes: string[];
  faqs: FaqItemResponse[];
  status: number;
};

export type CreateCategoryRequest = {
  name: string;
  slug: string;
  description: string;
  isPublished?: boolean;
};

export type CreateModuleRequest = {
  title: string;
  description: string;
};

export type CreateLessonRequest = {
  title: string;
  summary: string;
  videoUrl?: string;
  notesUrl?: string;
  durationMinutes: number;
  accessLevel: number;
};

export type CreateLiveClassRequest = {
  programId: string;
  mentorId?: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  joinUrl?: string;
  recordingUrl?: string;
};

export type CreateAssignmentRequest = {
  programId: string;
  title: string;
  instructions: string;
  dueAt?: string;
  maxScore?: number;
  isPublished?: boolean;
};

export type CreateProjectRequest = {
  programId: string;
  title: string;
  description: string;
  requiredArtifacts: string[];
  maxScore?: number;
  isPublished?: boolean;
};

export type CreateAssessmentRequest = {
  programId: string;
  title: string;
  assessmentType: string;
  instructions: string;
  durationMinutes: number;
  passingPercentage?: number;
  isAiPowered?: boolean;
  isPublished?: boolean;
};

export type UpdateEnrollmentStatusRequest = {
  status: number;
  lockedReason?: string;
};

export type UpdatePaymentStatusRequest = {
  status: number;
  gatewayPaymentId?: string;
  failureReason?: string;
};

export type RefundPaymentRequest = {
  reason?: string;
};

export type SubmitAssessmentAttemptRequest = {
  score?: number;
  resultJson?: string;
};

export type StartAiInterviewRequest = {
  jobRole: string;
  domain: string;
  interviewType: string;
};

export type CreateCouponRequest = {
  code: string;
  description: string;
  discountValue: number;
  isPercentage: boolean;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
};

export type IssueCertificateRequest = {
  studentId: string;
  programId: string;
  enrollmentId?: string;
  type?: number;
  authorizedSignatory?: string;
};

export type CreateSupportTicketRequest = {
  programId?: string;
  name: string;
  email: string;
  studentIdText?: string;
  issue: string;
  description: string;
  attachmentUrl?: string;
  priority: string;
};

export type ReviewSubmissionRequest = {
  score: number;
  feedback: string;
  status: number;
};

export type LmsSupportTicketPage = PagedResult<SupportTicketResponse>;

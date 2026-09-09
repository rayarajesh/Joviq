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
  isPublished?: boolean;
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
  certificationName: string;
  outcomes: string[];
  faqs: FaqItemResponse[];
  plans: ProgramPlanResponse[];
  curriculum: CurriculumModuleResponse[];
  projects: ProjectResponse[];
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
  isActive: boolean;
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
  sortOrder: number;
  isActive: boolean;
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
  pendingProjects: number;
  latestCertificate?: CertificateResponse;
  balanceDue: number;
  notifications: NotificationResponse[];
};

export type StudentProgramWorkspaceResponse = {
  enrollment?: EnrollmentResponse;
  projects: ProjectResponse[];
  certificates: CertificateResponse[];
  payments: PaymentTransactionResponse[];
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

export type NotificationResponse = {
  id: string;
  title: string;
  body: string;
  actionUrl?: string;
  status: string;
  createdAt: string;
  readAt?: string;
};

export type AdminLmsSummaryResponse = {
  programs: number;
  publishedPrograms: number;
  enrollments: number;
  activeEnrollments: number;
  verifiedRevenue: number;
  pendingProjectReviews: number;
  newCallbackRequests: number;
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

export type AdminNotificationResponse = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  title: string;
  body: string;
  actionUrl?: string;
  status: string;
  createdAt: string;
  readAt?: string;
};

export type AuditLogResponse = {
  id: string;
  userId?: string;
  eventType: string;
  email?: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
  metadataJson?: string;
  createdAt: string;
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
  certificationName: string;
  thumbnailUrl?: string;
  skills: string[];
  outcomes: string[];
  faqs: FaqItemResponse[];
  status: number;
};

export type CreatePlanRequest = {
  name: string;
  code: string;
  actualPrice: number;
  offerPrice: number;
  reserveAmount: number;
  features: string[];
  isActive: boolean;
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
  sortOrder?: number;
  isActive?: boolean;
};

export type CreateLessonRequest = {
  title: string;
  summary: string;
  videoUrl?: string;
  notesUrl?: string;
  durationMinutes: number;
  accessLevel: number;
  sortOrder?: number;
  isActive?: boolean;
  resources?: LessonResourceRequest[];
};

export type LessonResourceRequest = {
  title: string;
  resourceType: string;
  url: string;
};

export type ReorderItemsRequest = {
  orderedIds: string[];
};

export type CreateProjectRequest = {
  programId: string;
  title: string;
  description: string;
  requiredArtifacts: string[];
  maxScore?: number;
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

export type CreateAdminNotificationRequest = {
  userId?: string;
  title: string;
  body: string;
  actionUrl?: string;
  sendToAllUsers?: boolean;
  sendToAllStudents?: boolean;
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

export type UpdateCertificateStatusRequest = {
  status: number;
};

export type AuditLogPage = PagedResult<AuditLogResponse>;

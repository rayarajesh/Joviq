import type { EnrollmentResponse, StudentLmsDashboardResponse, StudentProgramWorkspaceResponse } from "../features/lms/api/lmsTypes";

const enrollment: EnrollmentResponse = {
  id: "preview-enrollment", studentId: "preview-student", programId: "preview-program",
  programSlug: "full-stack-web-development", programTitle: "Full Stack Web Development",
  programPlanName: "Intermediate", programPlanCode: "INTERMEDIATE", status: "Active",
  totalAmount: 4999, paidAmount: 4999, balanceAmount: 0, enrolledAt: "2026-09-01T00:00:00Z",
  accessExpiresAt: "2027-09-01T00:00:00Z", isAccessExpired: false, hasFullAccess: true, accessCycle: 1
};
export const studentPreviewDashboard: StudentLmsDashboardResponse = {
  enrollment, programStatus: "Active", learningProgressPercentage: 42, completedLessons: 10,
  totalLessons: 24, pendingProjects: 0, balanceDue: 0, notifications: []
};
export const studentPreviewWorkspace: StudentProgramWorkspaceResponse = {
  enrollment, projects: [], payments: [], certificates: []
};

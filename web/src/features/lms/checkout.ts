export const pendingEnrollmentStorageKey = "joviq-pending-enrollment";

export function resolveCheckoutEmail(applicantEmail: string, accountEmail?: string) {
  return (accountEmail?.trim() || applicantEmail.trim()).toLowerCase();
}

export function checkoutEmailsMatch(applicantEmail: string, accountEmail: string) {
  const normalized = applicantEmail.trim().toLowerCase();
  return normalized.length > 0 && normalized === accountEmail.trim().toLowerCase();
}

export type EnrollmentApplicant = {
  fullName: string;
  phoneNumber: string;
  email: string;
  collegeName: string;
};

export type PendingEnrollment = {
  slug: string;
  programId?: string;
  planId?: string;
  planCode: string;
  programTitle: string;
  paymentMode?: 1 | 2 | 3;
  amount?: number;
  applicant?: EnrollmentApplicant;
  startDate?: string;
};

export function savePendingEnrollment(enrollment: PendingEnrollment) {
  window.localStorage.setItem(pendingEnrollmentStorageKey, JSON.stringify(enrollment));
}

export function readPendingEnrollment(): PendingEnrollment | null {
  try {
    const value = window.localStorage.getItem(pendingEnrollmentStorageKey);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<PendingEnrollment>;
    if (!parsed.slug || !parsed.planCode || !parsed.programTitle) return null;
    return {
      slug: parsed.slug,
      programId: parsed.programId,
      planId: parsed.planId,
      planCode: parsed.planCode,
      programTitle: parsed.programTitle,
      paymentMode: parsed.paymentMode,
      amount: parsed.amount,
      applicant: parsed.applicant,
      startDate: parsed.startDate
    };
  } catch {
    return null;
  }
}

export function clearPendingEnrollment() {
  window.localStorage.removeItem(pendingEnrollmentStorageKey);
}

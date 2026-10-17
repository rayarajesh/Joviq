import { useEffect, useRef, useState } from "react";
import { defaultProgramPlans } from "../data/siteContent";
import { useAuth } from "../features/auth/context/useAuth";
import { readPendingEnrollment } from "../features/lms/checkout";
import { usePaymentFlow } from "../features/lms/usePaymentFlow";
import type { PaymentTarget } from "../features/lms/usePaymentFlow";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { PaymentPanel } from "./EnrollmentDialog";

/** Confirms a Cashfree order after a bank / UPI-app redirect lands back on this page. */
export function PaymentReturn({ orderId, paymentTransactionId, onClose, onContinueRegistration }: { orderId: string; paymentTransactionId?: string; onClose: () => void; onContinueRegistration?: (target: PaymentTarget) => void }) {
  const auth = useAuth();
  const payment = usePaymentFlow();
  const confirmedRef = useRef(false);
  const [paymentTarget] = useState<PaymentTarget | null>(() => {
    const pending = readPendingEnrollment();
    if (!pending?.applicant) return null;
    return {
      programId: pending.programId ?? "",
      programSlug: pending.slug,
      programTitle: pending.programTitle,
      planId: pending.planId ?? "",
      planName: defaultProgramPlans.find((plan) => plan.code === pending.planCode)?.name ?? pending.planCode,
      paymentTransactionId,
      paymentMode: pending.paymentMode === 2 ? 2 : 1,
      applicant: pending.applicant,
      startDate: pending.startDate,
      amountPaid: pending.amount
    };
  });
  useDialogAccessibility(true, ".enroll-dialog", onClose);

  useEffect(() => {
    if (auth.isBooting || !auth.user || confirmedRef.current) return;
    confirmedRef.current = true;
    void payment.checkStatus({
      gatewayOrderId: orderId,
      paymentTransactionId
    });
  }, [auth.isBooting, auth.user, orderId, payment, paymentTransactionId]);

  const signedOut = !auth.isBooting && !auth.user;
  const verified = payment.verifiedTransaction;
  const confirmedTarget: PaymentTarget | null = verified && auth.user ? {
    ...paymentTarget,
    programId: verified.programId,
    programTitle: verified.programTitle ?? paymentTarget?.programTitle ?? "Your program",
    planId: verified.programPlanId ?? paymentTarget?.planId ?? "",
    planName: verified.programPlanName ?? paymentTarget?.planName ?? "",
    paymentTransactionId: verified.id,
    paymentMode: verified.mode === "PayInFull" ? 2 : 1,
    amountPaid: verified.amount,
    applicant: paymentTarget?.applicant ?? { fullName: auth.user.fullName, email: auth.user.email, phoneNumber: auth.user.phoneNumber ?? "", collegeName: "" }
  } : paymentTarget;

  return (
    <div className="enroll-backdrop" role="presentation">
      <section aria-label="Payment confirmation" aria-modal="true" className="enroll-dialog enroll-dialog--compact" role="dialog">
        <div className="enroll-dialog__body">
          {signedOut ? (
            <div className="pay-panel pay-panel--error">
              <h3>Sign in to confirm your payment</h3>
              <p>Your session has ended. Sign in with your payment email to resume onboarding. Do not pay again.</p>
              <a className="btn btn--primary" href="/onboarding">Resume onboarding</a>
              <div className="pay-panel__actions"><button className="btn btn--primary" type="button" onClick={onClose}>Close</button></div>
            </div>
          ) : (
            <PaymentPanel
              payment={payment}
              target={confirmedTarget}
              onRetry={() => void payment.checkStatus({ gatewayOrderId: orderId, paymentTransactionId })}
              onContinueRegistration={confirmedTarget && onContinueRegistration
                ? () => onContinueRegistration(confirmedTarget)
                : undefined}
              onClose={onClose}
            />
          )}
        </div>
      </section>
    </div>
  );
}

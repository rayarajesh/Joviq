import { useEffect, useRef } from "react";
import { useAuth } from "../features/auth/context/useAuth";
import { usePaymentFlow } from "../features/lms/usePaymentFlow";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { PaymentPanel } from "./EnrollmentDialog";

/** Confirms a Cashfree order after a bank / UPI-app redirect lands back on this page. */
export function PaymentReturn({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const auth = useAuth();
  const payment = usePaymentFlow();
  const confirmedRef = useRef(false);
  useDialogAccessibility(true, ".enroll-dialog", onClose);

  useEffect(() => {
    if (auth.isBooting || !auth.user || confirmedRef.current) return;
    confirmedRef.current = true;
    void payment.checkStatus({ gatewayOrderId: orderId });
  }, [auth.isBooting, auth.user, orderId, payment]);

  const signedOut = !auth.isBooting && !auth.user;

  return (
    <div className="enroll-backdrop" role="presentation">
      <section aria-label="Payment confirmation" aria-modal="true" className="enroll-dialog enroll-dialog--compact" role="dialog">
        <div className="enroll-dialog__body">
          {signedOut ? (
            <div className="pay-panel pay-panel--error">
              <h3>Sign in to confirm your payment</h3>
              <p>Your session has ended. Sign in to your Joviq dashboard — your payment status is confirmed there automatically.</p>
              <div className="pay-panel__actions"><button className="btn btn--primary" type="button" onClick={onClose}>Close</button></div>
            </div>
          ) : (
            <PaymentPanel payment={payment} onRetry={() => void payment.checkStatus({ gatewayOrderId: orderId })} onClose={onClose} />
          )}
        </div>
      </section>
    </div>
  );
}

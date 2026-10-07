import { useCallback, useRef, useState } from "react";
import { useAuth } from "../auth/context/useAuth";
import { studentLmsApi } from "./api/lmsApi";
import type { PaymentCheckoutResponse } from "./api/lmsTypes";
import { clearPendingEnrollment } from "./checkout";
import type { EnrollmentApplicant } from "./checkout";
import { loadCashfreeScript, loadRazorpayScript } from "./paymentGateways";
import type { CashfreeResult, RazorpaySuccess } from "./paymentGateways";
import { ApiError, formatApiError } from "../../lib/api/httpClient";

/**
 * The /web checkout page's payment logic (enrollment → checkout → gateway → server verification),
 * packaged as a hook so the single page can run it inside the enrollment dialog.
 */

/** How long to keep asking the server while the bank confirms (UPI can take a little while). */
const CONFIRM_ATTEMPTS = 20;
const CONFIRM_INTERVAL_MS = 3000;
export const STILL_PROCESSING_MESSAGE =
  "Your bank has not confirmed this payment yet. Do not pay again if money was deducted. Check payment status while confirmation is pending.";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const errorCode = (error: unknown) => (error instanceof ApiError ? error.problem?.errorCode : undefined);

export type PaymentPhase =
  | "idle"
  | "preparing"
  | "confirming"
  | "pending"
  | "closed"
  | "development"
  | "success"
  | "error";

export type PaymentTarget = {
  programId: string;
  programTitle: string;
  planId: string;
  planName: string;
  paymentMode: 1 | 2;
  applicant: EnrollmentApplicant;
  startDate?: string;
};

type ConfirmTarget = { paymentTransactionId?: string; gatewayOrderId: string };

export function usePaymentFlow() {
  const auth = useAuth();
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [message, setMessage] = useState("");
  const [checkout, setCheckout] = useState<PaymentCheckoutResponse | null>(null);
  const enrollmentIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  const finishPaidCheckout = useCallback(async () => {
    await auth.loadMe().catch(() => undefined);
    clearPendingEnrollment();
    setPhase("success");
    setMessage("");
  }, [auth]);

  /** Returns "paid", "pending" (still unconfirmed after retrying) or "failed". */
  const confirmWithGateway = useCallback(async (target: ConfirmTarget, attempts = CONFIRM_ATTEMPTS) => {
    setPhase("confirming");
    setMessage("");
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await studentLmsApi.verifyPayment(target);
        await finishPaidCheckout();
        return "paid" as const;
      } catch (error) {
        if (errorCode(error) !== "payment_pending") {
          setPhase("error");
          setMessage(formatApiError(error));
          return "failed" as const;
        }
        if (attempt < attempts) await wait(CONFIRM_INTERVAL_MS);
      }
    }
    return "pending" as const;
  }, [finishPaidCheckout]);

  const confirmPayment = useCallback(async (current: PaymentCheckoutResponse, gatewayResponse: RazorpaySuccess) => {
    setPhase("confirming");
    setMessage("");
    try {
      await studentLmsApi.verifyPayment({
        paymentTransactionId: current.transaction.id,
        gatewayOrderId: gatewayResponse.razorpay_order_id,
        gatewayPaymentId: gatewayResponse.razorpay_payment_id,
        gatewaySignature: gatewayResponse.razorpay_signature
      });
      await finishPaidCheckout();
    } catch (error) {
      setPhase("error");
      setMessage(formatApiError(error));
    }
  }, [finishPaidCheckout]);

  const openCashfreeCheckout = useCallback(async (current: PaymentCheckoutResponse) => {
    if (!current.paymentSessionId) throw new Error("Cashfree payment session is missing. Please start checkout again.");
    await loadCashfreeScript();
    if (!window.Cashfree) throw new Error("Cashfree checkout is unavailable. Please try again.");

    const cashfree = window.Cashfree({
      mode: current.paymentEnvironment?.toLowerCase() === "production" ? "production" : "sandbox"
    });
    const result = (await cashfree.checkout({ paymentSessionId: current.paymentSessionId, redirectTarget: "_modal" })) as CashfreeResult;

    // Some methods (UPI apps, net banking) leave the site; the return URL confirms those.
    if (result?.redirect) return;

    const target = { paymentTransactionId: current.transaction.id, gatewayOrderId: current.gatewayOrderId };
    if (result?.paymentDetails) {
      if ((await confirmWithGateway(target)) === "pending") {
        setPhase("pending");
        setMessage(STILL_PROCESSING_MESSAGE);
      }
      return;
    }

    // Closing the modal does not prove failure: the bank may still confirm this order.
    if ((await confirmWithGateway(target, 3)) !== "pending") return;
    setPhase("closed");
    setMessage(result?.error?.message
      ? `${result.error.message} No payment has been confirmed. If money was deducted, check payment status before trying again.`
      : "Checkout was closed. No payment has been confirmed. If you already paid, check payment status before trying again.");
  }, [confirmWithGateway]);

  const startPayment = useCallback(async (target: PaymentTarget) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase("preparing");
    setMessage("");
    void loadCashfreeScript().catch(() => undefined);

    try {
      const enrollmentId = enrollmentIdRef.current ?? (await studentLmsApi.createEnrollment({
        programId: target.programId,
        programPlanId: target.planId,
        startDate: target.startDate
      })).data.id;
      enrollmentIdRef.current = enrollmentId;

      const response = await studentLmsApi.createPaymentCheckout({
        programId: target.programId,
        programPlanId: target.planId,
        enrollmentId,
        mode: target.paymentMode,
        customerName: target.applicant.fullName,
        customerEmail: target.applicant.email,
        customerPhone: target.applicant.phoneNumber,
        customerCollege: target.applicant.collegeName
      });
      const current = response.data;
      setCheckout(current);

      if (current.provider === "Free") {
        await confirmPayment(current, {
          razorpay_order_id: current.gatewayOrderId,
          razorpay_payment_id: `free_${current.transaction.id}`,
          razorpay_signature: "free-payment-no-signature"
        });
        return;
      }

      if (current.provider === "Development") {
        setPhase("development");
        setMessage("Development test mode is active. No money will be charged.");
        return;
      }

      if (current.provider === "Cashfree") {
        await openCashfreeCheckout(current);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Secure payment checkout is unavailable. Please try again.");

      const payment = new window.Razorpay({
        key: current.publicKey,
        amount: current.amountInMinorUnits,
        currency: current.currency,
        name: "Joviq Technologies",
        description: `${target.programTitle} · ${target.planName} ${target.paymentMode === 1 ? "seat reservation" : "full program payment"}`,
        order_id: current.gatewayOrderId,
        prefill: { name: target.applicant.fullName, email: target.applicant.email, contact: target.applicant.phoneNumber },
        notes: { program: target.programTitle, plan: target.planName },
        theme: { color: "#5148a8" },
        handler: (gatewayResponse) => void confirmPayment(current, gatewayResponse),
        modal: {
          ondismiss: () => {
            void studentLmsApi.markPaymentFailed(current.transaction.id, { failureReason: "Checkout was closed by the customer." });
            setPhase("closed");
            setMessage("Checkout was closed. No payment has been confirmed.");
          }
        }
      });
      payment.on("payment.failed", (failure) => {
        void studentLmsApi.markPaymentFailed(current.transaction.id, {
          failureReason: failure.error?.description ?? failure.error?.reason ?? "Payment was declined."
        });
        setPhase("error");
        setMessage(failure.error?.description ?? "Payment was declined. You can try again.");
      });
      payment.open();
    } catch (error) {
      if (errorCode(error) === "payment_already_received") {
        await finishPaidCheckout();
        return;
      }
      setPhase("error");
      setMessage(formatApiError(error));
    } finally {
      busyRef.current = false;
    }
  }, [confirmPayment, finishPaidCheckout, openCashfreeCheckout]);

  const checkStatus = useCallback(async (target?: ConfirmTarget) => {
    const confirmTarget = target ?? (checkout ? { paymentTransactionId: checkout.transaction.id, gatewayOrderId: checkout.gatewayOrderId } : null);
    if (!confirmTarget) return;
    if ((await confirmWithGateway(confirmTarget)) === "pending") {
      setPhase("pending");
      setMessage(STILL_PROCESSING_MESSAGE);
    }
  }, [checkout, confirmWithGateway]);

  const completeTestPayment = useCallback(() => {
    if (!checkout) return;
    void confirmPayment(checkout, {
      razorpay_order_id: checkout.gatewayOrderId,
      razorpay_payment_id: `test_payment_${checkout.transaction.id}`,
      razorpay_signature: "development-test-signature"
    });
  }, [checkout, confirmPayment]);

  const reset = useCallback(() => {
    enrollmentIdRef.current = null;
    setCheckout(null);
    setPhase("idle");
    setMessage("");
  }, []);

  return { phase, message, checkout, startPayment, checkStatus, completeTestPayment, reset };
}

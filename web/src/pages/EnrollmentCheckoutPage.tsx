import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { ToastMessage } from "../components/ToastMessage";
import { useAuth } from "../features/auth/context/useAuth";
import { publicLmsApi, studentLmsApi } from "../features/lms/api/lmsApi";
import type { PaymentCheckoutResponse, ProgramDetailsResponse } from "../features/lms/api/lmsTypes";
import { clearPendingEnrollment, readPendingEnrollment } from "../features/lms/checkout";
import { formatApiError } from "../lib/api/httpClient";

type PageMessage = { tone: "success" | "error"; text: string } | null;

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = { error?: { description?: string; reason?: string } };

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay checkout could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load."));
    document.body.appendChild(script);
  });
}

export function EnrollmentCheckoutPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pending] = useState(readPendingEnrollment);
  const [program, setProgram] = useState<ProgramDetailsResponse | null>(null);
  const [checkout, setCheckout] = useState<PaymentCheckoutResponse | null>(null);
  const [message, setMessage] = useState<PageMessage>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!pending) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    void publicLmsApi.getProgram(pending.slug)
      .then((response) => {
        if (mounted) setProgram(response.data);
      })
      .catch((error) => {
        if (mounted) setMessage({ tone: "error", text: formatApiError(error) });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pending]);

  useEffect(() => {
    if (!checkout) return;
    const update = () => setSecondsLeft(Math.max(0, Math.floor((new Date(checkout.expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [checkout]);

  const selectedPlan = useMemo(
    () => program?.plans.find((plan) => plan.code === pending?.planCode) ?? program?.plans[0],
    [pending?.planCode, program]
  );
  const paymentMode = pending?.paymentMode ?? 1;
  const paymentPurpose = paymentMode === 1 ? "initial access payment" : "remaining balance payment";
  const expectedAmount = paymentMode === 1 ? selectedPlan?.reserveAmount : pending?.amount;

  async function startPayment() {
    if (!pending || !program || !selectedPlan) return;
    setIsPaying(true);
    setMessage(null);

    try {
      const enrollment = await studentLmsApi.createEnrollment({
        programId: program.id,
        programPlanId: selectedPlan.id
      });
      const response = await studentLmsApi.createPaymentCheckout({
        programId: program.id,
        programPlanId: selectedPlan.id,
        enrollmentId: enrollment.data.id,
        mode: paymentMode
      });
      setCheckout(response.data);

      if (response.data.provider === "Development") {
        setMessage({ tone: "success", text: "Development test mode is active. No money will be charged." });
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Secure payment checkout is unavailable. Please try again.");
      }

      const payment = new window.Razorpay({
        key: response.data.publicKey,
        amount: response.data.amountInMinorUnits,
        currency: response.data.currency,
        name: "Joviq Technologies",
        description: `${program.title} · ${selectedPlan.name} ${paymentPurpose}`,
        order_id: response.data.gatewayOrderId,
        prefill: {
          name: auth.user?.fullName,
          email: auth.user?.email
        },
        notes: {
          program: program.title,
          plan: selectedPlan.name
        },
        theme: { color: "#5148a8" },
        handler: (gatewayResponse) => {
          void confirmPayment(response.data, gatewayResponse);
        },
        modal: {
          ondismiss: () => {
            void studentLmsApi.markPaymentFailed(response.data.transaction.id, { failureReason: "Checkout was closed by the customer." });
          }
        }
      });

      payment.on("payment.failed", (failure) => {
        void studentLmsApi.markPaymentFailed(response.data.transaction.id, {
          failureReason: failure.error?.description ?? failure.error?.reason ?? "Payment was declined."
        });
        setMessage({ tone: "error", text: failure.error?.description ?? "Payment was declined. You can try again." });
      });
      payment.open();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsPaying(false);
    }
  }

  async function confirmPayment(currentCheckout: PaymentCheckoutResponse, gatewayResponse: RazorpaySuccess) {
    setIsPaying(true);
    setMessage(null);
    try {
      await studentLmsApi.verifyPayment({
        paymentTransactionId: currentCheckout.transaction.id,
        gatewayOrderId: gatewayResponse.razorpay_order_id,
        gatewayPaymentId: gatewayResponse.razorpay_payment_id,
        gatewaySignature: gatewayResponse.razorpay_signature
      });
      clearPendingEnrollment();
      navigate("/dashboard?payment=success", { replace: true });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsPaying(false);
    }
  }

  if (!pending) {
    return (
      <section className="checkout-empty dashboard-card">
        <CreditCard size={34} />
        <h1>Choose a program to continue</h1>
        <p>Select Launch, Elevate, or Mastery from a program page to start secure enrollment.</p>
        <Link className="primary-action" to="/programs">Explore programs</Link>
      </section>
    );
  }

  const isExpired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <section className="checkout-page">
      <Link className="checkout-back-link" to={`/programs/${pending.slug}`}><ArrowLeft size={17} /> Back to program</Link>
      <div className="checkout-layout">
        <section className="checkout-card checkout-summary-card">
          <span className="eyebrow">Secure enrollment</span>
          <h1>Start your learning journey</h1>
          {isLoading ? <div className="table-state">Loading plan details...</div> : null}
          {program && selectedPlan ? (
            <>
              <div className="checkout-program-heading">
                <div className="checkout-program-icon"><CreditCard size={22} /></div>
                <div><strong>{program.title}</strong><span>{selectedPlan.name} plan</span></div>
              </div>
              <div className="checkout-price-row"><span>{paymentMode === 1 ? "Initial payment today" : "Balance payment today"}</span><strong>{expectedAmount ? formatCurrency(expectedAmount) : "Calculated securely"}</strong></div>
              <div className="checkout-price-row checkout-price-row--muted"><span>Full plan value</span><span>{formatCurrency(selectedPlan.offerPrice)}</span></div>
              <div className="checkout-rule" />
              <ul className="checkout-benefits">
                <li><CheckCircle2 size={16} /> Account activation after payment verification</li>
                {paymentMode === 1 ? <li><CheckCircle2 size={16} /> First module preview for two months</li> : <li><CheckCircle2 size={16} /> Full course access unlocks after the balance is verified</li>}
                <li><CheckCircle2 size={16} /> {paymentMode === 1 ? "Pay the remaining balance to unlock projects, all modules, and certificate" : "Projects, all modules, and certificate access are protected until verification"}</li>
              </ul>
            </>
          ) : null}
        </section>

        <section className="checkout-card checkout-payment-card">
          <div className="checkout-security-heading"><LockKeyhole size={20} /><div><strong>{checkout?.provider === "Development" ? "Development test payment" : "Protected payment"}</strong><span>{checkout?.provider === "Development" ? "Local-only test mode · no money charged" : "Processed by Razorpay Secure Checkout"}</span></div></div>
          <h2>{paymentMode === 1 ? "Pay the initial amount" : "Pay the remaining balance"}</h2>
          <p className="checkout-payment-copy">{checkout?.provider === "Development" ? "This local test payment completes the same server-side verification and access flow without charging money." : "UPI, UPI QR, cards, and net banking are shown by the gateway according to the methods enabled on your merchant account."}</p>
          {checkout && secondsLeft !== null ? (
            <div className={`checkout-timer${isExpired ? " is-expired" : ""}`}><Clock3 size={17} /> {isExpired ? "Payment session expired" : `Payment session valid for ${formatCountdown(secondsLeft)}`}</div>
          ) : null}
          <button className="primary-action checkout-pay-button" type="button" disabled={isLoading || !program || !selectedPlan || isPaying || isExpired} onClick={() => void startPayment()}>
            <CreditCard size={18} /> {isPaying ? "Preparing secure checkout..." : `Pay ${expectedAmount ? formatCurrency(expectedAmount) : paymentMode === 1 ? "initial amount" : "balance"}`}
          </button>
          {checkout?.provider === "Development" ? (
            <button
              className="secondary-action checkout-test-button"
              type="button"
              disabled={isPaying || isExpired}
              onClick={() => void confirmPayment(checkout, {
                razorpay_order_id: checkout.gatewayOrderId,
                razorpay_payment_id: `test_payment_${checkout.transaction.id}`,
                razorpay_signature: "development-test-signature"
              })}
            >
              Confirm test payment (no charge)
            </button>
          ) : null}
          <div className="checkout-trust-row"><ShieldCheck size={17} /> No course access is granted until the gateway payment is verified.</div>
          <ToastMessage message={message} onDismiss={() => setMessage(null)} />
        </section>
      </div>
    </section>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

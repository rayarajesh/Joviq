import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgePercent, CheckCircle2, Clock3, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { ToastMessage } from "../components/ToastMessage";
import { useAuth } from "../features/auth/context/useAuth";
import { publicLmsApi, studentLmsApi } from "../features/lms/api/lmsApi";
import type { CouponValidationResponse, EnrollmentResponse, PaymentCheckoutResponse, ProgramDetailsResponse } from "../features/lms/api/lmsTypes";
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
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};

type CashfreeCheckout = {
  checkout: (options: { paymentSessionId: string; redirectTarget?: "_modal" | "_self" | "_blank" }) => Promise<unknown>;
};

type CashfreeFactory = (options: { mode: "sandbox" | "production" }) => CashfreeCheckout;

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
    Cashfree?: CashfreeFactory;
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

function loadCashfreeScript() {
  if (window.Cashfree) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cashfree checkout could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Cashfree checkout could not load."));
    document.body.appendChild(script);
  });
}

export function EnrollmentCheckoutPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoStartRequested = searchParams.get("autostart") === "1";
  const autoStartRef = useRef(false);
  const [pending] = useState(readPendingEnrollment);
  const [program, setProgram] = useState<ProgramDetailsResponse | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [checkout, setCheckout] = useState<PaymentCheckoutResponse | null>(null);
  const [message, setMessage] = useState<PageMessage>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<CouponValidationResponse | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
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
  const paymentPurpose = paymentMode === 1 ? "seat reservation" : paymentMode === 2 ? "full program payment" : "remaining balance payment";
  const expectedAmount = paymentMode === 1
    ? selectedPlan?.reserveAmount
    : paymentMode === 2
      ? selectedPlan?.offerPrice
      : couponValidation?.payableAmount ?? pending?.amount;

  async function applyCoupon() {
    if (!pending || !program || !selectedPlan || paymentMode !== 3 || !couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setMessage(null);

    try {
      const response = await studentLmsApi.validateCoupon({
        programId: program.id,
        programPlanId: selectedPlan.id,
        enrollmentId: enrollment?.id,
        mode: 3,
        couponCode: couponCode.trim()
      });
      setCouponValidation(response.data);
      setMessage({ tone: "success", text: `${response.data.code} applied. Your remaining payment was recalculated securely.` });
    } catch (error) {
      setCouponValidation(null);
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponValidation(null);
    setMessage(null);
  }

  async function startPayment() {
    if (!pending || !program || !selectedPlan) return;
    setIsPaying(true);
    setMessage(null);

    try {
      const currentEnrollment = enrollment ?? (await studentLmsApi.createEnrollment({
        programId: program.id,
        programPlanId: selectedPlan.id,
        startDate: pending.startDate
      })).data;
      setEnrollment(currentEnrollment);
      const response = await studentLmsApi.createPaymentCheckout({
        programId: program.id,
        programPlanId: selectedPlan.id,
        enrollmentId: currentEnrollment.id,
        mode: paymentMode,
        couponCode: paymentMode === 3 ? couponCode.trim() || undefined : undefined,
        customerName: pending.applicant?.fullName,
        customerEmail: pending.applicant?.email,
        customerPhone: pending.applicant?.phoneNumber,
        customerCollege: pending.applicant?.collegeName
      });
      setCheckout(response.data);

      if (response.data.transaction.couponCode && response.data.transaction.discountAmount > 0) {
        setCouponValidation((current) => ({
          code: response.data.transaction.couponCode!,
          description: current?.description ?? "Coupon applied to remaining balance",
          originalAmount: response.data.transaction.originalAmount,
          discountAmount: response.data.transaction.discountAmount,
          payableAmount: response.data.transaction.amount
        }));
      }

      if (response.data.provider === "Free") {
        await confirmPayment(response.data, {
          razorpay_order_id: response.data.gatewayOrderId,
          razorpay_payment_id: `free_${response.data.transaction.id}`,
          razorpay_signature: "free-payment-no-signature"
        });
        return;
      }

      if (response.data.provider === "Development") {
        setMessage({ tone: "success", text: "Development test mode is active. No money will be charged." });
        return;
      }

      if (response.data.provider === "Cashfree") {
        await openCashfreeCheckout(response.data);
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
          name: auth.user?.fullName ?? pending.applicant?.fullName,
          email: auth.user?.email ?? pending.applicant?.email,
          contact: pending.applicant?.phoneNumber
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

  useEffect(() => {
    if (!autoStartRequested || paymentMode === 3 || autoStartRef.current || isLoading || !program || !selectedPlan) return;
    autoStartRef.current = true;
    void startPayment();
  }, [autoStartRequested, isLoading, paymentMode, program, selectedPlan]);

  async function openCashfreeCheckout(currentCheckout: PaymentCheckoutResponse) {
    if (!currentCheckout.paymentSessionId) {
      throw new Error("Cashfree payment session is missing. Please start checkout again.");
    }

    await loadCashfreeScript();
    if (!window.Cashfree) {
      throw new Error("Cashfree checkout is unavailable. Please try again.");
    }

    const cashfree = window.Cashfree({
      mode: currentCheckout.paymentEnvironment?.toLowerCase() === "production" ? "production" : "sandbox"
    });
    const result = await cashfree.checkout({ paymentSessionId: currentCheckout.paymentSessionId, redirectTarget: "_modal" });

    // Check if the user cancelled or if there was an error before verifying
    if (result && typeof result === "object") {
      if ("error" in result) {
        const error = (result as { error?: { message?: string; code?: string } }).error;
        if (error) {
          // Mark the transaction as failed if user cancelled
          void studentLmsApi.markPaymentFailed(currentCheckout.transaction.id, {
            failureReason: error.message ?? "Payment was cancelled or not completed."
          });
          throw new Error(error.message ?? "Payment was not completed. Please try again.");
        }
      }
      // If paymentDetails exists the payment was successful
      if (!("paymentDetails" in result)) {
        // Modal closed without clear success — verify with backend to confirm
        void studentLmsApi.markPaymentFailed(currentCheckout.transaction.id, {
          failureReason: "Checkout was closed without payment confirmation."
        });
        throw new Error("Payment was not completed. Please try again.");
      }
    }

    await confirmCashfreePayment(currentCheckout);
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
      await auth.loadMe();
      clearPendingEnrollment();
      navigate("/dashboard?payment=success", { replace: true });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsPaying(false);
    }
  }

  async function confirmCashfreePayment(currentCheckout: PaymentCheckoutResponse) {
    setIsPaying(true);
    setMessage(null);
    try {
      await studentLmsApi.verifyPayment({
        paymentTransactionId: currentCheckout.transaction.id,
        gatewayOrderId: currentCheckout.gatewayOrderId
      });
      await auth.loadMe();
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

  if (autoStartRequested && paymentMode !== 3) {
    const launcherTitle = isLoading
      ? "Preparing your secure checkout"
      : isPaying
        ? "Opening Cashfree checkout"
        : checkout?.provider === "Development"
          ? "Test checkout is ready"
          : message?.tone === "error"
            ? "We could not open checkout"
            : "Preparing your secure checkout";
    const launcherMessage = message?.text
      ?? (checkout?.provider === "Development"
        ? "Local test mode is active. Complete the test payment to continue."
        : "Your payment dialog will open here. Please keep this window open.");

    return (
      <section className="checkout-launcher" aria-live="polite">
        <div className="checkout-launcher__card">
          <div className="checkout-launcher__icon"><LockKeyhole size={25} /></div>
          <span className="checkout-launcher__eyebrow">Secure enrollment</span>
          <h1>{launcherTitle}</h1>
          <p>{launcherMessage}</p>
          {checkout?.provider === "Development" ? (
            <button
              className="primary-action checkout-pay-button"
              type="button"
              disabled={isPaying}
              onClick={() => void confirmPayment(checkout, {
                razorpay_order_id: checkout.gatewayOrderId,
                razorpay_payment_id: `test_payment_${checkout.transaction.id}`,
                razorpay_signature: "development-test-signature"
              })}
            >
              <CreditCard size={18} /> Complete test payment
            </button>
          ) : null}
          {message?.tone === "error" ? (
            <button className="secondary-action checkout-launcher__retry" type="button" disabled={isPaying} onClick={() => void startPayment()}>
              Try again
            </button>
          ) : null}
          <Link className="checkout-launcher__back" to={`/programs/${pending.slug}`}><ArrowLeft size={17} /> Return to program</Link>
        </div>
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
              <div className="checkout-price-row"><span>{paymentMode === 1 ? "Seat token today" : paymentMode === 2 ? "Full payment today" : "Balance payment today"}</span><strong>{expectedAmount ? formatCurrency(expectedAmount) : "Calculated securely"}</strong></div>
              {paymentMode === 3 && couponValidation ? <>
                <div className="checkout-price-row checkout-price-row--muted"><span>Balance before coupon</span><span>{formatCurrency(couponValidation.originalAmount)}</span></div>
                <div className="checkout-price-row checkout-price-row--discount"><span>Coupon {couponValidation.code}</span><strong>-{formatCurrency(couponValidation.discountAmount)}</strong></div>
              </> : null}
              <div className="checkout-price-row checkout-price-row--muted"><span>Full plan value</span><span>{formatCurrency(selectedPlan.offerPrice)}</span></div>
              {pending.startDate ? <div className="checkout-price-row checkout-price-row--muted"><span>Requested start date</span><span>{formatDisplayDate(pending.startDate)}</span></div> : null}
              <div className="checkout-rule" />
              <ul className="checkout-benefits">
                <li><CheckCircle2 size={16} /> Account activation after payment verification</li>
                {paymentMode === 1 ? <li><CheckCircle2 size={16} /> Seat reserved with limited preview access until full payment</li> : <li><CheckCircle2 size={16} /> Full course access unlocks after this payment is verified</li>}
                <li><CheckCircle2 size={16} /> {paymentMode === 1 ? "Pay the remaining balance to unlock projects, all modules, and certificate" : "Projects, all modules, and certificate access are included for six months"}</li>
                {paymentMode === 1 ? <li><CheckCircle2 size={16} /> Coupons apply only to the remaining balance, never to the initial reserve payment.</li> : null}
              </ul>
            </>
          ) : null}
        </section>

        <section className="checkout-card checkout-payment-card">
          <div className="checkout-security-heading"><LockKeyhole size={20} /><div><strong>{checkout?.provider === "Development" ? "Development test payment" : "Protected payment"}</strong><span>{checkout?.provider === "Development" ? "Local-only test mode · no money charged" : checkout?.provider === "Cashfree" ? "Processed by Cashfree Secure Checkout" : "Processed by Razorpay Secure Checkout"}</span></div></div>
          <h2>{paymentMode === 1 ? "Reserve your seat" : paymentMode === 2 ? "Pay in full" : "Pay the remaining balance"}</h2>
          <p className="checkout-payment-copy">{checkout?.provider === "Development" ? "This local test payment completes the same server-side verification and access flow without charging money." : "UPI, UPI QR, cards, and net banking are shown by the gateway according to the methods enabled on your merchant account."}</p>
          {paymentMode === 3 ? (
            <div className="checkout-coupon-box">
              <label htmlFor="checkout-coupon"><BadgePercent size={17} /> Have a coupon?</label>
              <div className="checkout-coupon-box__controls">
                <input id="checkout-coupon" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponValidation(null); }} placeholder="Enter coupon code" autoComplete="off" />
                {couponValidation ? <button className="secondary-action" type="button" onClick={removeCoupon}>Remove</button> : <button className="secondary-action" type="button" disabled={isApplyingCoupon || !couponCode.trim()} onClick={() => void applyCoupon()}>{isApplyingCoupon ? "Checking..." : "Apply"}</button>}
              </div>
              {couponValidation ? <small className="checkout-coupon-box__success">{couponValidation.description}</small> : <small>Eligible coupons reduce only this remaining-balance payment.</small>}
            </div>
          ) : null}
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

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

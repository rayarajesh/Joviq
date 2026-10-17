import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import type { PaymentTransactionResponse } from "../features/lms/api/lmsTypes";
import type { PaymentTarget } from "../features/lms/usePaymentFlow";
import { ApiError, formatApiError } from "../lib/api/httpClient";
import { readOnboardingEmail } from "../lib/onboardingLink";
import { defaultProgramPlans } from "../data/siteContent";
import { EnrollmentDialog } from "./EnrollmentDialog";
import { formatInr } from "./format";

/** A resumable entry point: authentication and verified payments come from the API. */
export function OnboardingPage() {
  const auth = useAuth();
  const [email, setEmail] = useState(readOnboardingEmail);
  const [password, setPassword] = useState("");
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [payments, setPayments] = useState<PaymentTransactionResponse[] | null>(null);
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [retry, setRetry] = useState(0);
  const busyRef = useRef(false);
  const user = auth.user;
  const emailMatches = !email.trim() || email.trim().toLowerCase() === user?.email.toLowerCase();

  useEffect(() => {
    if (!user || !emailMatches || !user.roles.includes("Student")) return;
    let active = true;
    setPayments(null);
    setError("");
    studentLmsApi.getPayments().then(({ data }) => {
      if (!active) return;
      // Never treat pending/failed transactions or a browser flag as proof of payment.
      const paid = data.filter((item) => item.status === "Verified" && item.enrollmentId && item.programPlanId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      // Multiple installments for one enrollment should not create duplicate forms.
      const enrollments = paid.filter((item, index) => paid.findIndex((other) => other.enrollmentId === item.enrollmentId) === index);
      setPayments(enrollments);
      if (enrollments.length === 1) openRegistration(enrollments[0]);
    }).catch((reason: unknown) => { if (active) setError(formatApiError(reason)); });
    return () => { active = false; };
  }, [user?.id, emailMatches, retry]);

  function openRegistration(payment: PaymentTransactionResponse) {
    if (!user || !payment.programPlanId) return;
    setTarget({
      programId: payment.programId,
      programTitle: payment.programTitle ?? "Your program",
      planId: payment.programPlanId,
      planName: payment.programPlanName ?? "",
      paymentTransactionId: payment.id,
      paymentMode: payment.mode === "Full" ? 2 : 1,
      amountPaid: payment.amount,
      applicant: { fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber ?? "", collegeName: "" }
    });
  }

  async function run(task: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try { await task(); } catch (reason) { setError(formatApiError(reason)); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function sendCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Enter the email used during payment.");
    await authApi.forgotPassword(email.trim());
    setReset(true);
    setNotice("If this email has an account, a code has been sent. Use it to set your password and resume onboarding.");
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      try {
        const response = await authApi.login({ email: email.trim(), password, rememberMe: true });
        auth.applyAuthResponse(response.data);
        setPassword("");
        setNotice("");
      } catch (reason) {
        if (reason instanceof ApiError && reason.problem?.errorCode === "password_not_set") await sendCode();
        else throw reason;
      }
    });
  }

  function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      const newPassword = String(fields.get("newPassword") ?? "");
      const confirmPassword = String(fields.get("confirmPassword") ?? "");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      const verification = await authApi.verifyForgotPassword(email.trim(), String(fields.get("otp") ?? ""));
      await authApi.resetPassword({ ...verification.data, newPassword, confirmPassword });
      setReset(false);
      setPassword("");
      setNotice("Password saved. Sign in below to open your onboarding form.");
    });
  }

  const plan = target ? defaultProgramPlans.find((item) => item.name.toLowerCase() === target.planName.toLowerCase()) ?? defaultProgramPlans[0] : null;

  return (
    <main className="resume-onboarding">
      <section className="resume-onboarding__card" aria-labelledby="onboarding-title">
        <a href="/">← Back to Joviq</a>
        <span className="eyebrow">Already paid? Continue here</span>
        <h1 id="onboarding-title">Complete your onboarding</h1>
        <p>Choose your course, preferred start month and study details. You do not need to pay again.</p>
        {auth.isBooting ? <p role="status">Checking your session…</p> : !user ? (
          <>
            <p>Sign in with the email used during payment. Google sign-in is not required.</p>
            {notice ? <p role="status">{notice}</p> : null}
            <form className="enroll-form" onSubmit={reset ? resetPassword : signIn}>
              <label className="field"><span>Email used during payment</span>
                <input type="email" autoComplete="email" required value={email} readOnly={reset} onChange={(event) => setEmail(event.target.value)} />
              </label>
              {reset ? <>
                <label className="field"><span>Email OTP</span><input name="otp" autoComplete="one-time-code" inputMode="numeric" required /></label>
                <label className="field"><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
                <label className="field"><span>Confirm password</span><input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
                <small>Use at least 8 characters, including uppercase, lowercase, a number and a symbol.</small>
              </> : <label className="field"><span>Password</span>
                <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>}
              <button className="btn btn--primary" disabled={busy}>{busy ? "Please wait…" : reset ? "Save password" : "Continue to onboarding"}</button>
              <button className="btn btn--ghost" type="button" disabled={busy} onClick={() => void run(sendCode)}>{reset ? "Resend email code" : "Set or reset password using email OTP"}</button>
              {reset ? <button className="btn btn--ghost" type="button" disabled={busy} onClick={() => { setReset(false); setNotice(""); }}>Back to sign in</button> : null}
            </form>
          </>
        ) : !emailMatches || !user.roles.includes("Student") ? (
          <p>You are signed in as {user.email}. Use the student account associated with your payment to continue.</p>
        ) : <>
          <p>Signed in as {user.email}</p>
          {!payments && !error ? <p role="status">Loading your verified payment…</p> : null}
          {payments?.length === 0 ? <p>No verified payment was found for this account. If money was deducted, wait for payment confirmation or contact support. Do not pay again.</p> : null}
          {payments?.map((payment) => <button className="btn btn--primary" key={payment.id} onClick={() => openRegistration(payment)}>
            Continue onboarding · {payment.programPlanName ?? payment.programTitle} · {formatInr(payment.amount)}
          </button>)}
          <button className="btn btn--ghost" onClick={() => setRetry((value) => value + 1)}>Refresh payment status</button>
        </>}
        {error ? <p className="enroll-error" role="alert">{error}</p> : null}
        {user ? <button className="btn btn--ghost" disabled={busy} onClick={() => void run(async () => { setTarget(null); setPayments(null); await auth.logout(); })}>Use another account</button> : null}
      </section>
      {target && plan && user && emailMatches ? <EnrollmentDialog
        key={target.paymentTransactionId}
        plan={plan}
        initialValues={target.applicant}
        initialPostPaymentTarget={target}
        onClose={() => setTarget(null)}
      /> : null}
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import type { PaymentTransactionResponse } from "../features/lms/api/lmsTypes";
import type { PaymentTarget } from "../features/lms/usePaymentFlow";
import { formatApiError } from "../lib/api/httpClient";
import { consumeManualResumeFlag, readOnboardingEmail } from "../lib/onboardingLink";
import { defaultProgramPlans } from "../data/siteContent";
import { EnrollmentDialog } from "./EnrollmentDialog";

/** A resumable entry point: a paid learner enters only the payment email — no password. */
export function OnboardingPage() {
  const auth = useAuth();
  // A Google sign-in that failed its onboarding email-match returns here as ?email=&googleError=.
  const googleCallback = useRef((() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return { email: params.get("email") ?? "", googleError: params.get("googleError") ?? "" };
    } catch { return { email: "", googleError: "" }; }
  })());
  const [email, setEmail] = useState(() => googleCallback.current.email || readOnboardingEmail());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(googleCallback.current.googleError);
  const [payments, setPayments] = useState<PaymentTransactionResponse[] | null>(null);
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [retry, setRetry] = useState(0);
  const busyRef = useRef(false);
  // Skip the auto-resume when the page was opened by closing the onboarding form, when a Google
  // sign-in bounced back with an error, or when opened from a shared ?email= link (sent manually to
  // a learner) — show the email-entry screen with the email prefilled and let the learner press
  // Continue themselves.
  const manualResume = useRef(consumeManualResumeFlag() || !!googleCallback.current.googleError || !!googleCallback.current.email);
  const autoResumeRef = useRef(manualResume.current);
  const [autoResuming, setAutoResuming] = useState(() => !manualResume.current && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((googleCallback.current.email || readOnboardingEmail()).trim()));

  // Strip the Google callback params so a refresh does not replay the error.
  useEffect(() => {
    if (!googleCallback.current.email && !googleCallback.current.googleError) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("email");
      url.searchParams.delete("googleError");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch { /* ignore */ }
  }, []);
  const user = auth.user;
  const emailMatches = !email.trim() || email.trim().toLowerCase() === user?.email.toLowerCase();

  // Email-only resume: if the page already has the payment email (e.g. opened from the resume strip),
  // sign the student in without a password. The API only succeeds when that email has a verified
  // payment, after which the effect below loads the payment and opens the registration form directly.
  useEffect(() => {
    if (auth.isBooting || user || autoResumeRef.current) return;
    const resumeEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resumeEmail)) return;
    autoResumeRef.current = true;
    setAutoResuming(true);
    setError("");
    authApi.resumeOnboarding(resumeEmail)
      .then((response) => auth.applyAuthResponse(response.data))
      .catch((reason: unknown) => setError(formatApiError(reason)))
      .finally(() => setAutoResuming(false));
  }, [auth.isBooting, user?.id, email]);

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
      // A learner who has already paid goes straight to the registration form for their
      // most recent verified enrollment (enrollments are sorted newest-first). The selection
      // list stays rendered behind it, so closing the dialog still lets them pick another.
      if (enrollments.length >= 1) openRegistration(enrollments[0]);
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

  // Plain close (details already saved / not the course form): just dismiss the dialog.
  function closeRegistration() {
    setTarget(null);
  }

  // Guard: closing the UNSAVED course form (X) must not jump the learner all the way back. It
  // returns them to the "enter the email used for payment" screen with their email still filled in.
  // From there, Continue onboarding re-opens the form — so a mis-click is easily recovered.
  function guardCloseRegistration() {
    void run(async () => {
      const resumeEmail = user?.email ?? email;
      setTarget(null);
      setPayments(null);
      await auth.logout();
      setEmail(resumeEmail);
      // Keep the auto-resume guard set so the email entry does not auto-submit; the learner
      // confirms the email and clicks Continue onboarding themselves.
      autoResumeRef.current = true;
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

  // Enter the payment email, confirm, no password. Resumes when that email has a verified payment.
  function resumeWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const resumeEmail = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resumeEmail)) throw new Error("Enter the email used during payment.");
      const response = await authApi.resumeOnboarding(resumeEmail);
      auth.applyAuthResponse(response.data);
    });
  }

  function useAnotherAccount() {
    void run(async () => {
      setTarget(null);
      setPayments(null);
      await auth.logout();
      setEmail("");
      // Keep the auto-resume guard set so clearing the field does not auto-submit; the student
      // types the other email and confirms manually.
      autoResumeRef.current = true;
    });
  }

  const plan = target ? defaultProgramPlans.find((item) => item.name.toLowerCase() === target.planName.toLowerCase()) ?? defaultProgramPlans[0] : null;

  return (
    <main className="resume-onboarding">
      <section className="resume-onboarding__card" aria-labelledby="onboarding-title">
        <a href="/">← Back to JoviQ</a>
        <span className="eyebrow">Already paid? Continue here</span>
        <h1 id="onboarding-title">Complete your onboarding</h1>
        <p>Choose your course, preferred start month and study details. You do not need to pay again.</p>
        {auth.isBooting ? (
          <p role="status">Checking your session…</p>
        ) : !user && autoResuming ? (
          <p role="status">Verifying your payment…</p>
        ) : (!user || !emailMatches || !user.roles.includes("Student")) ? (
          <>
            <p>Enter the email used during payment to continue. No password needed.</p>
            <form className="enroll-form" onSubmit={resumeWithEmail}>
              <label className="field"><span>Email used during payment</span>
                <input type="email" autoComplete="email" autoFocus required value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <button className="btn btn--primary" disabled={busy}>{busy ? "Please wait…" : "Continue onboarding"}</button>
            </form>
            <small>Use the same email you used for payment.</small>
          </>
        ) : (
          <>
            <p>Signed in as {user.email}</p>
            {!payments && !error ? <p role="status">Loading your verified payment…</p> : null}
            {payments?.length === 0 ? <p>No verified payment was found for this account. If money was deducted, wait for payment confirmation or contact support. Do not pay again.</p> : null}
            {payments && payments.length > 0 ? <button className="btn btn--primary" key={payments[0].id} onClick={() => openRegistration(payments[0])}>
              Continue onboarding
            </button> : null}
            <button className="btn btn--ghost" onClick={() => setRetry((value) => value + 1)}>Refresh payment status</button>
          </>
        )}
        {error ? <p className="enroll-error" role="alert">{error}</p> : null}
        {user ? <button className="btn btn--ghost" disabled={busy} onClick={useAnotherAccount}>Use another account</button> : null}
      </section>
      {target && plan && user && emailMatches ? <EnrollmentDialog
        key={target.paymentTransactionId}
        plan={plan}
        initialValues={target.applicant}
        initialPostPaymentTarget={target}
        onClose={closeRegistration}
        onRequestResumeGuard={guardCloseRegistration}
      /> : null}
    </main>
  );
}

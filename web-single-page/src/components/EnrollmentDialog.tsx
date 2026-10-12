import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  CreditCard,
  Globe2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  MessageCircle,
  Save,
  ShieldCheck,
  UserPlus,
  WalletCards,
  X
} from "lucide-react";
import { programCategories, uniquePrograms } from "../data/siteContent";
import type { ProgramPlan } from "../data/siteContent";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { publicLmsApi, studentLmsApi, studentOnboardingApi } from "../features/lms/api/lmsApi";
import { checkoutEmailsMatch, resolveCheckoutEmail, savePendingEnrollment, savePostPaymentRegistration } from "../features/lms/checkout";
import type { EnrollmentApplicant } from "../features/lms/checkout";
import { usePaymentFlow } from "../features/lms/usePaymentFlow";
import type { PaymentTarget } from "../features/lms/usePaymentFlow";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { ApiError, formatApiError } from "../lib/api/httpClient";
import { env } from "../config/env";
import { formatInr } from "./format";

const checkoutPolicyVersion = "2026-08-20";

type PaymentChoice = "token" | "full";

type RegistrationStep = "details" | "signin" | "reset" | "payment" | "registration" | "account-choice";

type RegistrationDetails = {
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  categoryName: string;
  programSlug: string;
  startDate: string;
  currentYearOfStudy: string;
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function createRegistrationDetails(fullName = "", phoneNumber = ""): RegistrationDetails {
  const firstCategory = programCategories[0];
  return {
    fullName,
    phoneNumber,
    whatsappNumber: phoneNumber,
    categoryName: firstCategory?.domain ?? "",
    programSlug: firstCategory?.programs[0]?.slug ?? "",
    startDate: "",
    currentYearOfStudy: ""
  };
}

type Props = {
  plan: ProgramPlan;
  /** Fixed when opened from the course section; chosen in the dialog when opened from pricing. */
  programSlug?: string;
  initialValues?: {
    fullName: string;
    phoneNumber: string;
    email: string;
    collegeName: string;
  };
  initialPaymentChoice?: PaymentChoice;
  onPaymentChoiceChange?: (choice: PaymentChoice) => void;
  initialAcceptedTerms?: boolean;
  autoStart?: boolean;
  initialPostPaymentTarget?: PaymentTarget;
  onClose: () => void;
};

export function EnrollmentDialog({ plan, programSlug, initialValues, initialPaymentChoice, onPaymentChoiceChange, initialAcceptedTerms, autoStart = false, initialPostPaymentTarget, onClose }: Props) {
  const auth = useAuth();
  const { user, isBooting } = auth;
  const payment = usePaymentFlow();
  const [step, setStep] = useState<RegistrationStep>(initialPostPaymentTarget ? "registration" : "details");
  // The program picker is intentionally kept out of the dialog; enrollment uses the first catalog program
  // unless the dialog was opened from a specific program card.
  const slug = programSlug ?? uniquePrograms[0]?.slug ?? "";
  const [fullName, setFullName] = useState(initialValues?.fullName ?? user?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialValues?.phoneNumber ?? user?.phoneNumber ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? user?.email ?? "");
  const [collegeName, setCollegeName] = useState(initialValues?.collegeName ?? "");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>(initialPaymentChoice ?? "token");
  useEffect(() => {
    setPaymentChoice(initialPaymentChoice ?? "token");
  }, [initialPaymentChoice]);

  function choosePayment(choice: PaymentChoice) {
    setPaymentChoice(choice);
    onPaymentChoiceChange?.(choice);
  }
  const [acceptedTerms, setAcceptedTerms] = useState(initialAcceptedTerms ?? false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [registration, setRegistration] = useState<RegistrationDetails>(() => createRegistrationDetails(
    initialValues?.fullName ?? user?.fullName ?? "",
    initialValues?.phoneNumber ?? user?.phoneNumber ?? ""
  ));
  const [retryAt, setRetryAt] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const submittingRef = useRef(false);
  const autoStartedRef = useRef(false);
  const targetRef = useRef<PaymentTarget | null>(initialPostPaymentTarget ?? null);
  const programTitle = uniquePrograms.find((program) => program.slug === slug)?.title ?? "your program";
  const enrollmentEmail = resolveCheckoutEmail(email, user?.email);
  // Signed-in students already registered their details; only ask for a phone if the account lacks one.
  const needsPhone = !user?.phoneNumber;
  const paymentStepNumber = user && !needsPhone ? "01" : "02";
  const amount = paymentChoice === "token" ? plan.reserveAmount : plan.offerPrice;
  const isWorking = ["preparing", "confirming"].includes(payment.phase);
  const currentTarget = targetRef.current;
  const today = new Date();
  const minStartDate = formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const maxStartDate = formatDateInput(addMonths(today, 3));
  const selectedCategory = programCategories.find((category) => category.domain === registration.categoryName) ?? programCategories[0];
  const registrationPrograms = selectedCategory?.programs ?? [];
  const selectedRegistrationProgram = registrationPrograms.find((program) => program.slug === registration.programSlug) ?? registrationPrograms[0];
  // The hero form already collected the required checkout details. Keep its
  // automatic payment launch invisible while the account/session is prepared;
  // show the dialog only when the learner needs to resolve an error or sign in.
  const hideAutomaticCheckout = autoStart && !errorMessage &&
    (step === "details" || step === "payment") &&
    !["error", "closed", "pending", "development", "success"].includes(payment.phase);

  function closeDialog() {
    void payment.cancel();
    onClose();
  }

  useDialogAccessibility(true, ".enroll-dialog", () => {
    if (!isWorking) closeDialog();
  });

  useEffect(() => {
    if (!retryAt) return;
    const update = () => setRetrySeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  function handleError(error: unknown) {
    if (error instanceof ApiError && error.status === 429) {
      const seconds = error.retryAfterSeconds ?? 60;
      setRetrySeconds(seconds);
      setRetryAt(Date.now() + seconds * 1000);
      setErrorMessage("Too many attempts. Your details are still here; please wait before continuing.");
      return;
    }
    setErrorMessage(formatApiError(error));
  }

  async function run(task: () => Promise<void>) {
    if (submittingRef.current || Date.now() < retryAt) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await task();
    } catch (error) {
      handleError(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!autoStart || isBooting || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void run(continueToPayment);
  }, [autoStart, isBooting]);

  if (hideAutomaticCheckout) return null;

  function goToPayment(target: PaymentTarget) {
    targetRef.current = target;
    setStep("payment");
    void payment.startPayment(target);
  }

  function openRegistrationDetails() {
    const applicant = currentTarget?.applicant;
    const paymentTransactionId = currentTarget?.paymentTransactionId ?? payment.checkout?.transaction.id;
    if (currentTarget && paymentTransactionId && currentTarget.paymentTransactionId !== paymentTransactionId) {
      targetRef.current = { ...currentTarget, paymentTransactionId };
    }
    setRegistration((current) => ({
      ...current,
      fullName: current.fullName || user?.fullName || applicant?.fullName || fullName,
      phoneNumber: current.phoneNumber || user?.phoneNumber || applicant?.phoneNumber || phoneNumber,
      whatsappNumber: current.whatsappNumber || user?.phoneNumber || applicant?.phoneNumber || phoneNumber
    }));
    setErrorMessage("");
    setStep("registration");
  }

  function handleRegistrationCategoryChange(categoryName: string) {
    const category = programCategories.find((item) => item.domain === categoryName);
    setRegistration((current) => ({
      ...current,
      categoryName,
      programSlug: category?.programs[0]?.slug ?? ""
    }));
  }

  async function submitRegistrationDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const category = programCategories.find((item) => item.domain === registration.categoryName);
      const selectedProgram = category?.programs.find((program) => program.slug === registration.programSlug);
      if (!category || !selectedProgram) throw new Error("Choose a category and program to continue.");
      if (!registration.startDate || registration.startDate < minStartDate || registration.startDate > maxStartDate) {
        throw new Error("Choose a start date within the next 3 months.");
      }
      if (!registration.currentYearOfStudy) throw new Error("Choose your current year of study.");

      const paymentTarget = targetRef.current ?? currentTarget;
      const paymentTransactionId = paymentTarget?.paymentTransactionId ?? payment.checkout?.transaction.id;
      if (!paymentTransactionId) {
        throw new Error("The verified payment reference is missing. Please return to the payment confirmation and try again.");
      }

      const selectedProgramDetails = (await publicLmsApi.getProgram(selectedProgram.slug)).data;
      const selectedPlan = selectedProgramDetails.plans.find((item) =>
        item.isActive && item.name.trim().toLowerCase() === (paymentTarget?.planName ?? plan.name).trim().toLowerCase())
        ?? selectedProgramDetails.plans.find((item) => item.isActive);
      if (!selectedPlan) throw new Error("The selected course has no active enrollment level.");

      await studentLmsApi.completePaidEnrollmentRegistration(paymentTransactionId, {
        programId: selectedProgramDetails.id,
        programPlanId: selectedPlan.id,
        startDate: registration.startDate
      });

      const savedDetails = {
        fullName: registration.fullName.trim(),
        phoneNumber: registration.phoneNumber,
        whatsappNumber: registration.whatsappNumber.trim(),
        categoryName: category.domain,
        programSlug: selectedProgram.slug,
        programTitle: selectedProgram.title,
        enrolledProgramTitle: selectedProgramDetails.title,
        enrolledLevel: selectedPlan.name,
        startDate: registration.startDate,
        currentYearOfStudy: registration.currentYearOfStudy
      };
      savePostPaymentRegistration(savedDetails);
      await studentOnboardingApi.saveRegistration({
        fullName: savedDetails.fullName,
        phoneNumber: savedDetails.phoneNumber,
        whatsappNumber: savedDetails.whatsappNumber,
        categoryName: savedDetails.categoryName,
        programSlug: savedDetails.programSlug,
        programTitle: savedDetails.programTitle,
        startDate: savedDetails.startDate,
        currentYearOfStudy: savedDetails.currentYearOfStudy
      });
      if (paymentTarget) {
        targetRef.current = {
          ...paymentTarget,
          programId: selectedProgramDetails.id,
          programSlug: selectedProgramDetails.slug,
          programTitle: selectedProgramDetails.title,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          paymentTransactionId,
          startDate: registration.startDate
        };
      }
      setStep("account-choice");
    });
  }

  function redirectToMainWebLogin() {
    const mainWebUrl = env.lmsAppUrl || "http://localhost:5173";
    window.location.assign(`${mainWebUrl}/login?returnUrl=${encodeURIComponent("/dashboard")}`);
  }

  function continueWithGoogle() {
    window.location.assign(authApi.oauthStartUrl({ phoneNumber: registration.phoneNumber }));
  }

  /** Mirrors /web's continueToCheckout: authoritative pricing, checkout account, then payment. */
  async function continueToPayment() {
      if (user && !user.roles.includes("Student")) {
        throw new Error("You are signed in as an administrator. Choose Use another account and sign in with a student account to continue checkout.");
      }
      if (!slug) throw new Error("Choose the program you want to join.");
      const applicant: EnrollmentApplicant = user
        ? { fullName: user.fullName, phoneNumber: user.phoneNumber || phoneNumber, email: enrollmentEmail, collegeName: "" }
        : { fullName: fullName.trim(), phoneNumber, email: enrollmentEmail, collegeName: collegeName.trim() };

      // Checkout must use a published database program and its authoritative pricing.
      const availableProgram = (await publicLmsApi.getProgram(slug)).data;
      const availablePlan = availableProgram.plans.find((item) => item.code === plan.code && item.isActive);
      if (!availablePlan) throw new Error("This plan is not available for enrollment. Please choose another plan.");

      const paymentMode = paymentChoice === "token" ? 1 : 2;
      const target: PaymentTarget = {
        programId: availableProgram.id,
        programTitle: availableProgram.title,
        planId: availablePlan.id,
        planName: availablePlan.name,
        paymentMode,
        applicant
      };
      // Kept so a Cashfree bank / UPI redirect can be confirmed when the learner returns.
      savePendingEnrollment({
        slug: availableProgram.slug,
        programId: availableProgram.id,
        planId: availablePlan.id,
        planCode: availablePlan.code,
        programTitle: availableProgram.title,
        paymentMode,
        amount: paymentMode === 1 ? availablePlan.reserveAmount : availablePlan.offerPrice,
        applicant
      });

      if (!user) {
        try {
          const response = await authApi.createCheckoutAccount({
            fullName: applicant.fullName,
            email: applicant.email,
            phoneNumber: applicant.phoneNumber,
            collegeName: applicant.collegeName,
            acceptedTerms,
            termsVersion: checkoutPolicyVersion,
            privacyPolicyVersion: checkoutPolicyVersion
          });
          auth.applyAuthResponse(response.data);
        } catch (error) {
          if (error instanceof ApiError && error.status === 409 &&
            ["email_exists", "phone_exists"].includes(error.problem?.errorCode ?? "")) {
            // Existing learners sign in right here instead of leaving the page.
            targetRef.current = target;
            setNotice("You already have a Joviq account. Sign in to continue your enrollment.");
            setStep("signin");
            return;
          }
          throw error;
        }
      }

      goToPayment(target);
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(continueToPayment);
  }

  async function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const target = targetRef.current;
      if (!target) return setStep("details");
      try {
        const response = await authApi.login({ email: enrollmentEmail, password, rememberMe: true, deviceName: "Joviq Web" });
        auth.applyAuthResponse(response.data);
        if (!checkoutEmailsMatch(target.applicant.email, response.data.user.email)) {
          throw new Error("Your enrollment email does not match your signed-in account. Use your signed-in email.");
        }
        setPassword("");
        goToPayment(target);
      } catch (error) {
        if (error instanceof ApiError && error.problem?.errorCode === "password_not_set") {
          // Accounts created during an earlier checkout set their password through the reset OTP.
          await authApi.forgotPassword(enrollmentEmail);
          setNotice(`Your account was created during an earlier enrollment. Enter the OTP sent to ${enrollmentEmail} and choose a password.`);
          setStep("reset");
          return;
        }
        throw error;
      }
    });
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    await run(async () => {
      if (newPassword !== confirmPassword) throw new Error("New password and confirm password must match.");
      const verification = await authApi.verifyForgotPassword(enrollmentEmail, String(form.get("otp") ?? ""));
      await authApi.resetPassword({ userId: verification.data.userId, resetToken: verification.data.resetToken, newPassword, confirmPassword });
      setPassword(newPassword);
      setNotice("Password saved. Sign in to continue your enrollment.");
      setStep("signin");
    });
  }

  async function useAnotherAccount() {
    await run(async () => {
      await auth.logout();
      setEmail("");
      setFullName("");
      setPhoneNumber("");
      setAcceptedTerms(false);
    });
  }

  const steps: { key: RegistrationStep; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "signin", label: "Account" },
    { key: "payment", label: "Payment" },
    { key: "registration", label: "Profile" }
  ];
  const activeIndex = step === "reset" ? 1 : step === "registration" || step === "account-choice" ? 3 : steps.findIndex((item) => item.key === step);

  return (
    <div
      className="enroll-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isWorking) closeDialog();
      }}
    >
      <section aria-labelledby="enroll-dialog-title" aria-modal="true" className="enroll-dialog" role="dialog">
        <header className="enroll-dialog__header">
          <span className="enroll-dialog__orb" aria-hidden="true" />
          <div className="enroll-dialog__title-icon"><UserPlus size={22} /></div>
          <div className="enroll-dialog__heading">
            <span className="eyebrow eyebrow--light">{initialPostPaymentTarget ? "Registration after payment" : "Registration before payment"}</span>
            <h2 id="enroll-dialog-title">{initialPostPaymentTarget ? "Complete your enrollment" : "Secure your place"}</h2>
            <p>{initialPostPaymentTarget ? "Choose your course and preferred start date to finish your registration." : user ? "Choose how you want to start your learning journey." : "Share these details once, then choose how you want to start your learning journey."}</p>
          </div>
          <div className="enroll-dialog__summary">
            <div><WalletCards size={18} /><span><small>Selected level</small><strong>{plan.name}</strong></span></div>
            <div><BadgeCheck size={18} /><span><small>Full plan value</small><strong>{formatInr(plan.offerPrice)}</strong></span></div>
            <div><CalendarClock size={18} /><span><small>Access period</small><strong>6 months</strong></span></div>
          </div>
          <button aria-label="Close registration dialog" className="enroll-dialog__close" disabled={isWorking} onClick={closeDialog} type="button"><X size={18} /></button>
        </header>

        <ol className="enroll-steps" aria-label="Enrollment progress">
          {steps.map((item, index) => (
            <li key={item.key} className={index < activeIndex ? "is-done" : index === activeIndex ? "is-active" : ""}>
              <span>{index < activeIndex ? <CheckCircle2 size={14} /> : index + 1}</span>{item.label}
            </li>
          ))}
        </ol>

        <div className="enroll-dialog__body" key={step}>
          {step === "details" ? (
            <form className="enroll-form" onSubmit={submitDetails}>
              {user ? (
                <div className="enroll-account">
                  <span>Enrolling as <strong>{user.fullName}</strong> · {user.email}</span>
                  <button disabled={isSubmitting} onClick={() => void useAnotherAccount()} type="button"><LogOut size={15} /> Use another account</button>
                </div>
              ) : null}

              {user && !needsPhone ? null : (
                <fieldset>
                  <legend><span>01</span><strong>{user ? "Add your phone number" : "Your details"}</strong><small>We use these details for your enrollment and payment receipt.</small></legend>
                  <div className="enroll-fields">
                    {user ? null : (
                      <label className="field">
                        <span>Name <b>*</b></span>
                        <input autoComplete="name" onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" required value={fullName} />
                      </label>
                    )}
                    <label className="field">
                      <span>Phone number <b>*</b></span>
                      <div className="phone-field">
                        <i>+91</i>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          pattern="[6-9][0-9]{9}"
                          minLength={10}
                          maxLength={10}
                          placeholder="9876543210"
                          title="Enter a valid 10-digit Indian mobile number."
                          required
                          value={phoneNumber}
                          onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                      </div>
                    </label>
                    {user ? null : (
                      <>
                        <label className="field">
                          <span>Email ID <b>*</b></span>
                          <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
                        </label>
                        <label className="field">
                          <span>College name <b>*</b></span>
                          <input autoComplete="organization" onChange={(event) => setCollegeName(event.target.value)} placeholder="Your college or organization" required value={collegeName} />
                        </label>
                      </>
                    )}
                  </div>
                </fieldset>
              )}

              <fieldset>
                <legend><span>{paymentStepNumber}</span><strong>Choose your payment option</strong><small>Your account and course access are updated only after payment verification.</small></legend>
                <div className="pay-options">
                  <label className={`pay-option${paymentChoice === "token" ? " is-selected" : ""}`}>
                    <input checked={paymentChoice === "token"} name="paymentChoice" onChange={() => choosePayment("token")} type="radio" value="token" />
                    <span className="pay-option__icon"><WalletCards size={19} /></span>
                    <span><strong>Reserve my seat</strong><small>Pay {formatInr(plan.reserveAmount)} for pre-registration now.</small></span>
                    <b>Pre-registration</b>
                  </label>
                  <label className={`pay-option${paymentChoice === "full" ? " is-selected" : ""}`}>
                    <input checked={paymentChoice === "full"} name="paymentChoice" onChange={() => choosePayment("full")} type="radio" value="full" />
                    <span className="pay-option__icon"><BadgeCheck size={19} /></span>
                    <span><strong>Pay in full</strong><small>Pay {formatInr(plan.offerPrice)} now and unlock the complete program for six months.</small></span>
                    <b>Full access</b>
                  </label>
                </div>
              </fieldset>

              <label className="enroll-terms">
                <input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.currentTarget.checked)} required type="checkbox" />
                <span>I agree to the Joviq terms and privacy policy.</span>
              </label>
              {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
              <div className="enroll-note"><ShieldCheck size={17} /><span>Existing learners sign in to continue. New learners receive a checkout account before secure payment opens.</span></div>
              <button className="btn btn--primary btn--block" disabled={isSubmitting || retrySeconds > 0} type="submit">
                {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
                {retrySeconds > 0
                  ? `Try again in ${retrySeconds}s`
                  : isSubmitting
                    ? "Preparing your account…"
                    : `Continue with ${paymentChoice === "token" ? "pre-registration" : "full payment"} · ${formatInr(amount)}`}
              </button>
            </form>
          ) : null}

          {step === "signin" ? (
            <form className="enroll-form" onSubmit={submitSignIn}>
              <div className="enroll-banner"><KeyRound size={20} /><span>{notice}</span></div>
              <label className="field">
                <span>Email ID</span>
                <input value={enrollmentEmail} readOnly />
              </label>
              <label className="field">
                <span>Password <b>*</b></span>
                <input autoComplete="current-password" autoFocus onChange={(event) => setPassword(event.target.value)} placeholder="Your Joviq password" required type="password" value={password} />
              </label>
              {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
              <button className="btn btn--primary btn--block" disabled={isSubmitting || retrySeconds > 0} type="submit">
                {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />}
                {retrySeconds > 0 ? `Try again in ${retrySeconds}s` : isSubmitting ? "Signing in…" : "Sign in and continue to payment"}
              </button>
              <button className="btn btn--ghost btn--block" type="button" onClick={() => { setErrorMessage(""); setStep("details"); }}>
                <ArrowLeft size={17} /> Edit my details
              </button>
            </form>
          ) : null}

          {step === "reset" ? (
            <form className="enroll-form" onSubmit={submitReset}>
              <div className="enroll-banner"><KeyRound size={20} /><span>{notice}</span></div>
              <label className="field">
                <span>OTP <b>*</b></span>
                <input autoComplete="one-time-code" inputMode="numeric" name="otp" placeholder="6-digit code" required />
              </label>
              <div className="enroll-fields">
                <label className="field">
                  <span>New password <b>*</b></span>
                  <input autoComplete="new-password" name="newPassword" required type="password" />
                </label>
                <label className="field">
                  <span>Confirm password <b>*</b></span>
                  <input autoComplete="new-password" name="confirmPassword" required type="password" />
                </label>
              </div>
              {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
              <button className="btn btn--primary btn--block" disabled={isSubmitting || retrySeconds > 0} type="submit">
                {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <CheckCircle2 size={18} />}
                {isSubmitting ? "Saving…" : "Save password"}
              </button>
            </form>
          ) : null}

          {step === "payment" ? (
            <PaymentPanel
              payment={payment}
              target={currentTarget}
              onBack={() => { void payment.cancel(); payment.reset(); setStep("details"); }}
              onRetry={() => targetRef.current && void payment.startPayment(targetRef.current)}
              onContinueRegistration={openRegistrationDetails}
              onClose={closeDialog}
            />
          ) : null}

          {step === "registration" ? (
            <form className="enroll-form post-payment-registration" onSubmit={submitRegistrationDetails}>
              <div className="post-payment-registration__intro">
                <span className="post-payment-registration__icon"><GraduationCap size={21} /></span>
                <div>
                  <span className="eyebrow">Complete registration</span>
                  <h3>Tell us how to prepare your learning journey</h3>
                  <p>Your payment is confirmed. Add the remaining details so our team can activate the right program experience for you.</p>
                </div>
              </div>

              <fieldset>
                <legend><span>01</span><strong>Confirm your contact details</strong><small>Your name and phone are already filled from checkout.</small></legend>
                <div className="enroll-fields">
                  <label className="field">
                    <span>Full name <b>*</b></span>
                    <input autoComplete="name" onChange={(event) => setRegistration((current) => ({ ...current, fullName: event.target.value }))} required value={registration.fullName} />
                  </label>
                  <label className="field">
                    <span>Phone number <b>*</b></span>
                    <div className="phone-field">
                      <i>+91</i>
                      <input autoComplete="tel-national" inputMode="numeric" maxLength={10} minLength={10} onChange={(event) => setRegistration((current) => ({ ...current, phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 10) }))} pattern="[6-9][0-9]{9}" required value={registration.phoneNumber} />
                    </div>
                  </label>
                  <label className="field">
                    <span>WhatsApp number <b>*</b></span>
                    <div className="phone-field">
                      <i>+91</i>
                      <input autoComplete="tel" inputMode="numeric" maxLength={10} minLength={10} onChange={(event) => setRegistration((current) => ({ ...current, whatsappNumber: event.target.value.replace(/\D/g, "").slice(0, 10) }))} pattern="[6-9][0-9]{9}" required value={registration.whatsappNumber} />
                    </div>
                  </label>
                  <label className="field">
                    <span>Current year of study <b>*</b></span>
                    <select onChange={(event) => setRegistration((current) => ({ ...current, currentYearOfStudy: event.target.value }))} required value={registration.currentYearOfStudy}>
                      <option value="">Select your year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Graduated">Graduated</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend><span>02</span><strong>Choose your learning path</strong><small>Pick a category, program, and a start date within the next 3 months.</small></legend>
                <div className="enroll-fields">
                  <label className="field">
                    <span>Category <b>*</b></span>
                    <select onChange={(event) => handleRegistrationCategoryChange(event.target.value)} required value={registration.categoryName}>
                      <option value="">Select a category</option>
                      {programCategories.map((category) => <option key={category.domain} value={category.domain}>{category.domain}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Program <b>*</b></span>
                    <select onChange={(event) => setRegistration((current) => ({ ...current, programSlug: event.target.value }))} required value={registration.programSlug}>
                      <option value="">Select a program</option>
                      {registrationPrograms.map((program) => <option key={program.slug} value={program.slug}>{program.title}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Preferred start date <b>*</b></span>
                    <span className="input-with-icon"><CalendarDays size={15} /><input max={maxStartDate} min={minStartDate} onChange={(event) => setRegistration((current) => ({ ...current, startDate: event.target.value }))} required type="date" value={registration.startDate} /></span>
                    <small className="field__hint">Available from {minStartDate} through {maxStartDate}.</small>
                  </label>
                </div>
              </fieldset>

              {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
              <div className="enroll-note"><Save size={17} /><span>{initialPostPaymentTarget ? "Your payment is verified. Submit your course and start date to finish enrollment." : "Your details will be saved before you choose how to access the main Joviq web app."}</span></div>
              <button className="btn btn--primary btn--block" disabled={isSubmitting} type="submit">
                {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
                {isSubmitting ? "Saving details…" : "Save details and continue"}
              </button>
            </form>
          ) : null}

          {step === "account-choice" ? (
            <div className="pay-panel account-choice-panel">
              <div className="pay-panel__icon account-choice-panel__icon"><CheckCircle2 size={34} /></div>
              <span className="eyebrow">Registration saved</span>
              <h3>Course registration complete</h3>
              <p>Your course and preferred start date are saved. Continue to the main Joviq website to access your student dashboard.</p>
              <div className="account-choice-panel__summary">
                <span><GraduationCap size={16} /><strong>{selectedRegistrationProgram?.title ?? "Selected program"}</strong></span>
                <span><CalendarDays size={16} /><strong>{registration.startDate}</strong></span>
              </div>
              <div className="pay-panel__actions account-choice-panel__actions">
                <button className="btn btn--primary" onClick={redirectToMainWebLogin} type="button"><LogIn size={18} /> Continue to website</button>
                <button className="btn btn--ghost account-choice-panel__google" onClick={continueWithGoogle} type="button"><Globe2 size={18} /> Continue with Google</button>
              </div>
              <div className="enroll-note"><MessageCircle size={17} /><span>After sign-in, your saved enrollment details will be ready in the main Joviq web app.</span></div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type PaymentFlow = ReturnType<typeof usePaymentFlow>;

export function PaymentPanel({ payment, target, onBack, onRetry, onContinueRegistration, onClose }: {
  payment: PaymentFlow;
  target?: PaymentTarget | null;
  onBack?: () => void;
  onRetry?: () => void;
  onContinueRegistration?: () => void;
  onClose: () => void;
}) {
  const { phase, message } = payment;
  const amountPaid = payment.checkout?.transaction.amount ?? target?.amountPaid;
  const title = {
    idle: "Preparing your secure checkout",
    preparing: "Opening secure checkout",
    confirming: "Confirming your payment",
    pending: "Payment is being processed",
    closed: "Checkout closed",
    development: "Test checkout is ready",
    success: "Enrollment successful!",
    error: "We could not complete checkout"
  }[phase];
  const text = phase === "success"
    ? "Your payment was successful and your enrollment is confirmed. Review your details, then continue registration."
    : phase === "confirming"
      ? "Checking with your bank. Please keep this window open — this usually takes a few seconds."
      : message || "Your payment dialog will open here. Please keep this window open.";

  return (
    <div className={`pay-panel pay-panel--${phase}`} aria-live="polite">
      <div className="pay-panel__icon">
        {phase === "success" ? <CheckCircle2 size={34} /> : phase === "error" ? <CreditCard size={30} /> : <LockKeyhole size={30} />}
        {["idle", "preparing", "confirming"].includes(phase) ? <span className="pay-panel__ring" aria-hidden="true" /> : null}
      </div>
      {phase === "success" ? <Confetti /> : null}
      <span className="eyebrow">Secure enrollment</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {phase === "success" ? (
        <div className="payment-success-details" aria-label="Enrollment details">
          <div><small>Full name</small><strong>{target?.applicant.fullName ?? "Your Joviq account"}</strong></div>
          <div><small>Email</small><strong>{target?.applicant.email ?? payment.checkout?.transaction.studentEmail ?? "Saved at checkout"}</strong></div>
          <div><small>Phone number</small><strong>{target?.applicant.phoneNumber ?? "Saved at checkout"}</strong></div>
          <div><small>Enrolled level</small><strong>{target?.planName ?? "Selected plan"}</strong></div>
          <div><small>Amount paid</small><strong>{amountPaid === undefined ? "Confirmed" : formatInr(amountPaid)}</strong></div>
        </div>
      ) : null}
      <div className="pay-panel__actions">
        {phase === "development" ? (
          <button className="btn btn--primary" type="button" onClick={payment.completeTestPayment}><CreditCard size={18} /> Complete test payment</button>
        ) : null}
        {phase === "pending" || phase === "closed" ? (
          <button className="btn btn--primary" type="button" onClick={() => void payment.checkStatus()}>Check payment status</button>
        ) : null}
        {(phase === "error" || phase === "closed") && onRetry ? (
          <button className="btn btn--ghost" type="button" onClick={onRetry}>Try again</button>
        ) : null}
        {phase === "success" ? (
          <button className="btn btn--primary" type="button" onClick={onContinueRegistration ?? onClose}>Continue registration <ArrowRight size={17} /></button>
        ) : null}
        {phase === "error" && onBack ? (
          <button className="btn btn--link" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to details</button>
        ) : null}
      </div>
      <div className="enroll-note"><ShieldCheck size={17} /><span>No course access is granted until the gateway payment is verified.</span></div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}
    </div>
  );
}

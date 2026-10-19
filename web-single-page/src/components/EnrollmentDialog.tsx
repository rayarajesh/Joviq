import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  CreditCard,
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
  collegeName: string;
  executiveName: string;
  fullName: string;
  email: string;
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

function getStartMonthOptions(today: Date) {
  // Offer the next three months only, excluding the current month. Each option is the
  // first day of that month, which stays inside the API's "within the next three months" window.
  const firstNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  return Array.from({ length: 3 }, (_, index) => {
    const monthDate = new Date(firstNextMonth.getFullYear(), firstNextMonth.getMonth() + index, 1);

    return {
      value: formatDateInput(monthDate),
      label: monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    };
  });
}

function createRegistrationDetails(fullName = "", phoneNumber = ""): RegistrationDetails {
  return {
    collegeName: "",
    executiveName: "",
    fullName,
    email: "",
    phoneNumber,
    whatsappNumber: phoneNumber,
    categoryName: "",
    programSlug: "",
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
  onAutoStartError?: (message: string) => void;
  initialPostPaymentTarget?: PaymentTarget;
  onClose: () => void;
};

export function EnrollmentDialog({ plan, programSlug, initialValues, initialPaymentChoice, onPaymentChoiceChange, initialAcceptedTerms, autoStart = false, onAutoStartError, initialPostPaymentTarget, onClose }: Props) {
  const auth = useAuth();
  const { user, isBooting } = auth;
  const payment = usePaymentFlow();
  const [step, setStep] = useState<RegistrationStep>(initialPostPaymentTarget ? "registration" : "details");
  const [selectedSlug, setSelectedSlug] = useState(programSlug ?? "");
  const slug = programSlug ?? selectedSlug;
  const [fullName, setFullName] = useState(initialValues?.fullName ?? user?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialValues?.phoneNumber ?? user?.phoneNumber ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? user?.email ?? "");
  const [collegeName, setCollegeName] = useState(initialValues?.collegeName ?? "");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>(initialPaymentChoice ?? "token");
  useEffect(() => {
    setPaymentChoice(initialPaymentChoice ?? "token");
  }, [initialPaymentChoice]);

  useEffect(() => {
    setSelectedSlug(programSlug ?? "");
  }, [programSlug]);

  function choosePayment(choice: PaymentChoice) {
    setPaymentChoice(choice);
    onPaymentChoiceChange?.(choice);
  }
  const [acceptedTerms, setAcceptedTerms] = useState(initialAcceptedTerms ?? false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [passwordAuthView, setPasswordAuthView] = useState<"create" | "login">("create");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginConfirm, setLoginConfirm] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registration, setRegistration] = useState<RegistrationDetails>(() => ({
    ...createRegistrationDetails(initialValues?.fullName ?? user?.fullName ?? "", initialValues?.phoneNumber ?? user?.phoneNumber ?? ""),
    email: initialValues?.email ?? user?.email ?? "",
    collegeName: initialValues?.collegeName ?? ""
  }));
  const [retryAt, setRetryAt] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const submittingRef = useRef(false);
  const autoStartedRef = useRef(false);
  const targetRef = useRef<PaymentTarget | null>(initialPostPaymentTarget ?? null);
  const programTitle = uniquePrograms.find((program) => program.slug === slug)?.title ?? "your selected course";
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
  const startMonthOptions = getStartMonthOptions(today);
  const selectedCategory = programCategories.find((category) => category.domain === registration.categoryName);
  const registrationPrograms = selectedCategory?.programs ?? [];
  const selectedRegistrationProgram = registrationPrograms.find((program) => program.slug === registration.programSlug);
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

  // Disable the main dialog's focus trap while the password-auth modal is open, otherwise it
  // steals focus back and the modal's inputs cannot be typed into. The modal gets its own trap.
  useDialogAccessibility(!showPasswordAuth, ".enroll-dialog", () => {
    if (!isWorking) closeDialog();
  });
  useDialogAccessibility(showPasswordAuth, ".password-auth-dialog", () => {
    if (!isSubmitting) closePasswordAuth();
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
      const message = "Too many attempts. Your details are still here; please wait before continuing.";
      if (autoStart && onAutoStartError) {
        onAutoStartError(message);
        return;
      }
      setErrorMessage(message);
      return;
    }
    const message = formatApiError(error);
    if (autoStart && onAutoStartError) {
      onAutoStartError(message);
      return;
    }
    setErrorMessage(message);
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
    if (!autoStart || isBooting || autoStartedRef.current || !slug) return;
    autoStartedRef.current = true;
    void run(continueToPayment);
  }, [autoStart, isBooting, slug]);

  useEffect(() => {
    if (!initialPostPaymentTarget || !user) return;
    let active = true;
    studentOnboardingApi.get().then(({ data }) => {
      if (active) setRegistration((current) => ({ ...current,
        collegeName: current.collegeName || data.academic?.college || ""
      }));
    }).catch(() => { /* The student can enter missing details manually. */ });
    return () => { active = false; };
  }, [initialPostPaymentTarget, user?.id]);

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
      email: current.email || applicant?.email || enrollmentEmail,
      phoneNumber: current.phoneNumber || user?.phoneNumber || applicant?.phoneNumber || phoneNumber,
      whatsappNumber: current.whatsappNumber || user?.phoneNumber || applicant?.phoneNumber || phoneNumber,
      collegeName: current.collegeName || applicant?.collegeName || collegeName
    }));
    setErrorMessage("");
    setStep("registration");
  }

  function handleRegistrationCategoryChange(categoryName: string) {
    setRegistration((current) => ({
      ...current,
      categoryName,
      programSlug: ""
    }));
  }

  async function submitRegistrationDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (!registration.email.trim() || !registration.collegeName.trim()) {
        throw new Error("Enter your email and college name.");
      }
      const category = programCategories.find((item) => item.domain === registration.categoryName);
      const selectedProgram = category?.programs.find((program) => program.slug === registration.programSlug);
      if (!category || !selectedProgram) throw new Error("Choose a category and program to continue.");
      if (!registration.startDate || !startMonthOptions.some((option) => option.value === registration.startDate) || registration.startDate < minStartDate || registration.startDate > maxStartDate) {
        throw new Error("Choose one of the available start months.");
      }
      if (!registration.currentYearOfStudy) throw new Error("Choose your current year of study.");
      if (!registration.executiveName.trim()) throw new Error("Enter the executive name.");

      const paymentTarget = targetRef.current ?? currentTarget;
      const paymentTransactionId = paymentTarget?.paymentTransactionId ?? payment.checkout?.transaction.id;
      if (!paymentTransactionId) {
        throw new Error("The verified payment reference is missing. Please return to the payment confirmation and try again.");
      }

      const selectedProgramDetails = (await publicLmsApi.getProgram(selectedProgram.slug)).data;
      const selectedPlan = selectedProgramDetails.plans.find((item) =>
        item.isActive && item.name.trim().toLowerCase() === (paymentTarget?.planName ?? plan.name).trim().toLowerCase())
        ?? selectedProgramDetails.plans.find((item) => item.isActive);
      if (!selectedPlan) throw new Error("The selected course has no active onboarding level.");

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
      await studentOnboardingApi.saveRegistration({
        collegeName: registration.collegeName.trim(),
        executiveName: registration.executiveName.trim(),
        fullName: savedDetails.fullName,
        phoneNumber: savedDetails.phoneNumber,
        whatsappNumber: savedDetails.whatsappNumber,
        categoryName: savedDetails.categoryName,
        programSlug: savedDetails.programSlug,
        programTitle: savedDetails.programTitle,
        startDate: savedDetails.startDate,
        currentYearOfStudy: savedDetails.currentYearOfStudy
      });
      savePostPaymentRegistration(savedDetails);
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

  function openPasswordLogin() {
    setLoginEmail(enrollmentEmail || registration.email || user?.email || "");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setShowPassword(false);
    setOtpSent(false);
    setErrorMessage("");
    setNotice("");
    setLoginConfirm(false);
    setPasswordAuthView("create");
    setShowPasswordAuth(true);
  }

  function closePasswordAuth() {
    setShowPasswordAuth(false);
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setOtpSent(false);
    setErrorMessage("");
    setNotice("");
    setLoginConfirm(false);
  }

  function switchPasswordAuthView(view: "create" | "login") {
    setPasswordAuthView(view);
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setOtpSent(false);
    setErrorMessage("");
    setNotice("");
  }

  // Create-password popup: email OTP proves ownership before a new password is set.
  function sendPasswordOtp() {
    void run(async () => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) throw new Error("Enter the email used during payment.");
      await authApi.forgotPassword(loginEmail.trim());
      setOtpSent(true);
      setNotice(`Enter the 6-digit code sent to ${loginEmail.trim()} and create your password.`);
    });
  }

  async function submitCreatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (password !== confirmPassword) throw new Error("Password and confirm password must match.");
      const verification = await authApi.verifyForgotPassword(loginEmail.trim(), otp.trim());
      await authApi.resetPassword({ userId: verification.data.userId, resetToken: verification.data.resetToken, newPassword: password, confirmPassword });
      const response = await authApi.login({ email: loginEmail.trim(), password, rememberMe: true, deviceName: "Joviq Web" });
      auth.applyAuthResponse(response.data);
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setLoginConfirm(true);
    });
  }

  async function submitPasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const response = await authApi.login({ email: loginEmail.trim(), password, rememberMe: true, deviceName: "Joviq Web" });
      auth.applyAuthResponse(response.data);
      setPassword("");
      // Signed in; show the final confirmation before opening the dashboard.
      setLoginConfirm(true);
    });
  }

  function redirectToDashboard() {
    const mainWebUrl = env.lmsAppUrl || "http://localhost:5173";
    // The student is already signed in; the main app restores the session from the shared
    // refresh cookie on load and opens the dashboard directly.
    window.location.assign(`${mainWebUrl}/dashboard`);
  }


  /** Mirrors /web's continueToCheckout: authoritative pricing, checkout account, then payment. */
  async function continueToPayment() {
      if (user && !user.roles.includes("Student")) {
        throw new Error("You are signed in as an administrator. Choose Use another account and sign in with a student account to continue checkout.");
      }
      if (!slug) throw new Error("Choose the course you want to join.");
      const applicant: EnrollmentApplicant = user
        ? { fullName: user.fullName, phoneNumber: user.phoneNumber || phoneNumber, email: enrollmentEmail, collegeName: "" }
        : { fullName: fullName.trim(), phoneNumber, email: enrollmentEmail, collegeName: collegeName.trim() };

      // Checkout must use a published database program and its authoritative pricing.
      const availableProgram = (await publicLmsApi.getProgram(slug)).data;
      const availablePlan = availableProgram.plans.find((item) => item.code === plan.code && item.isActive);
      if (!availablePlan) throw new Error("This plan is not available for onboarding. Please choose another plan.");

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
            setNotice("You already have a Joviq account. Sign in to continue your onboarding.");
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
          throw new Error("Your onboarding email does not match your signed-in account. Use your signed-in email.");
        }
        setPassword("");
        goToPayment(target);
      } catch (error) {
        if (error instanceof ApiError && error.problem?.errorCode === "password_not_set") {
          // Accounts created during an earlier checkout set their password through the reset OTP.
          await authApi.forgotPassword(enrollmentEmail);
          setNotice(`Your account was created during an earlier onboarding. Enter the OTP sent to ${enrollmentEmail} and choose a password.`);
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
      setNotice("Password saved. Sign in to continue your onboarding.");
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
    <>
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
            <span className="eyebrow eyebrow--light">{initialPostPaymentTarget ? "Onboarding after payment" : "Onboarding before payment"}</span>
            <h2 id="enroll-dialog-title">{initialPostPaymentTarget ? "Complete your onboarding" : "Secure your place"}</h2>
            <p>{initialPostPaymentTarget ? "Choose your course and preferred start date to finish your onboarding." : user ? "Choose how you want to start your learning journey." : "Share these details once, then choose how you want to start your learning journey."}</p>
          </div>
          <div className="enroll-dialog__summary">
            <div><WalletCards size={18} /><span><small>Selected level</small><strong>{plan.name}</strong></span></div>
            <div><BadgeCheck size={18} /><span><small>Full plan value</small><strong>{formatInr(plan.offerPrice)}</strong></span></div>
            <div><CalendarClock size={18} /><span><small>Access period</small><strong>6 months</strong></span></div>
          </div>
          <button aria-label="Close registration dialog" className="enroll-dialog__close" disabled={isWorking} onClick={closeDialog} type="button"><X size={18} /></button>
        </header>

        <ol className="enroll-steps" aria-label="Onboarding progress">
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

              {!programSlug ? (
                <fieldset>
                  <legend><span>01</span><strong>Choose your course</strong><small>This course will be used for your enrollment and confirmation email.</small></legend>
                  <label className="field">
                    <span>Course <b>*</b></span>
                    <select onChange={(event) => setSelectedSlug(event.target.value)} required value={selectedSlug}>
                      <option value="">Select a course</option>
                      {uniquePrograms.map((program) => <option key={program.slug} value={program.slug}>{program.title}</option>)}
                    </select>
                  </label>
                </fieldset>
              ) : null}

              {user && !needsPhone ? null : (
                <fieldset>
                  <legend><span>01</span><strong>{user ? "Add your phone number" : "Your details"}</strong><small>We use these details for your onboarding and payment receipt.</small></legend>
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
                <legend><span>01</span><strong>Confirm your contact details</strong><small>Your details are filled from checkout and can be edited.</small></legend>
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
                  <label className="field">
                    <span>Email <b>*</b></span>
                    <input autoComplete="email" readOnly required type="email" value={user?.email || registration.email} />
                  </label>
                  <label className="field">
                    <span>College name <b>*</b></span>
                    <input required maxLength={200} value={registration.collegeName} onChange={(event) => setRegistration((current) => ({ ...current, collegeName: event.target.value }))} />
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
                    <span>Preferred start month <b>*</b></span>
                    <select onChange={(event) => setRegistration((current) => ({ ...current, startDate: event.target.value }))} required value={registration.startDate}>
                      <option value="">Select a month</option>
                      {startMonthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <small className="field__hint">Choose one of the next 3 available months.</small>
                  </label>
                  <label className="field">
                    <span>Executive Name <b>*</b></span>
                    <input autoComplete="off" maxLength={160} required placeholder="Executive who assisted you" value={registration.executiveName} onChange={(event) => setRegistration((current) => ({ ...current, executiveName: event.target.value }))} />
                    <small className="field__hint">The executive who assisted you.</small>
                  </label>
                </div>
              </fieldset>

              {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
              <div className="enroll-note"><Save size={17} /><span>{initialPostPaymentTarget ? "Your payment is verified. Submit your course and start date to finish onboarding." : "Your details will be saved before you choose how to access the main Joviq web app."}</span></div>
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
              <h3>Your onboarding was successful</h3>
              <p>Your onboarding details are saved. Continue with your payment email to set up your login.</p>
              <div className="account-choice-panel__summary">
                <span><GraduationCap size={16} /><strong>{selectedRegistrationProgram?.title ?? "Selected program"}</strong></span>
                <span><CalendarDays size={16} /><strong>{registration.startDate ? new Date(`${registration.startDate}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : ""}</strong></span>
              </div>
              {confirmingEmail ? (
                <div className="account-choice-panel__confirm" role="alertdialog" aria-label="Confirm your email">
                  <p>Continue to your dashboard as <strong>{enrollmentEmail || registration.email || user?.email}</strong>?</p>
                  <div className="pay-panel__actions account-choice-panel__actions">
                    <button className="btn btn--primary" onClick={redirectToDashboard} type="button"><CheckCircle2 size={18} /> Confirm</button>
                    <button className="btn btn--ghost" onClick={() => setConfirmingEmail(false)} type="button"><X size={18} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="pay-panel__actions account-choice-panel__actions">
                  <button className="btn btn--primary" onClick={() => setConfirmingEmail(true)} type="button"><LogIn size={18} /> Continue with Google</button>
                  <button className="btn btn--ghost" onClick={openPasswordLogin} type="button"><LockKeyhole size={18} /> Login with email and password</button>
                </div>
              )}
              <div className="enroll-note"><MessageCircle size={17} /><span>After sign-in, your saved onboarding details will be ready in the main Joviq web app.</span></div>
            </div>
          ) : null}
        </div>
      </section>
    </div>

    {showPasswordAuth ? (
      <div className="enroll-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget && !isSubmitting) closePasswordAuth(); }}>
        <section aria-modal="true" className="enroll-dialog enroll-dialog--compact password-auth-dialog" role="dialog" aria-label={passwordAuthView === "create" ? "Create your password" : "Login with email and password"}>
          <header className="enroll-dialog__header">
            <span className="enroll-dialog__orb" aria-hidden="true" />
            <div className="enroll-dialog__title-icon">{passwordAuthView === "create" ? <KeyRound size={22} /> : <LockKeyhole size={22} />}</div>
            <div className="enroll-dialog__heading">
              <span className="eyebrow eyebrow--light">{passwordAuthView === "create" ? "Set up your login" : "Sign in"}</span>
              <h2>{passwordAuthView === "create" ? "Create your password" : "Login with email and password"}</h2>
              <p>{passwordAuthView === "create" ? "Verify your email with a code, then create a password for your dashboard login." : "Enter your email and password to open your dashboard."}</p>
            </div>
            <button aria-label="Close" className="enroll-dialog__close" disabled={isSubmitting} onClick={closePasswordAuth} type="button"><X size={18} /></button>
          </header>

          <div className="enroll-dialog__body">
            {loginConfirm ? (
              <div className="pay-panel account-choice-panel">
                <div className="pay-panel__icon account-choice-panel__icon"><CheckCircle2 size={34} /></div>
                <h3>You're signed in</h3>
                <p>Signed in as <strong>{loginEmail}</strong>. Continue to your dashboard?</p>
                <div className="pay-panel__actions account-choice-panel__actions">
                  <button className="btn btn--primary" onClick={redirectToDashboard} type="button"><LogIn size={18} /> Continue to dashboard</button>
                  <button className="btn btn--ghost" onClick={closePasswordAuth} type="button"><X size={18} /> Cancel</button>
                </div>
              </div>
            ) : passwordAuthView === "create" ? (
              <form className="enroll-form" onSubmit={submitCreatePassword}>
                <label className="field"><span>Email <b>*</b></span>
                  <input type="email" autoComplete="email" required readOnly={otpSent} value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                </label>
                {!otpSent ? (
                  <>
                    {notice ? <p role="status" className="enroll-banner"><KeyRound size={18} /><span>{notice}</span></p> : null}
                    {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
                    <button className="btn btn--primary btn--block" disabled={isSubmitting} type="button" onClick={sendPasswordOtp}>
                      {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />} Send code
                    </button>
                    <button className="btn btn--ghost btn--block" type="button" onClick={() => switchPasswordAuthView("login")}><ArrowLeft size={17} /> Back to login with email and password</button>
                  </>
                ) : (
                  <>
                    {notice ? <div className="enroll-banner"><KeyRound size={18} /><span>{notice}</span></div> : null}
                    <label className="field"><span>Email OTP <b>*</b></span>
                      <input autoComplete="one-time-code" inputMode="numeric" required value={otp} onChange={(event) => setOtp(event.target.value)} />
                    </label>
                    <label className="field"><span>Create password <b>*</b></span>
                      <div className="password-field">
                        <input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
                        <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                    </label>
                    <label className="field"><span>Confirm password <b>*</b></span>
                      <div className="password-field">
                        <input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                        <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                    </label>
                    <small>Use at least 8 characters, including uppercase, lowercase, a number and a symbol.</small>
                    {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
                    <button className="btn btn--primary btn--block" disabled={isSubmitting || retrySeconds > 0} type="submit">
                      {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <CheckCircle2 size={18} />}
                      {retrySeconds > 0 ? `Try again in ${retrySeconds}s` : isSubmitting ? "Saving…" : "Confirm"}
                    </button>
                    <button className="btn btn--ghost btn--block" type="button" disabled={isSubmitting} onClick={sendPasswordOtp}>Resend code</button>
                    <button className="btn btn--ghost btn--block" type="button" onClick={() => switchPasswordAuthView("login")}><ArrowLeft size={17} /> Back to login with email and password</button>
                  </>
                )}
              </form>
            ) : (
              <form className="enroll-form" onSubmit={submitPasswordLogin}>
                <label className="field"><span>Email <b>*</b></span>
                  <input type="email" autoComplete="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                </label>
                <label className="field"><span>Password <b>*</b></span>
                  <div className="password-field">
                    <input type={showPassword ? "text" : "password"} autoComplete="current-password" autoFocus required value={password} onChange={(event) => setPassword(event.target.value)} />
                    <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </label>
                {errorMessage ? <p className="enroll-error" role="alert">{errorMessage}</p> : null}
                <button className="btn btn--primary btn--block" disabled={isSubmitting || retrySeconds > 0} type="submit">
                  {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />}
                  {retrySeconds > 0 ? `Try again in ${retrySeconds}s` : isSubmitting ? "Signing in…" : "Confirm"}
                </button>
                <button className="btn btn--ghost btn--block" type="button" onClick={() => switchPasswordAuthView("create")}><KeyRound size={17} /> Create a password instead</button>
              </form>
            )}
          </div>
        </section>
      </div>
    ) : null}
    </>
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
  const amountPaid = payment.verifiedTransaction?.amount ?? payment.checkout?.transaction.amount ?? target?.amountPaid;
  const title = {
    idle: "Preparing your secure checkout",
    preparing: "Opening secure checkout",
    confirming: "Confirming your payment",
    pending: "Payment is being processed",
    closed: "Checkout closed",
    development: "Test checkout is ready",
    success: "Payment Successful!",
    error: "We could not complete checkout"
  }[phase];
  const text = phase === "success"
    ? "Thanks for choosing Joviq Technologies. Your payment is confirmed. Review your details, then continue onboarding."
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
      <span className="eyebrow">Secure onboarding</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {phase === "success" ? (
        <div className="payment-success-details" aria-label="Onboarding details">
          <div><small>Full name</small><strong>{target?.applicant.fullName ?? "Your Joviq account"}</strong></div>
          <div><small>Email</small><strong>{target?.applicant.email ?? payment.checkout?.transaction.studentEmail ?? "Saved at checkout"}</strong></div>
          <div><small>Phone number</small><strong>{target?.applicant.phoneNumber ?? "Saved at checkout"}</strong></div>
          <div><small>College name</small><strong>{target?.applicant.collegeName || "Add during onboarding"}</strong></div>
          <div><small>Payment ID</small><strong>{payment.verifiedTransaction?.gatewayPaymentId || payment.verifiedTransaction?.id || payment.checkout?.transaction.gatewayPaymentId || payment.checkout?.transaction.id || target?.paymentTransactionId || "Confirmed by gateway"}</strong></div>
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
          <button className="btn btn--primary" type="button" onClick={onContinueRegistration ?? onClose}>Continue onboarding <ArrowRight size={17} /></button>
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

import { useCallback, useEffect, useState } from "react";
import { defaultProgramPlans } from "./data/siteContent";
import type { ProgramPlan } from "./data/siteContent";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { useReveal } from "./hooks/useReveal";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import type { HeroCheckoutDetails } from "./components/Hero";
import { CourseSection, ProgramExplorer } from "./components/Programs";
import { CertificateSection, Contact, Faq, FinalCta, Footer, PartnersMarquee, Pricing, Reviews, WhyJoviq } from "./components/Sections";
import { EnrollmentDialog } from "./components/EnrollmentDialog";
import { PaymentReturn } from "./components/PaymentReturn";
import { BackToTop } from "./components/BackToTop";
import { OnboardingPage } from "./components/OnboardingPage";
import { CampusSection } from "./components/Campus";
import type { CampusInterest } from "./components/Campus";
import { checkoutLink, readCheckoutLink } from "./lib/checkoutLinks";
import type { PaymentChoice } from "./lib/checkoutLinks";
import type { PaymentTarget } from "./features/lms/usePaymentFlow";

type Enrollment = {
  plan: ProgramPlan;
  programSlug?: string;
  prefill?: HeroCheckoutDetails;
  autoStart?: boolean;
  paymentChoice?: PaymentChoice;
};

/** Cashfree sends learners back with ?cashfree=return&order_id=… after bank / UPI-app redirects. */
function readReturnedOrderId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cashfree") === "return" ? params.get("order_id") : null;
}

function readReturnedTransactionId() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("cashfree") !== "return") return null;

  const value = params.get("joviq_payment_transaction_id") ?? params.get("transaction_id");
  return value && /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(value)
    ? value
    : null;
}

export function App() {
  return (
    <AuthProvider>
      {window.location.pathname.replace(/\/+$/, "") === "/onboarding" ? <OnboardingPage /> : <SinglePage />}
    </AuthProvider>
  );
}

function SinglePage() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [returnedOrderId, setReturnedOrderId] = useState(readReturnedOrderId);
  const [returnedTransactionId, setReturnedTransactionId] = useState(readReturnedTransactionId);
  const [postPaymentTarget, setPostPaymentTarget] = useState<PaymentTarget | null>(null);
  const [heroCheckoutError, setHeroCheckoutError] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(() => readCheckoutLink(window.location.search, defaultProgramPlans));
  const [contactInterest, setContactInterest] = useState<CampusInterest | "program">("program");
  useReveal();

  useEffect(() => {
    function restoreLocation() {
      setEnrollment(readCheckoutLink(window.location.search, defaultProgramPlans));
      setReturnedOrderId(readReturnedOrderId());
      setReturnedTransactionId(readReturnedTransactionId());
    }
    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, []);

  function openEnrollment(plan: ProgramPlan, paymentChoice: PaymentChoice, programSlug?: string) {
    window.history.pushState(null, "", checkoutLink(plan.code, paymentChoice, programSlug));
    setEnrollment({ plan, programSlug, paymentChoice });
  }

  function closeEnrollment() {
    const url = new URL(window.location.href);
    for (const param of ["plan", "payment", "program"]) url.searchParams.delete(param);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setEnrollment(null);
  }

  function updatePaymentChoice(choice: PaymentChoice) {
    if (!enrollment || enrollment.autoStart) return;
    window.history.replaceState(null, "", checkoutLink(enrollment.plan.code, choice, enrollment.programSlug));
  }

  function openContact(interest: CampusInterest) {
    setContactInterest(interest);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const openCourse = useCallback((slug: string) => {
    setSelectedSlug(slug);
    // Wait for the course section to render before scrolling to it.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById("course")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }, []);

  function closeCourse() {
    setSelectedSlug(null);
    requestAnimationFrame(() => document.getElementById("programs")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openHeroCheckout(details: HeroCheckoutDetails) {
    setHeroCheckoutError("");
    setEnrollment({ plan: details.plan, programSlug: details.programSlug, prefill: details, autoStart: true });
  }

  function closeReturn() {
    setReturnedOrderId(null);
    setReturnedTransactionId(null);
    window.history.replaceState(null, "", window.location.pathname === "/checkout" ? "/" : window.location.pathname);
  }

  function continueRegistration(target: PaymentTarget) {
    closeReturn();
    setPostPaymentTarget(target);
  }

  function closePostPaymentRegistration() {
    setPostPaymentTarget(null);
  }

  const postPaymentPlan = postPaymentTarget
    ? defaultProgramPlans.find((plan) => plan.name === postPaymentTarget.planName || plan.code === postPaymentTarget.planName) ?? defaultProgramPlans[0]
    : null;

  return (
    <>
      <a className="skip-link" href="#programs">Skip to programs</a>
      <Navbar />
      <main>
        <Hero onCheckout={openHeroCheckout} checkoutError={heroCheckoutError} />
        <PartnersMarquee />
        <ProgramExplorer query={query} onQueryChange={setQuery} selectedSlug={selectedSlug} onSelect={openCourse} />
        {selectedSlug ? (
          <CourseSection
            key={selectedSlug}
            slug={selectedSlug}
            onClose={closeCourse}
            onSelectPlan={(plan, programSlug, choice) => openEnrollment(plan, choice, programSlug)}
          />
        ) : null}
        <Pricing programSlug={selectedSlug ?? undefined} onSelectPlan={(plan, choice) => openEnrollment(plan, choice, selectedSlug ?? undefined)} />
        <WhyJoviq />
        <CampusSection onContact={openContact} />
        <CertificateSection />
        <Reviews />
        <Faq />
        <Contact interest={contactInterest} />
        <FinalCta />
      </main>
      <Footer onSelectProgram={openCourse} />
      <BackToTop />

      {enrollment ? (
        <EnrollmentDialog
          key={`${enrollment.programSlug ?? "any"}-${enrollment.plan.code}`}
          plan={enrollment.plan}
          programSlug={enrollment.programSlug}
          initialValues={enrollment.prefill ? {
            fullName: enrollment.prefill.fullName,
            phoneNumber: enrollment.prefill.phoneNumber,
            email: enrollment.prefill.email,
            collegeName: enrollment.prefill.collegeName
          } : undefined}
          initialPaymentChoice={enrollment.prefill?.paymentChoice ?? enrollment.paymentChoice}
          onPaymentChoiceChange={updatePaymentChoice}
          initialAcceptedTerms={enrollment.prefill?.acceptedTerms}
          autoStart={enrollment.autoStart}
          onAutoStartError={enrollment.autoStart ? (message) => { setHeroCheckoutError(message); setEnrollment(null); } : undefined}
          onClose={closeEnrollment}
        />
      ) : null}
      {returnedOrderId ? (
        <PaymentReturn
          orderId={returnedOrderId}
          paymentTransactionId={returnedTransactionId ?? undefined}
          onContinueRegistration={continueRegistration}
          onClose={closeReturn}
        />
      ) : null}
      {postPaymentTarget && postPaymentPlan ? (
        <EnrollmentDialog
          key={`post-payment-${postPaymentTarget.programId}-${postPaymentTarget.planId}`}
          plan={postPaymentPlan}
          programSlug={postPaymentTarget.programSlug}
          initialValues={{
            fullName: postPaymentTarget.applicant.fullName,
            phoneNumber: postPaymentTarget.applicant.phoneNumber,
            email: postPaymentTarget.applicant.email,
            collegeName: postPaymentTarget.applicant.collegeName
          }}
          initialPostPaymentTarget={postPaymentTarget}
          onClose={closePostPaymentRegistration}
        />
      ) : null}
    </>
  );
}

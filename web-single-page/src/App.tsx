import { useCallback, useState } from "react";
import { findProgramBySlug } from "./data/siteContent";
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
import { CampusSection } from "./components/Campus";
import type { CampusInterest } from "./components/Campus";

type Enrollment = {
  plan: ProgramPlan;
  programSlug?: string;
  prefill?: HeroCheckoutDetails;
  autoStart?: boolean;
};

/** Cashfree sends learners back with ?cashfree=return&order_id=… after bank / UPI-app redirects. */
function readReturnedOrderId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cashfree") === "return" ? params.get("order_id") : null;
}

export function App() {
  return (
    <AuthProvider>
      <SinglePage />
    </AuthProvider>
  );
}

function SinglePage() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [returnedOrderId, setReturnedOrderId] = useState(readReturnedOrderId);
  const [contactInterest, setContactInterest] = useState<CampusInterest | "program">("program");
  useReveal();

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
    const program = findProgramBySlug(details.programSlug);
    if (program) setEnrollment({ plan: details.plan, programSlug: program.slug, prefill: details, autoStart: true });
  }

  function closeReturn() {
    setReturnedOrderId(null);
    window.history.replaceState(null, "", window.location.pathname === "/checkout" ? "/" : window.location.pathname);
  }

  return (
    <>
      <a className="skip-link" href="#programs">Skip to programs</a>
      <Navbar />
      <main>
        <Hero onCheckout={openHeroCheckout} />
        <PartnersMarquee />
        <ProgramExplorer query={query} onQueryChange={setQuery} selectedSlug={selectedSlug} onSelect={openCourse} />
        {selectedSlug ? (
          <CourseSection
            key={selectedSlug}
            slug={selectedSlug}
            onClose={closeCourse}
            onSelectPlan={(plan, programSlug) => setEnrollment({ plan, programSlug })}
          />
        ) : null}
        <Pricing onSelectPlan={(plan) => setEnrollment({ plan, programSlug: selectedSlug ?? undefined })} />
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
          initialPaymentChoice={enrollment.prefill?.paymentChoice}
          initialAcceptedTerms={enrollment.prefill?.acceptedTerms}
          autoStart={enrollment.autoStart}
          onClose={() => setEnrollment(null)}
        />
      ) : null}
      {returnedOrderId ? <PaymentReturn orderId={returnedOrderId} onClose={closeReturn} /> : null}
    </>
  );
}

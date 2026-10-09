import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent } from "react";
import {
  Check,
  ChevronDown,
  CreditCard,
  GraduationCap,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { defaultProgramPlans, findProgramBySlug, uniquePrograms } from "../data/siteContent";
import type { ProgramPlan } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { formatInr } from "./format";

export type HeroPaymentChoice = "token" | "full";

export type HeroCheckoutDetails = {
  programSlug: string;
  plan: ProgramPlan;
  paymentChoice: HeroPaymentChoice;
  fullName: string;
  phoneNumber: string;
  email: string;
  collegeName: string;
  acceptedTerms: boolean;
};

function defaultPlanCode(slug: string) {
  const program = findProgramBySlug(slug);
  return program?.plans.find((plan) => plan.code === "INTERMEDIATE" && plan.isActive)?.code
    ?? program?.plans.find((plan) => plan.isActive)?.code
    ?? "";
}

export function Hero({ onCheckout }: { onCheckout: (details: HeroCheckoutDetails) => void }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedPlanCode, setSelectedPlanCode] = useState("INTERMEDIATE");
  const [paymentChoice, setPaymentChoice] = useState<HeroPaymentChoice>("token");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const heroRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);
  const coursePickerRef = useRef<HTMLDivElement>(null);

  const selectedProgram = findProgramBySlug(selectedCourse);
  const activePlans = selectedProgram?.plans.filter((plan) => plan.isActive) ?? [];
  const displayPlans = activePlans.length ? activePlans : defaultProgramPlans.filter((plan) => plan.isActive);
  const selectedPlan = activePlans.find((plan) => plan.code === selectedPlanCode);
  const displayPlan = selectedPlan ?? displayPlans.find((plan) => plan.code === selectedPlanCode) ?? displayPlans[0];
  const amountPlan = selectedPlan ?? displayPlan;
  const courseImage = selectedProgram ? getProgramImage(selectedProgram.slug, selectedProgram.domain) : "/assets/learning-studio.jpg";
  const amount = amountPlan ? paymentChoice === "token" ? amountPlan.reserveAmount : amountPlan.offerPrice : 0;
  const amountLabel = amountPlan ? formatInr(amount) : "—";
  const balanceLabel = amountPlan ? formatInr(Math.max(0, amountPlan.offerPrice - amountPlan.reserveAmount)) : "—";
  const timerLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const timerProgress = (remainingSeconds / (5 * 60)) * 360;

  useEffect(() => {
    const timer = window.setInterval(() => setRemainingSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!courseMenuOpen) return;
    function closeOnOutsideClick(event: globalThis.PointerEvent) {
      if (!coursePickerRef.current?.contains(event.target as Node)) setCourseMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCourseMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [courseMenuOpen]);

  useEffect(() => {
    if (!termsOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTermsOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [termsOpen]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      hero.style.setProperty("--gx", `${event.clientX - rect.left}px`);
      hero.style.setProperty("--gy", `${event.clientY - rect.top}px`);
    });
  }

  function resetPointer() {
    heroRef.current?.style.setProperty("--gx", "70%");
    heroRef.current?.style.setProperty("--gy", "30%");
  }

  function chooseCourse(slug: string) {
    setSelectedCourse(slug);
    setSelectedPlanCode(defaultPlanCode(slug));
    setCourseMenuOpen(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourse || !selectedPlan || !acceptedTerms) return;
    onCheckout({
      programSlug: selectedCourse,
      plan: selectedPlan,
      paymentChoice,
      fullName: fullName.trim(),
      phoneNumber,
      email: email.trim(),
      collegeName: collegeName.trim(),
      acceptedTerms
    });
  }

  return (
    <section className="hero hero--payment" id="top" aria-labelledby="hero-title" ref={heroRef} onPointerMove={trackPointer} onPointerLeave={resetPointer}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__aurora"><span /><span /><span /></div>
        <div className="hero__grid" />
        <div className="hero__beams"><span /><span /><span /></div>
        <div className="hero__stars">
          {Array.from({ length: 34 }, (_, index) => (
            <i key={index} style={{ left: `${(index * 37.3) % 100}%`, top: `${(index * 53.7) % 100}%`, width: 1 + (index % 3), height: 1 + (index % 3), animationDelay: `${(index % 7) * 0.6}s` }} />
          ))}
        </div>
        <div className="hero__glow" />
      </div>

      <div className="container hero__payment-container">
        <form className="hero-payment-card hero-payment-card--workspace" onSubmit={submit}>
          <header className="hero-payment__workspace-header">
            <div className="hero-payment__header-copy">
              <span className="hero-payment__brand"><span><Sparkles size={14} /></span> Joviq learning</span>
              <span className="hero-payment__aside-kicker">Enrollment workspace</span>
              <h1 id="hero-title">Start your next chapter.</h1>
              <p>Choose a course, compare the available support, and secure your place in a few simple steps.</p>
            </div>
            <div className="hero-payment__header-visual hero-payment__time-visual" aria-hidden="true">
              <span className="hero-payment__time-orbit hero-payment__time-orbit--one" />
              <span className="hero-payment__time-orbit hero-payment__time-orbit--two" />
              <span className="hero-payment__timer-ring" style={{ "--timer-progress": `${timerProgress}deg` } as CSSProperties} />
              <span className="hero-payment__time-readout"><small>SEAT HOLD</small><strong>{timerLabel}</strong><b>minutes left</b></span>
              <span className="hero-payment__time-badge"><Sparkles size={11} /> Live availability</span>
            </div>
            <div className="hero-payment__header-meta">
              <span className="hero-payment__step">01 <small>of 02</small></span>
              <span className="hero-payment__header-status"><i /> Seats are being claimed fast</span>
            </div>
          </header>

          <section className="hero-payment__course-bar" aria-labelledby="hero-course-title">
            <div className="hero-payment__course-label">
              <span id="hero-course-title"><GraduationCap size={16} /> Choose your course <b>* Required</b></span>
              <small>{selectedProgram ? "Course plans and pricing are ready below." : "Select a course to load its plans and pricing."}</small>
            </div>
            <div className={`hero-payment__course-picker${courseMenuOpen ? " is-open" : ""}`} ref={coursePickerRef}>
              <select className="sr-only" required value={selectedCourse} onChange={(event) => chooseCourse(event.target.value)} aria-label="Choose course" tabIndex={-1}>
                <option value="" disabled>Choose a course to begin</option>
                {uniquePrograms.map((program) => <option key={program.slug} value={program.slug}>{program.title}</option>)}
              </select>
              <button className="hero-payment__course-trigger" type="button" aria-haspopup="listbox" aria-expanded={courseMenuOpen} onClick={() => setCourseMenuOpen((open) => !open)}>
                <span>{selectedProgram ? <img src={courseImage} alt="" /> : <GraduationCap size={17} />}</span>
                <strong>{selectedProgram ? selectedProgram.title : "Choose a course to begin"}</strong>
                <ChevronDown size={17} aria-hidden="true" />
              </button>
              {courseMenuOpen ? (
                <div className="hero-payment__course-menu" role="listbox" aria-label="Available courses">
                  <div className="hero-payment__course-menu-head"><span>Explore programs</span><small>{uniquePrograms.length} career paths</small></div>
                  {uniquePrograms.map((program, index) => (
                    <button className={`hero-payment__course-option${selectedCourse === program.slug ? " is-selected" : ""}`} key={program.slug} type="button" role="option" aria-selected={selectedCourse === program.slug} onClick={() => chooseCourse(program.slug)} style={{ "--i": index } as CSSProperties}>
                      <img src={getProgramImage(program.slug, program.domain)} alt="" />
                      <span><strong>{program.title}</strong><small>{program.domain}</small></span>
                      {selectedCourse === program.slug ? <Check size={16} /> : <ChevronDown className="hero-payment__course-option-arrow" size={14} />}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <span className={`hero-payment__course-state${selectedProgram ? " is-ready" : ""}`}>
              {selectedProgram ? <img src={courseImage} alt="" /> : <i />}
              <span>{selectedProgram ? selectedProgram.title : "No course selected"}</span>
            </span>
          </section>

          <div className="hero-payment__workspace">
            <div className="hero-payment__selection-column">
              <section className="hero-payment__section" aria-labelledby="hero-plan-title">
                <h2 id="hero-plan-title">1) Choose your plan <small>Support level</small></h2>
                <div className="hero-payment__plans">
                  {displayPlans.map((plan) => (
                    <label className={`hero-payment__plan${selectedPlan?.code === plan.code ? " is-selected" : ""}`} key={plan.code}>
                      <input checked={selectedPlan?.code === plan.code} name="heroPlan" onChange={() => setSelectedPlanCode(plan.code)} type="radio" value={plan.code} />
                      <span>
                        <strong>{plan.name}{plan.code === "INTERMEDIATE" ? " ★" : ""}</strong>
                        <ul>{plan.features.slice(0, 3).map((feature) => <li key={feature}><Check size={11} />{feature}</li>)}</ul>
                      </span>
                      <b>{formatInr(plan.offerPrice)}</b>
                    </label>
                  ))}
                </div>
              </section>

              <section className="hero-payment__section" aria-labelledby="hero-pay-title">
                <h2 id="hero-pay-title">2) Choose how to pay <small>Secure checkout</small></h2>
                <div className="hero-payment__pay-options">
                  <label className={`hero-payment__pay-option${paymentChoice === "token" ? " is-selected" : ""}`}>
                    <input checked={paymentChoice === "token"} name="heroPaymentChoice" onChange={() => setPaymentChoice("token")} type="radio" value="token" />
                    <span><strong>Reserve with {displayPlan ? formatInr(displayPlan.reserveAmount) : "—"}</strong><small>Pay now + remaining later</small></span>
                    <b>{displayPlan ? `${formatInr(displayPlan.reserveAmount)} now` : "—"}</b>
                  </label>
                  <label className={`hero-payment__pay-option${paymentChoice === "full" ? " is-selected" : ""}`}>
                    <input checked={paymentChoice === "full"} name="heroPaymentChoice" onChange={() => setPaymentChoice("full")} type="radio" value="full" />
                    <span><strong>Pay in full</strong><small>One-time payment. Instant access.</small></span>
                    <b>{displayPlan ? formatInr(displayPlan.offerPrice) : "—"}</b>
                  </label>
                </div>
                <div className="hero-payment__summary">
                  <strong>You pay now: {amountLabel}</strong>
                  <span>{displayPlan ? paymentChoice === "token" ? `Balance after reservation: ${balanceLabel}` : "No extra fee when paying in full." : "Select a course to calculate your payment."}</span>
                </div>
              </section>
            </div>

            <section className="hero-payment__details-column" aria-labelledby="hero-details-title">
              <div className="hero-payment__column-heading"><span>02</span><div><h2 id="hero-details-title">Your details</h2><p>We use these details for enrollment and your payment receipt.</p></div></div>
              <div className="hero-payment__fields">
                <label className="hero-payment__field"><span>Full name</span><span className="hero-payment__control"><UserRound size={14} aria-hidden="true" /><input autoComplete="name" onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" required value={fullName} /></span></label>
                <label className="hero-payment__field"><span>Phone</span><span className="hero-payment__phone-control"><b>+91</b><Phone size={13} aria-hidden="true" /><input autoComplete="tel-national" inputMode="numeric" maxLength={10} minLength={10} onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 10))} pattern="[6-9][0-9]{9}" placeholder="10-digit number" required type="tel" value={phoneNumber} /></span></label>
                <label className="hero-payment__field"><span>Email</span><span className="hero-payment__control"><Mail size={14} aria-hidden="true" /><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" required type="email" value={email} /></span></label>
                <label className="hero-payment__field"><span>College</span><span className="hero-payment__control"><GraduationCap size={14} aria-hidden="true" /><input autoComplete="organization" onChange={(event) => setCollegeName(event.target.value)} placeholder="Your college name" required value={collegeName} /></span></label>
              </div>
              <div className="hero-payment__terms">
                <input id="hero-terms" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.currentTarget.checked)} required type="checkbox" />
                <label htmlFor="hero-terms">I agree to the <button className="hero-payment__terms-link" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setTermsOpen(true); }} type="button">Terms &amp; Conditions</button></label>
              </div>
            </section>
          </div>

          {termsOpen ? (
            <div className="hero-payment__terms-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setTermsOpen(false); }}>
              <section className="hero-payment__terms-dialog" role="dialog" aria-modal="true" aria-labelledby="hero-terms-title">
                <button className="hero-payment__terms-close" onClick={() => setTermsOpen(false)} type="button" aria-label="Close terms and conditions"><X size={18} /></button>
                <span className="hero-payment__terms-eyebrow">Before you continue</span>
                <h2 id="hero-terms-title">Terms &amp; Conditions</h2>
                <p>By enrolling with Joviq, you agree to the following:</p>
                <ul>
                  <li>Your course seat is confirmed after successful payment verification.</li>
                  <li>For a reservation, the remaining balance is due before training begins.</li>
                  <li>Your contact details are used for enrollment updates, receipts, and support.</li>
                  <li>Refunds and cancellations follow the applicable payment and course policy.</li>
                </ul>
                <button className="hero-payment__terms-accept" onClick={() => { setAcceptedTerms(true); setTermsOpen(false); }} type="button">I understand</button>
              </section>
            </div>
          ) : null}

          <footer className="hero-payment__workspace-footer">
            <div className="hero-payment__trust"><span><ShieldCheck size={13} /> QR-verified certificates</span><span><LockKeyhole size={13} /> Secure checkout</span><span><Sparkles size={13} /> Instant access</span></div>
            <button className="hero-payment__submit" disabled={!selectedPlan} type="submit"><CreditCard size={15} /> {selectedPlan ? `Continue securely · ${amountLabel}` : "Select a course to continue"}</button>
            <a className="hero-payment__help" href="tel:+919281977188"><Phone size={12} /> Need help? +91 92819 77188</a>
          </footer>
        </form>
      </div>

      <div className="hero__wave" aria-hidden="true"><svg viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 40c240 50 480 50 720 20s480-60 720-10v40H0z" /></svg></div>
    </section>
  );
}

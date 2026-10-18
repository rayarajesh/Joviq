import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent } from "react";
import {
  ArrowRight,
  Check,
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
import { defaultProgramPlans } from "../data/siteContent";
import type { ProgramPlan } from "../data/siteContent";
import { openOnboarding } from "../lib/onboardingLink";
import { formatInr } from "./format";
import { planLink, readPlanLink } from "../lib/planLinks";

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

// The single-page landing page promotes this primary program. Other programs
// can still pass their own slug through the course cards and checkout links.
const defaultHeroProgramSlug = "full-stack-web-development";

export function Hero({ onCheckout, checkoutError }: { onCheckout: (details: HeroCheckoutDetails) => void; checkoutError?: string }) {
  const selectedProgramSlug = defaultHeroProgramSlug;
  const [selectedPlanCode, setSelectedPlanCode] = useState(() => readPlanLink(window.location.pathname)?.planCode ?? "INTERMEDIATE");
  const [paymentChoice, setPaymentChoice] = useState<HeroPaymentChoice>(() => readPlanLink(window.location.pathname)?.paymentChoice ?? "token");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [resumeEmail, setResumeEmail] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(() => Boolean(readPlanLink(window.location.pathname)?.paymentChoice));
  const popupRef = useRef<HTMLDialogElement>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);
  const heroRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);

  const displayPlans = defaultProgramPlans.filter((plan) => plan.isActive);
  const selectedPlan = displayPlans.find((plan) => plan.code === selectedPlanCode) ?? displayPlans[0];
  const displayPlan = selectedPlan;
  const amountPlan = selectedPlan;
  const amount = selectedPlan ? paymentChoice === "token" ? selectedPlan.reserveAmount : selectedPlan.offerPrice : 0;
  const amountLabel = amountPlan ? formatInr(amount) : "—";
  const balanceLabel = amountPlan ? formatInr(Math.max(0, amountPlan.offerPrice - amountPlan.reserveAmount)) : "—";
  const timerLabel = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;
  const timerProgress = (remainingSeconds / (5 * 60)) * 360;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = /^[6-9][0-9]{9}$/.test(phoneNumber);
  const canContinueToPayment = Boolean(
    selectedPlan &&
    selectedProgramSlug &&
    fullName.trim() &&
    isValidPhone &&
    isValidEmail &&
    collegeName.trim() &&
    acceptedTerms
  );

  useEffect(() => {
    const timer = window.setInterval(() => setRemainingSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!termsOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTermsOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [termsOpen]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const dialog = popupRef.current;
    if (!dialog || !popupOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [popupOpen]);

  function closePopup() {
    setPopupOpen(false);
    setTermsOpen(false);
    const url = new URL(window.location.href);
    url.pathname = "/";
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    function restoreSelection() {
      const selection = readPlanLink(window.location.pathname);
      setSelectedPlanCode(selection?.planCode ?? "INTERMEDIATE");
      setPaymentChoice(selection?.paymentChoice ?? "token");
      setPopupOpen(Boolean(selection?.paymentChoice));
    }
    window.addEventListener("popstate", restoreSelection);
    return () => window.removeEventListener("popstate", restoreSelection);
  }, []);

  function selectPlan(code: string) {
    setSelectedPlanCode(code);
    const selection = readPlanLink(window.location.pathname);
    const url = new URL(window.location.href);
    url.pathname = planLink(code, selection?.paymentChoice ? paymentChoice : undefined);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function selectPayment(choice: HeroPaymentChoice) {
    setPaymentChoice(choice);
    const url = new URL(window.location.href);
    url.pathname = planLink(selectedPlanCode, choice);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinueToPayment) return;
    setPopupOpen(false);
    onCheckout({
      programSlug: selectedProgramSlug,
      plan: selectedPlan,
      paymentChoice,
      fullName: fullName.trim(),
      phoneNumber,
      email: email.trim(),
      collegeName: collegeName.trim(),
      acceptedTerms
    });
  }

  function resumeOnboarding() {
    const normalizedEmail = resumeEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setResumeError("Enter the email used during payment.");
      return;
    }

    setResumeError("");
    openOnboarding(normalizedEmail);
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
        <dialog
          ref={popupRef}
          className={`hero-checkout-dialog${popupOpen ? " is-popup" : ""}`}
          aria-labelledby="hero-title"
          onCancel={(event) => {
            event.preventDefault();
            if (termsOpen) setTermsOpen(false);
            else closePopup();
          }}
        >
        <form className="hero-payment-card hero-payment-card--workspace" onSubmit={submit}>
          {popupOpen ? <button className="hero-checkout-dialog__close" type="button" aria-label="Close enrollment popup" onClick={closePopup}><X size={22} /></button> : null}
          <header className="hero-payment__workspace-header">
            <div className="hero-payment__header-copy">
              <span className="hero-payment__brand"><span><Sparkles size={14} /></span> Joviq learning</span>
              <span className="hero-payment__aside-kicker">Enrollment workspace</span>
              <h1 id="hero-title">Start your next chapter.</h1>
              <p>Choose your support level, share your details, and secure your place in a few simple steps.</p>
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

          <div className="hero-resume-strip" aria-label="Resume onboarding">
            <div className="hero-resume-strip__copy">
              <strong>Already registered? Resume onboarding</strong>
              <span>Enter the email used during payment to continue your form.</span>
            </div>
            <div className="hero-resume-strip__actions">
              <div className={`hero-resume-strip__email${resumeError ? " is-invalid" : ""}`}>
                <Mail size={17} aria-hidden="true" />
                <input
                  aria-label="Email used during payment"
                  autoComplete="email"
                  onChange={(event) => { setResumeEmail(event.target.value); setResumeError(""); }}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); resumeOnboarding(); } }}
                  placeholder="you@example.com"
                  type="email"
                  value={resumeEmail}
                />
                <button type="button" onClick={resumeOnboarding}>Continue <ArrowRight size={16} /></button>
              </div>
              {resumeError ? <small className="hero-resume-strip__error" role="alert">{resumeError}</small> : null}
              <span className="hero-resume-strip__help">Use the same email you used for payment.</span>
            </div>
          </div>

          <div className="hero-payment__workspace">
            {!popupOpen ? <div className="hero-payment__selection-column">
              <section className="hero-payment__section" aria-labelledby="hero-plan-title">
                <h2 id="hero-plan-title">1) Choose your plan <small>Support level</small></h2>
                <div className="hero-payment__plans">
                  {displayPlans.map((plan) => (
                    <label className={`hero-payment__plan hero-payment__choice-card${selectedPlan?.code === plan.code ? " is-selected" : ""}`} data-price={formatInr(plan.offerPrice)} key={plan.code}>
                      <input checked={selectedPlan?.code === plan.code} name="heroPlan" onChange={() => selectPlan(plan.code)} type="radio" value={plan.code} />
                      {selectedPlan?.code === plan.code ? <span className="hero-payment__selection-badge" aria-hidden="true"><Check size={12} /></span> : null}
                      <span className="hero-payment__choice-content">
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
                  <label className={`hero-payment__pay-option${paymentChoice === "token" ? " is-selected" : ""}`} data-price={displayPlan ? formatInr(displayPlan.reserveAmount) : "—"}>
                    <input checked={paymentChoice === "token"} name="heroPaymentChoice" onChange={() => selectPayment("token")} type="radio" value="token" />
                    {paymentChoice === "token" ? <span className="hero-payment__selection-badge" aria-hidden="true"><Check size={12} /></span> : null}
                    <span><strong>Reserve with {displayPlan ? formatInr(displayPlan.reserveAmount) : "—"}</strong><small>Pay now + remaining later</small></span>
                    <b>{displayPlan ? `${formatInr(displayPlan.reserveAmount)} now` : "—"}</b>
                  </label>
                  <label className={`hero-payment__pay-option${paymentChoice === "full" ? " is-selected" : ""}`} data-price={displayPlan ? formatInr(displayPlan.offerPrice) : "—"}>
                    <input checked={paymentChoice === "full"} name="heroPaymentChoice" onChange={() => selectPayment("full")} type="radio" value="full" />
                    {paymentChoice === "full" ? <span className="hero-payment__selection-badge" aria-hidden="true"><Check size={12} /></span> : null}
                    <span><strong>Pay in full</strong><small>One-time payment. Instant access.</small></span>
                    <b>{displayPlan ? formatInr(displayPlan.offerPrice) : "—"}</b>
                  </label>
                </div>
                <div className="hero-payment__summary">
                  <strong>You pay now: {amountLabel}</strong>
                  <span>{displayPlan ? paymentChoice === "token" ? `Balance after reservation: ${balanceLabel}` : "No extra fee when paying in full." : "Choose a plan to calculate your payment."}</span>
                </div>
              </section>
            </div>

            : null}
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
              {checkoutError ? <p className="enroll-error" role="alert">{checkoutError}</p> : null}
              <button className="hero-payment__submit" disabled={!canContinueToPayment} type="submit"><CreditCard size={15} /> {selectedPlan ? paymentChoice === "token" ? `Pay securely ${amountLabel} & reserve your seat` : `Pay securely ${amountLabel}` : "Continue to payment"}</button>
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
            <a className="hero-payment__help" href="tel:+919281977188"><Phone size={12} /> Need help? +91 92819 77188</a>
          </footer>
        </form>
        </dialog>
      </div>

      <div className="hero__wave" aria-hidden="true"><svg viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 40c240 50 480 50 720 20s480-60 720-10v40H0z" /></svg></div>
    </section>
  );
}

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
import { authApi } from "../features/auth/api/authApi";
import { env } from "../config/env";
import { formatInr } from "./format";

export type HeroPaymentChoice = "token" | "full";

export type HeroCheckoutDetails = {
  plan: ProgramPlan;
  paymentChoice: HeroPaymentChoice;
  fullName: string;
  phoneNumber: string;
  email: string;
  collegeName: string;
  acceptedTerms: boolean;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="hero-resume-strip__google-mark" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.25-.2-1.8H12v3.41h5.37a4.58 4.58 0 0 1-1.99 3.01v2.48h3.22c1.89-1.74 2.75-4.3 2.75-7.1Z" />
      <path fill="#34A853" d="M12 21.6c2.7 0 4.96-.89 6.61-2.42l-3.22-2.48c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.56A9.99 9.99 0 0 0 12 21.6Z" />
      <path fill="#FBBC05" d="M6.39 13.53A6 6 0 0 1 6.08 12c0-.53.11-1.05.31-1.53V7.91H3.06A9.93 9.93 0 0 0 2 12c0 1.47.35 2.86 1.06 4.09l3.33-2.56Z" />
      <path fill="#EA4335" d="M12 6.34c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 3.35 14.7 2.4 12 2.4a9.99 9.99 0 0 0-8.94 5.51l3.33 2.56C7.18 8.1 9.39 6.34 12 6.34Z" />
    </svg>
  );
}

export function Hero({ onCheckout }: { onCheckout: (details: HeroCheckoutDetails) => void }) {
  const [selectedPlanCode, setSelectedPlanCode] = useState("INTERMEDIATE");
  const [paymentChoice, setPaymentChoice] = useState<HeroPaymentChoice>("token");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [resumeEmail, setResumeEmail] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
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
    onCheckout({
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
    const mainWebUrl = env.lmsAppUrl || "http://localhost:5173";
    window.location.assign(`${mainWebUrl}/login?returnUrl=${encodeURIComponent("/student/onboarding")}&email=${encodeURIComponent(normalizedEmail)}`);
  }

  function continueWithGoogle() {
    window.location.assign(authApi.oauthStartUrl({ allowSignUp: false, acceptedTerms: false, returnUrl: "/student/onboarding" }));
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
              <button className="hero-resume-strip__google" type="button" onClick={continueWithGoogle}>
                <GoogleMark /> Continue with Google
              </button>
            </div>
          </div>

          <div className="hero-payment__workspace">
            <div className="hero-payment__selection-column">
              <section className="hero-payment__section" aria-labelledby="hero-plan-title">
                <h2 id="hero-plan-title">1) Choose your plan <small>Support level</small></h2>
                <div className="hero-payment__plans">
                  {displayPlans.map((plan) => (
                    <label className={`hero-payment__plan hero-payment__choice-card${selectedPlan?.code === plan.code ? " is-selected" : ""}`} data-price={formatInr(plan.offerPrice)} key={plan.code}>
                      <input checked={selectedPlan?.code === plan.code} name="heroPlan" onChange={() => setSelectedPlanCode(plan.code)} type="radio" value={plan.code} />
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
                    <input checked={paymentChoice === "token"} name="heroPaymentChoice" onChange={() => setPaymentChoice("token")} type="radio" value="token" />
                    {paymentChoice === "token" ? <span className="hero-payment__selection-badge" aria-hidden="true"><Check size={12} /></span> : null}
                    <span><strong>Reserve with {displayPlan ? formatInr(displayPlan.reserveAmount) : "—"}</strong><small>Pay now + remaining later</small></span>
                    <b>{displayPlan ? `${formatInr(displayPlan.reserveAmount)} now` : "—"}</b>
                  </label>
                  <label className={`hero-payment__pay-option${paymentChoice === "full" ? " is-selected" : ""}`} data-price={displayPlan ? formatInr(displayPlan.offerPrice) : "—"}>
                    <input checked={paymentChoice === "full"} name="heroPaymentChoice" onChange={() => setPaymentChoice("full")} type="radio" value="full" />
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
            <button className="hero-payment__submit" disabled={!canContinueToPayment} type="submit"><CreditCard size={15} /> {selectedPlan ? `Continue to payment · ${amountLabel}` : "Continue to payment"}</button>
            <a className="hero-payment__help" href="tel:+919281977188"><Phone size={12} /> Need help? +91 92819 77188</a>
          </footer>
        </form>
      </div>

      <div className="hero__wave" aria-hidden="true"><svg viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 40c240 50 480 50 720 20s480-60 720-10v40H0z" /></svg></div>
    </section>
  );
}

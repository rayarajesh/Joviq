import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  MailCheck,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  UserRound,
  X
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { ToastMessage } from "../components/ToastMessage";
import type { RouteSceneVariant } from "../components/RouteScene3D";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/contact-page.css";
import {
  allPrograms,
  expertGuides,
  keyStatistics,
  pricingPlans,
  recognitions
} from "../data/siteContent";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { normalizeOAuthReturnUrl } from "../features/auth/oauthPopup";
import { ApiError, formatApiError } from "../lib/api/httpClient";
import { PasswordRecovery } from "../components/PasswordRecovery";
import "../styles/login-flow.css";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

type ImmersiveRouteHeroProps = {
  accent: string;
  actions?: ReactNode;
  eyebrow: string;
  metrics: Array<{ value: string; label: string }>;
  text: string;
  title: string;
  variant: RouteSceneVariant;
};

type PageMessage = { tone: "success" | "error"; text: string } | null;
type AuthPageMode = "login" | "register" | "verify-email" | "forgot-password";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const RouteScene3D = lazy(async () => {
  const routeScene = await import("../components/RouteScene3D");
  return { default: routeScene.RouteScene3D };
});

const aboutValues = ["Industry-focused education", "Project-first learning", "Expert-reviewed outcomes", "Career preparation"];
export { ProgramsPage } from "./ProgramsPage";

export { FeaturesPage } from "./FeaturesPage";

export { AboutPage } from "./AboutPage";

export function RequestCallbackPage() {
  return (
    <PublicPageShell>
      <main className="contact-page">
        <section className="contact-hero" aria-labelledby="contact-title">
          <div className="contact-hero__copy">
            <span className="contact-pill"><PhoneCall size={14} /> REQUEST CALLBACK</span>
            <h1 id="contact-title">Let&apos;s Find the<br />Right Program<br /><span>for You</span></h1>
            <p>Share a few details and our team will guide you with the best program, plan, batch, and LMS access path - completely free.</p>
            <div className="contact-hero__benefits">
              <span><UserRound size={19} /><small>Personalized<br />Guidance</small></span>
              <span><ShieldCheck size={19} /><small>No Spam<br />Promise</small></span>
              <span><Send size={19} /><small>Quick<br />Response</small></span>
            </div>
          </div>
          <div className="contact-hero__visual">
            <span className="contact-hero__scribble">Career Your Journey<br />Starts Here</span>
            <img src="/assets/about/hero.png" alt="Learner planning her next career step with a laptop" />
            <span className="contact-hero__badge"><GraduationCap size={19} /><b>Learn<br />Build<br />Grow</b></span>
          </div>
        </section>

        <section className="contact-form-panel" aria-labelledby="contact-form-title">
          <div className="contact-form-panel__copy">
            <span className="contact-pill"><MessageCircle size={14} /> TALK TO AN EXPERT</span>
            <h2 id="contact-form-title">Get Expert Guidance</h2>
            <p>Our team will help you with program selection, pricing, payment options, and onboarding.</p>
            <ul>
              {pricingPlans.map((plan, index) => (
                <li key={plan.name}><span>{index === 0 ? <Send size={17} /> : index === 1 ? <GraduationCap size={17} /> : <ShieldCheck size={17} />}</span><b>{plan.name}: {plan.price}</b></li>
              ))}
            </ul>
            <div className="contact-trust"><span className="contact-trust__avatars"><span /> <span /> <span /> <b>+</b></span><p>Trusted by <strong>50K+ learners</strong><br />to make the right career move.</p></div>
          </div>
          <CallbackRequestForm />
        </section>

        <section className="contact-support-strip" aria-label="Callback support benefits">
          <span><MessageCircle size={21} /><b>Free Consultation</b><small>Get answers to all<br />your questions</small></span>
          <span><Clock3 size={21} /><b>Quick Response</b><small>We usually respond<br />within 24 hours</small></span>
          <span><UserRound size={21} /><b>Personalized Support</b><small>Guidance from<br />experts</small></span>
          <span><LockKeyhole size={21} /><b>Your Information is Safe</b><small>We value your privacy</small></span>
        </section>

        <section className="contact-details" aria-label="Contact details">
          <article><span className="contact-details__icon"><PhoneCall size={22} /></span><div><h3>Prefer to Contact Us Directly?</h3><p>You can also reach us through email or phone.</p><div className="contact-details__links"><a href="tel:+919281977188"><PhoneCall size={20} /> +91 92819 77188</a><a href="mailto:info@joviqtechnologies.com"><Mail size={20} /> info@joviqtechnologies.com</a></div></div></article>
          <article><span className="contact-details__icon"><Building2 size={22} /></span><div><h3>Visit Our Office</h3><p>Let&apos;s discuss your goals in person.</p><small>CS COWORKING SPACE, 6TH FLOOR,<br />MELKIORS PRIDE, HITEX ROAD,<br />VINAYAKA NAGAR, IZZATHNAGAR,<br />HITECH CITY, KHANAMMET,<br />HYDERABAD, TELANGANA 500084</small></div><iframe className="contact-map" title="Joviq office location" src="https://www.google.com/maps?q=CS+COWORKING+SPACE%2C+6TH+FLOOR%2C+MELKIORS+PRIDE%2C+HITEX+ROAD%2C+VINAYAKA+NAGAR%2C+IZZATHNAGAR%2C+HITECH+CITY%2C+KHANAMMET%2C+HYDERABAD%2C+TELANGANA+500084&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></article>
        </section>
      </main>
    </PublicPageShell>
  );
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loginSearchParams] = useSearchParams();
  const returnUrl = normalizeOAuthReturnUrl(loginSearchParams.get("returnUrl"));
  const [mode, setMode] = useState<AuthPageMode>("login");
  const [loginRole, setLoginRole] = useState<"student" | "admin">(loginSearchParams.get("role") === "admin" ? "admin" : "student");
  const [message, setMessage] = useState<PageMessage>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedOAuthTerms, setAcceptedOAuthTerms] = useState(false);
  const [oauthPhoneNumber, setOauthPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await authApi.login({
        email: String(form.get("email") ?? "").trim().toLowerCase(),
        password: String(form.get("password") ?? ""),
        rememberMe
      });

      auth.applyAuthResponse(response.data);
      navigate(returnUrl);
    } catch (error) {
      if (error instanceof ApiError && error.problem?.errorCode === "email_not_verified") {
        setPendingEmail(String(form.get("email") ?? "").trim().toLowerCase());
        setMode("verify-email");
      }
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const phoneNumber = toIndiaMobileNumber(form.get("phoneNumber"));

    if (password !== confirmPassword) {
      setMessage({ tone: "error", text: "Password and confirm password must match." });
      setIsSubmitting(false);
      return;
    }

    if (!phoneNumber) {
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await authApi.register({
        fullName: String(form.get("fullName") ?? ""),
        email,
        phoneNumber,
        password,
        confirmPassword,
        acceptedTerms: form.get("acceptedTerms") === "on",
        termsVersion: policyVersion,
        privacyPolicyVersion: policyVersion
      });

      setPendingEmail(email);
      setMode("verify-email");
      setMessage(response.data.verificationEmailSent === false
        ? { tone: "error", text: "Your account was created, but the OTP email could not be delivered. Use Send / resend OTP to retry. Email delivery must be configured on the server." }
        : { tone: "success", text: `OTP sent to ${email}. Verify it to activate your account.` });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authApi.verifyEmail(pendingEmail, String(new FormData(event.currentTarget).get("otp") ?? ""));
      setMode("login");
      setMessage({ tone: "success", text: "Email verified successfully. You can login now." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!pendingEmail.trim()) { setMessage({ tone: "error", text: "Enter your registered email address first." }); return; }
    setIsSubmitting(true);
    try {
      await authApi.sendEmailVerification(pendingEmail.trim().toLowerCase());
      setMessage({ tone: "success", text: "If this email has an unverified account, a new OTP has been sent. Check your inbox and spam folder." });
    } catch (error) { setMessage({ tone: "error", text: formatApiError(error) }); }
    finally { setIsSubmitting(false); }
  }

  async function beginGoogleOAuth(allowSignUp: boolean) {
    const phoneNumber = toIndiaMobileNumber(oauthPhoneNumber);

    if (allowSignUp && !phoneNumber) {
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return;
    }

    if (allowSignUp && !acceptedOAuthTerms) {
      setMessage({ tone: "error", text: "Terms and policies must be accepted." });
      return;
    }

    setIsSubmitting(true);
    try {
      const providers = await authApi.providers();
      if (!providers.data.google) {
        setMessage({ tone: "error", text: "Google sign-in is not configured yet. Please use email and password. The administrator must configure Google OAuth before this option can work." });
        setIsSubmitting(false);
        return;
      }
    } catch (error) { setMessage({ tone: "error", text: formatApiError(error) }); setIsSubmitting(false); return; }
    setMessage({ tone: "success", text: "Redirecting to Google..." });
    window.location.assign(
      authApi.oauthStartUrl("google", {
        returnUrl,
        acceptedTerms: allowSignUp ? acceptedOAuthTerms : false,
        allowSignUp,
        phoneNumber: allowSignUp ? phoneNumber : undefined,
        rememberMe,
        termsVersion: policyVersion,
        privacyPolicyVersion: policyVersion
      })
    );
  }

  return (
    <main className="site-page login-page-shell">
      <PublicNavbar />
      <section className="login-page">
        <div className="login-page__intro">
          <span className="login-page__eyebrow"><KeyRound size={15} /> LMS ACCESS</span>
          <h1>{mode === "register" || mode === "verify-email" ? <>Create your<br /><span>learning account.</span></> : <>Login to your<br /><span>LMS Dashboard</span></>}</h1>
          <p>Secure access for students and admins with<br className="login-page__desktop-break" /> project-driven learning workflows.</p>
          <div className="login-page__benefits">
            <div><span><BookOpen size={27} /></span><strong>Learn</strong><small>Access your<br />courses anytime</small></div>
            <div><span><BarChart3 size={25} /></span><strong>Track</strong><small>Monitor your<br />progress</small></div>
            <div><span><Star size={27} /></span><strong>Achieve</strong><small>Build a brighter<br />tomorrow</small></div>
          </div>
          <div className="login-page__quote"><b>&ldquo;</b><p>&ldquo;Same learning platform.<br /><strong>A brighter you.</strong>&rdquo;</p></div>
        </div>

        <div className="route-auth-card">
          <div className="auth-card__tabs">
            <button className={mode === "login" && loginRole === "student" ? "is-active" : undefined} type="button" onClick={() => { setLoginRole("student"); setMode("login"); }}>
              <UserRound size={17} />
              {mode === "login" ? "Student Login" : "Login"}
            </button>
            <button className={mode === "login" && loginRole === "admin" ? "is-active" : mode !== "login" ? "is-active" : undefined} type="button" onClick={() => { if (mode === "login") { setLoginRole("admin"); } else { setMode("register"); } }}>
              <UserPlus size={17} />
              {mode === "login" ? "Admin Login" : "Register"}
            </button>
          </div>

          {mode === "forgot-password" ? <PasswordRecovery onBack={() => setMode("login")} /> : mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <button
                className="auth-secondary-button auth-oauth-button"
                type="button"
                onClick={() => beginGoogleOAuth(false)}
                disabled={isSubmitting}
              >
                <ShieldCheck size={18} />
                Sign in with Google
              </button>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <label className="login-page__field">
                Email
                <span className="login-page__input-wrap"><Mail size={19} /><input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={256} pattern={emailPattern} required /></span>
              </label>
              <label className="login-page__field">
                Password
                <span className="login-page__input-wrap"><LockKeyhole size={19} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" minLength={8} required /><button className="login-page__password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span>
              </label>
              <div className="login-page__form-options"><label className="checkbox-row"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.currentTarget.checked)} /><span>Keep me signed in on this device</span></label><button className="auth-link-button login-page__forgot" type="button" onClick={() => { setMode("forgot-password"); setMessage(null); }}>Forgot password?</button></div>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in" : "Login to dashboard"}
                <ArrowRight size={18} />
              </button>
              <p className="login-page__register-prompt">Don&apos;t have an account? <button type="button" onClick={() => setMode("register")}>Register now</button></p>
              <button className="auth-link-button" type="button" onClick={() => { setMode("verify-email"); setMessage(null); }}>Verify email / enter OTP</button>
            </form>
          ) : mode === "register" ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-oauth-signup">
                <IndiaMobileInput
                  label="Phone number for Google sign-up"
                  name="oauthPhoneNumber"
                  value={oauthPhoneNumber}
                  onChange={(event) => setOauthPhoneNumber(event.currentTarget.value)}
                />
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={acceptedOAuthTerms}
                    onChange={(event) => setAcceptedOAuthTerms(event.currentTarget.checked)}
                  />
                  <span>I accept the terms and privacy policy.</span>
                </label>
                <button
                  className="auth-secondary-button auth-oauth-button"
                  type="button"
                  onClick={() => beginGoogleOAuth(true)}
                  disabled={isSubmitting}
                >
                  <ShieldCheck size={18} />
                  Create account with Google
                </button>
              </div>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <label>
                Full name
                <input name="fullName" required />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required />
              </label>
              <IndiaMobileInput label="Phone number" name="phoneNumber" required />
              <label>
                Password
                <input name="password" type="password" autoComplete="new-password" minLength={8} required />
                <small>Use at least 8 characters, including uppercase, lowercase, a number, and a symbol.</small>
              </label>
              <label>
                Confirm password
                <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
              </label>
              <label className="checkbox-row">
                <input name="acceptedTerms" type="checkbox" required />
                <span>I accept the terms and privacy policy.</span>
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating" : "Register as student"}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleVerifyEmail}>
              <h2>Verify email OTP</h2>
              <p>Enter your registered email and the verification code from your inbox.</p>
              <label>Email<input name="email" type="email" autoComplete="email" required value={pendingEmail} onChange={event => setPendingEmail(event.currentTarget.value)} /></label>
              <label>
                OTP
                <input name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} pattern="[0-9]{4,8}" required />
              </label>
              <button type="submit" disabled={isSubmitting || !pendingEmail}>
                {isSubmitting ? "Verifying" : "Verify and activate"}
                <MailCheck size={18} />
              </button>
              <button className="auth-secondary-button" type="button" disabled={isSubmitting} onClick={resendVerification}>Send / resend OTP</button>
              <button className="auth-secondary-button" type="button" onClick={() => setMode("register")}>
                <RefreshCw size={17} />
                Back to registration
              </button>
            </form>
          )}

          <ToastMessage message={message} onDismiss={() => setMessage(null)} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="site-page public-route-page">
      <PublicNavbar />
      {children}
      <SiteFooter />
    </main>
  );
}

function ImmersiveRouteHero({ accent, actions, eyebrow, metrics, text, title, variant }: ImmersiveRouteHeroProps) {
  return (
    <section className={`immersive-route-hero immersive-route-hero--${variant}`}>
      <Suspense fallback={null}>
        <RouteScene3D variant={variant} />
      </Suspense>
      <div aria-hidden="true" className="immersive-route-hero__veil" />
      <div className="immersive-route-hero__content">
        <div className="immersive-route-hero__copy">
          <span className="apt-pill apt-pill--dark">
            <Sparkles size={15} />
            {eyebrow}
          </span>
          <h1>
            {title} <span>{accent}</span>
          </h1>
          <p>{text}</p>
          {actions ? <div className="immersive-route-hero__actions">{actions}</div> : null}
        </div>

        <div className="immersive-route-hero__metrics" aria-label="Page highlights">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallbackRequestForm() {
  const [message, setMessage] = useState<PageMessage>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (!toIndiaMobileNumber(form.get("phoneNumber"))) {
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return;
    }

    formElement.reset();
    setMessage({ tone: "success", text: "Callback request captured. The team can contact you soon." });
  }

  return (
    <form className="callback-card route-callback-card contact-form" onSubmit={handleSubmit}>
      <label>
        Full name
        <input name="fullName" placeholder="Your name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="you@example.com" maxLength={256} pattern={emailPattern} required />
      </label>
      <IndiaMobileInput label="Phone" name="phoneNumber" required />
      <label>
        College / university
        <input name="college" placeholder="College / university name" />
      </label>
      <label>
        Program interest
        <select name="program" defaultValue="">
          <option value="" disabled>
            Select a track
          </option>
          {allPrograms.map((program) => (
            <option key={program.slug} value={program.title}>
              {program.title}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">
        <Send size={18} />
        Submit request
      </button>
      <ToastMessage message={message} onDismiss={() => setMessage(null)} />
    </form>
  );
}



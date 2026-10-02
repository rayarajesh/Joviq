import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
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
  MapPin,
  MailCheck,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { ToastMessage } from "../components/ToastMessage";
import type { RouteSceneVariant } from "../components/RouteScene3D";
import { SiteFooter } from "../components/SiteFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/contact-page.css";
import {
  allPrograms,
  expertGuides,
  keyStatistics,
  pricingPlans,
  recognitions,
} from "../data/siteContent";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { publicLmsApi } from "../features/lms/api/lmsApi";
import { normalizeOAuthReturnUrl } from "../features/auth/oauthPopup";
import { ApiError, formatApiError, request } from "../lib/api/httpClient";
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

const aboutValues = [
  "Industry-focused education",
  "Project-first learning",
  "Expert-reviewed outcomes",
  "Career preparation",
];

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z"
      />
      <path
        fill="#34A853"
        d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.78a5.85 5.85 0 0 1 0-3.56V7.69H3.3a9.74 9.74 0 0 0 0 8.62l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.19c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.28 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.91 9.46 6.19 12 6.19Z"
      />
    </svg>
  );
}
export { ProgramsPage } from "./ProgramsPage";

export { FeaturesPage } from "./FeaturesPage";

export { AboutPage } from "./AboutPage";

const contactOrder = (index: number) => ({ "--i": index }) as CSSProperties;
const contactBenefits = [
  { icon: UserRound, label: "Personalized guidance", tone: "lilac" },
  { icon: ShieldCheck, label: "No spam promise", tone: "mint" },
  { icon: Send, label: "Quick response", tone: "peach" },
];
const contactSupport = [
  { icon: MessageCircle, title: "Free Consultation", text: "Get answers to all your questions" },
  { icon: Clock3, title: "Quick Response", text: "We usually respond within 24 hours" },
  { icon: UserRound, title: "Personalized Support", text: "Guidance from experts" },
  { icon: LockKeyhole, title: "Your Information is Safe", text: "We value your privacy" },
];
const planIcons = [Send, GraduationCap, ShieldCheck];
const planTones = ["mint", "peach", "sky"];
const supportTones = ["lilac", "butter", "rose", "mint"];

export function RequestCallbackPage() {
  const mainRef = useScrollReveal();
  return (
    <div className="contact-v2 sc-page">
      <PublicNavbar />
      <main className="sc-main" ref={mainRef}>
        <section className="sc-hero contact-hero" aria-labelledby="contact-title">
          <div className="sc-hero-grid">
            <div className="sc-hero-copy">
              <span className="sc-badge">
                <span className="sc-pulse" aria-hidden="true" />
                <PhoneCall size={15} /> Request a callback
              </span>
              <h1 id="contact-title">
                <span>Let&apos;s Find the</span> <span>Right Program</span>{" "}
                <em>for You</em>
              </h1>
              <p>
                Share a few details and our team will guide you with the best
                program, plan, batch, and LMS access path - completely free.
              </p>
              <ul className="contact-benefits" aria-label="Why request a callback">
                {contactBenefits.map(({ icon: Icon, label, tone }) => (
                  <li key={label} className={`tone-${tone}`}>
                    <span className="sc-icon sc-icon--tone-solid"><Icon size={16} /></span>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="contact-quick">
                <a href="tel:+919281977188" className="tone-mint">
                  <span className="sc-icon sc-icon--tone"><PhoneCall size={17} /></span>
                  <span><small>Call us</small>+91 92819 77188</span>
                </a>
                <a href="mailto:info@joviqtechnologies.com" className="tone-sky">
                  <span className="sc-icon sc-icon--tone"><Mail size={17} /></span>
                  <span><small>Email us</small>info@joviqtechnologies.com</span>
                </a>
              </div>
            </div>
            <div className="sc-hero-visual contact-form-stage">
              <span className="contact-blob contact-blob--peach" aria-hidden="true" />
              <span className="contact-blob contact-blob--mint" aria-hidden="true" />
              <div className="contact-form-card" id="contact-form">
                <span className="sc-pill tone-lilac"><Sparkles size={13} /> Free consultation</span>
                <h2 id="contact-form-title">Request your free callback</h2>
                <p>Fill in your details and we&apos;ll get in touch.</p>
                <CallbackRequestForm />
              </div>
              <div className="sc-floater contact-float tone-butter" style={contactOrder(0)}>
                <span className="sc-icon sc-icon--tone-solid"><Clock3 size={18} /></span>
                <span><strong>Quick Response</strong>Usually within 24 hours</span>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-guidance" aria-labelledby="contact-guidance-title" data-reveal>
          <div className="contact-panel-copy sc-dark">
            <span className="sc-eyebrow">Talk to an expert</span>
            <h2 id="contact-guidance-title">Get Expert Guidance</h2>
            <p>
              Our team will help you with program selection, pricing, payment
              options, and onboarding.
            </p>
            <ul className="contact-plans">
              {pricingPlans.map((plan, index) => {
                const Icon = planIcons[index % planIcons.length];
                return (
                  <li key={plan.name} className={`tone-${planTones[index % planTones.length]}`}>
                    <span className="sc-icon sc-icon--tone-solid"><Icon size={17} /></span>
                    <span>{plan.name}</span>
                    <b>{plan.price}</b>
                  </li>
                );
              })}
            </ul>
            <div className="contact-trust">
              <span className="contact-trust-icons" aria-hidden="true">
                <i><UserRound size={14} /></i><i><GraduationCap size={14} /></i><i><Sparkles size={14} /></i>
              </span>
              <p>
                Trusted by <strong>50K+ learners</strong>
                <br />
                to make the right career move.
              </p>
            </div>
          </div>
          <div className="contact-guidance-photo">
            <img
              src="/assets/about/hero.png"
              alt="Learner planning her next career step with a laptop"
              width={1254}
              height={1254}
              loading="lazy"
            />
            <div className="sc-floater contact-photo-badge tone-lilac" style={contactOrder(1)}>
              <span className="sc-icon sc-icon--tone-solid"><GraduationCap size={18} /></span>
              <span><strong>Learn · Build · Grow</strong>Guidance at every step</span>
            </div>
          </div>
        </section>

        <section className="contact-support sc-grid-4" aria-label="Callback support benefits">
          {contactSupport.map(({ icon: Icon, title, text }, index) => (
            <article className={`sc-card tone-${supportTones[index]}`} key={title} data-reveal style={contactOrder(index)}>
              <span className="sc-icon sc-icon--tone-solid"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="contact-reach sc-section" aria-label="Contact details">
          <article className="contact-office sc-card tone-lilac" data-reveal>
            <div className="contact-office-info">
              <div className="contact-office-head">
                <span className="sc-icon sc-icon--tone-solid"><Building2 size={20} /></span>
                <div>
                  <span className="sc-eyebrow">Let&apos;s discuss your goals in person</span>
                  <h3>Visit Our Office</h3>
                </div>
              </div>
              <p className="contact-address">
                <MapPin size={16} />
                <span>
                  CS COWORKING SPACE, 6TH FLOOR, MELKIORS PRIDE, HITEX ROAD,
                  VINAYAKA NAGAR, IZZATHNAGAR, HITECH CITY, KHANAMMET, HYDERABAD,
                  TELANGANA 500084
                </span>
              </p>
              <div className="contact-office-links">
                <a className="sc-ghost" href="tel:+919281977188">+91 92819 77188 <ArrowUpRight size={16} /></a>
                <a className="sc-ghost" href="mailto:info@joviqtechnologies.com">info@joviqtechnologies.com <ArrowUpRight size={16} /></a>
              </div>
            </div>
            <iframe
              className="contact-map"
              title="Joviq office location"
              src="https://www.google.com/maps?q=CS+COWORKING+SPACE%2C+6TH+FLOOR%2C+MELKIORS+PRIDE%2C+HITEX+ROAD%2C+VINAYAKA+NAGAR%2C+IZZATHNAGAR%2C+HITECH+CITY%2C+KHANAMMET%2C+HYDERABAD%2C+TELANGANA+500084&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function VerifyCertificatePage() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState<
    Awaited<ReturnType<typeof publicLmsApi.verifyCertificate>>["data"] | null
  >(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!certificateId) return;
    void publicLmsApi
      .verifyCertificate(certificateId)
      .then((response) => setCertificate(response.data))
      .catch((reason) => setError(formatApiError(reason)));
  }, [certificateId]);

  return (
    <main className="certificate-verification-page">
      <div className="certificate-verification-card">
        <span className="certificate-verification-eyebrow">
          JOVIQ TECHNOLOGIES
        </span>
        <h1>
          {certificate
            ? "Certificate verified"
            : error
              ? "Certificate unavailable"
              : "Checking certificate"}
        </h1>
        {error ? (
          <p>{error}</p>
        ) : certificate ? (
          <>
            <div
              className={`certificate-verification-status ${certificate.isValid ? "is-valid" : "is-invalid"}`}
            >
              {certificate.isValid
                ? "Valid certificate"
                : "Certificate revoked"}
            </div>
            <dl>
              <div>
                <dt>Certificate ID</dt>
                <dd>{certificate.certificateId}</dd>
              </div>
              <div>
                <dt>Student</dt>
                <dd>{certificate.studentName}</dd>
              </div>
              <div>
                <dt>Program</dt>
                <dd>{certificate.programTitle}</dd>
              </div>
              <div>
                <dt>Certificate type</dt>
                <dd>{certificate.type}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>
                  {certificate.fromDate ?? "-"} to {certificate.toDate ?? "-"}
                </dd>
              </div>
              <div>
                <dt>Director</dt>
                <dd>
                  {certificate.authorizedSignatory ?? "Joviq Technologies"}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p>We are checking the certificate details.</p>
        )}
        <Link to="/login" className="certificate-verification-back">
          Open Joviq LMS
        </Link>
      </div>
    </main>
  );
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loginSearchParams] = useSearchParams();
  const returnUrl = normalizeOAuthReturnUrl(loginSearchParams.get("returnUrl"));
  const [mode, setMode] = useState<AuthPageMode>("login");
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
        email: String(form.get("email") ?? "")
          .trim()
          .toLowerCase(),
        password: String(form.get("password") ?? ""),
        rememberMe,
      });

      auth.applyAuthResponse(response.data);
      navigate(returnUrl);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.problem?.errorCode === "email_not_verified"
      ) {
        setPendingEmail(
          String(form.get("email") ?? "")
            .trim()
            .toLowerCase(),
        );
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
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const phoneNumber = toIndiaMobileNumber(form.get("phoneNumber"));

    if (password !== confirmPassword) {
      setMessage({
        tone: "error",
        text: "Password and confirm password must match.",
      });
      setIsSubmitting(false);
      return;
    }

    if (!phoneNumber) {
      setMessage({
        tone: "error",
        text: "Phone must be a valid India +91 mobile number with exactly 10 digits.",
      });
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
        privacyPolicyVersion: policyVersion,
      });

      setPendingEmail(email);
      setMode("verify-email");
      setMessage(
        response.data.verificationEmailSent === false
          ? {
              tone: "error",
              text: "Your account was created, but the OTP email could not be delivered. Use Send / resend OTP to retry. Email delivery must be configured on the server.",
            }
          : {
              tone: "success",
              text: `OTP sent to ${email}. Verify it to activate your account.`,
            },
      );
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
      await authApi.verifyEmail(
        pendingEmail,
        String(new FormData(event.currentTarget).get("otp") ?? ""),
      );
      setMode("login");
      setMessage({
        tone: "success",
        text: "Email verified successfully. You can login now.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!pendingEmail.trim()) {
      setMessage({
        tone: "error",
        text: "Enter your registered email address first.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.sendEmailVerification(pendingEmail.trim().toLowerCase());
      setMessage({
        tone: "success",
        text: "If this email has an unverified account, a new OTP has been sent. Check your inbox and spam folder.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function beginGoogleOAuth(allowSignUp: boolean) {
    const phoneNumber = toIndiaMobileNumber(oauthPhoneNumber);

    if (allowSignUp && !phoneNumber) {
      setMessage({
        tone: "error",
        text: "Phone must be a valid India +91 mobile number with exactly 10 digits.",
      });
      return;
    }

    if (allowSignUp && !acceptedOAuthTerms) {
      setMessage({
        tone: "error",
        text: "Terms and policies must be accepted.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const providers = await authApi.providers();
      if (!providers.data.google) {
        setMessage({
          tone: "error",
          text: "Google sign-in is not configured yet. Please use email and password. The administrator must configure Google OAuth before this option can work.",
        });
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
      setIsSubmitting(false);
      return;
    }
    setMessage({ tone: "success", text: "Redirecting to Google..." });
    window.location.assign(
      authApi.oauthStartUrl("google", {
        returnUrl,
        acceptedTerms: allowSignUp ? acceptedOAuthTerms : false,
        allowSignUp,
        phoneNumber: allowSignUp ? phoneNumber : undefined,
        rememberMe,
        termsVersion: policyVersion,
        privacyPolicyVersion: policyVersion,
      }),
    );
  }

  return (
    <main className="site-page login-page-shell">
      <PublicNavbar />
      <section className="login-page">
        <div className="login-page__intro">
          <span className="login-page__eyebrow">
            <KeyRound size={15} /> LMS ACCESS
          </span>
          <h1>
            {mode === "register" || mode === "verify-email" ? (
              <>
                Create your
                <br />
                <span>learning account.</span>
              </>
            ) : (
              <>
                Login to your
                <br />
                <span>LMS Dashboard</span>
              </>
            )}
          </h1>
          <p>
            Secure access to your
            <br className="login-page__desktop-break" /> project-driven learning
            workflows.
          </p>
          <div className="login-page__benefits">
            <div>
              <span>
                <BookOpen size={27} />
              </span>
              <strong>Learn</strong>
              <small>
                Access your
                <br />
                courses anytime
              </small>
            </div>
            <div>
              <span>
                <BarChart3 size={25} />
              </span>
              <strong>Track</strong>
              <small>
                Monitor your
                <br />
                progress
              </small>
            </div>
            <div>
              <span>
                <Star size={27} />
              </span>
              <strong>Achieve</strong>
              <small>
                Build a brighter
                <br />
                tomorrow
              </small>
            </div>
          </div>
          <div className="login-page__quote">
            <b>&ldquo;</b>
            <p>
              &ldquo;Same learning platform.
              <br />
              <strong>A brighter you.</strong>&rdquo;
            </p>
          </div>
        </div>

        <div className="route-auth-card">
          <div className="auth-card__tabs">
            <button
              className={mode === "login" ? "is-active" : undefined}
              type="button"
              onClick={() => setMode("login")}
            >
              <UserRound size={17} />
              Login
            </button>
            <button
              className={mode === "register" ? "is-active" : undefined}
              type="button"
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {mode === "forgot-password" ? (
            <PasswordRecovery onBack={() => setMode("login")} />
          ) : mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <button
                className="auth-secondary-button auth-oauth-button"
                type="button"
                onClick={() => beginGoogleOAuth(false)}
                disabled={isSubmitting}
              >
                <GoogleMark />
                Sign in with Google
              </button>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <label className="login-page__field">
                Email
                <span className="login-page__input-wrap">
                  <Mail size={19} />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    maxLength={256}
                    pattern={emailPattern}
                    required
                  />
                </span>
              </label>
              <label className="login-page__field">
                Password
                <span className="login-page__input-wrap">
                  <LockKeyhole size={19} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    minLength={8}
                    required
                  />
                  <button
                    className="login-page__password-toggle"
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
              </label>
              <div className="login-page__form-options">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.currentTarget.checked)
                    }
                  />
                  <span>Keep me signed in on this device</span>
                </label>
                <button
                  className="auth-link-button login-page__forgot"
                  type="button"
                  onClick={() => {
                    setMode("forgot-password");
                    setMessage(null);
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in" : "Login to dashboard"}
                <ArrowRight size={18} />
              </button>
              <p className="login-page__register-prompt">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setMode("register")}>
                  Register now
                </button>
              </p>
              <button
                className="auth-link-button"
                type="button"
                onClick={() => {
                  setMode("verify-email");
                  setMessage(null);
                }}
              >
                Verify email / enter OTP
              </button>
            </form>
          ) : mode === "register" ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="auth-oauth-signup">
                <IndiaMobileInput
                  label="Phone number for Google sign-up"
                  name="oauthPhoneNumber"
                  value={oauthPhoneNumber}
                  onChange={(event) =>
                    setOauthPhoneNumber(event.currentTarget.value)
                  }
                />
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={acceptedOAuthTerms}
                    onChange={(event) =>
                      setAcceptedOAuthTerms(event.currentTarget.checked)
                    }
                  />
                  <span>I accept the terms and privacy policy.</span>
                </label>
                <button
                  className="auth-secondary-button auth-oauth-button"
                  type="button"
                  onClick={() => beginGoogleOAuth(true)}
                  disabled={isSubmitting}
                >
                  <GoogleMark />
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
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={256}
                  pattern={emailPattern}
                  required
                />
              </label>
              <IndiaMobileInput
                label="Phone number"
                name="phoneNumber"
                required
              />
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <small>
                  Use at least 8 characters, including uppercase, lowercase, a
                  number, and a symbol.
                </small>
              </label>
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
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
              <p>
                Enter your registered email and the verification code from your
                inbox.
              </p>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={pendingEmail}
                  onChange={(event) =>
                    setPendingEmail(event.currentTarget.value)
                  }
                />
              </label>
              <label>
                OTP
                <input
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  pattern="[0-9]{4,8}"
                  required
                />
              </label>
              <button type="submit" disabled={isSubmitting || !pendingEmail}>
                {isSubmitting ? "Verifying" : "Verify and activate"}
                <MailCheck size={18} />
              </button>
              <button
                className="auth-secondary-button"
                type="button"
                disabled={isSubmitting}
                onClick={resendVerification}
              >
                Send / resend OTP
              </button>
              <button
                className="auth-secondary-button"
                type="button"
                onClick={() => setMode("register")}
              >
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

function ImmersiveRouteHero({
  accent,
  actions,
  eyebrow,
  metrics,
  text,
  title,
  variant,
}: ImmersiveRouteHeroProps) {
  return (
    <section
      className={`immersive-route-hero immersive-route-hero--${variant}`}
    >
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
          {actions ? (
            <div className="immersive-route-hero__actions">{actions}</div>
          ) : null}
        </div>

        <div
          className="immersive-route-hero__metrics"
          aria-label="Page highlights"
        >
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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const phone = toIndiaMobileNumber(form.get("phoneNumber"));
    if (!phone) {
      setMessage({
        tone: "error",
        text: "Phone must be a valid India +91 mobile number with exactly 10 digits.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await request("/api/v1/callbackrequests", {
        method: "POST",
        accessToken: null,
        skipAuthRetry: true,
        body: {
          fullName: (form.get("fullName") as string) ?? "",
          email: (form.get("email") as string) ?? "",
          phone,
          collegeUniversity: (form.get("college") as string) || null,
          programInterest: (form.get("program") as string) || null,
        },
      });

      formElement.reset();
      setMessage({
        tone: "success",
        text: "Your request was submitted! Our team will reach out to you soon.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof ApiError
            ? formatApiError(error)
            : "Network error. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="callback-card route-callback-card contact-form"
      onSubmit={handleSubmit}
    >
      <label>
        Full name
        <input name="fullName" placeholder="Your name" required />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          maxLength={256}
          pattern={emailPattern}
          required
        />
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
      <button type="submit" disabled={submitting}>
        <Send size={18} />
        {submitting ? "Submitting…" : "Submit request"}
      </button>
      <ToastMessage message={message} onDismiss={() => setMessage(null)} />
    </form>
  );
}

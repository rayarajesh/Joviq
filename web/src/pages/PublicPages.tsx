import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Layers3,
  MailCheck,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { ToastMessage } from "../components/ToastMessage";
import type { RouteSceneVariant } from "../components/RouteScene3D";
import { SiteFooter } from "../components/SiteFooter";
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
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  text: string;
  actions?: ReactNode;
};

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
type AuthPageMode = "login" | "register" | "verify-email";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const RouteScene3D = lazy(async () => {
  const routeScene = await import("../components/RouteScene3D");
  return { default: routeScene.RouteScene3D };
});

const featureGroups = [
  {
    icon: <Sparkles size={24} />,
    title: "AI learning support",
    text: "Interview practice, improvement suggestions, and role-based checkpoints.",
    signals: ["Adaptive checkpoints", "Interview practice", "Actionable feedback"]
  },
  {
    icon: <UsersRound size={24} />,
    title: "Expert-led delivery",
    text: "Expert-led sessions, project reviews, mock interviews, and career guidance.",
    signals: ["Guided cohorts", "Weekly reviews", "Career guidance"]
  },
  {
    icon: <Layers3 size={24} />,
    title: "Project-first LMS",
    text: "Lesson replays, projects, progress tracking, reviews, and certification.",
    signals: ["Real projects", "Clear rubrics", "Progress tracking"]
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Verified outcomes",
    text: "Certificates, QR verification, portfolio proof, resume support, and interview readiness.",
    signals: ["Verified records", "Portfolio proof", "Shareable outcomes"]
  }
];

const aboutValues = ["Industry-focused education", "Project-first learning", "Expert-reviewed outcomes", "Career preparation"];
export { ProgramsPage } from "./ProgramsPage";

export function FeaturesPage() {
  return (
    <PublicPageShell>
      <ImmersiveRouteHero
        accent="prove your skill."
        eyebrow="The Joviq learning system"
        metrics={[
          { value: "One", label: "Connected workspace" },
          { value: "AI", label: "Practice checkpoints" },
          { value: "Weekly", label: "Expert reviews" },
          { value: "Verified", label: "Career proof" }
        ]}
        text="Live learning, practical projects, expert review, AI practice, and verified outcomes working together in one focused experience."
        title="One workspace to learn, build, and"
        variant="features"
        actions={
          <>
            <Link className="site-button site-button--primary" to="/programs">
              Explore programs <ArrowRight size={18} />
            </Link>
            <Link className="site-button immersive-route-hero__secondary" to="/request-callback">
              Talk to an advisor <PhoneCall size={18} />
            </Link>
          </>
        }
      />

      <section className="route-experience-section route-feature-showcase">
        <div className="route-section-lead">
          <span>Connected learning experience</span>
          <h2>Every feature moves the learner toward demonstrable work.</h2>
          <p>Nothing sits in isolation. Classes lead to practice, practice becomes projects, and projects become career proof.</p>
        </div>
        <div className="route-feature-showcase__grid">
          {featureGroups.map((feature, index) => (
            <article key={feature.title}>
              <header>
                <span>{feature.icon}</span>
                <small>0{index + 1}</small>
              </header>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <ul>
                {feature.signals.map((signal) => (
                  <li key={signal}><CheckCircle2 size={15} /> {signal}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="route-learning-flow">
        <div className="route-learning-flow__intro">
          <span className="apt-pill apt-pill--dark"><Layers3 size={15} /> One connected flow</span>
          <h2>From the first lesson to proof you can share.</h2>
          <p>One visible progression keeps classes, practice, projects, feedback, and certification aligned.</p>
          <Link className="site-button site-button--primary" to="/programs">
            Find your program <ArrowRight size={18} />
          </Link>
        </div>
        <ol className="route-learning-flow__steps">
          {["Learn", "Practice", "Build", "Review", "Prove"].map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
    </PublicPageShell>
  );
}

export function AboutPage() {
  return (
    <PublicPageShell>
      <ImmersiveRouteHero
        accent="proof."
        eyebrow="About Joviq Technologies"
        metrics={keyStatistics}
        text="Joviq connects training, practical projects, expert review, AI-supported practice, certification, and career preparation into one focused learning ecosystem."
        title="Learning becomes valuable when it produces"
        variant="about"
        actions={
          <Link className="site-button site-button--primary" to="/programs">
            View programs <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-experience-section about-story">
        <div className="about-story__statement">
          <span>Why Joviq exists</span>
          <h2>To close the gap between finishing a course and being able to show real capability.</h2>
        </div>
        <div className="about-story__copy">
          <p>Our model focuses on practical projects, structured review, LMS-driven progress, and clear career preparation rather than passive course watching.</p>
          <p>Every part of the experience is designed to help learners understand what they built, improve it with feedback, and communicate that work with confidence.</p>
          <div>
            {aboutValues.map((value) => <span key={value}><CheckCircle2 size={15} /> {value}</span>)}
          </div>
        </div>
      </section>

      <section className="about-metrics">
        {keyStatistics.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="route-experience-section about-experts">
        <div className="route-section-lead">
          <span>Expert context</span>
          <h2>Different disciplines, one review standard.</h2>
          <p>Learners get guidance from people who understand the technical work and the career conversation around it.</p>
        </div>
        <div className="about-experts__grid">
          {expertGuides.map((expert, index) => (
            <article key={expert.name}>
              <header><GraduationCap size={23} /><span>0{index + 1}</span></header>
              <h3>{expert.name}</h3>
              <p>{expert.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-principles">
        <div><span className="apt-pill apt-pill--dark"><ShieldCheck size={15} /> How we operate</span><h2>Practical by design.</h2></div>
        <div className="about-principles__list">
          {recognitions.map((item, index) => (
            <span key={item}><small>0{index + 1}</small>{item}</span>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}

export function RequestCallbackPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Request Callback"
        title="Get your best-fit program roadmap."
        text="Share a few details and the Joviq team can suggest the right program, plan, batch, and LMS access path."
      />

      <section className="route-section route-form-shell">
        <div>
          <span className="apt-pill">
            <PhoneCall size={15} />
            Program guidance
          </span>
          <h2>Talk to a career expert.</h2>
          <p>No spam. Just a focused callback for program selection, pricing, payment, and onboarding next steps.</p>
          <ul>
            {pricingPlans.map((plan) => (
              <li key={plan.name}>
                <CheckCircle2 size={17} />
                {plan.name}: {plan.price}
              </li>
            ))}
          </ul>
        </div>
        <CallbackRequestForm />
      </section>
    </PublicPageShell>
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
      await authApi.register({
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
      setMessage({ tone: "success", text: `OTP sent to ${email}. Verify it to activate your account.` });
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

  function beginGoogleOAuth(allowSignUp: boolean) {
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
    <PublicPageShell>
      <section className="route-auth-page">
        <div>
          <span className="apt-pill">
            <KeyRound size={15} />
            LMS access
          </span>
          <h1>{mode === "register" || mode === "verify-email" ? "Create your learning account." : "Login to your LMS dashboard."}</h1>
          <p>Secure access for students and admins with project-driven learning workflows.</p>
        </div>

        <div className="route-auth-card">
          <div className="auth-card__tabs">
            <button className={mode === "login" ? "is-active" : undefined} type="button" onClick={() => setMode("login")}>
              <KeyRound size={17} />
              Login
            </button>
            <button className={mode !== "login" ? "is-active" : undefined} type="button" onClick={() => setMode("register")}>
              <UserPlus size={17} />
              Register
            </button>
          </div>

          {mode === "login" ? (
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
              <label>
                Email
                <input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required />
              </label>
              <label>
                Password
                <input name="password" type="password" autoComplete="current-password" minLength={8} required />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.currentTarget.checked)} />
                <span>Keep me signed in on this device.</span>
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in" : "Login to dashboard"}
                <ArrowRight size={18} />
              </button>
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
              <p>Enter the OTP sent to {pendingEmail || "your email"}.</p>
              <label>
                OTP
                <input name="otp" inputMode="numeric" maxLength={8} required />
              </label>
              <button type="submit" disabled={isSubmitting || !pendingEmail}>
                {isSubmitting ? "Verifying" : "Verify and activate"}
                <MailCheck size={18} />
              </button>
              <button className="auth-secondary-button" type="button" onClick={() => setMode("register")}>
                <RefreshCw size={17} />
                Back to registration
              </button>
            </form>
          )}

          <ToastMessage message={message} onDismiss={() => setMessage(null)} />
        </div>
      </section>
    </PublicPageShell>
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

function PageHero({ eyebrow, title, text, actions }: PageHeroProps) {
  return (
    <section className="route-hero">
      <div>
        <span className="apt-pill">
          <Sparkles size={15} />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{text}</p>
        {actions ? <div className="route-hero__actions">{actions}</div> : null}
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
    <form className="callback-card route-callback-card" onSubmit={handleSubmit}>
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



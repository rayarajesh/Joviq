import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Code2,
  Cpu,
  GraduationCap,
  KeyRound,
  Layers3,
  Lightbulb,
  MailCheck,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  Wrench
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import {
  allPrograms,
  homeFaqs,
  keyStatistics,
  mentors,
  pricingPlans,
  programCategories,
  recognitions,
  reviews
} from "../data/siteContent";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { isOAuthPopupMessage, normalizeOAuthReturnUrl, openOAuthPopup } from "../features/auth/oauthPopup";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  text: string;
  actions?: ReactNode;
};

type PageMessage = { tone: "success" | "error"; text: string } | null;
type AuthPageMode = "login" | "register" | "verify-email";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

const featureGroups = [
  {
    icon: <Sparkles size={24} />,
    title: "AI learning support",
    text: "AI assessments, interview practice, improvement suggestions, and role-based checkpoints."
  },
  {
    icon: <UsersRound size={24} />,
    title: "Mentor-led delivery",
    text: "Live classes, mentor support, project reviews, mock interviews, and career guidance."
  },
  {
    icon: <Layers3 size={24} />,
    title: "Project-first LMS",
    text: "Recorded classes, assignments, projects, assessments, progress tracking, and certification."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Verified outcomes",
    text: "Certificates, QR verification, portfolio proof, resume support, and interview readiness."
  }
];

const ambassadorSteps = ["Apply", "Represent Joviq", "Host campus activities", "Earn recognition"];
const careerRoles = ["HR", "Program Advisor", "Digital Marketing", "Full Stack Developer", "Operations", "Operations Executive"];
const aboutValues = ["Industry-focused education", "Project-first learning", "Mentor-reviewed outcomes", "Career preparation"];

export function ProgramsPage() {
  const [query, setQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState("All");

  const filteredPrograms = useMemo(() => {
    const search = query.trim().toLowerCase();

    return allPrograms.filter((program) => {
      const matchesDomain = activeDomain === "All" || program.domain === activeDomain;
      const searchable = [
        program.title,
        program.domain,
        program.shortDescription,
        program.level,
        ...program.skills,
        ...program.tags
      ]
        .join(" ")
        .toLowerCase();

      return matchesDomain && (!search || searchable.includes(search));
    });
  }, [activeDomain, query]);

  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Programs"
        title="Choose the right career track."
        text="Explore Joviq programs by domain, skill, and outcome. Every track is built around projects, assessment, certification, and career readiness."
        actions={
          <>
            <Link className="site-button site-button--primary" to="/request-callback">
              Request Callback <PhoneCall size={18} />
            </Link>
            <Link className="site-button site-button--light" to="/login">
              Login to LMS <ArrowRight size={18} />
            </Link>
          </>
        }
      />

      <section className="route-section route-program-catalog">
        <div className="route-toolbar">
          <label className="route-search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search AI, Full Stack, VLSI, Finance..."
            />
          </label>
          <div className="route-tabs" aria-label="Program domains">
            <button className={activeDomain === "All" ? "is-active" : undefined} type="button" onClick={() => setActiveDomain("All")}>
              All <span>{allPrograms.length}</span>
            </button>
            {programCategories.map((category) => (
              <button
                key={category.domain}
                className={activeDomain === category.domain ? "is-active" : undefined}
                type="button"
                onClick={() => setActiveDomain(category.domain)}
              >
                {category.domain.replace("Computer Science & IT", "Computer Science")}
                <span>{category.programs.length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="route-program-grid">
          {filteredPrograms.map((program) => (
            <Link key={program.slug} to={`/programs/${program.slug}`}>
              <span>
                <ProgramIcon domain={program.domain} />
              </span>
              <strong>{program.title}</strong>
              <small>{program.domain}</small>
              <p>{program.shortDescription}</p>
              <em>{program.duration}</em>
            </Link>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}

export function FeaturesPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Features"
        title="Everything needed to learn, build, and prove skill."
        text="Joviq combines LMS access, live delivery, projects, mentor review, AI practice, certification, and career support in one learning flow."
        actions={
          <Link className="site-button site-button--primary" to="/programs">
            Explore Programs <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-section route-feature-grid">
        {featureGroups.map((feature) => (
          <article key={feature.title}>
            <div>{feature.icon}</div>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="route-section route-split-band">
        <div>
          <span className="apt-pill">
            <BadgeCheck size={15} />
            LMS capabilities
          </span>
          <h2>Clear progress from first class to certification.</h2>
          <p>Students can track learning, classes, assignments, projects, assessments, AI practice, payments, certifications, and support from their dashboard.</p>
        </div>
        <ul>
          {["Live classes", "Recorded classes", "Assignments", "Projects", "AI Assessment", "AI Interview", "Mentor Support", "Career Support", "Certificate Verification"].map((item) => (
            <li key={item}>
              <CheckCircle2 size={17} />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </PublicPageShell>
  );
}

export function CampusAmbassadorPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Campus Ambassador"
        title="Lead your campus learning community."
        text="Represent Joviq in your college, organize awareness activities, help peers discover career programs, and earn recognition for meaningful outcomes."
        actions={
          <Link className="site-button site-button--primary" to="/request-callback">
            Apply / Request Callback <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-section route-process-grid">
        {ambassadorSteps.map((step, index) => (
          <article key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{step}</h2>
            <p>{index === 0 ? "Share your profile and campus details." : index === 1 ? "Promote programs, events, and student opportunities." : index === 2 ? "Run learning circles, workshops, and peer conversations." : "Receive certificates, rewards, and performance recognition."}</p>
          </article>
        ))}
      </section>
    </PublicPageShell>
  );
}

export function ReviewsPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Reviews"
        title="Student outcomes built through projects and reviews."
        text="Learners value the practical project work, mentor feedback, interview preparation, and confidence they gain before applying for roles."
      />

      <section className="route-section route-review-grid">
        {reviews.map((review) => (
          <article key={review.name}>
            <span>{review.program}</span>
            <p>"{review.quote}"</p>
            <strong>{review.name}</strong>
          </article>
        ))}
        {homeFaqs.slice(0, 3).map((faq) => (
          <article key={faq.question}>
            <span>FAQ</span>
            <p>{faq.answer}</p>
            <strong>{faq.question}</strong>
          </article>
        ))}
      </section>
    </PublicPageShell>
  );
}

export function CareersPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Careers"
        title="Build practical career education with Joviq."
        text="We are looking for people who care about learner outcomes, clear communication, operating discipline, and practical education."
        actions={
          <Link className="site-button site-button--primary" to="/request-callback">
            Contact Hiring Team <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-section route-role-grid">
        {careerRoles.map((role) => (
          <article key={role}>
            <BriefcaseBusiness size={22} />
            <strong>{role}</strong>
            <span>Open for outcome-focused team members.</span>
          </article>
        ))}
      </section>
    </PublicPageShell>
  );
}

export function AboutPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="About Joviq Technologies"
        title="A career-focused learning ecosystem."
        text="Joviq Technologies combines training, real-time projects, mentorship, AI-powered assessments, certification, and career preparation for students and professionals."
        actions={
          <Link className="site-button site-button--primary" to="/programs">
            View Programs <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-section route-about-grid">
        <article>
          <span>Who we are</span>
          <h2>We help learners move from training to job-ready proof.</h2>
          <p>Our model focuses on practical projects, structured review, LMS-driven progress, and clear career preparation rather than passive course watching.</p>
        </article>
        <div>
          {aboutValues.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      </section>

      <section className="route-section route-metric-grid">
        {keyStatistics.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="route-section route-feature-grid">
        {mentors.map((mentor) => (
          <article key={mentor.name}>
            <div>
              <GraduationCap size={24} />
            </div>
            <h2>{mentor.name}</h2>
            <p>{mentor.role}</p>
          </article>
        ))}
      </section>

      <section className="route-section route-proof-list">
        {recognitions.map((item) => (
          <span key={item}>
            <ShieldCheck size={17} />
            {item}
          </span>
        ))}
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
        rememberMe,
        deviceName: "Joviq Web"
      });

      auth.applyAuthResponse(response.data);
      navigate("/dashboard");
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
        privacyPolicyVersion: policyVersion,
        refundPolicyVersion: policyVersion
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

    const popup = openOAuthPopup(
      authApi.oauthStartUrl("google", {
        returnUrl: "/dashboard",
        acceptedTerms: allowSignUp ? acceptedOAuthTerms : false,
        allowSignUp,
        phoneNumber: allowSignUp ? phoneNumber : undefined,
        rememberMe,
        termsVersion: policyVersion,
        privacyPolicyVersion: policyVersion,
        refundPolicyVersion: policyVersion
      })
    );

    if (!popup) {
      setMessage({ tone: "error", text: "Please allow pop-ups for this site to continue with Google." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ tone: "success", text: "Complete Google sign-in in the popup window." });
    popup.focus();

    const popupClosedTimer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(popupClosedTimer);
        window.removeEventListener("message", handleOAuthMessage);
        setIsSubmitting(false);
        setMessage({ tone: "error", text: "Google sign-in was closed before it finished." });
      }
    }, 600);

    async function handleOAuthMessage(event: MessageEvent) {
      if (!isOAuthPopupMessage(event)) {
        return;
      }

      window.clearInterval(popupClosedTimer);
      window.removeEventListener("message", handleOAuthMessage);

      if (event.data.status === "error") {
        setIsSubmitting(false);
        setMessage({ tone: "error", text: event.data.error ?? "Google sign-in failed. Please try again." });
        return;
      }

      try {
        await auth.refresh();
        navigate(normalizeOAuthReturnUrl(event.data.returnUrl));
      } catch (error) {
        setMessage({ tone: "error", text: formatApiError(error) });
      } finally {
        setIsSubmitting(false);
      }
    }

    window.addEventListener("message", handleOAuthMessage);
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
          <p>Secure access for students, mentors, and admins with project-driven learning workflows.</p>
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
                Continue with Google
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
                  <span>I accept the terms, privacy policy, and refund policy.</span>
                </label>
                <button
                  className="auth-secondary-button auth-oauth-button"
                  type="button"
                  onClick={() => beginGoogleOAuth(true)}
                  disabled={isSubmitting}
                >
                  <ShieldCheck size={18} />
                  Continue with Google
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
                <span>I accept the terms, privacy policy, and refund policy.</span>
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

          {message ? <div className={`auth-message auth-message--${message.tone}`}>{message.text}</div> : null}
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
      {message ? <div className={`auth-message auth-message--${message.tone}`}>{message.text}</div> : null}
    </form>
  );
}

function ProgramIcon({ domain }: { domain: string }) {
  if (domain.includes("Computer")) {
    return <Code2 size={22} />;
  }

  if (domain.includes("Electrical")) {
    return <Cpu size={22} />;
  }

  if (domain.includes("Mechanical")) {
    return <Wrench size={22} />;
  }

  if (domain.includes("Civil")) {
    return <Building2 size={22} />;
  }

  return <Lightbulb size={22} />;
}

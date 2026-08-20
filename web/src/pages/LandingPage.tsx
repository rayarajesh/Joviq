import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Code2,
  Cpu,
  Eye,
  EyeOff,
  Gauge,
  GraduationCap,
  KeyRound,
  Layers3,
  LockKeyhole,
  MailCheck,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
type AuthMessage = { tone: "success" | "error"; text: string } | null;
type AuthMode = "login" | "register" | "verify-email" | "forgot-password" | "reset-password";

const programs = [
  {
    title: "Generative AI",
    text: "Prompt engineering, copilots, RAG apps, and production AI workflows.",
    meta: "Project studio",
    Icon: BrainCircuit
  },
  {
    title: "Full Stack",
    text: ".NET API layers, React interfaces, PostgreSQL, auth, and deployment.",
    meta: "Career track",
    Icon: Code2
  },
  {
    title: "Data Science",
    text: "Analytics, ML foundations, dashboards, model evaluation, and reporting.",
    meta: "Portfolio ready",
    Icon: BarChart3
  },
  {
    title: "VLSI",
    text: "Digital design, verification practice, workflows, and interview preparation.",
    meta: "Core engineering",
    Icon: Cpu
  }
];

const outcomes = [
  {
    title: "Live mentor loops",
    text: "Every learner gets guided review cycles, project feedback, and clear next steps.",
    Icon: UsersRound
  },
  {
    title: "Assessment engine",
    text: "Track quizzes, tasks, project rubrics, and certification readiness in one place.",
    Icon: Gauge
  },
  {
    title: "Verified certificates",
    text: "Completion paths are mapped to projects, mentor reviews, and skill evidence.",
    Icon: Award
  }
];

const navItems = [
  { label: "Programs", href: "#programs" },
  { label: "Outcomes", href: "#outcomes" },
  { label: "Workspaces", href: "#workspaces" }
];

export function LandingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState<AuthMessage>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingResetEmail, setPendingResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
  }

  function scrollToAuth(nextMode: AuthMode) {
    setIsMenuOpen(false);
    selectMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById("auth")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    try {
      const response = await authApi.login({
        email,
        password: String(form.get("password") ?? ""),
        rememberMe: true,
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
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    if (password !== confirmPassword) {
      setMessage({ tone: "error", text: "Password and confirm password must match." });
      setIsSubmitting(false);
      return;
    }

    try {
      await authApi.register({
        fullName: String(form.get("fullName") ?? ""),
        email,
        phoneNumber: toIndiaMobileNumber(form.get("phoneNumber")),
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

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    try {
      await authApi.forgotPassword(email);
      setPendingResetEmail(email);
      setMode("reset-password");
      setMessage({ tone: "success", text: `Password reset OTP sent to ${email}.` });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const otp = String(form.get("otp") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setMessage({ tone: "error", text: "New password and confirm password must match." });
      setIsSubmitting(false);
      return;
    }

    try {
      const verification = await authApi.verifyForgotPassword(pendingResetEmail, otp);
      await authApi.resetPassword({
        userId: verification.data.userId,
        resetToken: verification.data.resetToken,
        newPassword,
        confirmPassword
      });

      setMode("login");
      setMessage({ tone: "success", text: "Password reset successfully. Login with your new password." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendPasswordResetOtp() {
    if (!pendingResetEmail) {
      setMode("forgot-password");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await authApi.forgotPassword(pendingResetEmail);
      setMessage({ tone: "success", text: `New password reset OTP sent to ${pendingResetEmail}.` });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyRegistrationOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);

    try {
      await authApi.verifyEmail(pendingEmail, String(form.get("otp") ?? ""));
      setMode("login");
      setMessage({ tone: "success", text: "Email verified successfully. You can login now." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendRegistrationOtp() {
    if (!pendingEmail) {
      setMode("register");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await authApi.sendEmailVerification(pendingEmail);
      setMessage({ tone: "success", text: `New OTP sent to ${pendingEmail}.` });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="landing-page">
      <header className={`landing-nav ${isMenuOpen ? "is-open" : ""}`}>
        <a className="landing-nav__brand" href="#home" aria-label="Joviq Technologies LMS home" onClick={() => setIsMenuOpen(false)}>
          <span className="landing-nav__mark">
            <Sparkles size={20} />
          </span>
          <span>
            <strong>Joviq Technologies</strong>
            <small>Learning Management System</small>
          </span>
        </a>
        <nav className="landing-nav__links" aria-label="Landing page navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="landing-nav__actions">
          <button type="button" onClick={() => scrollToAuth("login")}>
            Login
          </button>
          <button className="is-primary" type="button" onClick={() => scrollToAuth("register")}>
            Register
            <ArrowRight size={16} />
          </button>
        </div>
        <button
          className="landing-nav__menu-button"
          type="button"
          aria-controls="landing-mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div id="landing-mobile-menu" className="landing-nav__mobile" aria-hidden={!isMenuOpen}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          <div className="landing-nav__mobile-actions">
            <button type="button" onClick={() => scrollToAuth("login")}>
              Login
            </button>
            <button className="is-primary" type="button" onClick={() => scrollToAuth("register")}>
              Register
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <section id="home" className="hero" aria-labelledby="landing-title">
        <div className="hero__content">
          <div className="brand-mark">
            <Sparkles size={22} />
            <span>Career LMS for ambitious learners</span>
          </div>
          <h1 id="landing-title">
            <span>Learn with mentors.</span>
            <span>Build real projects.</span>
            <span>Get hired faster.</span>
          </h1>
          <p className="hero__copy">
            Career-focused programs with mentors, real-time projects, assessments, certificates, and dedicated LMS
            workspaces for students, mentors, and admins.
          </p>
          <div className="hero__actions">
            <button className="hero-button hero-button--primary" type="button" onClick={() => scrollToAuth("register")}>
              Start learning <ArrowRight size={18} />
            </button>
            <a href="#programs" className="hero-button hero-button--light">
              Explore programs
            </a>
          </div>
          <div className="hero__metrics" aria-label="Joviq LMS highlights">
            <article>
              <strong>4</strong>
              <span>Career tracks</span>
            </article>
            <article>
              <strong>3</strong>
              <span>Role dashboards</span>
            </article>
            <article>
              <strong>100%</strong>
              <span>Project-led learning</span>
            </article>
          </div>
        </div>
      </section>

      <section id="programs" className="program-band" aria-label="Joviq LMS programs">
        {programs.map((program) => {
          const Icon = program.Icon;

          return (
            <article key={program.title} className="program-tile">
              <div className="program-tile__top">
                <Icon size={23} />
                <small>{program.meta}</small>
              </div>
              <strong>{program.title}</strong>
              <span>{program.text}</span>
              <BookOpenCheck size={20} className="program-tile__end" />
            </article>
          );
        })}
      </section>

      <section id="outcomes" className="outcome-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Learning system</span>
            <h2>Built for momentum from login to placement.</h2>
          </div>
          <p>
            Joviq LMS connects curriculum, mentors, projects, assessments, certificates, and access control into one
            focused learning journey.
          </p>
        </div>

        <div className="bento-grid">
          <article className="bento-card bento-card--wide">
            <Layers3 size={24} />
            <h3>One flow for daily learning, mentor review, and proof of work.</h3>
            <div className="pipeline-bars" aria-hidden="true">
              <span style={{ width: "92%" }} />
              <span style={{ width: "76%" }} />
              <span style={{ width: "84%" }} />
            </div>
          </article>
          {outcomes.map((outcome) => {
            const Icon = outcome.Icon;

            return (
              <article key={outcome.title} className="bento-card">
                <Icon size={22} />
                <h3>{outcome.title}</h3>
                <p>{outcome.text}</p>
              </article>
            );
          })}
          <article className="bento-card bento-card--accent">
            <ShieldCheck size={22} />
            <h3>Secure role-based access</h3>
            <p>Admin, mentor, and student experiences stay separated with RBAC-backed dashboards.</p>
          </article>
        </div>
      </section>

      <section id="workspaces" className="split-section">
        <div className="value-panel">
          <span className="eyebrow">Role based LMS</span>
          <h2>One platform, three focused workspaces.</h2>
          <p>
            Each user lands in a dedicated dashboard with the actions they need most, without mixing admin controls into
            learning workflows.
          </p>
          <div className="role-cards">
            <article>
              <Building2 size={22} />
              <strong>Admin</strong>
              <span>Add mentors and students, review users, and manage access.</span>
            </article>
            <article>
              <GraduationCap size={22} />
              <strong>Mentor</strong>
              <span>Track learners, review projects, and guide career preparation.</span>
            </article>
            <article>
              <UserPlus size={22} />
              <strong>Student</strong>
              <span>Continue learning, submit work, view progress, and prepare for interviews.</span>
            </article>
          </div>
          <div className="workspace-proof">
            <CheckCircle2 size={20} />
            <span>New registrations automatically enter as students after email OTP verification.</span>
          </div>
        </div>

        <div id="auth" className="auth-card">
          <div className="auth-card__tabs">
            <button
              className={["login", "forgot-password", "reset-password"].includes(mode) ? "is-active" : ""}
              type="button"
              onClick={() => selectMode("login")}
            >
              <LockKeyhole size={17} />
              Login
            </button>
            <button
              className={["register", "verify-email"].includes(mode) ? "is-active" : ""}
              type="button"
              onClick={() => selectMode("register")}
            >
              <UserPlus size={17} />
              Register
            </button>
          </div>

          {mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <h2>Welcome back</h2>
              <p>Login with your Joviq LMS account.</p>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={256}
                  pattern={emailPattern}
                  title="Enter a valid email address."
                  required
                />
              </label>
              <label>
                Password
                <PasswordInput name="password" autoComplete="current-password" required />
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in" : "Login to dashboard"}
                <ArrowRight size={18} />
              </button>
              <button className="auth-link-button" type="button" onClick={() => selectMode("forgot-password")}>
                Forgot password?
              </button>
            </form>
          ) : mode === "register" ? (
            <form className="auth-form" onSubmit={handleRegister}>
              <h2>Create student account</h2>
              <p>After registration, an email OTP is sent and verified here.</p>
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
                  title="Enter a valid email address."
                  required
                />
              </label>
              <IndiaMobileInput label="Phone number" name="phoneNumber" required />
              <label>
                Password
                <PasswordInput name="password" autoComplete="new-password" placeholder="Student@123" required />
              </label>
              <label>
                Confirm password
                <PasswordInput name="confirmPassword" autoComplete="new-password" placeholder="Student@123" required />
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
          ) : mode === "verify-email" ? (
            <form className="auth-form" onSubmit={handleVerifyRegistrationOtp}>
              <h2>Verify email OTP</h2>
              <p>Enter the OTP sent to {pendingEmail || "your email"}.</p>
              <label>
                Email
                <input name="email" type="email" value={pendingEmail} readOnly />
              </label>
              <label>
                OTP
                <OtpInput />
              </label>
              <button type="submit" disabled={isSubmitting || !pendingEmail}>
                {isSubmitting ? "Verifying" : "Verify and activate"}
                <MailCheck size={18} />
              </button>
              <button className="auth-secondary-button" type="button" onClick={resendRegistrationOtp} disabled={isSubmitting}>
                <RefreshCw size={17} />
                Resend OTP
              </button>
            </form>
          ) : mode === "forgot-password" ? (
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <h2>Forgot password</h2>
              <p>Enter your registered email. We will send a password reset OTP.</p>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={256}
                  pattern={emailPattern}
                  title="Enter a valid email address."
                  required
                />
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending OTP" : "Send reset OTP"}
                <KeyRound size={18} />
              </button>
              <button className="auth-link-button" type="button" onClick={() => selectMode("login")}>
                Back to login
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <h2>Reset password</h2>
              <p>Enter the OTP sent to {pendingResetEmail || "your email"} and choose a new password.</p>
              <label>
                Email
                <input name="email" type="email" value={pendingResetEmail} readOnly />
              </label>
              <label>
                OTP
                <OtpInput />
              </label>
              <label>
                New password
                <PasswordInput name="newPassword" autoComplete="new-password" placeholder="Student@123" required />
              </label>
              <label>
                Confirm new password
                <PasswordInput name="confirmPassword" autoComplete="new-password" placeholder="Student@123" required />
              </label>
              <button type="submit" disabled={isSubmitting || !pendingResetEmail}>
                {isSubmitting ? "Resetting" : "Reset password"}
                <KeyRound size={18} />
              </button>
              <button className="auth-secondary-button" type="button" onClick={resendPasswordResetOtp} disabled={isSubmitting}>
                <RefreshCw size={17} />
                Resend OTP
              </button>
              <button className="auth-link-button" type="button" onClick={() => selectMode("login")}>
                Back to login
              </button>
            </form>
          )}

          {message ? <div className={`auth-message auth-message--${message.tone}`}>{message.text}</div> : null}
        </div>
      </section>

      <footer className="landing-footer">
        <strong>Joviq Technologies LMS</strong>
        <span>Admin, mentor, and student learning workspaces.</span>
      </footer>
    </main>
  );
}

function PasswordInput({
  name,
  autoComplete,
  placeholder,
  required
}: {
  name: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="auth-password-field">
      <input
        name={name}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={8}
        maxLength={128}
        placeholder={placeholder}
        title="Password must be at least 8 characters."
        required={required}
      />
      <button type="button" onClick={() => setIsVisible((value) => !value)} title="Show or hide password">
        {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function OtpInput() {
  return (
    <input
      name="otp"
      inputMode="numeric"
      maxLength={6}
      minLength={6}
      pattern="[0-9]{6}"
      placeholder="123456"
      title="Enter the 6-digit OTP from your email."
      onInput={(event) => {
        event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
      }}
      required
    />
  );
}

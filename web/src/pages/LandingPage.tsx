import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Layers3,
  Lightbulb,
  LockKeyhole,
  MailCheck,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import {
  allPrograms,
  homeFaqs,
  pricingPlans,
  programCategories
} from "../data/siteContent";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { isOAuthPopupMessage, normalizeOAuthReturnUrl, openOAuthPopup } from "../features/auth/oauthPopup";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

type AuthMessage = { tone: "success" | "error"; text: string } | null;
type AuthMode = "login" | "register" | "verify-email" | "forgot-password" | "reset-password";

const expertCompanies = ["Meta", "Apple", "Amazon", "Netflix", "Google", "Adobe", "Microsoft"];

const enterpriseStack = [
  "Cashfree Payments",
  "Clerk",
  "Google Cloud",
  "Gemini",
  "Meta",
  "MongoDB",
  "PostgreSQL",
  "React"
];

const alumniWall = [
  "Google",
  "Amazon",
  "NVIDIA",
  "Accenture",
  "Deloitte",
  "Bosch",
  "Jio",
  "TCS",
  "Tech Mahindra",
  "Goldman Sachs",
  "Oracle",
  "Samsung",
  "Infosys",
  "Wipro",
  "SAP",
  "Capgemini",
  "HCLTech",
  "Cognizant",
  "CGI",
  "NTT DATA",
  "Fractal",
  "Publicis Sapient",
  "Optum",
  "Eurofins",
  "Birlasoft",
  "Rakuten",
  "Societe Generale",
  "ADP"
];

const outcomeStories = [
  {
    name: "Ananya Rao",
    program: "CSE - 3rd Year",
    badge: "Internship",
    quote: "Portfolio and resume cleanup changed the way I explained my work.",
    result: "Internship shortlist in 14 days"
  },
  {
    name: "Ishita Sharma",
    program: "IT - 4th Year",
    badge: "Interview Win",
    quote: "Rubric-based feedback taught me to explain projects with confidence.",
    result: "Cracked 3 technical rounds"
  },
  {
    name: "Karthik Iyer",
    program: "ECE - Final Year",
    badge: "Job Offer",
    quote: "The interview became a walkthrough of the projects I had already built.",
    result: "Offer after project deep-dive"
  },
  {
    name: "Nikhil Shetty",
    program: "Mechanical - 4th Year",
    badge: "Interview Win",
    quote: "I learned to present work with clarity and evidence.",
    result: "Confidence in interview narration"
  },
  {
    name: "Tanvi Joshi",
    program: "CSE - Final Year",
    badge: "Job Offer",
    quote: "Expert reviews exposed weak spots before the real interview.",
    result: "Converted final HR discussion"
  },
  {
    name: "Sanjana Reddy",
    program: "CSE - 3rd Year",
    badge: "Internship",
    quote: "Timed practice fixed my speed and project storytelling.",
    result: "Shortlisted for internship tests"
  }
];

const certificationProofs = [
  "Outcome-based credential",
  "Hiring trust built-in",
  "Clean and shareable"
];

const roadmapSteps = ["Register", "Share goals", "Pick a program", "Payment & access", "Start learning"];

function authModeFromHash(hash: string): AuthMode | null {
  if (hash === "#auth-register" || hash === "#register") {
    return "register";
  }

  if (hash === "#auth" || hash === "#auth-login" || hash === "#login") {
    return "login";
  }

  return null;
}

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>(() => authModeFromHash(location.hash) ?? "login");
  const [message, setMessage] = useState<AuthMessage>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingResetEmail, setPendingResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedOAuthTerms, setAcceptedOAuthTerms] = useState(false);
  const [oauthPhoneNumber, setOauthPhoneNumber] = useState("");
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(authModeFromHash(location.hash) !== null);
  const [isCallbackDialogOpen, setIsCallbackDialogOpen] = useState(false);
  const [heroParallax, setHeroParallax] = useState<Record<string, string>>({
    "--hero-bg-x": "50%",
    "--hero-bg-y": "50%",
    "--hero-card-x": "0px",
    "--hero-card-y": "0px",
    "--hero-dashboard-x": "0px",
    "--hero-dashboard-y": "0px",
    "--hero-line-x": "0px"
  });
  const [programSearchQuery, setProgramSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = programSearchQuery.trim().toLowerCase();

    if (!query) {
      return allPrograms.slice(0, 8);
    }

    return allPrograms.filter((program) => {
      const searchable = [
        program.title,
        program.domain,
        program.shortDescription,
        program.level,
        ...program.tags,
        ...program.skills
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [programSearchQuery]);

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
  }

  function scrollToAuth(nextMode: AuthMode) {
    selectMode(nextMode);
    setIsAuthDialogOpen(true);
  }

  function closeAuthDialog() {
    setIsAuthDialogOpen(false);
    setMessage(null);
  }

  function scrollToCallback() {
    setIsCallbackDialogOpen(true);
  }

  function handleHeroPointerMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    setHeroParallax({
      "--hero-bg-x": `${50 + x * 3}%`,
      "--hero-bg-y": `${50 + y * 2}%`,
      "--hero-card-x": `${x * -22}px`,
      "--hero-card-y": `${y * -18}px`,
      "--hero-dashboard-x": `${x * 18}px`,
      "--hero-dashboard-y": `${y * 14}px`,
      "--hero-line-x": `${x * 34}px`
    });
  }

  function resetHeroParallax() {
    setHeroParallax({
      "--hero-bg-x": "50%",
      "--hero-bg-y": "50%",
      "--hero-card-x": "0px",
      "--hero-card-y": "0px",
      "--hero-dashboard-x": "0px",
      "--hero-dashboard-y": "0px",
      "--hero-line-x": "0px"
    });
  }

  useEffect(() => {
    const nextMode = authModeFromHash(location.hash);

    if (nextMode) {
      selectMode(nextMode);
      setIsAuthDialogOpen(true);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!location.hash || authModeFromHash(location.hash)) {
      return;
    }

    const sectionId = decodeURIComponent(location.hash.slice(1));
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  useEffect(() => {
    const revealSelectors = [
      ".site-hero__copy-block",
      ".site-hero__dashboard",
      ".program-search",
      ".apt-section > .apt-pill",
      ".apt-section h2",
      ".apt-section p",
      ".brand-grid strong",
      ".recognition-stage > *",
      ".official-partner",
      ".process-stepper",
      ".process-panel",
      ".category-card",
      ".outcome-story-grid article",
      ".certificate-section > *",
      ".pricing-grid article",
      ".faq-showcase",
      ".mini-split > *",
      ".final-cta",
      ".public-footer__top",
      ".public-footer__grid"
    ].join(",");

    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelectors));

    if (!elements.length) {
      return;
    }

    document.documentElement.classList.add("motion-ready");
    elements.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 8, 6) * 55}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    function isInsideViewport(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      return rect.top < viewportHeight * 0.96 && rect.bottom > viewportHeight * 0.04;
    }

    elements.forEach((element) => {
      if (isInsideViewport(element)) {
        element.classList.add("is-visible");
        return;
      }

      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      elements.forEach((element) => {
        element.classList.remove("reveal-on-scroll", "is-visible");
        element.style.removeProperty("--reveal-delay");
      });
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  useEffect(() => {
    if (!isAuthDialogOpen && !isCallbackDialogOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuthDialog();
        setIsCallbackDialogOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthDialogOpen, isCallbackDialogOpen]);

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
        rememberMe: form.get("rememberMe") === "on",
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
        closeAuthDialog();
        navigate(normalizeOAuthReturnUrl(event.data.returnUrl));
      } catch (error) {
        setMessage({ tone: "error", text: formatApiError(error) });
      } finally {
        setIsSubmitting(false);
      }
    }

    window.addEventListener("message", handleOAuthMessage);
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
    <main className="site-page">
      <PublicNavbar />

      <section
        id="home"
        className="site-hero"
        aria-labelledby="site-title"
        onMouseMove={handleHeroPointerMove}
        onMouseLeave={resetHeroParallax}
        style={heroParallax as CSSProperties}
      >
        <div className="site-hero__content">
          <div className="site-hero__copy-block">
            <div className="site-kicker">
              <Sparkles size={18} />
              <span>Career-focused training / AI-powered LMS</span>
            </div>
            <h1 id="site-title">Joviq Career Programs</h1>
            <p>
              Expert-led cohorts, AI-assisted checkpoints, mentor-reviewed projects, verified certifications, and
              interview support for students and professionals.
            </p>
            <div className="site-hero__actions">
              <Link className="site-button site-button--primary" to="/programs">
                Explore Programs <ArrowRight size={18} />
              </Link>
              <Link className="site-button site-button--light" to="/request-callback">
                Talk to Career Expert <PhoneCall size={18} />
              </Link>
              <Link className="site-button site-button--ghost" to="/login">
                Login to LMS <LockKeyhole size={18} />
              </Link>
            </div>
            <div className="site-hero__proof" aria-label="Website highlights">
              <span>Expert-led cohorts</span>
              <span>Internship-grade projects</span>
              <span>Rubrics + certification</span>
            </div>
          </div>

          <div className="site-hero__dashboard" aria-hidden="true">
            <div className="hero-dashboard-card hero-dashboard-card--main hero-cohort-card">
              <span>Next batch</span>
              <strong>10 Sept</strong>
              <small>Limited seats / live cohort</small>
              <div className="hero-seat-meter">
                <div>
                  <span style={{ width: "68%" }} />
                </div>
                <small>12 seats left</small>
              </div>
            </div>
            <div className="hero-dashboard-card hero-expert-card">
              <UsersRound size={20} />
              <strong>MAANG-style mentor loop</strong>
              <span>Weekly reviews, portfolio fixes, and mock interviews.</span>
            </div>
            <div className="hero-dashboard-card hero-expert-card">
              <Lightbulb size={20} />
              <strong>AI practice engine</strong>
              <span>Smart checkpoints, quizzes, and project feedback.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="program-search" className="site-section site-section--lift">
        <div className="program-search">
          <div>
            <span className="site-eyebrow">Program Search</span>
            <h2>What do you want to learn?</h2>
          </div>
          <label className="program-search__field">
            <Search size={20} />
            <input
              value={programSearchQuery}
              onChange={(event) => setProgramSearchQuery(event.target.value)}
              placeholder="Search any Joviq program (AI, Full Stack, DevOps, Finance...)"
            />
          </label>
          <div className="program-search__results">
            {searchResults.length ? (
              searchResults.map((program) => (
                <Link key={program.slug} to={`/programs/${program.slug}`}>
                  <strong>{program.title}</strong>
                  <span>{program.domain}</span>
                  <ChevronRight size={16} />
                </Link>
              ))
            ) : (
              <p>No matching programs found.</p>
            )}
          </div>
        </div>
      </section>

      <section id="features" className="site-section apt-section apt-centered">
        <span className="apt-pill">
          <BriefcaseBusiness size={15} />
          Expert Profile
        </span>
        <h2>
          Learn from the <span>top 1% in the industry.</span>
        </h2>
        <p>Mentorship led by experienced engineers and operators from high-trust technology teams.</p>
        <BrandGrid items={expertCompanies} tone="prime" />
      </section>

      <section id="about" className="apt-recognition">
        <div className="apt-section apt-centered">
          <span className="apt-pill apt-pill--dark">
            <BadgeCheck size={15} />
            Our Recognitions
          </span>
          <h2>
            Trusted by the industry. <span>Recognized for outcomes.</span>
          </h2>
          <p>Project-first training, verified assessments, and quality-driven education services.</p>
          <div className="recognition-stage">
            <div className="certificate-sheet certificate-sheet--wide">
              <span>Certificate of Recognition</span>
              <strong>Joviq Technologies</strong>
              <small>Project-first career learning model</small>
            </div>
            <div className="certificate-sheet">
              <span>Quality Standard</span>
              <strong>ISO Ready Process</strong>
              <small>Review-driven learning operations</small>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section apt-section apt-centered">
        <span className="apt-pill">
          <Building2 size={15} />
          Join the best
        </span>
        <h2>
          Our <span>hiring partner</span>
        </h2>
        <p>Get connected with companies that trust structured curriculum and hire from reviewed talent pools.</p>
        <div className="official-partner">OptimHire</div>
      </section>

      <section id="copilot" className="site-section apt-section apt-powered apt-centered">
        <span className="apt-pill">
          <ShieldCheck size={15} />
          Powered by
        </span>
        <h2>
          Enterprise-grade. <span>Secure & reliable.</span>
        </h2>
        <p>Built for stability, protected access, and uninterrupted learning workflows.</p>
        <BrandGrid items={[...enterpriseStack, ...enterpriseStack]} tone="muted" />
      </section>

      <section className="site-section apt-section apt-process">
        <div className="apt-centered">
          <p className="process-note">Simple steps. Tight outcomes. Zero confusion.</p>
          <Link className="site-button site-button--primary" to="/request-callback">
            <PhoneCall size={18} />
            Talk to Career Expert
          </Link>
        </div>
        <div className="process-stepper">
          {roadmapSteps.map((step, index) => (
            <article key={step} className={index === 0 ? "is-active" : undefined}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
        <div className="process-panel">
          <article>
            <span className="apt-pill">
              <UserPlus size={15} />
              Step 01
            </span>
            <h3>Register</h3>
            <ul>
              <li>
                <CheckCircle2 size={16} />
                Quick signup
              </li>
              <li>
                <CheckCircle2 size={16} />
                No noise
              </li>
              <li>
                <CheckCircle2 size={16} />
                Start in minutes
              </li>
            </ul>
          </article>
          <article>
            <span className="apt-pill">What happens here</span>
            <h3>Create your account and set your starting point.</h3>
            <div className="process-progress">
              <span>Progress</span>
              <strong>1/5</strong>
              <div>
                <span style={{ width: "20%" }} />
              </div>
            </div>
            <div className="process-actions">
              <button type="button">Back</button>
              <button type="button">Next</button>
            </div>
          </article>
        </div>
      </section>

      <section id="programs" className="site-section apt-section apt-programs">
        <div className="apt-centered">
          <span className="apt-pill">
            <Layers3 size={15} />
            Program Categories
          </span>
          <h2>
            Choose a domain. <span>Build proof.</span>
          </h2>
          <p>Focused tracks across technology, core engineering, finance, marketing, analytics, and management.</p>
        </div>
        <div className="category-grid">
          {programCategories.map((category) => (
            <article key={category.domain} className="category-card">
              <div className="category-card__top">
                <DomainIcon domain={category.domain} />
                <span>{category.programs.length} programs</span>
              </div>
              <h3>{category.domain}</h3>
              <p>{category.description}</p>
              <div className="category-card__programs">
                {category.programs.map((program) => (
                  <Link key={program.slug} to={`/programs/${program.slug}`}>
                    {program.title}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section apt-section apt-alumni apt-centered">
        <span className="apt-pill">
          <GraduationCap size={15} />
          Alumni Companies
        </span>
        <h2>
          From Joviq to <span>top companies.</span>
        </h2>
        <p>Trust signals that matter: recognizable brands, reviewed projects, and real outcomes.</p>
        <BrandGrid items={alumniWall} tone="logos" />
      </section>

      <section id="reviews" className="site-section apt-section apt-outcomes apt-centered">
        <span className="apt-pill">
          <BookOpenCheck size={15} />
          Interview-ready outcomes
        </span>
        <h2>
          Internships that turn into <span>job offers.</span>
        </h2>
        <p>Strong projects, strict reviews, and interview practice that converts rounds.</p>
        <Link className="site-button site-button--primary" to="/request-callback">
          <PhoneCall size={18} />
          Talk to Career Expert
        </Link>
        <div className="outcome-story-grid">
          {outcomeStories.map((story) => (
            <article key={story.name}>
              <div>
                <strong>{story.name}</strong>
                <span>{story.program}</span>
                <small>{story.badge}</small>
              </div>
              <p>{story.quote}</p>
              <footer>
                <b>{story.result}</b>
                <span>Verified</span>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section id="certifications" className="site-section apt-section certificate-section">
        <div>
          <span className="apt-pill">
            <Award size={15} />
            Certification that signals proof
          </span>
          <h2>
            Get certified. <span>Get hired.</span>
          </h2>
          <p>
            Your certificate is tied to real deliverables, projects, expert checks, and rubric-based evaluation.
          </p>
          <div className="proof-pills">
            <span>Expert-reviewed</span>
            <span>Rubric-scored</span>
            <span>Shareable proof</span>
          </div>
          <div className="credential-list">
            {certificationProofs.map((proof) => (
              <article key={proof}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>{proof}</strong>
                  <span>Issued after rubrics, project review, and mentor approval.</span>
                </div>
              </article>
            ))}
          </div>
          <Link className="site-button site-button--primary" to="/request-callback">
            <PhoneCall size={18} />
            Talk to Career Expert
          </Link>
        </div>
        <div className="certificate-preview-card">
          <span>Certificate Preview</span>
          <strong>Training + expert-led cohort completion</strong>
          <div className="certificate-document">
            <small>Joviq Technologies</small>
            <h3>Certificate of Training</h3>
            <p>Issued for successful completion of project-based career learning.</p>
            <div />
          </div>
          <footer>
            <span>Training</span>
            <span>Internship</span>
            <span>Excellence</span>
          </footer>
        </div>
      </section>

      <section id="pricing" className="site-section apt-section apt-centered">
        <span className="apt-pill">
          <Award size={15} />
          Pricing
        </span>
        <h2>
          Launch pricing. <span>Proven outcomes.</span>
        </h2>
        <p>Cohort seats are limited. Plans are built around projects, evaluations, and hiring readiness.</p>
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={plan.name === "Career Track" ? "is-featured" : undefined}>
              <span>{plan.name}</span>
              <h3>{plan.price}</h3>
              <p>{plan.description}</p>
              <div className="pricing-meta">
                <small>Next batch: 05 Sept</small>
                <small>Limited slots</small>
              </div>
              <div className="pricing-actions">
                <Link to="/request-callback">Proceed to Pay</Link>
                <Link to="/request-callback">
                  Talk to Career Expert
                </Link>
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={17} />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="site-section faq-showcase">
        <aside>
          <span>Got questions?</span>
          <h2>Questions & Answers</h2>
          <p>Clear answers on programs, projects, certificates, and career support.</p>
          <div>
            <span>Expert-led cohorts</span>
            <span>Portfolio-grade projects</span>
            <span>1-year content access</span>
          </div>
        </aside>
        <div className="faq-grid">
          {homeFaqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <span id="auth" className="auth-anchor" aria-hidden="true" />
      <section id="callback" className="site-section final-cta">
        <div>
          <span className="apt-pill apt-pill--dark">Next step</span>
          <h2>Ready for real upskilling?</h2>
          <p>You will train on real projects, learn how to position your work, and get evaluated through a project-first learning program.</p>
          <div className="final-cta__actions">
            <Link className="site-button site-button--primary" to="/request-callback">
              Talk to Career Expert <PhoneCall size={18} />
            </Link>
            <Link className="site-button site-button--light" to="/login">
              Need support? <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />

      <AuthDialog isOpen={isAuthDialogOpen} onClose={closeAuthDialog}>
        <div className="auth-dialog__visual">
          <div className="auth-dialog__badge">
            <Sparkles size={18} />
            Joviq LMS Access
          </div>
          <h2>{mode === "register" || mode === "verify-email" ? "Create your learning account." : "Welcome back to your workspace."}</h2>
          <p>
            Continue into role-based dashboards for students, mentors, and admins with secure access and project-driven
            learning.
          </p>
          <div className="auth-dialog__metrics">
            <span>Projects</span>
            <strong>100+</strong>
          </div>
        </div>
        <div className="auth-dialog__form">
          <AuthTabs mode={mode} selectMode={selectMode} />

          {mode === "login" ? (
            <LoginForm
              isSubmitting={isSubmitting}
              rememberMe={rememberMe}
              onRememberMeChange={setRememberMe}
              onSubmit={handleLogin}
              onForgot={() => selectMode("forgot-password")}
              onGoogle={() => beginGoogleOAuth(false)}
            />
          ) : mode === "register" ? (
            <RegisterForm
              isSubmitting={isSubmitting}
              oauthPhoneNumber={oauthPhoneNumber}
              acceptedOAuthTerms={acceptedOAuthTerms}
              onOAuthPhoneChange={setOauthPhoneNumber}
              onAcceptedOAuthTermsChange={setAcceptedOAuthTerms}
              onSubmit={handleRegister}
              onGoogle={() => beginGoogleOAuth(true)}
            />
          ) : mode === "verify-email" ? (
            <VerifyEmailForm
              isSubmitting={isSubmitting}
              pendingEmail={pendingEmail}
              onSubmit={handleVerifyRegistrationOtp}
              onResend={resendRegistrationOtp}
            />
          ) : mode === "forgot-password" ? (
            <ForgotPasswordForm isSubmitting={isSubmitting} onSubmit={handleForgotPassword} onBack={() => selectMode("login")} />
          ) : (
            <ResetPasswordForm
              isSubmitting={isSubmitting}
              pendingResetEmail={pendingResetEmail}
              onSubmit={handleResetPassword}
              onResend={resendPasswordResetOtp}
              onBack={() => selectMode("login")}
            />
          )}

          {message ? <div className={`auth-message auth-message--${message.tone}`}>{message.text}</div> : null}
        </div>
      </AuthDialog>

      <CallbackDialog isOpen={isCallbackDialogOpen} onClose={() => setIsCallbackDialogOpen(false)} />
    </main>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="site-heading">
      <div>
        <span className="site-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <p>{text}</p>
    </div>
  );
}

function AuthDialog({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="auth-dialog" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="auth-dialog-title" className="sr-only">
          Joviq LMS access
        </h2>
        <button className="auth-dialog__close" type="button" onClick={onClose} aria-label="Close login dialog">
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}

function DomainIcon({ domain }: { domain: string }) {
  if (domain.includes("Computer")) {
    return <Code2 size={24} />;
  }

  if (domain.includes("Electrical")) {
    return <Cpu size={24} />;
  }

  if (domain.includes("Mechanical")) {
    return <Building2 size={24} />;
  }

  return <BarChart3 size={24} />;
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="feature-card">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function LogoCloud({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="logo-cloud">
      <span className="site-eyebrow">{title}</span>
      <div>
        {items.map((item) => (
          <strong key={item}>{item}</strong>
        ))}
      </div>
    </div>
  );
}

function BrandGrid({ items, tone }: { items: string[]; tone: "prime" | "muted" | "logos" }) {
  return (
    <div className={`brand-grid brand-grid--${tone}`}>
      {items.map((item, index) => (
        <strong key={`${item}-${index}`}>{item}</strong>
      ))}
    </div>
  );
}

function CallbackDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="callback-dialog" role="presentation" onMouseDown={onClose}>
      <section
        className="callback-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="callback-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="callback-dialog__close" type="button" onClick={onClose} aria-label="Close callback dialog">
          <X size={18} />
        </button>
        <div className="callback-dialog__header">
          <h2 id="callback-dialog-title">Get your best-fit program roadmap</h2>
          <p>Share a few details. We will suggest the most relevant track.</p>
        </div>
        <CallbackForm />
      </section>
    </div>
  );
}

function CallbackForm() {
  const [message, setMessage] = useState<AuthMessage>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const phoneNumber = toIndiaMobileNumber(form.get("phoneNumber"));

    if (!phoneNumber) {
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return;
    }

    formElement.reset();
    setMessage({ tone: "success", text: "Callback request captured for this website flow." });
  }

  return (
    <form className="callback-card" onSubmit={handleSubmit}>
      <div>
        <span className="site-eyebrow">Talk to Career Expert</span>
        <h3>Get a personal roadmap</h3>
      </div>
      <label>
        Full name
        <input name="fullName" placeholder="Your name" required />
      </label>
      <IndiaMobileInput label="Phone" name="phoneNumber" required />
      <label>
        College / university
        <input name="college" placeholder="College / university name" />
      </label>
      <label>
        State
        <input name="state" placeholder="State" />
      </label>
      <label>
        Department / program interest
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

function AuthTabs({ mode, selectMode }: { mode: AuthMode; selectMode: (mode: AuthMode) => void }) {
  return (
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
  );
}

function LoginForm({
  isSubmitting,
  rememberMe,
  onRememberMeChange,
  onSubmit,
  onForgot,
  onGoogle
}: {
  isSubmitting: boolean;
  rememberMe: boolean;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgot: () => void;
  onGoogle: () => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2>Login to LMS</h2>
      <p>Continue to your Joviq dashboard.</p>
      <OAuthButton isSubmitting={isSubmitting} onClick={onGoogle} />
      <div className="auth-divider">
        <span>or</span>
      </div>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required />
      </label>
      <label>
        Password
        <PasswordInput name="password" autoComplete="current-password" required />
      </label>
      <label className="checkbox-row">
        <input
          name="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => onRememberMeChange(event.currentTarget.checked)}
        />
        <span>Keep me signed in on this device.</span>
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in" : "Login to dashboard"}
        <ArrowRight size={18} />
      </button>
      <button className="auth-link-button" type="button" onClick={onForgot}>
        Forgot password?
      </button>
    </form>
  );
}

function RegisterForm({
  isSubmitting,
  oauthPhoneNumber,
  acceptedOAuthTerms,
  onOAuthPhoneChange,
  onAcceptedOAuthTermsChange,
  onSubmit,
  onGoogle
}: {
  isSubmitting: boolean;
  oauthPhoneNumber: string;
  acceptedOAuthTerms: boolean;
  onOAuthPhoneChange: (value: string) => void;
  onAcceptedOAuthTermsChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoogle: () => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2>Create student account</h2>
      <p>Register and verify your email OTP.</p>
      <div className="auth-oauth-signup">
        <IndiaMobileInput
          label="Phone number for Google sign-up"
          name="oauthPhoneNumber"
          value={oauthPhoneNumber}
          onChange={(event) => onOAuthPhoneChange(event.currentTarget.value)}
        />
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={acceptedOAuthTerms}
            onChange={(event) => onAcceptedOAuthTermsChange(event.currentTarget.checked)}
          />
          <span>I accept the terms, privacy policy, and refund policy.</span>
        </label>
        <OAuthButton isSubmitting={isSubmitting} onClick={onGoogle} />
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
        <PasswordInput name="password" autoComplete="new-password" placeholder="Student@123" enforceComplexity required />
      </label>
      <label>
        Confirm password
        <PasswordInput name="confirmPassword" autoComplete="new-password" placeholder="Student@123" enforceComplexity required />
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
  );
}

function OAuthButton({ isSubmitting, onClick }: { isSubmitting: boolean; onClick: () => void }) {
  return (
    <button className="auth-secondary-button auth-oauth-button" type="button" onClick={onClick} disabled={isSubmitting}>
      <ShieldCheck size={18} />
      Continue with Google
    </button>
  );
}

function VerifyEmailForm({
  isSubmitting,
  pendingEmail,
  onSubmit,
  onResend
}: {
  isSubmitting: boolean;
  pendingEmail: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
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
      <button className="auth-secondary-button" type="button" onClick={onResend} disabled={isSubmitting}>
        <RefreshCw size={17} />
        Resend OTP
      </button>
    </form>
  );
}

function ForgotPasswordForm({
  isSubmitting,
  onSubmit,
  onBack
}: {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2>Forgot password</h2>
      <p>Enter your registered email. We will send a password reset OTP.</p>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending OTP" : "Send reset OTP"}
        <KeyRound size={18} />
      </button>
      <button className="auth-link-button" type="button" onClick={onBack}>
        Back to login
      </button>
    </form>
  );
}

function ResetPasswordForm({
  isSubmitting,
  pendingResetEmail,
  onSubmit,
  onResend,
  onBack
}: {
  isSubmitting: boolean;
  pendingResetEmail: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
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
        <PasswordInput name="newPassword" autoComplete="new-password" placeholder="Student@123" enforceComplexity required />
      </label>
      <label>
        Confirm new password
        <PasswordInput name="confirmPassword" autoComplete="new-password" placeholder="Student@123" enforceComplexity required />
      </label>
      <button type="submit" disabled={isSubmitting || !pendingResetEmail}>
        {isSubmitting ? "Resetting" : "Reset password"}
        <KeyRound size={18} />
      </button>
      <button className="auth-secondary-button" type="button" onClick={onResend} disabled={isSubmitting}>
        <RefreshCw size={17} />
        Resend OTP
      </button>
      <button className="auth-link-button" type="button" onClick={onBack}>
        Back to login
      </button>
    </form>
  );
}

function PasswordInput({
  name,
  autoComplete,
  placeholder,
  enforceComplexity = false,
  required
}: {
  name: string;
  autoComplete?: string;
  placeholder?: string;
  enforceComplexity?: boolean;
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
        pattern={enforceComplexity ? "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,128}$" : undefined}
        placeholder={placeholder}
        title={
          enforceComplexity
            ? "Password must be 8-128 characters and include uppercase, lowercase, number, and symbol."
            : "Password must be at least 8 characters."
        }
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

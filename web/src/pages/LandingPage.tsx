import { JourneySection } from "../components/JourneySection";
import { CertificateSection } from "../components/CertificateSection";
import { ExpertsSection } from "../components/ExpertsSection";
import { HomeHero } from "../components/HomeHero";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
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
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { ToastMessage } from "../components/ToastMessage";
import { SiteFooter } from "../components/SiteFooter";
import {
  allPrograms,
  homeFaqs,
  pricingPlans,
  programCategories
} from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

type AuthMessage = { tone: "success" | "error"; text: string } | null;
type AuthMode = "login" | "register" | "verify-email" | "forgot-password" | "reset-password";

type CompanyLogo = {
  name: string;
  src: string;
  accent: string;
};

const programDomains = ["All", ...programCategories.map((category) => category.domain)];

const alumniWall: CompanyLogo[] = [
  { name: "Google", src: "/assets/company-logos/google.svg", accent: "#4285f4" },
  { name: "Amazon", src: "/assets/company-logos/amazon.svg", accent: "#ff9900" },
  { name: "NVIDIA", src: "/assets/company-logos/nvidia.svg", accent: "#76b900" },
  { name: "Accenture", src: "/assets/company-logos/accenture.svg", accent: "#a100ff" },
  { name: "Deloitte", src: "/assets/company-logos/deloitte.svg", accent: "#86bc25" },
  { name: "Bosch", src: "/assets/company-logos/bosch.svg", accent: "#e20015" },
  { name: "Jio", src: "/assets/company-logos/jio.svg", accent: "#0f3cc9" },
  { name: "TCS", src: "/assets/company-logos/tcs.svg", accent: "#c73c93" },
  { name: "Tech Mahindra", src: "/assets/company-logos/tech-mahindra.svg", accent: "#e31837" },
  { name: "Goldman Sachs", src: "/assets/company-logos/goldman-sachs.svg", accent: "#7399c6" },
  { name: "Oracle", src: "/assets/company-logos/oracle.svg", accent: "#f80000" },
  { name: "Samsung", src: "/assets/company-logos/samsung.svg", accent: "#1428a0" },
  { name: "Infosys", src: "/assets/company-logos/infosys.svg", accent: "#007cc3" },
  { name: "Wipro", src: "/assets/company-logos/wipro.svg", accent: "#7856a2" },
  { name: "SAP", src: "/assets/company-logos/sap.svg", accent: "#0faaff" },
  { name: "Capgemini", src: "/assets/company-logos/capgemini.svg", accent: "#0070ad" },
  { name: "HCLTech", src: "/assets/company-logos/hcltech.svg", accent: "#0067d9" },
  { name: "Cognizant", src: "/assets/company-logos/cognizant.svg", accent: "#000048" },
  { name: "CGI", src: "/assets/company-logos/cgi.png", accent: "#e11937" },
  { name: "NTT DATA", src: "/assets/company-logos/ntt-data.svg", accent: "#0065a8" },
  { name: "Fractal", src: "/assets/company-logos/fractal.svg", accent: "#ef4b5f" },
  { name: "Publicis Sapient", src: "/assets/company-logos/publicis-sapient.svg", accent: "#ff2e63" },
  { name: "Optum", src: "/assets/company-logos/optum.svg", accent: "#f36c21" },
  { name: "Eurofins", src: "/assets/company-logos/eurofins.png", accent: "#1254a0" },
  { name: "Birlasoft", src: "/assets/company-logos/birlasoft.png", accent: "#d9262e" },
  { name: "Rakuten", src: "/assets/company-logos/rakuten.svg", accent: "#bf0000" },
  { name: "Societe Generale", src: "/assets/company-logos/societe-generale.svg", accent: "#e50a30" },
  { name: "ADP", src: "/assets/company-logos/adp.svg", accent: "#d0271d" }
];

const outcomeStories = [
  {
    name: "Ananya Rao",
    program: "CSE - 3rd Year",
    badge: "Internship",
    quote: "Portfolio and resume cleanup changed the way I explained my work.",
    result: "Internship shortlist in 14 days",
    portraitPosition: "0% 0%",
    accent: "#5b8cff"
  },
  {
    name: "Ishita Sharma",
    program: "IT - 4th Year",
    badge: "Interview Win",
    quote: "Rubric-based feedback taught me to explain projects with confidence.",
    result: "Cracked 3 technical rounds",
    portraitPosition: "50% 0%",
    accent: "#12a594"
  },
  {
    name: "Karthik Iyer",
    program: "ECE - Final Year",
    badge: "Job Offer",
    quote: "The interview became a walkthrough of the projects I had already built.",
    result: "Offer after project deep-dive",
    portraitPosition: "100% 0%",
    accent: "#f3a93b"
  },
  {
    name: "Nikhil Shetty",
    program: "Mechanical - 4th Year",
    badge: "Interview Win",
    quote: "I learned to present work with clarity and evidence.",
    result: "Confidence in interview narration",
    portraitPosition: "0% 100%",
    accent: "#e36f45"
  },
  {
    name: "Tanvi Joshi",
    program: "CSE - Final Year",
    badge: "Job Offer",
    quote: "Expert feedback exposed weak spots before the real interview.",
    result: "Converted final HR discussion",
    portraitPosition: "50% 100%",
    accent: "#61a66b"
  },
  {
    name: "Sanjana Reddy",
    program: "CSE - 3rd Year",
    badge: "Internship",
    quote: "Timed practice fixed my speed and project storytelling.",
    result: "Shortlisted for internship tests",
    portraitPosition: "100% 100%",
    accent: "#ef7181"
  }
];

const pricingLabels = ["Basic", "Standard", "Pro"];
const pricingArtLabels = ["play", "expert", "target"];
const pricingBenefits = [
  { title: "Expert Experts", text: "Learn from industry professionals.", icon: ShieldCheck },
  { title: "Project-Based Learning", text: "Build real-world projects and portfolios.", icon: Award },
  { title: "Placement Support", text: "Resume, mock interviews & job assistance.", icon: BarChart3 },
  { title: "Lifetime Access", text: "Access recordings & resources whenever you need.", icon: PhoneCall }
];

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
  const programCarouselRef = useRef<HTMLDivElement>(null);
  const programTabsRef = useRef<HTMLDivElement>(null);
  const [programSearchQuery, setProgramSearchQuery] = useState("");
  const [activeProgramDomain, setActiveProgramDomain] = useState("All");



  const searchResults = useMemo(() => {
    const query = programSearchQuery.trim().toLowerCase();
    const domainPrograms =
      activeProgramDomain === "All"
        ? allPrograms
        : allPrograms.filter((program) => program.domain === activeProgramDomain);

    if (!query) {
      return domainPrograms;
    }

    return domainPrograms.filter((program) => {
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
  }, [activeProgramDomain, programSearchQuery]);

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

  function handleOutcomeCardMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    event.currentTarget.style.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x - 0.5) * 10}deg`);
    event.currentTarget.style.setProperty("--shine-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--shine-y", `${y * 100}%`);
  }

  function resetOutcomeCard(event: MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
    event.currentTarget.style.setProperty("--shine-x", "50%");
    event.currentTarget.style.setProperty("--shine-y", "20%");
  }

  function scrollProgramCarousel(direction: -1 | 1) {
    const carousel = programCarouselRef.current;

    if (!carousel) {
      return;
    }

    carousel.scrollBy({
      left: direction * Math.max(carousel.clientWidth * 0.82, 280),
      behavior: "smooth"
    });
  }

  function scrollProgramTabs(direction: -1 | 1) {
    const tabs = programTabsRef.current;

    if (!tabs) {
      return;
    }

    const nextPosition = tabs.scrollLeft + direction * Math.max(tabs.clientWidth * 0.65, 220);
    const isAtEnd = direction === 1 && nextPosition >= tabs.scrollWidth - tabs.clientWidth - 4;
    const isAtStart = direction === -1 && nextPosition <= 4;

    tabs.scrollTo({
      left: isAtEnd ? 0 : isAtStart ? tabs.scrollWidth : nextPosition,
      behavior: "smooth"
    });
  }

  useEffect(() => {
    const interval = window.setInterval(() => scrollProgramTabs(1), 3500);
    return () => window.clearInterval(interval);
  }, []);

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
      ".process-stepper",
      ".process-panel",
      ".category-card",
      ".outcome-story-grid article",
      ".certificate-section > *",
      ".pricing-grid article",
      ".mini-split > *",
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

    setIsSubmitting(true);
    setMessage({ tone: "success", text: "Redirecting to Google..." });
    window.location.assign(
      authApi.oauthStartUrl("google", {
        returnUrl: "/dashboard",
        acceptedTerms: allowSignUp ? acceptedOAuthTerms : false,
        allowSignUp,
        phoneNumber: allowSignUp ? phoneNumber : undefined,
        rememberMe,
        termsVersion: policyVersion,
        privacyPolicyVersion: policyVersion
      })
    );
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

      <HomeHero />

      <ExpertsSection />

      <section id="program-search" className="site-section program-search-section">
        <div className="program-search">
          <header className="program-search__header">
            <span className="apt-pill">
              <Search size={15} />
              Program directory
            </span>
            <h2>
              Find the Program
              <br />
              That <span>Moves You Forward</span>
            </h2>
            <p>Explore career-focused tracks designed with real projects, expert review, and industry-ready skills.</p>
          </header>
          <aside className="program-search__stats" aria-label="Joviq program highlights">
            <div>
              <span className="program-search__stat-icon"><Rocket size={20} /></span>
              <strong>20+</strong>
              <small>Career Programs</small>
            </div>
            <div>
              <span className="program-search__stat-icon"><UsersRound size={20} /></span>
              <strong>5K+</strong>
              <small>Active Learners</small>
            </div>
            <div>
              <span className="program-search__stat-icon"><Star size={20} /></span>
              <strong>4.8/5</strong>
              <small>Learner Rating</small>
            </div>
          </aside>
          <label className="program-search__field">
            <Search size={20} />
            <input
              value={programSearchQuery}
              aria-label="Search Joviq programs"
              onChange={(event) => {
                setProgramSearchQuery(event.target.value);
                programCarouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
              }}
              placeholder="Search any Joviq program (AI, Full Stack, DevOps, Finance...)"
            />
          </label>

          <div className="program-search__tabs-shell">
            <button
              aria-label="Scroll program categories left"
              className="program-search__tabs-arrow"
              onClick={() => scrollProgramTabs(-1)}
              type="button"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="program-search__tabs" ref={programTabsRef} role="tablist" aria-label="Filter programs by category">
              {programDomains.map((domain) => (
                <button
                  aria-controls="program-search-results"
                  aria-selected={activeProgramDomain === domain}
                  className={activeProgramDomain === domain ? "is-active" : undefined}
                  key={domain}
                  onClick={() => {
                    setActiveProgramDomain(domain);
                    programCarouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                  }}
                  role="tab"
                  type="button"
                >
                  {domain !== "All" ? <DomainIcon domain={domain} /> : null}
                  {domain}
                </button>
              ))}
            </div>
            <button
              aria-label="Scroll program categories right"
              className="program-search__tabs-arrow"
              onClick={() => scrollProgramTabs(1)}
              type="button"
            >
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="program-directory__cta"><Link to="/programs">View All Programs <ArrowRight size={19} /></Link><span aria-hidden="true">Your Next<br />Opportunity Starts Here</span></div>
          <div className="program-search__carousel-shell">
            <span className="program-directory__note" aria-hidden="true">Real Skills<br />Real Opportunities</span>
            {searchResults.length > 0 && (
              <button
                aria-label="View previous programs"
                className="program-search__arrow program-search__arrow--previous"
                onClick={() => scrollProgramCarousel(-1)}
                type="button"
              >
                <ArrowLeft size={25} />
              </button>
            )}

            <div
              aria-live="polite"
              className="program-search__viewport"
              id="program-search-results"
              ref={programCarouselRef}
              role="tabpanel"
            >
              <div className="program-search__results">
                {searchResults.length ? (
                  searchResults.map((program, index) => (
                    <Link className="program-showcase-card" key={program.slug} to={`/programs/${program.slug}`}>
                      <span className="program-showcase-card__media">
                        <img
                          alt={`${program.title} program`}
                          decoding="async"
                          loading={index < 4 ? "eager" : "lazy"}
                          src={getProgramImage(program.slug, program.domain)}
                        />
                      </span>
                      <span className="program-showcase-card__body">
                        <small>{program.domain}</small>
                        <strong>{program.title}</strong>
                        <span>{program.shortDescription}</span>
                        <span className="program-directory__metadata"><span><BookOpenCheck size={12} />{program.projects.length} Projects</span><span><CalendarClock size={12} />{program.duration}</span><span><BarChart3 size={12} />{program.level}</span></span>
                        <span className="program-showcase-card__action">Explore program <ArrowRight size={18} /></span>
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="program-search__empty">No matching programs found. Try another skill or domain.</p>
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <button
                aria-label="View more programs"
                className="program-search__arrow program-search__arrow--next"
                onClick={() => scrollProgramCarousel(1)}
                type="button"
              >
                <ArrowRight size={25} />
              </button>
            )}
          </div>
        </div>
      </section>

      <JourneySection />

      <section id="outcomes" className="learner-testimonials" aria-labelledby="testimonials-title">
        <h2 id="testimonials-title">Trusted by Modern <span>Educators and Learners</span></h2>
        <div className="learner-testimonials__grid">
          {outcomeStories.map((story, index) => <article key={story.name}>
            <div className="learner-testimonials__stars" aria-hidden="true">{[0,1,2,3,4].map(star => <Star key={star} size={16} fill="currentColor" />)}</div>
            <blockquote>{story.quote}</blockquote>
            <footer><span className={"learner-testimonials__avatar learner-testimonials__avatar--" + index % 3}>{story.name.split(" ").map(part => part[0]).slice(0,2).join("")}</span><div><strong>{story.name}</strong><small>{story.program}</small></div></footer>
          </article>)}
        </div>
      </section>

      <CertificateSection />



      <section id="pricing" className="site-section apt-section apt-centered">
        <span className="apt-pill">
          <ShieldCheck size={15} />
          Pricing
        </span>
        <h2>
          Simple Plans for <span>Serious Project Work.</span>
        </h2>
        <p>Choose the support level that fits your learning goal, project depth, and career timeline.</p>
        <div className="pricing-orbit pricing-orbit--left" aria-hidden="true"><GraduationCap size={25} /></div>
        <div className="pricing-orbit pricing-orbit--right" aria-hidden="true"><Rocket size={25} /></div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <article
              key={plan.name}
              className={`${plan.name === "Elevate" ? "is-featured" : ""} pricing-card--${pricingArtLabels[index]}`}
            >
              <div className="pricing-card__summary">
                <div className="pricing-card__head">
                  <span>{pricingLabels[index]}</span>
                  {plan.name === "Elevate" ? <strong>Most popular</strong> : null}
                </div>
                <h3>{plan.price.replace("INR", "\u20b9")}</h3>
              </div>
              <p className="pricing-card__description">{plan.description}</p>
              <div className="pricing-meta">
                <small><CalendarClock size={18} /> Next batch:<br /><b>10 Sept</b></small>
                <small><UsersRound size={18} /> Limited<br /><b>slots</b></small>
              </div>
              <div className="pricing-actions">
                <Link to="/programs">
                  View programs
                  <ArrowRight size={17} />
                </Link>
                <Link to="/request-callback">
                  <PhoneCall size={17} />
                  Talk to an advisor
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
        <div className="pricing-benefits" aria-label="Pricing benefits">
          {pricingBenefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title}>
                <span><Icon size={27} /></span>
                <div>
                  <strong>{benefit.title}</strong>
                  <p>{benefit.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="joviq-start" aria-labelledby="joviq-start-title">
        <span className="joviq-start__pill"><Sparkles size={13} />LEARN. BUILD. GROW WITH JOVIQ.</span>
        <h2 id="joviq-start-title">Ready to Build Your<br />Next Career Chapter?</h2>
        <p>Turn learning into real skills with Joviq's guided projects, expert feedback, and career-focused programs.</p>
        <div className="joviq-start__actions">
          <Link to="/programs">Explore Programs <ArrowRight size={16} /></Link>
          <Link to="/request-callback">Talk to an Advisor</Link>
        </div>
      </section>

      <section id="faq" className="site-section faq-showcase">
        <aside>
          <span>Got questions?</span>
          <h2>Questions & Answers</h2>
          <p>Clear answers on programs, projects, certificates, and learner guidance.</p>
          <div>
            <span>Expert-led cohorts</span>
            <span>Portfolio-grade projects</span>
            <span>1-year content access</span>
          </div>
        </aside>
        <div className="faq-grid">
          {homeFaqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary><span>{faq.question}</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <span id="auth" className="auth-anchor" aria-hidden="true" />

      <SiteFooter />

      <AuthDialog isOpen={isAuthDialogOpen} onClose={closeAuthDialog}>
        <div className="auth-dialog__visual">
          <div className="auth-dialog__badge">
            <Sparkles size={18} />
            Joviq LMS Access
          </div>
          <h2>{mode === "register" || mode === "verify-email" ? "Create your learning account." : "Welcome back to your workspace."}</h2>
          <p>
            Continue into role-based dashboards for students and admins with secure access and project-driven
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

          <ToastMessage message={message} onDismiss={() => setMessage(null)} />
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

function BrandGrid({ items, tone }: { items: Array<string | CompanyLogo>; tone: "prime" | "muted" | "logos" }) {
  if (tone === "prime") {
    const logoItems = items.map((item) =>
      typeof item === "string" ? { name: item, src: "", accent: "#075fcf" } : item
    );
    const scrollingItems = [...logoItems, ...logoItems];

    return (
      <div className="brand-grid brand-grid--prime" aria-label="Company logos from expert backgrounds">
        <div className="brand-grid__track">
          {scrollingItems.map((item, index) => {
            const isDuplicate = index >= logoItems.length;

            return (
              <strong
                aria-hidden={isDuplicate}
                className="brand-logo-card"
                data-logo={item.name.toLowerCase()}
                key={`${item.name}-${index}`}
                style={{ "--brand-accent": item.accent } as CSSProperties}
              >
                {item.src ? (
                  <img
                    alt={isDuplicate ? "" : `${item.name} logo`}
                    decoding="async"
                    loading={isDuplicate ? "lazy" : "eager"}
                    src={item.src}
                  />
                ) : (
                  <span>{item.name}</span>
                )}
                <small>{item.name}</small>
              </strong>
            );
          })}
        </div>
      </div>
    );
  }

  if (tone === "logos") {
    const logoItems = items.map((item) =>
      typeof item === "string" ? { name: item, src: "", accent: "#075fcf" } : item
    );

    return (
      <div className="brand-grid brand-grid--logos" role="list" aria-label="Company logos across the employer landscape">
        {logoItems.map((item) => (
          <div
            className="alumni-logo-card"
            data-logo={item.name.toLowerCase()}
            key={item.name}
            role="listitem"
            style={{ "--brand-accent": item.accent } as CSSProperties}
          >
            <span className="alumni-logo-card__mark">
              {item.src ? (
                <img alt={`${item.name} logo`} decoding="async" loading="lazy" src={item.src} />
              ) : (
                <strong>{item.name}</strong>
              )}
            </span>
            <span className="alumni-logo-card__name">{item.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`brand-grid brand-grid--${tone}`}>
      {items.map((item, index) => (
        <strong key={`${typeof item === "string" ? item : item.name}-${index}`}>
          {typeof item === "string" ? item : item.name}
        </strong>
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
      <ToastMessage message={message} onDismiss={() => setMessage(null)} />
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
      <OAuthButton isSubmitting={isSubmitting} onClick={onGoogle} label="Sign in with Google" />
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
          <span>I accept the terms and privacy policy.</span>
        </label>
        <OAuthButton isSubmitting={isSubmitting} onClick={onGoogle} label="Create account with Google" />
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
        <span>I accept the terms and privacy policy.</span>
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating" : "Register as student"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}

function OAuthButton({
  isSubmitting,
  onClick,
  label
}: {
  isSubmitting: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button className="auth-secondary-button auth-oauth-button" type="button" onClick={onClick} disabled={isSubmitting}>
      <ShieldCheck size={18} />
      {label}
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

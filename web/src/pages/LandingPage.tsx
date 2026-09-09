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

const expertCompanies: CompanyLogo[] = [
  {
    name: "Microsoft",
    src: "/assets/company-logos/microsoft.png",
    accent: "#00a4ef"
  },
  {
    name: "Meta",
    src: "/assets/company-logos/meta.svg",
    accent: "#0866ff"
  },
  {
    name: "Apple",
    src: "/assets/company-logos/apple.svg",
    accent: "#111827"
  },
  {
    name: "Amazon",
    src: "/assets/company-logos/amazon.svg",
    accent: "#ff9900"
  },
  {
    name: "Netflix",
    src: "/assets/company-logos/netflix.svg",
    accent: "#e50914"
  },
  {
    name: "Google",
    src: "/assets/company-logos/google.svg",
    accent: "#4285f4"
  },
  {
    name: "Adobe",
    src: "/assets/company-logos/adobe.svg",
    accent: "#fa0f00"
  }
];

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

const certificationProofs = [
  {
    title: "Outcome-based credential",
    description: "Issued after the required project work and expert review are complete."
  },
  {
    title: "Unique verification record",
    description: "Every issued certificate carries its own ID, status, and public verification route."
  },
  {
    title: "Shareable career proof",
    description: "Built for resumes, portfolios, and the conversations that happen during interviews."
  }
];

const certificateTypes = [
  { label: "Training", icon: GraduationCap, title: "Certificate of Training" },
  { label: "Internship", icon: BriefcaseBusiness, title: "Certificate of Internship" },
  { label: "Project", icon: Code2, title: "Certificate of Project" },
  { label: "Excellence", icon: Award, title: "Certificate of Excellence" }
];

const certificateProgress = [
  {
    label: "Enroll",
    action: "Choose your program and complete registration.",
    proof: "Your learner profile and batch access are created."
  },
  {
    label: "Learn",
    action: "Join guided sessions and use lesson replays for revision.",
    proof: "Module progress, quizzes, and practice work are tracked."
  },
  {
    label: "Build",
    action: "Complete hands-on tasks and submit real project work.",
    proof: "Portfolio artifacts and project documentation are prepared."
  },
  {
    label: "Review",
    action: "Get expert feedback, improve submissions, and complete review checkpoints.",
    proof: "Rubric scores and expert review notes validate your skills."
  },
  {
    label: "Certified",
    action: "Receive your QR-verified certificate after completion approval.",
    proof: "Certificate ID, status, and verification route become shareable."
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

const roadmapSteps = [
  {
    title: "Create your profile",
    label: "Register",
    duration: "2 min",
    description: "Set up one learner profile with your background, current skills, and availability.",
    outcome: "A clear starting point your experts can act on.",
    highlights: ["One simple account", "Current skills captured", "Preferences saved from day one"],
    icon: UserPlus
  },
  {
    title: "Set your direction",
    label: "Share goals",
    duration: "10 min",
    description: "Tell us the role, skills, or career move you are working toward so your path has a real destination.",
    outcome: "A focused learning goal instead of a generic course list.",
    highlights: ["Role and skill priorities", "Timeline that fits your life", "Expert-ready context"],
    icon: Lightbulb
  },
  {
    title: "Choose your program",
    label: "Pick a track",
    duration: "1 decision",
    description: "Compare focused tracks by projects, difficulty, and career outcomes before choosing your best fit.",
    outcome: "The right curriculum for the proof you need to build.",
    highlights: ["Project-based comparison", "Clear skill progression", "Expert guidance available"],
    icon: Layers3
  },
  {
    title: "Unlock your workspace",
    label: "Access",
    duration: "Instant",
    description: "Complete secure enrollment and open your learning workspace, schedule, and project resources.",
    outcome: "Everything you need to begin, organized in one place.",
    highlights: ["Secure checkout", "Immediate platform access", "Cohort schedule visible"],
    icon: KeyRound
  },
  {
    title: "Build job-ready proof",
    label: "Start learning",
    duration: "Week 1",
    description: "Learn through guided projects and feedback that improves both your work and your story.",
    outcome: "Reviewed work you can confidently show in interviews.",
    highlights: ["Hands-on project work", "Expert feedback loops", "Portfolio-ready evidence"],
    icon: BookOpenCheck
  }
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
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState(0);
  const [activeCertificateType, setActiveCertificateType] = useState(0);
  const [activeCertificateStep, setActiveCertificateStep] = useState(1);
  const programCarouselRef = useRef<HTMLDivElement>(null);
  const programTabsRef = useRef<HTMLDivElement>(null);
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
  const [activeProgramDomain, setActiveProgramDomain] = useState("All");
  const activeRoadmapStep = roadmapSteps[activeRoadmapIndex];
  const ActiveRoadmapIcon = activeRoadmapStep.icon;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveRoadmapIndex((current) => (current + 1) % roadmapSteps.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

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

      <section
        id="home"
        className="site-hero site-hero--studio"
        aria-labelledby="site-title"
        onMouseMove={handleHeroPointerMove}
        onMouseLeave={resetHeroParallax}
        style={heroParallax as CSSProperties}
      >
        <div className="hero-studio__signals" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="site-hero__content">
          <div className="site-hero__copy-block">
            <div className="site-kicker">
              <Sparkles size={18} />
              <span>AI-powered learning. Expert-led outcomes.</span>
            </div>
            <h1 id="site-title">
              <span>Learn Today.</span>
              <span>Lead Tomorrow.</span>
            </h1>
            <div className="hero-title-accent" aria-hidden="true" />
            <p>
              Real projects, expert review, and practical guidance to go from learner to leader.
            </p>
            <div className="site-hero__actions">
              <Link className="site-button site-button--primary" to="/programs">
                Explore Programs <ArrowRight size={18} />
              </Link>
              <Link className="site-button site-button--light" to="/request-callback">
                Talk to an Advisor <PhoneCall size={18} />
              </Link>
            </div>
            <div className="site-hero__proof" aria-label="Website highlights">
              <span>
                <CheckCircle2 size={16} />
                Live Expert Cohorts
              </span>
              <span>
                <CheckCircle2 size={16} />
                Expert Reviewed Projects
              </span>
              <span>
                <CheckCircle2 size={16} />
                Career Guidance
              </span>
            </div>
          </div>

          <aside className="hero-rating-card" aria-label="Learner trust signals">
            <div>
              <BadgeCheck size={25} />
              <small>Projects Completed</small>
              <strong>24+</strong>
              <span>Hands-on Projects</span>
            </div>
            <div>
              <Star size={25} />
              <small>Learner Rating</small>
              <strong>4.9/5</strong>
              <span>Learner trust signal</span>
            </div>
            <div>
              <UsersRound size={25} />
              <small>Learners Trust Joviq</small>
              <strong>2,500+</strong>
              <span>And growing</span>
            </div>
          </aside>

          <aside className="hero-command-bar" aria-label="Live cohort and program highlights">
            <div className="hero-command-bar__cohort">
              <span className="hero-command-bar__live">
                <GraduationCap size={28} />
                Admissions open
              </span>
              <div className="hero-command-bar__date">
                <small>Next live cohort</small>
                <strong>10 Sept 2025</strong>
                <span>Enroll before seats fill up.</span>
              </div>
              <div className="hero-command-bar__seats">
                <span>
                  <small>Limited seats left</small>
                  <strong>12 Seats Left</strong>
                </span>
                <div>
                  <span style={{ width: "68%" }} />
                </div>
              </div>
            </div>

            <div className="hero-command-bar__metrics">
              <div>
                <Code2 size={20} />
                <strong>20+</strong>
                <span>Career Programs</span>
              </div>
              <div>
                <BriefcaseBusiness size={20} />
                <strong>5-6</strong>
                <span>Projects Per Track</span>
              </div>
              <div>
                <Star size={20} />
                <strong>Weekly</strong>
                <span>Expert Feedback</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="features" className="site-section expert-showcase">
        <div className="expert-showcase__intro">
          <span className="apt-pill">
            <UsersRound size={15} />
            Industry-led guidance
          </span>
          <h2>
            Learn from experts
            <br />
            who build <span>what&apos;s next.</span>
          </h2>
          <p>Real-world knowledge, practical feedback, and industry standards shaped by leaders at top global companies.</p>
        </div>
        <div className="expert-showcase__carousel" aria-label="Companies represented by Joviq experts">
          <BrandGrid items={expertCompanies} tone="prime" />
          <span className="expert-showcase__next" aria-hidden="true">
            <ArrowRight size={20} />
          </span>
          <div className="expert-showcase__dots" aria-hidden="true">
            {expertCompanies.slice(0, 5).map((company, index) => (
              <span className={index === 0 ? "is-active" : undefined} key={company.name} />
            ))}
          </div>
        </div>
      </section>

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

          <div className="program-search__carousel-shell">
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

      <section id="journey" className="site-section apt-section apt-process">
        <div className="process-intro">
          <div className="process-intro__copy">
            <span className="apt-pill">
              <Sparkles size={15} />
              Your Joviq journey
            </span>
            <h2>
              From career goal to <span>proof you can show.</span>
            </h2>
            <p>Five focused milestones take you from your first decision to reviewed, interview-ready work.</p>
          </div>
          <Link className="site-button site-button--primary process-intro__cta" to="/request-callback">
            <PhoneCall size={18} />
            Talk to an advisor
          </Link>
        </div>
        <div className="process-experience">
          <nav className="process-stepper" aria-label="Your five-step Joviq journey">
            {roadmapSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === activeRoadmapIndex;

              return (
                <button
                  aria-current={isActive ? "step" : undefined}
                  className={isActive ? "is-active" : undefined}
                  key={step.title}
                  onClick={() => setActiveRoadmapIndex(index)}
                  type="button"
                >
                  <span className="process-stepper__icon">
                    <StepIcon size={21} />
                  </span>
                  <span className="process-stepper__copy">
                    <small>
                      Step {String(index + 1).padStart(2, "0")} / {step.duration}
                    </small>
                    <strong>{step.title}</strong>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              );
            })}
          </nav>

          <div className="process-panel" aria-live="polite">
            <div className="process-panel__header">
              <span className="process-panel__icon">
                <ActiveRoadmapIcon size={27} />
              </span>
              <div>
                <span className="process-panel__kicker">
                  Step {String(activeRoadmapIndex + 1).padStart(2, "0")} / {activeRoadmapStep.label}
                </span>
                <h3>{activeRoadmapStep.title}</h3>
              </div>
              <span className="process-panel__duration">{activeRoadmapStep.duration}</span>
            </div>

            <p>{activeRoadmapStep.description}</p>

            <div className="process-outcome">
              <BadgeCheck size={24} />
              <div>
                <span>Your outcome</span>
                <strong>{activeRoadmapStep.outcome}</strong>
              </div>
            </div>

            <ul className="process-highlights">
              {activeRoadmapStep.highlights.map((highlight) => (
                <li key={highlight}>
                  <CheckCircle2 size={17} />
                  {highlight}
                </li>
              ))}
            </ul>

            <div className="process-panel__footer">
              <div className="process-progress">
                <span>Journey progress</span>
                <strong>{Math.round(((activeRoadmapIndex + 1) / roadmapSteps.length) * 100)}%</strong>
                <div className="process-progress__bar">
                  <span style={{ width: `${((activeRoadmapIndex + 1) / roadmapSteps.length) * 100}%` }} />
                </div>
              </div>
              <div className="process-actions">
                <button
                  aria-label="Previous journey step"
                  disabled={activeRoadmapIndex === 0}
                  onClick={() => setActiveRoadmapIndex((current) => Math.max(0, current - 1))}
                  type="button"
                >
                  <ArrowLeft size={17} />
                  Back
                </button>
                {activeRoadmapIndex === roadmapSteps.length - 1 ? (
                  <Link to="/#program-search">
                    Explore programs
                    <ArrowRight size={17} />
                  </Link>
                ) : (
                  <button
                    className="is-primary"
                    onClick={() => setActiveRoadmapIndex((current) => Math.min(roadmapSteps.length - 1, current + 1))}
                    type="button"
                  >
                    Next step
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="outcomes" className="site-section apt-section apt-outcomes apt-centered outcomes-showcase">
        <div className="outcomes-showcase__plane" aria-hidden="true" />
        <div className="outcomes-showcase__intro">
          <span className="apt-pill apt-pill--dark">
            <BookOpenCheck size={15} />
            Interview-ready outcomes
          </span>
          <h2>
            Build proof. Walk into interviews <span>ready.</span>
          </h2>
          <p>Real project practice, direct expert feedback, and a career story you can explain with confidence.</p>
          <div className="outcomes-showcase__actions">
            <Link className="site-button site-button--primary" to="/request-callback">
              Talk to an advisor
              <ArrowRight size={18} />
            </Link>
            <Link className="site-button outcomes-showcase__secondary" to="/programs">
              Explore programs
            </Link>
          </div>
        </div>

        <div className="outcome-story-grid outcome-story-stage">
          {outcomeStories.map((story) => (
            <article
              className="outcome-card-3d"
              key={story.name}
              onMouseLeave={resetOutcomeCard}
              onMouseMove={handleOutcomeCardMove}
              style={{
                "--portrait-position": story.portraitPosition,
                "--story-accent": story.accent
              } as CSSProperties}
            >
              <div className="outcome-card-3d__shine" aria-hidden="true" />
              <header className="outcome-card-3d__profile">
                <span
                  aria-label={`Illustrated profile of ${story.name}`}
                  className="outcome-card-3d__portrait"
                  role="img"
                />
                <span className="outcome-card-3d__identity">
                  <strong>{story.name}</strong>
                  <span>{story.program}</span>
                </span>
                <small>
                  <BadgeCheck size={14} />
                  {story.badge}
                </small>
              </header>
              <blockquote>{story.quote}</blockquote>
              <footer>
                <span>
                  <small>Outcome</small>
                  <b>{story.result}</b>
                </span>
                <em>
                  <CheckCircle2 size={15} />
                  Learner result
                </em>
              </footer>
            </article>
          ))}
        </div>

        <div className="outcomes-showcase__closing">
          <div>
            <span>Your next move</span>
            <strong>Build the proof behind your next interview.</strong>
          </div>
          <Link className="site-button site-button--primary" to="/request-callback">
            Talk to an advisor
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section id="certifications" className="site-section apt-section certificate-section certificate-showcase">
        <div className="certificate-showcase__copy">
          <span className="apt-pill">
            <Award size={15} />
            Certification that signals proof
          </span>
          <h2>
            Earn a Credential <span>Built on Proof.</span>
          </h2>
          <p>
            Your certificate represents completed work, assessed skills, and expert-reviewed progress - not attendance
            alone.
          </p>
          <div className="proof-pills">
            <span><UsersRound size={15} /> Expert-reviewed</span>
            <span><BookOpenCheck size={15} /> Rubric-scored</span>
            <span><ShieldCheck size={15} /> Digitally verifiable</span>
          </div>
          <div className="credential-list">
            {certificationProofs.map((proof) => (
              <article key={proof.title}>
                <span className="credential-list__icon"><BadgeCheck size={26} /></span>
                <div>
                  <strong>{proof.title}</strong>
                  <span>{proof.description}</span>
                </div>
              </article>
            ))}
          </div>
          <Link className="site-button site-button--primary" to="/request-callback">
            Plan my certification path
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="certificate-preview-card certificate-preview-stage" aria-label="Interactive certificate preview">
          <div className="certificate-orbit" aria-hidden="true" />
          <header className="certificate-preview-stage__header">
            <div>
              <span>Original certificate preview</span>
            </div>
            <span>
              <ShieldCheck size={16} />
              Issued & Verified
              <i />
            </span>
          </header>

          <button
            className="certificate-floating-badge certificate-floating-badge--verified"
            onClick={() => setActiveCertificateStep(4)}
            type="button"
          >
            <ShieldCheck size={28} />
            <span>Verified<br />Credential</span>
          </button>

          <button
            className="certificate-floating-badge certificate-floating-badge--chain"
            onClick={() => setActiveCertificateStep(4)}
            type="button"
          >
            <Code2 size={29} />
            <span>Blockchain<br />Secured</span>
          </button>

          <div className="certificate-document certificate-original">
            <header className="certificate-original__header">
              <span className="certificate-original__brand">
                <i><BrandLogo compact /></i>
                <span>
                  <strong>Joviq Technologies</strong>
                  <small>Website and LMS</small>
                </span>
              </span>
              <span className="certificate-original__id">
                <small>Certificate ID</small>
                <strong>JOVIQ-2024-TRN-8X7F3A</strong>
              </span>
            </header>

            <div className="certificate-original__content">
              <small>This certifies that</small>
              <strong className="certificate-original__learner">Learner Name</strong>
              <span>has successfully completed the requirements for the</span>
              <h3>{certificateTypes[activeCertificateType].title}</h3>
              <p>Issued for successful completion of project-based career learning.</p>
            </div>

            <footer className="certificate-original__footer">
              <span className="certificate-original__signature">
                <i />
                <strong>Authorized Signatory</strong>
                <small>Joviq Technologies</small>
              </span>
              <span className="certificate-original__seal" aria-label="Joviq verified seal">
                <BadgeCheck size={28} />
              </span>
              <span className="certificate-original__verification">
                <span className="certificate-qr" aria-hidden="true" />
                <span>
                  <strong>Digitally verifiable</strong>
                  <small>Status and issue recorded</small>
                </span>
              </span>
            </footer>
          </div>

          <footer className="certificate-preview-stage__types" aria-label="Available certificate types">
            {certificateTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <button
                  aria-pressed={activeCertificateType === index}
                  className={activeCertificateType === index ? "is-active" : undefined}
                  key={type.label}
                  onClick={() => setActiveCertificateType(index)}
                  type="button"
                >
                  <Icon size={25} />
                  {type.label}
                </button>
              );
            })}
          </footer>

          <div className="certificate-progress" aria-label="Certification progress">
            {certificateProgress.map((step, index) => (
              <button
                aria-pressed={activeCertificateStep === index}
                className={activeCertificateStep === index ? "is-active" : undefined}
                key={step.label}
                onClick={() => setActiveCertificateStep(index)}
                type="button"
              >
                <span />
                <strong>{step.label}</strong>
              </button>
            ))}
          </div>

          <article className="certificate-step-guide" aria-live="polite">
            <span>Step {activeCertificateStep + 1}</span>
            <div>
              <h3>{certificateProgress[activeCertificateStep].label}</h3>
              <p>{certificateProgress[activeCertificateStep].action}</p>
            </div>
            <strong>{certificateProgress[activeCertificateStep].proof}</strong>
          </article>
        </div>
      </section>

      <section className="site-section apt-section apt-alumni apt-centered alumni-showcase employer-landscape">
        <div className="alumni-showcase__intro">
          <span className="apt-pill">
            <GraduationCap size={15} />
            Employer landscape
          </span>
          <h2>
            Build skills used across <span>leading teams.</span>
          </h2>
          <p>Career-ready capabilities for technology, engineering, finance, consulting, and product organizations.</p>
        </div>
        <BrandGrid items={alumniWall} tone="logos" />
      </section>

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
              <div className="pricing-card__head">
                <span>{pricingLabels[index]}</span>
                {plan.name === "Elevate" ? <strong>Most popular</strong> : null}
              </div>
              <div className="pricing-card__body">
                <div>
                  <h3>{plan.price.replace("INR", "\u20b9")}</h3>
                  <p>{plan.description}</p>
                </div>
                <div className="pricing-card-art" aria-hidden="true">
                  <span />
                  <i />
                </div>
              </div>
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

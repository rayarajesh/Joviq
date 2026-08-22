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
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
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
  MapPin,
  Menu,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  UsersRound,
  X,
  Zap
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { SiteFooter } from "../components/SiteFooter";
import {
  allPrograms,
  alumniCompanies,
  hiringPartners,
  homeFaqs,
  howItWorks,
  keyStatistics,
  mentors,
  poweredBy,
  pricingPlans,
  programCategories,
  recognitions,
  reviews,
  successOutcomes
} from "../data/siteContent";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const policyVersion = "2026-08-20";
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

type AuthMessage = { tone: "success" | "error"; text: string } | null;
type AuthMode = "login" | "register" | "verify-email" | "forgot-password" | "reset-password";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Programs", href: "#programs" },
  { label: "Features", href: "#features" },
  { label: "Campus Ambassador", href: "#campus-ambassador" },
  { label: "Reviews", href: "#reviews" },
  { label: "Careers", href: "#careers" },
  { label: "About Us", href: "#about" }
];

const projectHighlights = allPrograms
  .flatMap((program) => program.projects.slice(0, 1).map((project) => ({ program: program.title, project })))
  .slice(0, 8);

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState<AuthMessage>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingResetEmail, setPendingResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(location.hash === "#auth");
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

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function scrollToAuth(nextMode: AuthMode) {
    closeMenu();
    selectMode(nextMode);
    setIsAuthDialogOpen(true);
  }

  function closeAuthDialog() {
    setIsAuthDialogOpen(false);
    setMessage(null);
  }

  function scrollToCallback() {
    closeMenu();
    window.requestAnimationFrame(() => {
      document.getElementById("callback")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
    if (location.hash === "#auth") {
      selectMode("login");
      setIsAuthDialogOpen(true);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!isAuthDialogOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuthDialog();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthDialogOpen]);

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
    <main className="site-page">
      <header className={`site-nav ${isMenuOpen ? "is-open" : ""}`}>
        <a className="site-nav__brand" href="#home" onClick={closeMenu} aria-label="Joviq Technologies home">
          <span className="site-nav__mark">
            <Sparkles size={20} />
          </span>
          <span>
            <strong>Joviq Technologies</strong>
            <small>Website and LMS</small>
          </span>
        </a>

        <nav className="site-nav__links" aria-label="Main menu">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-nav__actions">
          <button type="button" onClick={() => scrollToAuth("login")}>
            Login
          </button>
          <button className="is-primary" type="button" onClick={scrollToCallback}>
            Request Callback
          </button>
        </div>

        <button
          className="site-nav__menu-button"
          type="button"
          aria-controls="site-mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div id="site-mobile-menu" className="site-nav__mobile" aria-hidden={!isMenuOpen}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
          <div className="site-nav__mobile-actions">
            <button type="button" onClick={() => scrollToAuth("login")}>
              Login
            </button>
            <button className="is-primary" type="button" onClick={scrollToCallback}>
              Request Callback
            </button>
          </div>
        </div>
      </header>

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
              Industry-focused learning with real project outcomes
            </div>
            <h1 id="site-title">Learn. Build. Get Certified. Get Hired.</h1>
            <p>
              Industry-focused programs, real-time projects, expert mentors, AI assessments, certifications, and career
              support for students and professionals.
            </p>
            <div className="site-hero__actions">
              <a className="site-button site-button--primary" href="#programs">
                Explore Programs <ArrowRight size={18} />
              </a>
              <button className="site-button site-button--light" type="button" onClick={scrollToCallback}>
                Request Callback <PhoneCall size={18} />
              </button>
              <button className="site-button site-button--ghost" type="button" onClick={() => scrollToAuth("login")}>
                Login to LMS <LockKeyhole size={18} />
              </button>
            </div>
            <div className="site-hero__proof" aria-label="Website highlights">
              <span>AI assessments</span>
              <span>Expert mentors</span>
              <span>Interview support</span>
            </div>
          </div>

          <div className="site-hero__dashboard" aria-hidden="true">
            <div className="hero-dashboard-card hero-dashboard-card--main">
              <div>
                <span>Career Readiness</span>
                <strong>92%</strong>
              </div>
              <div className="hero-progress">
                <span style={{ width: "92%" }} />
              </div>
            </div>
            <div className="hero-dashboard-card">
              <Lightbulb size={20} />
              <strong>AI Assessment</strong>
              <span>Adaptive quiz and project review</span>
            </div>
            <div className="hero-dashboard-card">
              <UsersRound size={20} />
              <strong>Mentor Loop</strong>
              <span>Weekly review and interview practice</span>
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
              placeholder="Search Data Science, Generative AI, Full Stack, VLSI, Finance..."
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

      <section className="site-section site-section--compact">
        <div className="stat-strip">
          {keyStatistics.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="programs" className="site-section">
        <SectionHeading
          eyebrow="Program Categories"
          title="Programs grouped by domain."
          text="Choose a focused path in technology, core engineering, CAD, finance, marketing, analytics, or management."
        />
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

      <section id="features" className="site-section site-section--band">
        <SectionHeading
          eyebrow="Features"
          title="A beautiful website connected to a serious LMS engine."
          text="The public website sells the promise. The LMS dashboard manages users, learning activity, assessments, and access."
        />
        <div className="feature-grid">
          <FeatureCard icon={<Layers3 size={24} />} title="Structured curriculum" text="Every program has overview, skills, curriculum, mode, assignments, assessment, certification, and outcomes." />
          <FeatureCard icon={<UsersRound size={24} />} title="Expert mentors" text="Mentor review loops help learners improve project quality and explain their work confidently." />
          <FeatureCard icon={<ClipboardCheck size={24} />} title="AI assessments" text="Quizzes, rubrics, and practical checkpoints keep learners aligned with career outcomes." />
          <FeatureCard icon={<BriefcaseBusiness size={24} />} title="Career support" text="Resume reviews, mock interviews, project walkthroughs, and interview readiness tracking." />
        </div>
      </section>

      <section className="site-section">
        <SectionHeading
          eyebrow="Expert Mentors"
          title="Guided by people who know the work."
          text="Mentors are organized around technology, core engineering, business, and career readiness."
        />
        <div className="mentor-grid">
          {mentors.map((mentor) => (
            <article key={mentor.name}>
              <div>
                <GraduationCap size={24} />
              </div>
              <h3>{mentor.name}</h3>
              <p>{mentor.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--split">
        <div>
          <span className="site-eyebrow">Recognitions</span>
          <h2>Built around skills that can be shown, reviewed, and discussed.</h2>
        </div>
        <div className="recognition-list">
          {recognitions.map((item) => (
            <article key={item}>
              <BadgeCheck size={20} />
              <span>{item}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--compact">
        <LogoCloud title="Hiring Partners" items={hiringPartners} />
      </section>

      <section className="site-section site-section--compact">
        <LogoCloud title="Technology / Powered By" items={poweredBy} />
      </section>

      <section className="site-section">
        <SectionHeading
          eyebrow="How It Works"
          title="From program discovery to interview confidence."
          text="A simple learning journey that keeps the learner moving toward portfolio and career readiness."
        />
        <div className="work-steps">
          {howItWorks.map((step, index) => (
            <article key={step.title}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--band">
        <SectionHeading
          eyebrow="Real-Time Projects"
          title="Projects that make every program concrete."
          text="Each program detail page includes 5 to 6 project examples. Here are sample outcomes across domains."
        />
        <div className="project-grid">
          {projectHighlights.map((item) => (
            <article key={`${item.program}-${item.project}`}>
              <BookOpenCheck size={22} />
              <strong>{item.project}</strong>
              <span>{item.program}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--compact">
        <LogoCloud title="Alumni Companies" items={alumniCompanies} />
      </section>

      <section className="site-section">
        <SectionHeading
          eyebrow="Student Success"
          title="Interview outcomes are treated as part of the learning journey."
          text="Learners practice the moments that matter: explaining projects, answering questions, and showing proof of skill."
        />
        <div className="outcome-grid">
          {successOutcomes.map((outcome) => (
            <article key={outcome}>
              <CheckCircle2 size={20} />
              <span>{outcome}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section--split">
        <div>
          <span className="site-eyebrow">Certifications</span>
          <h2>Certificates backed by projects, mentor reviews, and assessments.</h2>
          <p>
            Completion is linked to real-time projects, assignments, assessment scores, and interview preparation
            milestones.
          </p>
        </div>
        <div className="certificate-preview">
          <Award size={46} />
          <span>Joviq Technologies</span>
          <strong>Career Program Certification</strong>
          <small>Project reviewed - Assessment completed - Interview ready</small>
        </div>
      </section>

      <section id="pricing" className="site-section">
        <SectionHeading
          eyebrow="Pricing"
          title="Flexible pricing for foundation learning and career tracks."
          text="Use pricing cards as a guide. Final program pricing can vary by duration, batch, and mentorship level."
        />
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={plan.name === "Career Track" ? "is-featured" : undefined}>
              <span>{plan.name}</span>
              <h3>{plan.price}</h3>
              <p>{plan.description}</p>
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

      <section id="reviews" className="site-section site-section--band">
        <SectionHeading
          eyebrow="Reviews"
          title="Learners remember the project feedback."
          text="Showcase student experience, interview confidence, and practical program outcomes."
        />
        <div className="review-grid">
          {reviews.map((review) => (
            <article key={review.name}>
              <div className="review-stars" aria-label="Five star review">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} />
                ))}
              </div>
              <p>{review.quote}</p>
              <strong>{review.name}</strong>
              <span>{review.program}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="campus-ambassador" className="site-section site-section--split">
        <div>
          <span className="site-eyebrow">Campus Ambassador</span>
          <h2>Represent Joviq in your college and grow with the community.</h2>
          <p>
            Campus ambassadors help conduct awareness drives, workshops, referral campaigns, and student learning
            communities.
          </p>
        </div>
        <div className="campus-panel">
          <FeatureCard icon={<MessageCircle size={24} />} title="Community leadership" text="Host learning circles, program talks, and career readiness sessions." />
          <FeatureCard icon={<Award size={24} />} title="Recognition" text="Earn certificates, recommendations, and performance-linked rewards." />
        </div>
      </section>

      <section id="careers" className="site-section site-section--band">
        <SectionHeading
          eyebrow="Careers"
          title="Join the team building practical career education."
          text="Joviq can showcase mentor, trainer, counselor, business development, and operations openings here."
        />
        <div className="career-grid">
          {["Mentor / Trainer", "Career Counselor", "Business Development Executive", "LMS Operations Associate"].map((role) => (
            <article key={role}>
              <BriefcaseBusiness size={22} />
              <strong>{role}</strong>
              <span>Open for driven people who care about learner outcomes.</span>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="site-section">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions before you enroll."
          text="Clear answers for learners, parents, colleges, and career switchers."
        />
        <div className="faq-grid">
          {homeFaqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="about" className="site-section site-section--split">
        <div>
          <span className="site-eyebrow">About Us</span>
          <h2>Joviq Technologies helps learners move from classroom knowledge to career proof.</h2>
          <p>
            The website presents programs, outcomes, mentors, reviews, pricing, and callback journeys. The LMS powers
            authentication, role-based dashboards, user management, and future learning workflows.
          </p>
        </div>
        <div className="about-list">
          <article>
            <MapPin size={20} />
            <span>India-focused programs with global-ready project practice.</span>
          </article>
          <article>
            <ShieldCheck size={20} />
            <span>Admin, mentor, and student experiences separated with secure roles.</span>
          </article>
          <article>
            <Zap size={20} />
            <span>Built to grow into a full content-managed LMS website.</span>
          </article>
        </div>
      </section>

      <span id="auth" className="auth-anchor" aria-hidden="true" />
      <section id="callback" className="site-section final-cta">
        <div>
          <span className="site-eyebrow">Final CTA</span>
          <h2>Ready to choose your program?</h2>
          <p>Request a callback, compare programs, or login to continue your LMS journey.</p>
          <div className="final-cta__actions">
            <a className="site-button site-button--primary" href="#programs">
              Explore Programs <ArrowRight size={18} />
            </a>
            <button className="site-button site-button--light" type="button" onClick={() => scrollToAuth("login")}>
              Login to LMS
            </button>
          </div>
        </div>
        <div className="final-cta__forms">
          <CallbackForm />
          <div className="final-cta__showcase" aria-hidden="true">
            <span>Live LMS Preview</span>
            <strong>Student path</strong>
            <div>
              <span style={{ width: "86%" }} />
              <span style={{ width: "72%" }} />
              <span style={{ width: "94%" }} />
            </div>
            <small>Program selected - Mentor assigned - Interview prep active</small>
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
            <LoginForm isSubmitting={isSubmitting} onSubmit={handleLogin} onForgot={() => selectMode("forgot-password")} />
          ) : mode === "register" ? (
            <RegisterForm isSubmitting={isSubmitting} onSubmit={handleRegister} />
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
        <span className="site-eyebrow">Request Callback</span>
        <h3>Talk to a program advisor</h3>
      </div>
      <label>
        Full name
        <input name="fullName" placeholder="Your name" required />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={256}
          pattern={emailPattern}
          placeholder="name@example.com"
          required
        />
      </label>
      <IndiaMobileInput label="Phone" name="phoneNumber" required />
      <label>
        Interested program
        <select name="program" defaultValue="">
          <option value="" disabled>
            Select a program
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
  onSubmit,
  onForgot
}: {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgot: () => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2>Login to LMS</h2>
      <p>Continue to your Joviq dashboard.</p>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required />
      </label>
      <label>
        Password
        <PasswordInput name="password" autoComplete="current-password" required />
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
  onSubmit
}: {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <h2>Create student account</h2>
      <p>Register and verify your email OTP.</p>
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

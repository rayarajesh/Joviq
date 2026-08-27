import { FormEvent, lazy, Suspense, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Cpu,
  FolderKanban,
  GraduationCap,
  HeartHandshake,
  KeyRound,
  Layers3,
  Lightbulb,
  MailCheck,
  Megaphone,
  PhoneCall,
  Quote,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  UsersRound,
  Wrench,
  X
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import type { RouteSceneVariant } from "../components/RouteScene3D";
import { SiteFooter } from "../components/SiteFooter";
import {
  allPrograms,
  keyStatistics,
  mentors,
  pricingPlans,
  programCategories,
  recognitions,
  reviews
} from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
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
    text: "AI assessments, interview practice, improvement suggestions, and role-based checkpoints.",
    signals: ["Adaptive checkpoints", "Interview practice", "Actionable feedback"]
  },
  {
    icon: <UsersRound size={24} />,
    title: "Mentor-led delivery",
    text: "Live classes, mentor support, project reviews, mock interviews, and career guidance.",
    signals: ["Live cohorts", "Weekly reviews", "Career guidance"]
  },
  {
    icon: <Layers3 size={24} />,
    title: "Project-first LMS",
    text: "Recorded classes, assignments, projects, assessments, progress tracking, and certification.",
    signals: ["Real projects", "Clear rubrics", "Progress tracking"]
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Verified outcomes",
    text: "Certificates, QR verification, portfolio proof, resume support, and interview readiness.",
    signals: ["Verified records", "Portfolio proof", "Shareable outcomes"]
  }
];

const ambassadorSteps = ["Apply", "Represent Joviq", "Host campus activities", "Earn recognition"];
const ambassadorBenefits = [
  { icon: <Megaphone size={23} />, title: "Create momentum", text: "Bring useful career conversations, workshops, and learning opportunities to your campus." },
  { icon: <UsersRound size={23} />, title: "Build your network", text: "Collaborate with student leaders, mentors, and the Joviq program team." },
  { icon: <Trophy size={23} />, title: "Earn visible proof", text: "Turn consistent campus impact into certificates, rewards, and leadership evidence." }
];
const careerOpenings = [
  { role: "HR", team: "People & Culture", text: "Build thoughtful hiring, onboarding, and employee experience systems." },
  { role: "Program Advisor", team: "Learner Success", text: "Help learners choose the right program, plan, and career direction." },
  { role: "Digital Marketing", team: "Growth", text: "Create campaigns, content, and measurable acquisition experiments." },
  { role: "Full Stack Developer", team: "Product Engineering", text: "Build reliable LMS workflows across React, APIs, and data." },
  { role: "Operations", team: "Program Operations", text: "Keep cohorts, mentor workflows, and learner delivery running clearly." },
  { role: "Operations Executive", team: "Delivery", text: "Coordinate schedules, communication, records, and learner support." }
];
const aboutValues = ["Industry-focused education", "Project-first learning", "Mentor-reviewed outcomes", "Career preparation"];
const reviewSignals = [
  { icon: <FolderKanban size={22} />, title: "Portfolio evidence", text: "Work learners can demonstrate, explain, and improve." },
  { icon: <UsersRound size={22} />, title: "Direct feedback", text: "Specific review loops instead of generic completion signals." },
  { icon: <Target size={22} />, title: "Interview clarity", text: "Practice turning project decisions into confident answers." },
  { icon: <ShieldCheck size={22} />, title: "Verified progress", text: "Assessment and certification connected to completed work." }
];
const programCatalogStats = [
  { value: String(allPrograms.length), label: "Career programs" },
  { value: String(programCategories.length), label: "Learning domains" },
  { value: "5-6", label: "Projects per track" },
  { value: "Weekly", label: "Mentor reviews" }
];

export function ProgramsPage() {
  const [query, setQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

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

  const visiblePrograms = filteredPrograms.slice(0, visibleCount);
  const activeCategory = programCategories.find((category) => category.domain === activeDomain);

  function selectDomain(domain: string) {
    setActiveDomain(domain);
    setVisibleCount(6);
  }

  function resetCatalog() {
    setQuery("");
    setActiveDomain("All");
    setVisibleCount(6);
  }

  return (
    <PublicPageShell>
      <section className="route-programs-hero" aria-labelledby="programs-page-title">
        <div className="route-programs-hero__content">
          <div className="route-programs-hero__copy">
            <span className="apt-pill apt-pill--dark">
              <Sparkles size={15} />
              Joviq career programs
            </span>
            <h1 id="programs-page-title">
              Career programs built for <span>real work.</span>
            </h1>
            <p>
              Build practical projects, get direct expert feedback, and finish with proof you can explain in an
              interview.
            </p>
            <div className="route-programs-hero__actions">
              <a className="site-button site-button--primary" href="#program-catalog">
                Explore programs <ArrowRight size={18} />
              </a>
              <Link className="site-button route-programs-hero__secondary" to="/request-callback">
                Talk to an advisor <PhoneCall size={18} />
              </Link>
            </div>
            <div className="route-programs-hero__proof" aria-label="Program experience highlights">
              <span><CheckCircle2 size={16} /> Live mentor-led learning</span>
              <span><CheckCircle2 size={16} /> Portfolio-grade projects</span>
              <span><CheckCircle2 size={16} /> Verified certification</span>
            </div>
          </div>

          <div className="route-programs-hero__metrics" aria-label="Program catalog statistics">
            {programCatalogStats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="route-section route-program-catalog" id="program-catalog">
        <div className="route-toolbar">
          <header className="route-toolbar__header">
            <div>
              <Search size={18} />
              <span>Program finder</span>
            </div>
            <strong aria-live="polite">{filteredPrograms.length} matches</strong>
          </header>
          <label className="route-search">
            <Search size={20} />
            <input
              aria-label="Search career programs"
              value={query}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setVisibleCount(6);
              }}
              placeholder="Search AI, Full Stack, VLSI, Finance..."
            />
            {query ? (
              <button aria-label="Clear program search" onClick={() => setQuery("")} type="button">
                <X size={17} />
              </button>
            ) : null}
          </label>
          <div className="route-tabs" aria-label="Program domains" role="tablist">
            <button
              aria-controls="program-catalog-results"
              aria-selected={activeDomain === "All"}
              className={activeDomain === "All" ? "is-active" : undefined}
              onClick={() => selectDomain("All")}
              role="tab"
              type="button"
            >
              All <span>{allPrograms.length}</span>
            </button>
            {programCategories.map((category) => (
              <button
                aria-controls="program-catalog-results"
                aria-selected={activeDomain === category.domain}
                key={category.domain}
                className={activeDomain === category.domain ? "is-active" : undefined}
                role="tab"
                type="button"
                onClick={() => selectDomain(category.domain)}
              >
                {category.domain.replace("Computer Science & IT", "Computer Science")}
                <span>{category.programs.length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="route-program-results-head">
          <div>
            <span>{activeDomain === "All" ? "All career tracks" : activeDomain}</span>
            <h2>{filteredPrograms.length} programs built around practical outcomes.</h2>
          </div>
          <p>
            {activeCategory?.description ??
              "Technology, core engineering, and management tracks designed around practical work and reviewed progress."}
          </p>
        </div>

        {visiblePrograms.length ? (
          <>
            <div className="route-program-grid route-program-grid--catalog" id="program-catalog-results" role="tabpanel">
              {visiblePrograms.map((program, index) => (
                <Link
                  className="route-program-card"
                  data-domain={program.domain}
                  key={program.slug}
                  to={`/programs/${program.slug}`}
                >
                  <div className="route-program-card__media">
                    <img
                      alt={`${program.title} program`}
                      decoding="async"
                      loading={index < 6 ? "eager" : "lazy"}
                      src={getProgramImage(program.slug, program.domain)}
                    />
                    <span>
                      <ProgramIcon domain={program.domain} />
                      {program.domain}
                    </span>
                  </div>
                  <div className="route-program-card__body">
                    <div className="route-program-card__meta">
                      <span>{program.level}</span>
                      <em><Clock3 size={15} /> {program.duration}</em>
                    </div>
                    <strong>{program.title}</strong>
                    <p>{program.shortDescription}</p>
                    <div className="route-program-card__skills" aria-label={`${program.title} skills`}>
                      {program.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                    <div className="route-program-card__footer">
                      <span><FolderKanban size={16} /> {program.projects.length} projects</span>
                      <b>View program <ArrowRight size={17} /></b>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {visiblePrograms.length < filteredPrograms.length ? (
              <button
                className="route-program-more"
                onClick={() => setVisibleCount((current) => current + 6)}
                type="button"
              >
                <span>
                  Show more programs
                  <small>{filteredPrograms.length - visiblePrograms.length} remaining</small>
                </span>
                <ChevronDown size={20} />
              </button>
            ) : null}
          </>
        ) : (
          <div className="route-program-empty" id="program-catalog-results" role="status">
            <Search size={26} />
            <h2>No matching programs found.</h2>
            <p>Try another skill, role, or career domain.</p>
            <button onClick={resetCatalog} type="button">
              <RefreshCw size={17} />
              Show all programs
            </button>
          </div>
        )}
      </section>
    </PublicPageShell>
  );
}

export function FeaturesPage() {
  return (
    <PublicPageShell>
      <ImmersiveRouteHero
        accent="prove your skill."
        eyebrow="The Joviq learning system"
        metrics={[
          { value: "One", label: "Connected workspace" },
          { value: "AI", label: "Practice checkpoints" },
          { value: "Weekly", label: "Mentor reviews" },
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

export function CampusAmbassadorPage() {
  return (
    <PublicPageShell>
      <ImmersiveRouteHero
        accent="visible leadership."
        eyebrow="Joviq Campus Ambassador"
        metrics={[
          { value: "Lead", label: "Campus conversations" },
          { value: "Host", label: "Learning activities" },
          { value: "Connect", label: "Peers and mentors" },
          { value: "Earn", label: "Proof and rewards" }
        ]}
        text="Represent Joviq, create useful career conversations, and turn real campus impact into leadership proof you can carry forward."
        title="Turn campus energy into"
        variant="ambassador"
        actions={
          <Link className="site-button site-button--primary" to="/request-callback">
            Apply to lead <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-experience-section ambassador-impact">
        <div className="route-section-lead">
          <span>Leadership through action</span>
          <h2>Be useful on campus, not just visible.</h2>
          <p>The role is built around creating genuine value for peers while developing communication, ownership, and community leadership.</p>
        </div>
        <div className="ambassador-impact__grid">
          {ambassadorBenefits.map((benefit) => (
            <article key={benefit.title}>
              <span>{benefit.icon}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ambassador-pathway">
        <div className="ambassador-pathway__intro">
          <span className="apt-pill apt-pill--dark"><Rocket size={15} /> Your pathway</span>
          <h2>Four steps from application to recognized impact.</h2>
          <p>A clear operating rhythm keeps the role practical, measurable, and easy to explain.</p>
        </div>
        <ol>
          {ambassadorSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step}</strong>
                <p>{index === 0 ? "Share your profile, college, and leadership interests." : index === 1 ? "Introduce useful programs and opportunities with clarity." : index === 2 ? "Run learning circles, workshops, and peer conversations." : "Receive certificates, rewards, and evidence of contribution."}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link className="site-button site-button--primary" to="/request-callback">
          Start your application <ArrowRight size={18} />
        </Link>
      </section>
    </PublicPageShell>
  );
}

export function ReviewsPage() {
  return (
    <PublicPageShell>
      <ImmersiveRouteHero
        accent="confidence."
        eyebrow="Learner perspectives"
        metrics={[
          { value: "Build", label: "Portfolio projects" },
          { value: "Review", label: "Expert feedback" },
          { value: "Explain", label: "Interview practice" },
          { value: "Improve", label: "Visible progress" }
        ]}
        text="Learners remember the moment their work became easier to explain, their portfolio became more credible, and interviews felt less uncertain."
        title="The work changed. So did their"
        variant="reviews"
        actions={
          <Link className="site-button site-button--primary" to="/programs">
            Explore programs <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-experience-section route-review-stories">
        <div className="route-section-lead">
          <span>Stories behind the progress</span>
          <h2>Feedback is valuable when it changes the next attempt.</h2>
          <p>These learner perspectives focus on the practical moments that made their work and communication stronger.</p>
        </div>
        <div className="route-review-stories__grid">
          {reviews.map((review, index) => (
            <article key={review.name}>
              <header>
                <span className="route-review-stories__avatar">{review.name.charAt(0)}</span>
                <div>
                  <strong>{review.name}</strong>
                  <small>{review.program}</small>
                </div>
                <Quote size={25} />
              </header>
              <blockquote>{review.quote}</blockquote>
              <footer>
                <span><BadgeCheck size={15} /> Learner perspective</span>
                <strong>{["Portfolio clarity", "Project confidence", "Practical confidence"][index]}</strong>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="review-proof-band">
        <div className="review-proof-band__intro">
          <span className="apt-pill apt-pill--dark"><Star size={15} /> What creates confidence</span>
          <h2>Proof, feedback, and practice working together.</h2>
        </div>
        <div className="review-proof-band__grid">
          {reviewSignals.map((signal) => (
            <article key={signal.title}>
              <span>{signal.icon}</span>
              <div><strong>{signal.title}</strong><p>{signal.text}</p></div>
            </article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}

export function CareersPage() {
  return (
    <PublicPageShell>
      <ImmersiveRouteHero
        accent="better career outcomes."
        eyebrow="Careers at Joviq"
        metrics={[
          { value: String(careerOpenings.length), label: "Open disciplines" },
          { value: "Learner", label: "First decisions" },
          { value: "Clear", label: "Operating ownership" },
          { value: "Build", label: "Useful systems" }
        ]}
        text="Join a team that cares about clear communication, disciplined delivery, thoughtful technology, and learning that produces practical evidence."
        title="Build the team behind"
        variant="careers"
        actions={
          <Link className="site-button site-button--primary" to="/request-callback">
            Contact the hiring team <ArrowRight size={18} />
          </Link>
        }
      />

      <section className="route-experience-section career-culture">
        <div className="route-section-lead">
          <span>How we work</span>
          <h2>High standards, low noise, real ownership.</h2>
          <p>We value people who can make progress visible, communicate early, and keep the learner experience at the center of decisions.</p>
        </div>
        <div className="career-culture__grid">
          {[
            { icon: <HeartHandshake size={23} />, title: "Learner empathy", text: "Understand the person behind the workflow and build with their reality in mind." },
            { icon: <Target size={23} />, title: "Outcome ownership", text: "Take responsibility for work that is clear, measurable, and genuinely useful." },
            { icon: <Rocket size={23} />, title: "Thoughtful momentum", text: "Move decisively, share context, and improve the system as the team learns." }
          ].map((value) => (
            <article key={value.title}><span>{value.icon}</span><h3>{value.title}</h3><p>{value.text}</p></article>
          ))}
        </div>
      </section>

      <section className="career-openings">
        <div className="career-openings__intro">
          <span className="apt-pill apt-pill--dark"><BriefcaseBusiness size={15} /> Open disciplines</span>
          <h2>Find where your strengths can make a difference.</h2>
          <p>Current areas where Joviq is interested in meeting outcome-focused people.</p>
        </div>
        <div className="career-openings__grid">
          {careerOpenings.map((opening) => (
            <article key={opening.role}>
              <header><span>{opening.team}</span><small>Opportunity</small></header>
              <h3>{opening.role}</h3>
              <p>{opening.text}</p>
              <Link to="/request-callback">Contact hiring <ArrowRight size={17} /></Link>
            </article>
          ))}
        </div>
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

      <section className="route-experience-section about-mentors">
        <div className="route-section-lead">
          <span>Expert context</span>
          <h2>Different disciplines, one review standard.</h2>
          <p>Learners get guidance from people who understand the technical work and the career conversation around it.</p>
        </div>
        <div className="about-mentors__grid">
          {mentors.map((mentor, index) => (
            <article key={mentor.name}>
              <header><GraduationCap size={23} /><span>0{index + 1}</span></header>
              <h3>{mentor.name}</h3>
              <p>{mentor.role}</p>
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
        privacyPolicyVersion: policyVersion,
        refundPolicyVersion: policyVersion
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
                  <span>I accept the terms, privacy policy, and refund policy.</span>
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

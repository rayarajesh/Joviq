import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Code2,
  FolderKanban,
  GraduationCap,
  Headphones,
  Laptop,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  Video,
  WalletCards
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { allPrograms, defaultProgramPlans, findProgramBySlug } from "../data/siteContent";
import type { Program, ProgramPlan } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { publicLmsApi } from "../features/lms/api/lmsApi";
import type { ProgramDetailsResponse } from "../features/lms/api/lmsTypes";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
type FormMessage = { tone: "success" | "error"; text: string } | null;

type DetailItem = { title: string; text: string };
type CurriculumItem = DetailItem & { lessons: string[] };
type ProjectItem = DetailItem & { artifacts: string[] };
type DomainFeatureItem = { icon: ReactNode; title: string; text: string; bullets: string[] };

type ProgramViewModel = {
  slug: string;
  title: string;
  domain: string;
  shortDescription: string;
  overview: string;
  audience: string[];
  skills: string[];
  curriculum: CurriculumItem[];
  duration: string;
  mode: string;
  guidance: string;
  projects: ProjectItem[];
  certification: string;
  outcomes: string[];
  interviewPrep: string[];
  plans: ProgramPlan[];
  faqs: { question: string; answer: string }[];
  level: string;
};

const domainFeatures: DomainFeatureItem[] = [
  {
    icon: <CalendarClock size={28} />,
    title: "Guided + Lesson Replays",
    text: "Follow guided sessions and watch recordings anytime",
    bullets: ["Guided interactive sessions", "Lesson replays", "Industry-relevant curriculum"]
  },
  {
    icon: <CalendarClock size={28} />,
    title: "6 Months LMS Access",
    text: "Access videos, files, quizzes & resources anytime",
    bullets: ["Complete materials", "Self-paced learning", "Extra downloadable files"]
  },
  {
    icon: <UsersRound size={28} />,
    title: "Hands-on Projects",
    text: "Work on real industry-level problems",
    bullets: ["Hands-on experience", "Real-time projects", "Personal expert support"]
  },
  {
    icon: <Video size={28} />,
    title: "Certification",
    text: "Receive QR-verified certificate after completion",
    bullets: ["Industry-recognised", "QR-verified certification", "Includes capstone evaluations"]
  },
  {
    icon: <Headphones size={28} />,
    title: "Doubt Solving",
    text: "Ask doubts anytime via LMS or chat",
    bullets: ["Expert-led doubt solving", "Fast response time", "Detailed explanations"]
  },
  {
    icon: <CheckCircle2 size={28} />,
    title: "Placement Support",
    text: "Resume, interview prep & job assistance",
    bullets: ["Interview assistance", "Placement support", "Job readiness plan"]
  }
];

export function ProgramDetailsPage() {
  const { slug } = useParams();
  const localProgram = findProgramBySlug(slug);
  const [remoteProgram, setRemoteProgram] = useState<ProgramDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!localProgram);
  const [selectedPlanCode, setSelectedPlanCode] = useState("INTERMEDIATE");

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setRemoteProgram(null);
    setIsLoading(!localProgram);

    void publicLmsApi
      .getProgram(slug)
      .then((response) => {
        if (isCurrent) setRemoteProgram(response.data);
      })
      .catch(() => {
        // Static catalog content keeps public pages available while the local API is offline.
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [localProgram, slug]);

  const program = useMemo(() => buildProgramViewModel(localProgram, remoteProgram), [localProgram, remoteProgram]);

  useEffect(() => {
    if (!program?.plans.some((plan) => plan.code === selectedPlanCode)) {
      setSelectedPlanCode(program?.plans[0]?.code ?? "INTERMEDIATE");
    }
  }, [program, selectedPlanCode]);

  if (!program && isLoading) {
    return (
      <main className="program-detail-page program-detail-v2">
        <PublicNavbar />
        <section className="pd-loading" aria-live="polite"><span /><strong>Loading program details</strong></section>
      </main>
    );
  }

  if (!program) return <ProgramNotFound />;

  const heroImage = getProgramImage(program.slug, program.domain);

  function choosePlan(planCode: string) {
    setSelectedPlanCode(planCode);
    document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="program-detail-page program-detail-v2">
      <PublicNavbar />

      <section className="pd-hero" aria-labelledby="program-detail-title">
        <img alt="" aria-hidden="true" className="pd-hero__image" src={heroImage} />
        <div className="pd-hero__veil" aria-hidden="true" />
        <div className="pd-hero__content">
          <div className="pd-hero__copy">
            <Link className="pd-back-link" to="/programs"><ArrowLeft size={17} /> All programs</Link>
            <span className="pd-kicker"><Sparkles size={15} /> {program.domain}</span>
            <h1 id="program-detail-title">{program.title}</h1>
            <p>{program.shortDescription}</p>
            <div className="pd-hero__actions">
              <a className="site-button site-button--primary" href="#pricing">Compare plans <ArrowRight size={18} /></a>
              <Link className="site-button pd-button--glass" to="/request-callback">Talk to an expert <PhoneCall size={18} /></Link>
            </div>
          </div>

          <div className="pd-hero__metrics" aria-label="Program highlights">
            <Metric icon={<CalendarClock size={18} />} label="Duration" value={program.duration} />
            <Metric icon={<Laptop size={18} />} label="Learning mode" value={program.mode} />
            <Metric icon={<FolderKanban size={18} />} label="Portfolio work" value={`${program.projects.length} projects`} />
            <Metric icon={<Award size={18} />} label="Outcome" value="Verified certificate" />
          </div>
        </div>
      </section>

      <nav className="pd-anchor-nav" aria-label="Program page sections">
        <div>
          <a href="#overview">Overview</a><a href="#skills">Skills</a><a href="#curriculum">Curriculum</a>
          <a href="#projects">Projects</a><a href="#certification">Certification</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a>
        </div>
      </nav>

      <section className="pd-section pd-overview" id="overview">
        <div className="pd-section-heading">
          <span>Program overview</span>
          <h2>Build capability you can demonstrate, not just describe.</h2>
        </div>
        <div className="pd-overview__body">
          <div className="pd-overview__statement">
            <p>{program.overview}</p>
            <div className="pd-overview__facts">
              <span><CalendarClock size={18} /><small>Duration</small><strong>{program.duration}</strong></span>
              <span><Video size={18} /><small>Learning mode</small><strong>{program.mode}</strong></span>
              <span><GraduationCap size={18} /><small>Level</small><strong>{program.level}</strong></span>
              <span><UsersRound size={18} /><small>Review</small><strong>Expert reviewed</strong></span>
            </div>
          </div>
          <aside className="pd-audience">
            <div><UserPlus size={22} /><h3>Who should join</h3></div>
            <ul>{program.audience.map((item) => <li key={item}><CheckCircle2 size={17} /> {item}</li>)}</ul>
          </aside>
        </div>
      </section>

      <section className="pd-skill-band" id="skills">
        <div className="pd-skill-band__intro">
          <span className="pd-kicker"><Code2 size={15} /> Domain Features</span>
          <h2>Domain Features</h2>
          <p>Everything you need - structured learning, real projects, expert support & certification.</p>
        </div>
        <div className="pd-skill-band__grid">
          {domainFeatures.map((feature) => (
            <article key={feature.title}>
              <span className="pd-feature-card__icon">{feature.icon}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
              <ul>
                {feature.bullets.map((bullet) => (
                  <li key={bullet}><CheckCircle2 size={17} /> {bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="pd-section pd-curriculum" id="curriculum">
        <div className="pd-section-heading pd-section-heading--split">
          <div><span>Curriculum</span><h2>A clear path from foundations to career proof.</h2></div>
          <p>{program.curriculum.length} structured modules with lessons, practice checkpoints, and reviewed outputs.</p>
        </div>
        <div className="pd-curriculum__list">
          {program.curriculum.map((module, index) => (
            <article key={module.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{module.title}</h3><p>{module.text}</p></div>
              <ul>{module.lessons.map((lesson) => <li key={lesson}><BookOpenCheck size={15} /> {lesson}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="pd-projects" id="projects">
        <div className="pd-projects__head">
          <span className="pd-kicker"><FolderKanban size={15} /> Real-world projects</span>
          <h2>Real-World Hands-On Projects</h2>
          <p>Build strong industry-ready skills with practical experience.</p>
        </div>
        <div className="pd-projects__grid">
          {program.projects.map((project, index) => (
            <article key={project.title}>
              <header><span>{index + 1}</span></header>
              <h3>{project.title}</h3>
              <p>{project.text}</p>
              <details open={index === 0}>
                <summary>View Details</summary>
                <div>
                  <strong>Key Features</strong>
                  <ul>{project.artifacts.slice(0, 4).map((artifact) => <li key={artifact}>{artifact}</li>)}</ul>
                  <strong>Technologies</strong>
                  <ul>{program.skills.slice(0, 4).map((skill) => <li key={skill}>{skill}</li>)}</ul>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="pd-credential" id="certification">
        <div className="pd-credential__expert">
          <span className="pd-kicker"><UsersRound size={15} /> Expert guidance</span>
          <h2>Review from someone who understands the work.</h2><p>{program.guidance}</p>
          <div><Headphones size={20} /><span>Live guidance, project reviews, doubt support, and interview feedback.</span></div>
        </div>
        <div className="pd-credential__certificate">
          <header><Award size={30} /><span>Verified achievement</span></header><small>Joviq Technologies</small>
          <h3>{program.certification}</h3>
          <p>Issued after the required project work is successfully completed.</p>
          <footer><ShieldCheck size={20} /><strong>Project-backed credential</strong></footer>
        </div>
      </section>

      <section className="pd-section pd-career">
        <div className="pd-career__outcomes">
          <span>Career outcomes</span><h2>Know where this program can take you.</h2>
          <div>{program.outcomes.map((outcome) => <strong key={outcome}><ArrowRight size={17} /> {outcome}</strong>)}</div>
        </div>
        <div className="pd-career__interview">
          <span>Interview preparation</span><h3>Practice explaining the decisions behind your work.</h3>
          <ul>{program.interviewPrep.map((item) => <li key={item}><BadgeCheck size={17} /> {item}</li>)}</ul>
        </div>
      </section>

      <section className="pd-pricing" id="pricing">
        <div className="pd-pricing__head">
          <span className="pd-kicker"><WalletCards size={15} /> Program plans</span>
          <h2>Choose the support level that fits your goal.</h2>
          <p>Every plan provides structured learning and certification. Upgrade when you want deeper expert review.</p>
        </div>
        <div className="pd-pricing__grid">
          {program.plans.map((plan) => <PlanCard key={plan.code} onChoose={() => choosePlan(plan.code)} plan={plan} />)}
        </div>
        {remoteProgram ? <p className="pd-pricing__admin-note"><ShieldCheck size={15} /> Prices and features are managed per program from the Admin Panel.</p> : null}
      </section>

      <section className="pd-section pd-faq" id="faq">
        <div className="pd-section-heading pd-section-heading--split">
          <div><span>FAQ</span><h2>Questions before you enroll.</h2></div>
          <p>Clear answers about eligibility, projects, certification, and learner guidance.</p>
        </div>
        <div className="pd-faq__grid">
          {program.faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="pd-enroll" id="enroll">
        <div className="pd-enroll__copy">
          <span className="pd-kicker"><Send size={15} /> Enroll now</span><h2>Start your {program.title} journey.</h2>
          <p>Choose your plan and share your details. The Joviq team will confirm the batch, payment, and onboarding steps.</p>
          <div><CheckCircle2 size={18} /> No hidden plan features</div><div><CheckCircle2 size={18} /> Guided onboarding</div>
          <div><CheckCircle2 size={18} /> Secure LMS access</div>
        </div>
        <EnrollForm onPlanChange={setSelectedPlanCode} plans={program.plans} programTitle={program.title} selectedPlanCode={selectedPlanCode} />
      </section>

      <SiteFooter />
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <span>{icon}<small>{label}</small><strong>{value}</strong></span>;
}

function PlanCard({ onChoose, plan }: { onChoose: () => void; plan: ProgramPlan }) {
  const isRecommended = plan.code === "INTERMEDIATE";
  const includedPlan = plan.code === "INTERMEDIATE" ? "Everything in Launch, plus" : plan.code === "MASTER" ? "Everything in Elevate, plus" : null;
  const savings = Math.max(0, plan.actualPrice - plan.offerPrice);

  return (
    <article className={isRecommended ? "is-recommended" : undefined}>
      <header>
        <div><span>{plan.name}</span><small>{isRecommended ? "Most popular" : plan.code === "MASTER" ? "Maximum support" : "Strong start"}</small></div>
        {isRecommended ? <BadgeCheck size={23} /> : null}
      </header>
      <div className="pd-plan-price">
        {savings > 0 ? <del>{formatInr(plan.actualPrice)}</del> : null}
        <strong>{formatInr(plan.offerPrice)}</strong>
        {savings > 0 ? <span>Save {formatInr(savings)}</span> : null}
      </div>
      {includedPlan ? <p className="pd-plan-includes">{includedPlan}</p> : null}
      <ul>{plan.features.map((feature) => <li key={feature}><CheckCircle2 size={16} /> {feature}</li>)}</ul>
      <button onClick={onChoose} type="button">Choose {plan.name}<ArrowRight size={17} /></button>
    </article>
  );
}

function EnrollForm({ onPlanChange, plans, programTitle, selectedPlanCode }: {
  onPlanChange: (code: string) => void;
  plans: ProgramPlan[];
  programTitle: string;
  selectedPlanCode: string;
}) {
  const [message, setMessage] = useState<FormMessage>(null);
  const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0];

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
    setMessage({ tone: "success", text: `Enrollment request captured for ${programTitle} - ${selectedPlan?.name ?? "program plan"}.` });
  }

  return (
    <form className="pd-enroll-form" onSubmit={handleSubmit}>
      <div className="pd-enroll-form__summary"><span>Selected plan</span><strong>{selectedPlan?.name ?? "Choose a plan"}</strong><small>{selectedPlan ? formatInr(selectedPlan.offerPrice) : "Pricing unavailable"}</small></div>
      <div className="pd-enroll-form__two">
        <label>Full name<input name="fullName" placeholder="Your name" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required /></label>
      </div>
      <IndiaMobileInput label="Phone" name="phoneNumber" required />
      <label>
        Plan
        <select name="planCode" value={selectedPlanCode} onChange={(event) => onPlanChange(event.target.value)}>
          {plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name} - {formatInr(plan.offerPrice)}</option>)}
        </select>
      </label>
      <input name="program" type="hidden" value={programTitle} />
      <button type="submit"><Send size={18} /> Submit enrollment request</button>
      {message ? <div className={`auth-message auth-message--${message.tone}`}>{message.text}</div> : null}
    </form>
  );
}

function ProgramNotFound() {
  return (
    <main className="program-detail-page program-detail-v2">
      <PublicNavbar />
      <section className="program-not-found">
        <span className="site-eyebrow">Program not found</span><h1>Choose a program from the catalog.</h1>
        <p>The program URL does not match the current Joviq catalog.</p>
        <div className="program-suggestion-grid">{allPrograms.slice(0, 6).map((item) => <Link key={item.slug} to={`/programs/${item.slug}`}>{item.title}</Link>)}</div>
      </section>
      <SiteFooter />
    </main>
  );
}

function buildProgramViewModel(local: Program | undefined, remote: ProgramDetailsResponse | null): ProgramViewModel | null {
  if (!local && !remote) return null;

  const title = remote?.title ?? local?.title ?? "Career Program";
  const remoteCurriculum = remote?.curriculum.map((module) => ({
    title: module.title,
    text: module.description || `Build practical ${title} knowledge through guided lessons and checkpoints.`,
    lessons: module.lessons.map((lesson) => lesson.title)
  })) ?? [];
  const localCurriculum = (local?.curriculum ?? []).map((module) => ({
    title: module,
    text: `Learn the essential concepts, workflows, and practical decisions behind ${module.toLowerCase()}.`,
    lessons: ["Guided lesson", "Practice checkpoint", "Applied review"]
  }));
  const remoteProjects = remote?.projects.map((project) => ({ title: project.title, text: project.description, artifacts: project.requiredArtifacts })) ?? [];
  const localProjects = (local?.projects ?? []).map((project) => ({
    title: project,
    text: `Create a portfolio-ready ${project.toLowerCase()} with clear deliverables and expert feedback.`,
    artifacts: ["Project output", "Documentation", "Interview walkthrough"]
  }));
  const projects = completeProjectExamples(remoteProjects.length ? remoteProjects : localProjects, title);
  const curriculum = completeCurriculum(
    remoteCurriculum.length
      ? remoteCurriculum
      : localCurriculum.length
        ? localCurriculum
        : createFallbackCurriculum(title),
    title
  );
  const remotePlans = remote?.plans.filter((plan) => plan.isActive).map((plan) => ({
    id: plan.id,
    name: plan.name,
    code: plan.code,
    actualPrice: plan.actualPrice,
    offerPrice: plan.offerPrice,
    reserveAmount: plan.reserveAmount,
    features: plan.features,
    isActive: plan.isActive
  })) ?? [];

  return {
    slug: remote?.slug ?? local?.slug ?? "program",
    title,
    domain: remote?.categoryName ?? local?.domain ?? "Career Program",
    shortDescription: remote?.shortDescription ?? local?.shortDescription ?? "Practical learning, reviewed projects, and career preparation.",
    overview: remote?.overview ?? local?.overview ?? "Build practical capability through guided learning, projects, and review.",
    audience: local?.audience ?? ["Students building career skills", "Fresh graduates preparing for roles", "Working professionals changing domains"],
    skills: remote?.skills.length ? remote.skills : local?.skills.length ? local.skills : ["Core foundations", "Industry tools", "Applied problem solving", "Project delivery", "Quality review", "Interview communication"],
    curriculum,
    duration: remote?.duration ?? local?.duration ?? "8 to 16 weeks",
    mode: remote?.learningMode ?? local?.mode ?? "Live and recorded online learning",
    guidance: local?.expert ?? "Experienced domain experts provide project and interview review support.",
    projects,
    certification: remote?.certificationName ?? local?.certification ?? `Joviq ${title} Certification`,
    outcomes: remote?.outcomes.length ? remote.outcomes : local?.outcomes ?? [],
    interviewPrep: local?.interviewPrep ?? ["Resume and portfolio review", "Project explanation practice", "Technical mock interview", "HR interview preparation"],
    plans: remotePlans.length ? remotePlans : local?.plans ?? defaultProgramPlans,
    faqs: remote?.faqs.length ? remote.faqs : local?.faqs.length ? local.faqs : createFallbackFaqs(title),
    level: remote?.level ?? local?.level ?? "Beginner to job-ready"
  };
}

function completeProjectExamples(projects: ProjectItem[], title: string) {
  const result = projects.slice(0, 6);
  const fallbackTitles = [
    `${title} workflow build`,
    `${title} industry case study`,
    `${title} automation challenge`,
    `${title} quality review`,
    `${title} delivery simulation`,
    `${title} portfolio capstone`
  ];

  for (const fallbackTitle of fallbackTitles) {
    if (result.length >= 6) break;
    if (result.some((project) => project.title.toLowerCase() === fallbackTitle.toLowerCase())) continue;
    result.push({
      title: fallbackTitle,
      text: `Solve a realistic ${title.toLowerCase()} brief and defend the choices made during implementation.`,
      artifacts: ["Working deliverable", "Decision log", "Portfolio walkthrough"]
    });
  }

  return result;
}

function completeCurriculum(curriculum: CurriculumItem[], title: string) {
  const result = curriculum.slice(0, 10);
  const fallbackModules = [
    "Foundations",
    "Tool setup",
    "Core workflows",
    "Guided lab practice",
    "Industry case study",
    "Real-time project build",
    "Review and optimization",
    "Documentation and handoff",
    "Interview preparation",
    "Capstone presentation"
  ];

  for (const fallbackModule of fallbackModules) {
    if (result.length >= 10) break;
    const moduleTitle = `${title} ${fallbackModule}`;
    if (result.some((module) => module.title.toLowerCase() === moduleTitle.toLowerCase())) continue;
    result.push({
      title: moduleTitle,
      text: `Build practical ${title.toLowerCase()} ability through focused content, tool practice, and reviewed output.`,
      lessons: createModuleLessons(title, fallbackModule)
    });
  }

  return result.map((module) => ({
    ...module,
    lessons: module.lessons.length >= 4 ? module.lessons.slice(0, 5) : createModuleLessons(title, module.title)
  }));
}

function createModuleLessons(title: string, module: string) {
  return [
    `${title} concepts`,
    `${module} tools and workflows`,
    "Guided practical exercise",
    "Industry use case review",
    "Feedback checkpoint"
  ];
}

function createFallbackCurriculum(title: string): CurriculumItem[] {
  return ["Foundations", "Tools and workflows", "Guided practice", "Applied delivery", "Quality and review", "Career capstone"].map((module) => ({
    title: `${title} ${module}`,
    text: `Build confidence in ${module.toLowerCase()} through guided lessons and practical checkpoints.`,
    lessons: createModuleLessons(title, module)
  }));
}

function createFallbackFaqs(title: string) {
  return [
    { question: `Do I need prior ${title} experience?`, answer: "No. The learning path begins with foundations and progresses into applied project work." },
    { question: "Are projects included?", answer: "Yes. The program includes six portfolio-oriented project examples with clear deliverables." },
    { question: "Will I receive a certificate?", answer: "Yes. Certification is issued after the required project work is completed." },
    { question: "Is interview preparation included?", answer: "Yes. Support varies by plan and can include portfolio review, mock interviews, and technical preparation." }
  ];
}

function formatInr(amount: number) {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

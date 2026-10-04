import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  Code2,
  FolderKanban,
  GraduationCap,
  Headphones,
  Laptop,
  PhoneCall,
  PlayCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  Video,
  WalletCards
} from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { useDialogAccessibility } from "../components/useDialogAccessibility";
import { SiteFooter } from "../components/SiteFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/program-details.css";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { allPrograms, defaultProgramPlans, findProgramBySlug } from "../data/siteContent";
import type { Program, ProgramPlan } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { publicLmsApi } from "../features/lms/api/lmsApi";
import { checkoutEmailsMatch, savePendingEnrollment } from "../features/lms/checkout";
import type { EnrollmentApplicant } from "../features/lms/checkout";
import type { ProgramDetailsResponse } from "../features/lms/api/lmsTypes";
import { ApiError, formatApiError } from "../lib/api/httpClient";

type DetailItem = { title: string; text: string };
type CurriculumItem = DetailItem & { lessons: string[] };
type ProjectItem = DetailItem & { artifacts: string[]; technologies?: string[] };
type DomainFeatureItem = { icon: ReactNode; title: string; text: string; bullets: string[] };
type RegistrationSubmission = { applicant: EnrollmentApplicant; paymentChoice: "token" | "full"; startDate?: string; acceptedTerms: boolean };
const checkoutPolicyVersion = "2026-08-20";
const tones = ["lilac", "mint", "peach", "sky", "rose", "butter"];
const order = (index: number) => ({ "--i": index }) as CSSProperties;
const sectionLinks = [["overview", "Overview"], ["skills", "Skills"], ["curriculum", "Curriculum"], ["projects", "Projects"], ["certification", "Certification"], ["pricing", "Pricing"], ["faq", "FAQ"]] as const;

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

const credentialCertificates = [
  {
    title: "Training Certificate",
    image: "/assets/training-certificate.png",
    alt: "Joviq Technologies training certificate"
  },
  {
    title: "Internship Certificate",
    image: "/assets/internship-certificate.jpg",
    alt: "Joviq Technologies internship certificate"
  }
];

export function ProgramDetailsPage() {
  const { slug } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const localProgram = findProgramBySlug(slug);
  const [remoteProgram, setRemoteProgram] = useState<ProgramDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!localProgram);
  const [selectedPlanCode, setSelectedPlanCode] = useState("INTERMEDIATE");
  const [registrationPlan, setRegistrationPlan] = useState<ProgramPlan | null>(null);
  const [activeCertificateIndex, setActiveCertificateIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const mainRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveCertificateIndex((current) => (current + 1) % credentialCertificates.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

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

  // Highlight the tab for whichever section is currently in view.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const sections = sectionLinks.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [program?.slug]);

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

  const currentProgram = program;
  const heroImage = getProgramImage(currentProgram.slug, currentProgram.domain);

  function choosePlan(planCode: string) {
    const plan = currentProgram.plans.find((item) => item.code === planCode);
    if (!plan) return;
    setSelectedPlanCode(planCode);
    setRegistrationPlan(plan);
  }

  function beginCheckout(plan: ProgramPlan) {
    setSelectedPlanCode(plan.code);
    setRegistrationPlan(plan);
  }

  async function continueToCheckout(submission: RegistrationSubmission) {
    if (!registrationPlan) return;

    const email = submission.applicant.email.trim().toLowerCase();
    if (auth.user && !checkoutEmailsMatch(email, auth.user.email)) {
      throw new Error("Use your signed-in email for enrollment, or sign in to the account you want to enroll.");
    }

    // Checkout must use a published database program and its authoritative pricing.
    const availableProgram = (await publicLmsApi.getProgram(currentProgram.slug)).data;
    const availablePlan = availableProgram.plans.find((plan) => plan.code === registrationPlan.code && plan.isActive);
    if (!availablePlan) throw new Error("This plan is not available for enrollment. Please choose another plan.");
    const checkoutPath = "/checkout?autostart=1";
    const rememberEnrollment = () => savePendingEnrollment({
      slug: availableProgram.slug,
      programId: availableProgram.id,
      planId: availablePlan.id,
      planCode: availablePlan.code,
      programTitle: availableProgram.title,
      paymentMode: submission.paymentChoice === "token" ? 1 : 2,
      amount: submission.paymentChoice === "token" ? availablePlan.reserveAmount : availablePlan.offerPrice,
      applicant: { ...submission.applicant, email },
      startDate: submission.paymentChoice === "token" ? submission.startDate : undefined
    });

    if (!auth.user) {
      try {
        const response = await authApi.createCheckoutAccount({
          fullName: submission.applicant.fullName,
          email,
          phoneNumber: submission.applicant.phoneNumber,
          collegeName: submission.applicant.collegeName,
          acceptedTerms: submission.acceptedTerms,
          termsVersion: checkoutPolicyVersion,
          privacyPolicyVersion: checkoutPolicyVersion
        });
        auth.applyAuthResponse(response.data);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409 &&
          ["email_exists", "phone_exists"].includes(error.problem?.errorCode ?? "")) {
          rememberEnrollment();
          setRegistrationPlan(null);
          navigate(`/login?returnUrl=${encodeURIComponent(checkoutPath)}`);
          return;
        }
        throw error;
      }
    }

    rememberEnrollment();
    setRegistrationPlan(null);
    navigate(checkoutPath);
  }

  return (
    <main className="pdx sc-page">
      <PublicNavbar />
      <div className="sc-main" ref={mainRef}>
        <section className="sc-hero pdx-hero" aria-labelledby="program-detail-title">
          <div className="sc-hero-grid">
            <div className="sc-hero-copy">
              <Link className="pdx-back" to="/programs"><ArrowLeft size={16} /> All programs</Link>
              <span className="sc-badge"><span className="sc-pulse" aria-hidden="true" /><Sparkles size={15} /> {program.domain}</span>
              <h1 id="program-detail-title">{program.title}</h1>
              <p>{program.shortDescription}</p>
              <div className="sc-actions">
                <a className="sc-button" href="#pricing">Compare plans <ArrowRight size={18} /></a>
                <Link className="sc-ghost" to="/request-callback">Talk to an expert <PhoneCall size={16} /></Link>
              </div>
              <ul className="pdx-hero-facts" aria-label="Program highlights">
                <li className="tone-lilac"><span className="sc-icon sc-icon--tone-solid"><CalendarClock size={17} /></span><span><small>Duration</small>{program.duration}</span></li>
                <li className="tone-mint"><span className="sc-icon sc-icon--tone-solid"><GraduationCap size={17} /></span><span><small>Level</small>{program.level}</span></li>
                <li className="tone-peach"><span className="sc-icon sc-icon--tone-solid"><Award size={17} /></span><span><small>Outcome</small>Verified certificate</span></li>
              </ul>
            </div>
            <div className="sc-hero-visual pdx-hero-visual">
              <div className="pdx-hero-frame"><img src={heroImage} alt="" width={1200} height={800} fetchPriority="high" /></div>
              <div className="sc-floater pdx-float pdx-float--1 tone-sky" style={order(0)}><span className="sc-icon sc-icon--tone-solid"><Laptop size={18} /></span><span><strong>{program.mode}</strong>Learning mode</span></div>
              <div className="sc-floater pdx-float pdx-float--2 tone-mint" style={order(1)}><span className="sc-icon sc-icon--tone-solid"><FolderKanban size={18} /></span><span><strong>{program.projects.length} real projects</strong>Portfolio-ready work</span></div>
              <div className="sc-floater pdx-float pdx-float--3 tone-butter" style={order(2)}><span className="sc-icon sc-icon--tone-solid"><BookOpenCheck size={18} /></span><span><strong>{program.curriculum.length} modules</strong>Step-by-step path</span></div>
            </div>
          </div>
        </section>

        <nav className="pdx-tabs" aria-label="Program page sections">
          <div>{sectionLinks.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? "true" : undefined}>{label}</a>)}</div>
        </nav>

        <section className="sc-section pdx-overview" id="overview">
          <div className="sc-heading" data-reveal>
            <span className="sc-eyebrow">Program overview</span>
            <h2>Build capability you can demonstrate, not just describe.</h2>
            <p>{program.overview}</p>
            <div className="pdx-facts">
              <span className="tone-lilac"><span className="sc-icon sc-icon--tone"><CalendarClock size={18} /></span><small>Duration</small><strong>{program.duration}</strong></span>
              <span className="tone-sky"><span className="sc-icon sc-icon--tone"><Video size={18} /></span><small>Learning mode</small><strong>{program.mode}</strong></span>
              <span className="tone-mint"><span className="sc-icon sc-icon--tone"><GraduationCap size={18} /></span><small>Level</small><strong>{program.level}</strong></span>
              <span className="tone-peach"><span className="sc-icon sc-icon--tone"><UsersRound size={18} /></span><small>Review</small><strong>Expert reviewed</strong></span>
            </div>
          </div>
          <aside className="pdx-audience tone-mint" data-reveal style={order(1)}>
            <span className="sc-icon sc-icon--tone-solid"><UserPlus size={20} /></span>
            <h3>Who should join</h3>
            <ul>{program.audience.map((item) => <li key={item}><CheckCircle2 size={17} /> {item}</li>)}</ul>
          </aside>
        </section>

        <section className="sc-section" id="skills">
          <div className="sc-heading sc-heading--center" data-reveal><span className="sc-eyebrow">Skills you’ll build</span><h2>Tools and skills you’ll use on real work.</h2></div>
          <ul className="pdx-skills sc-stagger" data-reveal>{program.skills.map((skill, index) => <li key={skill} className={`tone-${tones[index % tones.length]}`} style={order(index)}><Code2 size={15} />{skill}</li>)}</ul>
          <div className="pdx-features">{domainFeatures.map((feature, index) => (
            <article key={feature.title} className={`sc-card tone-${tones[index % tones.length]}`} data-reveal style={order(index)}>
              <span className="sc-icon sc-icon--tone-solid">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <ul className="sc-checklist">{feature.bullets.map((bullet) => <li key={bullet}><Check size={16} />{bullet}</li>)}</ul>
            </article>
          ))}</div>
        </section>

        <section className="sc-section pdx-curriculum" id="curriculum">
          <div className="sc-heading" data-reveal>
            <span className="sc-eyebrow">Curriculum</span>
            <h2>A clear path from foundations to career proof.</h2>
            <p>Explore each module to see what you’ll learn.</p>
            <div className="pdx-curriculum-stats"><span><b>{program.curriculum.length}</b> modules</span><span><b>{program.curriculum.reduce((total, module) => total + module.lessons.length, 0)}</b> lessons</span><span><b>{program.projects.length}</b> projects</span></div>
          </div>
          <ol className="pdx-modules" data-reveal>
            {program.curriculum.map((module, index) => (
              <li key={`${program.slug}-${module.title}`} className={`tone-${tones[index % tones.length]}`}>
                <details name="program-curriculum" open={index === 0}>
                  <summary>
                    <span className="pdx-module-num">{String(index + 1).padStart(2, "0")}</span>
                    <div><h3>{module.title}</h3><p>{module.text}</p></div>
                    <span className="pdx-module-toggle" aria-hidden="true"><Plus size={16} /></span>
                  </summary>
                  <ul>{module.lessons.map((lesson) => <li key={lesson}><PlayCircle size={16} />{lesson}</li>)}</ul>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section className="sc-band pdx-projects" id="projects">
          <div className="sc-heading sc-heading--center" data-reveal>
            <span className="sc-eyebrow">Real-world projects</span>
            <h2>Real-World Hands-On Projects</h2>
            <p>Build strong industry-ready skills with practical experience.</p>
          </div>
          <div className="pdx-project-grid">
            {program.projects.map((project, index) => (
              <article key={project.title} className={`sc-glass tone-${tones[index % tones.length]}`} data-reveal style={order(index)}>
                <header><span className="sc-icon sc-icon--tone-solid"><FolderKanban size={19} /></span><span className="pdx-project-num">Project {index + 1}</span></header>
                <h3>{project.title}</h3>
                <p>{project.text}</p>
                <details>
                  <summary>View details <Plus size={15} /></summary>
                  <strong>Key features</strong>
                  <ul>{(project.technologies ? project.artifacts : project.artifacts.slice(0, 4)).map((artifact) => <li key={artifact}><Check size={14} />{artifact}</li>)}</ul>
                  <strong>Technologies</strong>
                  <div className="pdx-tech">{(project.technologies ?? program.skills.slice(0, 4)).map((skill) => <span key={skill}>{skill}</span>)}</div>
                </details>
              </article>
            ))}
          </div>
        </section>

        <section className="sc-section pdx-credential" id="certification">
          <div className="sc-heading" data-reveal>
            <span className="sc-eyebrow">Expert guidance & certification</span>
            <h2>Review from someone who understands the work.</h2>
            <p>{program.guidance}</p>
            <ul className="pdx-credential-points">
              <li className="tone-sky"><span className="sc-icon sc-icon--tone-solid"><Headphones size={17} /></span>Live guidance, project reviews, doubt support, and interview feedback.</li>
              <li className="tone-mint"><span className="sc-icon sc-icon--tone-solid"><ShieldCheck size={17} /></span>{program.certification}</li>
            </ul>
          </div>
          <a className="pdx-certificate" data-reveal style={order(1)} href={credentialCertificates[activeCertificateIndex].image} target="_blank" rel="noopener noreferrer" aria-label={`View ${credentialCertificates[activeCertificateIndex].title} for ${program.title} in full size`}>
            <span className="sc-pill tone-butter"><Award size={14} /> {credentialCertificates[activeCertificateIndex].title}</span>
            <img key={activeCertificateIndex} src={credentialCertificates[activeCertificateIndex].image} alt={credentialCertificates[activeCertificateIndex].alt} width="1600" height="1131" loading="lazy" />
            <span className="pdx-certificate-dots" aria-hidden="true">{credentialCertificates.map((certificate, index) => <i className={index === activeCertificateIndex ? "is-active" : ""} key={certificate.title} />)}</span>
          </a>
        </section>

        <section className="sc-section pdx-career">
          <article className="sc-card tone-lilac" data-reveal>
            <span className="sc-eyebrow">Career outcomes</span><h2>Know where this program can take you.</h2>
            <ul className="pdx-outcomes">{program.outcomes.map((outcome, index) => <li key={outcome} className={`tone-${tones[index % tones.length]}`}><span className="sc-icon sc-icon--tone-solid"><BriefcaseBusiness size={16} /></span>{outcome}</li>)}</ul>
          </article>
          <article className="sc-card tone-peach" data-reveal style={order(1)}>
            <span className="sc-eyebrow">Interview preparation</span><h2>Practice explaining the decisions behind your work.</h2>
            <ul className="sc-checklist">{program.interviewPrep.map((item) => <li key={item}><BadgeCheck size={16} />{item}</li>)}</ul>
          </article>
        </section>

        <section className="sc-section pdx-pricing" id="pricing">
          <div className="sc-heading sc-heading--center" data-reveal>
            <span className="sc-eyebrow">Program plans</span>
            <h2>Choose the support level that fits your goal.</h2>
            <p>Every plan provides structured learning and certification. Upgrade when you want deeper expert review.</p>
          </div>
          <div className="pdx-plans">
            {program.plans.map((plan, index) => <PlanCard key={plan.code} index={index} onChoose={() => choosePlan(plan.code)} plan={plan} />)}
          </div>
          {remoteProgram ? <p className="pdx-admin-note"><ShieldCheck size={15} /> Prices and features are managed per program from the Admin Panel.</p> : null}
        </section>

        <section className="sc-section sc-faq" id="faq">
          <div className="sc-heading" data-reveal>
            <span className="sc-eyebrow">FAQ</span><h2>Questions before you enroll.</h2>
            <p>Clear answers about eligibility, projects, certification, and learner guidance.</p>
            <Link className="sc-ghost" to="/request-callback">Ask an advisor <ArrowRight size={16} /></Link>
          </div>
          <div className="sc-faq-list" data-reveal>
            {program.faqs.map((faq, index) => (
              <details key={faq.question} name="program-faq" open={index === 0}>
                <summary>{faq.question}<span aria-hidden="true"><Plus size={16} /></span></summary><p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="pdx-enroll" id="enroll" data-reveal>
          <div className="pdx-enroll-copy">
            <span className="sc-eyebrow">Enroll now</span><h2>Start your {program.title} journey.</h2>
            <p>Choose your level, share your details, and reserve your place or pay in full securely. Full access lasts six months after verification.</p>
            <ul>
              <li><CheckCircle2 size={18} /> No hidden plan features</li>
              <li><CheckCircle2 size={18} /> Guided onboarding</li>
              <li><CheckCircle2 size={18} /> Secure LMS access</li>
            </ul>
          </div>
          <EnrollForm onCheckout={beginCheckout} onPlanChange={setSelectedPlanCode} plans={program.plans} programTitle={program.title} selectedPlanCode={selectedPlanCode} />
        </section>
      </div>

      {registrationPlan ? (
        <RegistrationDialog
          key={registrationPlan.code}
          onClose={() => setRegistrationPlan(null)}
          onSubmit={continueToCheckout}
          plan={registrationPlan}
          programTitle={currentProgram.title}
        />
      ) : null}

      <SiteFooter />
    </main>
  );
}

function PlanCard({ index, onChoose, plan }: { index: number; onChoose: () => void; plan: ProgramPlan }) {
  const isRecommended = plan.code === "INTERMEDIATE";
  const includedPlan = plan.code === "INTERMEDIATE" ? "Everything in Launch, plus" : plan.code === "MASTER" ? "Everything in Elevate, plus" : null;
  const savings = Math.max(0, plan.actualPrice - plan.offerPrice);
  const tone = ["mint", "lilac", "peach"][index % 3];
  const PlanIcon = [Send, Sparkles, Award][index % 3];

  return (
    <article className={`pdx-plan tone-${tone}${isRecommended ? " is-recommended" : ""}`} data-reveal style={order(index)}>
      {isRecommended ? <span className="pdx-plan-flag"><BadgeCheck size={15} /> Most popular</span> : null}
      <header>
        <span className="sc-icon sc-icon--tone-solid"><PlanIcon size={20} /></span>
        <div><h3>{plan.name}</h3><small>{isRecommended ? "Best value for most learners" : plan.code === "MASTER" ? "Maximum support" : "Strong start"}</small></div>
      </header>
      <div className="pdx-plan-price">
        <strong>{formatInr(plan.offerPrice)}</strong>
        {savings > 0 ? <span><del>{formatInr(plan.actualPrice)}</del><b>Save {formatInr(savings)}</b></span> : null}
      </div>
      {includedPlan ? <p className="pdx-plan-includes">{includedPlan}</p> : null}
      <ul className="sc-checklist">{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
      <small className="pdx-plan-deposit"><WalletCards size={14} /> Reserve with {formatInr(plan.reserveAmount)}</small>
      <button onClick={onChoose} type="button">Choose {plan.name}<ArrowRight size={17} /></button>
    </article>
  );
}

function EnrollForm({ onCheckout, onPlanChange, plans, programTitle, selectedPlanCode }: {
  onCheckout: (plan: ProgramPlan) => void;
  onPlanChange: (code: string) => void;
  plans: ProgramPlan[];
  programTitle: string;
  selectedPlanCode: string;
}) {
  const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0];

  return (
    <div className="pdx-enroll-form">
      <div className="pdx-enroll-summary"><span>Selected plan</span><strong>{selectedPlan?.name ?? "Choose a plan"}</strong><small>{selectedPlan ? `${formatInr(selectedPlan.offerPrice)} full plan` : "Pricing unavailable"}</small></div>
      <label>
        Plan
        <select name="planCode" value={selectedPlanCode} onChange={(event) => onPlanChange(event.target.value)}>
          {plans.map((plan) => <option key={plan.code} value={plan.code}>{plan.name} - {formatInr(plan.offerPrice)}</option>)}
        </select>
      </label>
      <div className="pdx-enroll-note"><ShieldCheck size={17} /><span>Register with your name, phone, email, and college. Then choose a seat token or pay the full plan amount securely.</span></div>
      <button type="button" disabled={!selectedPlan} onClick={() => selectedPlan && onCheckout(selectedPlan)}><UserPlus size={18} /> Continue to registration</button>
      <small className="pdx-enroll-label">{programTitle} · UPI, UPI QR, cards, and net banking supported by the payment gateway.</small>
    </div>
  );
}

function RegistrationDialog({ onClose, onSubmit, plan, programTitle }: {
  onClose: () => void;
  onSubmit: (submission: RegistrationSubmission) => Promise<void>;
  plan: ProgramPlan;
  programTitle: string;
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [collegeName, setCollegeName] = useState("");
  const [paymentChoice, setPaymentChoice] = useState<"token" | "full">("token");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);
  const [retryAt, setRetryAt] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  useDialogAccessibility(true, ".enrollment-dialog", onClose);

  useEffect(() => {
    if (!retryAt) return;
    const update = () => setRetrySeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || Date.now() < retryAt) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onSubmit({
        applicant: { fullName: fullName.trim(), phoneNumber, email: email.trim(), collegeName: collegeName.trim() },
        paymentChoice,
        acceptedTerms
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        const seconds = error.retryAfterSeconds ?? 60;
        setRetrySeconds(seconds);
        setRetryAt(Date.now() + seconds * 1000);
        setErrorMessage("Too many attempts. Your details are still here; please wait before continuing.");
      } else {
        setErrorMessage(formatApiError(error));
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div
      aria-label="Registration and payment options"
      className="enrollment-dialog-backdrop"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      role="presentation"
    >
      <section aria-labelledby="enrollment-dialog-title" aria-modal="true" className="enrollment-dialog" role="dialog">
        <header className="enrollment-dialog__header">
          <div className="enrollment-dialog__title-icon"><UserPlus size={23} /></div>
          <div className="enrollment-dialog__header-copy">
            <span className="enrollment-dialog__eyebrow">Registration before payment</span>
            <h2 id="enrollment-dialog-title">Secure your place in {programTitle}</h2>
            <p>Share these details once, then choose how you want to start your learning journey.</p>
          </div>
          <div className="enrollment-dialog__plan-summary">
            <div><WalletCards size={20} /><span><small>Selected level</small><strong>{plan.name}</strong></span></div>
            <div><BadgeCheck size={20} /><span><small>Full plan value</small><strong>{formatInr(plan.offerPrice)}</strong></span></div>
            <div><CalendarClock size={20} /><span><small>Access period</small><strong>6 months</strong></span></div>
          </div>
          <button aria-label="Close registration dialog" className="enrollment-dialog__close" onClick={onClose} type="button">×</button>
        </header>

        <form className="enrollment-dialog__form" onSubmit={handleSubmit}>
          <fieldset>
            <legend><span>01</span><strong>Your details</strong><small>We use these details for your enrollment and payment receipt.</small></legend>
            <div className="enrollment-dialog__fields">
              <label>
                <span className="enrollment-dialog__label-text">Name <b>*</b></span>
                <input autoComplete="name" onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" required value={fullName} />
              </label>
              <IndiaMobileInput label="Phone number *" name="phoneNumber" onChange={(event) => setPhoneNumber(event.target.value)} required value={phoneNumber} />
              <label>
                <span className="enrollment-dialog__label-text">Email ID <b>*</b></span>
                <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
              </label>
              <label>
                <span className="enrollment-dialog__label-text">College name <b>*</b></span>
                <input autoComplete="organization" onChange={(event) => setCollegeName(event.target.value)} placeholder="Your college or organization" required value={collegeName} />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span><strong>Choose your payment option</strong><small>Your account and course access are updated only after payment verification.</small></legend>
            <div className="enrollment-dialog__payment-options">
              <label className={`enrollment-dialog__payment-option${paymentChoice === "token" ? " is-selected" : ""}`}>
                <input checked={paymentChoice === "token"} name="paymentChoice" onChange={() => setPaymentChoice("token")} type="radio" value="token" />
                <span className="enrollment-dialog__payment-icon"><WalletCards size={20} /></span>
                <span><strong>Reserve my seat</strong><small>Pay {formatInr(plan.reserveAmount)} for pre-registration now.</small></span>
                <b>Pre-registration</b>
              </label>
              <label className={`enrollment-dialog__payment-option${paymentChoice === "full" ? " is-selected" : ""}`}>
                <input checked={paymentChoice === "full"} name="paymentChoice" onChange={() => setPaymentChoice("full")} type="radio" value="full" />
                <span className="enrollment-dialog__payment-icon"><BadgeCheck size={20} /></span>
                <span><strong>Pay in full</strong><small>Pay {formatInr(plan.offerPrice)} now and unlock the complete program for six months.</small></span>
                <b>Full access</b>
              </label>
            </div>
          </fieldset>

          <label className="enrollment-dialog__terms">
            <input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.currentTarget.checked)} required type="checkbox" />
            <span>I agree to the Joviq terms and privacy policy.</span>
          </label>
          {errorMessage ? <p className="enrollment-dialog__error" role="alert">{errorMessage}</p> : null}
          <div className="enrollment-dialog__secure-note"><ShieldCheck size={18} /><span>Existing learners sign in to continue. New learners receive a checkout account before secure payment opens.</span></div>
          <button className="enrollment-dialog__submit" disabled={isSubmitting || retrySeconds > 0} type="submit"><ArrowRight size={18} /> {retrySeconds > 0 ? `Try again in ${retrySeconds}s` : isSubmitting ? "Preparing your account…" : `Continue with ${paymentChoice === "token" ? `pre-registration · ${formatInr(plan.reserveAmount)}` : `full payment · ${formatInr(plan.offerPrice)}`}`}</button>
        </form>
      </section>
    </div>
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
  const projects = local?.projectDetails ?? completeProjectExamples(remoteProjects.length ? remoteProjects : localProjects, title);
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

  const view: ProgramViewModel = {
    slug: remote?.slug ?? local?.slug ?? "program",
    title,
    domain: remote?.categoryName ?? local?.domain ?? "Career Program",
    shortDescription: remote?.shortDescription ?? local?.shortDescription ?? "Practical learning, reviewed projects, and career preparation.",
    overview: remote?.overview ?? local?.overview ?? "Build practical capability through guided learning, projects, and review.",
    audience: local?.audience ?? ["Students building career skills", "Fresh graduates preparing for roles", "Working professionals changing domains"],
    skills: remote?.skills.length ? remote.skills : local?.skills.length ? local.skills : ["Core foundations", "Industry tools", "Applied problem solving", "Project delivery", "Quality review", "Interview communication"],
    curriculum: local?.curriculumDetails ?? curriculum,
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
  // The PDF catalog owns these editorial fields; live enrollment plans still come from the API.
  if (local?.content) {
    const content = local.content;
    return { ...view, title: content.title, shortDescription: content.shortDescription,
      overview: content.overview, skills: content.skills, curriculum: local.curriculumDetails ?? content.curriculum,
      projects: local.projectDetails ?? content.projects, faqs: local.faqs };
  }
  return view;
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

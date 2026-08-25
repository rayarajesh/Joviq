import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  PhoneCall,
  Send,
  UserPlus
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { allPrograms, findProgramBySlug } from "../data/siteContent";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
type FormMessage = { tone: "success" | "error"; text: string } | null;

export function ProgramDetailsPage() {
  const { slug } = useParams();
  const program = findProgramBySlug(slug);

  if (!program) {
    return (
      <main className="program-detail-page">
        <PublicNavbar />
        <section className="program-not-found">
          <span className="site-eyebrow">Program not found</span>
          <h1>Choose a program from the catalog.</h1>
          <p>The program URL does not match the current Joviq catalog.</p>
          <div className="program-suggestion-grid">
            {allPrograms.slice(0, 6).map((item) => (
              <Link key={item.slug} to={`/programs/${item.slug}`}>
                {item.title}
              </Link>
            ))}
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="program-detail-page">
      <PublicNavbar />

      <section className="program-hero">
        <div className="program-hero__content">
          <div className="program-hero__copy">
            <Link className="program-back-link" to="/programs">
              <ArrowLeft size={17} />
              All programs
            </Link>
            <span className="site-eyebrow">{program.domain}</span>
            <h1>{program.title}</h1>
            <p>{program.shortDescription}</p>
            <div className="program-hero__meta">
              <span>
                <CalendarClock size={17} />
                {program.duration}
              </span>
              <span>
                <GraduationCap size={17} />
                {program.level}
              </span>
              <span>
                <Award size={17} />
                {program.certification}
              </span>
            </div>
            <div className="program-hero__actions">
              <a className="site-button site-button--primary" href="#enroll">
                Enroll Now <ArrowRight size={18} />
              </a>
              <Link className="site-button site-button--light" to="/request-callback">
                Talk to Career Expert <PhoneCall size={18} />
              </Link>
            </div>
          </div>

          <aside className="program-hero__card" aria-label="Program summary">
            <span>Expert-led + LMS</span>
            <strong>Next cohort</strong>
            <div className="program-hero__date">10 Sept</div>
            <div className="program-hero__card-grid">
              <small>
                <b>{program.curriculum.length}</b>
                Modules
              </small>
              <small>
                <b>{program.projects.length}</b>
                Projects
              </small>
              <small>
                <b>1 Year</b>
                LMS access
              </small>
            </div>
            <p>Includes curriculum roadmap, rubrics, projects, certification, and career support.</p>
          </aside>
        </div>
      </section>

      <section className="program-overview-band">
        <article>
          <span className="site-eyebrow">Program Overview</span>
          <h2>{program.overview}</h2>
        </article>
        <article>
          <span className="site-eyebrow">Learning Mode</span>
          <p>{program.mode}</p>
        </article>
        <article>
          <span className="site-eyebrow">Mentor</span>
          <p>{program.mentor}</p>
        </article>
      </section>

      <section className="program-detail-grid">
        <DetailPanel title="Who Should Join" icon={<UserPlus size={22} />} items={program.audience} />
        <DetailPanel title="Skills You Will Learn" icon={<BadgeCheck size={22} />} items={program.skills} />
        <DetailPanel title="Curriculum" icon={<Layers3 size={22} />} items={program.curriculum} />
        <DetailPanel title="Assignments" icon={<ClipboardCheck size={22} />} items={program.assignments} />
      </section>

      <section className="program-section">
        <ProgramHeading eyebrow="Project Blueprints" title="Build practical projects for your portfolio." />
        <div className="program-project-grid">
          {program.projects.map((project, index) => (
            <article key={project}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <BookOpenCheck size={22} />
              <h3>{project}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="program-detail-grid">
        <DetailPanel title="Assessments" icon={<CheckCircle2 size={22} />} items={program.assessments} />
        <DetailPanel title="Career Outcomes" icon={<Award size={22} />} items={program.outcomes} />
        <DetailPanel title="Interview Preparation" icon={<GraduationCap size={22} />} items={program.interviewPrep} />
        <article className="program-panel program-panel--price">
          <span className="site-eyebrow">Pricing</span>
          <h3>{program.pricing}</h3>
          <p>Includes guided learning, assignments, projects, assessment, certification, and career preparation.</p>
        </article>
      </section>

      <section className="program-section">
        <ProgramHeading eyebrow="Certification" title={program.certification} />
        <div className="program-certificate-row">
          <Award size={42} />
          <div>
            <strong>Joviq Technologies certification</strong>
            <span>Issued after project completion, assignment review, assessment performance, and mentor approval.</span>
          </div>
        </div>
      </section>

      <section className="program-section">
        <ProgramHeading eyebrow="FAQ" title="Common questions about this program." />
        <div className="faq-grid">
          {program.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="enroll" className="program-enroll-section">
        <div>
          <span className="site-eyebrow">Enroll Now</span>
          <h2>Start your {program.title} journey.</h2>
          <p>Send an enrollment request and the Joviq team can guide you through batch, pricing, and next steps.</p>
        </div>
        <EnrollForm programTitle={program.title} />
      </section>

      <SiteFooter />
    </main>
  );
}

function ProgramHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="program-heading">
      <span className="site-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function DetailPanel({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <article className="program-panel">
      <div>{icon}</div>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircle2 size={17} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function EnrollForm({ programTitle }: { programTitle: string }) {
  const [message, setMessage] = useState<FormMessage>(null);

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
    setMessage({ tone: "success", text: `Enrollment request captured for ${programTitle}.` });
  }

  return (
    <form className="enroll-card" onSubmit={handleSubmit}>
      <label>
        Full name
        <input name="fullName" placeholder="Your name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" maxLength={256} pattern={emailPattern} required />
      </label>
      <IndiaMobileInput label="Phone" name="phoneNumber" required />
      <label>
        Program
        <input name="program" value={programTitle} readOnly />
      </label>
      <button type="submit">
        <Send size={18} />
        Enroll Now
      </button>
      {message ? <div className={`auth-message auth-message--${message.tone}`}>{message.text}</div> : null}
    </form>
  );
}

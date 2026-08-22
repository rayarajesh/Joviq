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
  Menu,
  PhoneCall,
  Send,
  Sparkles,
  UserPlus,
  X
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { SiteFooter } from "../components/SiteFooter";
import { allPrograms, findProgramBySlug } from "../data/siteContent";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
type FormMessage = { tone: "success" | "error"; text: string } | null;

const navItems = [
  { label: "Home", href: "/#home" },
  { label: "Programs", href: "/#programs" },
  { label: "Features", href: "/#features" },
  { label: "Campus Ambassador", href: "/#campus-ambassador" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Careers", href: "/#careers" },
  { label: "About Us", href: "/#about" }
];

export function ProgramDetailsPage() {
  const { slug } = useParams();
  const program = findProgramBySlug(slug);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!program) {
    return (
      <main className="program-detail-page">
        <ProgramNav isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
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
      <ProgramNav isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <section className="program-hero">
        <div className="program-hero__content">
          <Link className="program-back-link" to="/#programs">
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
            <a className="site-button site-button--light" href="/#callback">
              Request Callback <PhoneCall size={18} />
            </a>
          </div>
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
        <ProgramHeading eyebrow="Real-Time Projects" title="Build practical projects for your portfolio." />
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

function ProgramNav({
  isMenuOpen,
  setIsMenuOpen
}: {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean | ((value: boolean) => boolean)) => void;
}) {
  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className={`site-nav program-nav ${isMenuOpen ? "is-open" : ""}`}>
      <Link className="site-nav__brand" to="/#home" onClick={closeMenu} aria-label="Joviq Technologies home">
        <span className="site-nav__mark">
          <Sparkles size={20} />
        </span>
        <span>
          <strong>Joviq Technologies</strong>
          <small>Website and LMS</small>
        </span>
      </Link>
      <nav className="site-nav__links" aria-label="Main menu">
        {navItems.map((item) => (
          <Link key={item.href} to={item.href} onClick={closeMenu}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="site-nav__actions">
        <Link to="/#auth">Login</Link>
        <Link className="is-primary" to="/#callback">
          Request Callback
        </Link>
      </div>
      <button
        className="site-nav__menu-button"
        type="button"
        aria-controls="program-mobile-menu"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setIsMenuOpen((value) => !value)}
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div id="program-mobile-menu" className="site-nav__mobile" aria-hidden={!isMenuOpen}>
        {navItems.map((item) => (
          <Link key={item.href} to={item.href} onClick={closeMenu}>
            {item.label}
          </Link>
        ))}
        <div className="site-nav__mobile-actions">
          <Link to="/#auth" onClick={closeMenu}>
            Login
          </Link>
          <Link className="is-primary" to="/#callback" onClick={closeMenu}>
            Request Callback
          </Link>
        </div>
      </div>
    </header>
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

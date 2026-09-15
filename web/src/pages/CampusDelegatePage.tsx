import { ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, CalendarRange, MapPinned, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/service-landing.css";

const delegateBenefits = [
  "Represent Joviq on campus and build a visible student network.",
  "Help peers discover internship, certification, and career growth programs.",
  "Earn recognition through leadership opportunities and referral rewards.",
  "Develop communication, event management, and campus outreach skills."
];

const delegateSteps = [
  { icon: Users, title: "Lead outreach", text: "Build awareness among students via events, sessions, and referrals." },
  { icon: BookOpen, title: "Guide peers", text: "Share program details and help students choose the right learning path." },
  { icon: BriefcaseBusiness, title: "Drive conversions", text: "Support enrollments and create a stronger campus learning culture." },
  { icon: CalendarRange, title: "Host activities", text: "Coordinate workshops, demos, and engagement drives with our team." }
];

export function CampusDelegatePage() {
  return (
    <div className="service-page">
      <PublicNavbar />

      <main className="service-page__shell">
        <section className="service-hero service-hero--delegate">
          <div className="service-hero__content">
            <span className="service-hero__eyebrow"><Sparkles size={14} /> Campus Delegate</span>
            <h1>Lead, mentor, and grow the next generation of talent.</h1>
            <p>
              Become a campus delegate and help students discover industry-driven learning,
              project-based development, and career-focused mentorship through Joviq.
            </p>
            <div className="service-hero__actions">
              <Link className="service-button service-button--primary" to="/request-callback">
                Join as delegate
                <ArrowRight size={17} />
              </Link>
              <Link className="service-button service-button--secondary" to="/programs">
                Explore programs
              </Link>
            </div>
          </div>

          <div className="service-hero__card">
            <div className="service-hero__metric">
              <strong>150+</strong>
              <span>student ambassadors</span>
            </div>
            <div className="service-hero__metric">
              <strong>25+</strong>
              <span>campus events hosted</span>
            </div>
            <div className="service-hero__metric">
              <strong>3x</strong>
              <span>network growth</span>
            </div>
          </div>
        </section>

        <section className="service-section">
          <div className="service-section__heading">
            <span className="service-kicker">Why join</span>
            <h2>Build a visible impact on campus.</h2>
          </div>
          <div className="service-grid service-grid--list">
            {delegateBenefits.map((item) => (
              <article key={item} className="service-card service-card--inline">
                <BadgeCheck size={22} />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-section service-section--alt">
          <div className="service-section__heading">
            <span className="service-kicker">Responsibilities</span>
            <h2>What you’ll do as a delegate.</h2>
          </div>
          <div className="service-grid">
            {delegateSteps.map(({ icon: Icon, title, text }) => (
              <article key={title} className="service-card">
                <span className="service-card__icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-cta">
          <div>
            <span className="service-kicker service-kicker--dark">Campus ambassador network</span>
            <h2>Turn your campus into a learning hub.</h2>
          </div>
          <div className="service-cta__meta">
            <span><MapPinned size={18} /> Pan-India campus outreach</span>
            <span><Users size={18} /> Student-first collaboration</span>
          </div>
          <Link className="service-button service-button--primary" to="/request-callback">
            Apply now
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

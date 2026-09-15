import { ArrowRight, BriefcaseBusiness, CircleCheckBig, LaptopMinimal, Sparkles, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/service-landing.css";

const roles = [
  { title: "Student Success Manager", text: "Guide learners through enrollments, onboarding, engagement, and outcomes." },
  { title: "Industry Mentor", text: "Support learners with project feedback, live mentoring, and career readiness coaching." },
  { title: "Campus Outreach Lead", text: "Drive college relationships, events, and student activation strategies." },
  { title: "Content & Learning Designer", text: "Build engaging, practical learning journeys that connect skill-building to outcomes." }
];

const perks = [
  "Fast-growing EdTech culture with room to learn and lead.",
  "Mentorship from senior professionals and cross-functional teams.",
  "Meaningful work centered on student growth, career impact, and skill-building.",
  "Opportunity to shape learning experiences at scale."
];

export function CareersPage() {
  return (
    <div className="service-page">
      <PublicNavbar />

      <main className="service-page__shell">
        <section className="service-hero service-hero--careers">
          <div className="service-hero__content">
            <span className="service-hero__eyebrow"><Sparkles size={14} /> Careers</span>
            <h1>Build meaningful work that helps students grow.</h1>
            <p>
              Join Joviq and work with a team that is building practical, career-ready learning
              experiences for students and learners across the country.
            </p>
            <div className="service-hero__actions">
              <Link className="service-button service-button--primary" to="/request-callback">
                Apply now
                <ArrowRight size={17} />
              </Link>
              <Link className="service-button service-button--secondary" to="/about">
                About Joviq
              </Link>
            </div>
          </div>

          <div className="service-hero__card">
            <div className="service-hero__metric">
              <strong>Hybrid</strong>
              <span>work culture</span>
            </div>
            <div className="service-hero__metric">
              <strong>Growth</strong>
              <span>focused roles</span>
            </div>
            <div className="service-hero__metric">
              <strong>Impact</strong>
              <span>driven team</span>
            </div>
          </div>
        </section>

        <section className="service-section">
          <div className="service-section__heading">
            <span className="service-kicker">Open roles</span>
            <h2>Work where learning meets impact.</h2>
          </div>
          <div className="service-grid">
            {roles.map(({ title, text }) => (
              <article key={title} className="service-card">
                <span className="service-card__icon"><BriefcaseBusiness size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-section service-section--alt">
          <div className="service-section__heading">
            <span className="service-kicker">Why work with us</span>
            <h2>Build a career with purpose.</h2>
          </div>
          <div className="service-grid service-grid--list">
            {perks.map((item) => (
              <article key={item} className="service-card service-card--inline">
                <CircleCheckBig size={22} />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-cta">
          <div>
            <span className="service-kicker service-kicker--dark">Join the team</span>
            <h2>Help learners build their next chapter.</h2>
          </div>
          <div className="service-cta__meta">
            <span><LaptopMinimal size={18} /> Remote & hybrid friendly roles</span>
            <span><Users size={18} /> Collaborative team culture</span>
            <span><Star size={18} /> Growth-oriented work</span>
          </div>
          <Link className="service-button service-button--primary" to="/request-callback">
            Get in touch
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

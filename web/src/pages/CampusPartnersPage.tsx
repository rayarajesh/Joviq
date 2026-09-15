import { ArrowRight, Building2, CheckCircle2, Handshake, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/service-landing.css";

const partnerHighlights = [
  { icon: Building2, title: "Campus collaborations", text: "Connect with our student communities and co-create learning opportunities across campuses." },
  { icon: Handshake, title: "Talent pipelines", text: "Build a steady pipeline of motivated students ready for internships, projects, and placement support." },
  { icon: TrendingUp, title: "Brand visibility", text: "Create your presence in emerging talent networks through events, workshops, and campus initiatives." },
  { icon: ShieldCheck, title: "Trusted engagement", text: "Get vetted, structured engagement designed around student learning outcomes and project readiness." }
];

const partnerBenefits = [
  "Student outreach and managed campus programs.",
  "Workshops, training bootcamps, and learning sessions.",
  "Career opportunities through curated talent engagement.",
  "Long-term collaborations with institutions and student communities."
];

export function CampusPartnersPage() {
  return (
    <div className="service-page">
      <PublicNavbar />

      <main className="service-page__shell">
        <section className="service-hero service-hero--partners">
          <div className="service-hero__content">
            <span className="service-hero__eyebrow"><Sparkles size={14} /> Campus Partners</span>
            <h1>Connect with emerging talent through meaningful campus partnerships.</h1>
            <p>
              We collaborate with institutions, communities, and organizations to create
              relevant learning experiences that prepare students for real-world opportunities.
            </p>
            <div className="service-hero__actions">
              <Link className="service-button service-button--primary" to="/request-callback">
                Partner with us
                <ArrowRight size={17} />
              </Link>
              <Link className="service-button service-button--secondary" to="/about">
                Learn more
              </Link>
            </div>
          </div>

          <div className="service-hero__card">
            <div className="service-hero__metric">
              <strong>200+</strong>
              <span>campus connect points</span>
            </div>
            <div className="service-hero__metric">
              <strong>40%</strong>
              <span>higher student engagement</span>
            </div>
            <div className="service-hero__metric">
              <strong>1:1</strong>
              <span>collaboration support</span>
            </div>
          </div>
        </section>

        <section className="service-section">
          <div className="service-section__heading">
            <span className="service-kicker">Partner value</span>
            <h2>Build stronger student outcomes together.</h2>
          </div>
          <div className="service-grid">
            {partnerHighlights.map(({ icon: Icon, title, text }) => (
              <article key={title} className="service-card">
                <span className="service-card__icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-section service-section--alt">
          <div className="service-section__heading">
            <span className="service-kicker">What we offer</span>
            <h2>Structured partnership opportunities.</h2>
          </div>
          <div className="service-grid service-grid--list">
            {partnerBenefits.map((item) => (
              <article key={item} className="service-card service-card--inline">
                <CheckCircle2 size={22} />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-cta">
          <div>
            <span className="service-kicker service-kicker--dark">Collaboration opportunities</span>
            <h2>Let’s create learning experiences that shape future talent.</h2>
          </div>
          <Link className="service-button service-button--primary" to="/request-callback">
            Start a partnership
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

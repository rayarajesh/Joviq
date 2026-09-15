import { ArrowRight, Quote, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/service-landing.css";

const testimonials = [
  {
    name: "Ananya Rao",
    program: "CSE - 3rd Year",
    quote: "The practical project feedback and guidance changed the way I presented my work and built confidence for internships.",
    result: "Internship shortlist in 2 weeks"
  },
  {
    name: "Ishita Sharma",
    program: "IT - 4th Year",
    quote: "The mentoring structure was clear, supportive, and focused on real outcomes. It made my technical interviews much smoother.",
    result: "Cracked 3 technical rounds"
  },
  {
    name: "Karthik Iyer",
    program: "ECE - Final Year",
    quote: "I could clearly connect my projects to industry expectations. The feedback helped me move from learning to execution.",
    result: "Placed after final round"
  },
  {
    name: "Nikhil Shetty",
    program: "Mechanical - 4th Year",
    quote: "The platform gave me clarity, structure, and confidence. I learned how to explain my work in a way interviewers understood.",
    result: "Interview confidence boost"
  },
  {
    name: "Tanvi Joshi",
    program: "CSE - Final Year",
    quote: "Every project felt career-focused. The expert review process and structured guidance made a visible difference in my preparation.",
    result: "Role converted successfully"
  },
  {
    name: "Sanjana Reddy",
    program: "CSE - 3rd Year",
    quote: "The sessions made me feel more prepared, more focused, and more capable of turning academic work into real opportunities.",
    result: "Shortlisted for internship tests"
  }
];

export function ReviewsPage() {
  return (
    <div className="service-page">
      <PublicNavbar />

      <main className="service-page__shell">
        <section className="service-hero service-hero--reviews">
          <div className="service-hero__content">
            <span className="service-hero__eyebrow"><Sparkles size={14} /> Reviews</span>
            <h1>Students trust the process and see the results.</h1>
            <p>
              Learn from students who used Joviq to improve their skill-building, confidence,
              and career readiness through guided projects and expert feedback.
            </p>
            <div className="service-hero__actions">
              <Link className="service-button service-button--primary" to="/programs">
                Explore programs
                <ArrowRight size={17} />
              </Link>
              <Link className="service-button service-button--secondary" to="/request-callback">
                Talk to advisor
              </Link>
            </div>
          </div>

          <div className="service-hero__card">
            <div className="service-hero__metric">
              <strong>4.9/5</strong>
              <span>student satisfaction</span>
            </div>
            <div className="service-hero__metric">
              <strong>1k+</strong>
              <span>learner stories</span>
            </div>
            <div className="service-hero__metric">
              <strong>90%</strong>
              <span>career readiness uplift</span>
            </div>
          </div>
        </section>

        <section className="service-section">
          <div className="service-section__heading">
            <span className="service-kicker">Student stories</span>
            <h2>What learners say about Joviq.</h2>
          </div>

          <div className="service-grid service-grid--reviews">
            {testimonials.map(({ name, program, quote, result }) => (
              <article key={name} className="service-card service-card--review">
                <div className="service-card__stars" aria-label="Five star review">
                  {[...Array(5)].map((_, index) => (
                    <Star key={`${name}-${index}`} size={16} fill="currentColor" />
                  ))}
                </div>
                <Quote size={26} className="service-card__quote-mark" />
                <p className="service-card__quote">“{quote}”</p>
                <div className="service-card__author">
                  <strong>{name}</strong>
                  <small>{program}</small>
                </div>
                <span className="service-card__result">{result}</span>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

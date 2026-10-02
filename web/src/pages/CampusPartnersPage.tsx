import type { CSSProperties } from "react";
import { ArrowRight, Building2, Check, GraduationCap, Handshake, Layers3, MessagesSquare, Plus, Presentation, Rocket, Sparkles, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { CampusScene } from "../components/CampusScene";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/campus-partners.css";

const order = (index: number) => ({ "--i": index }) as CSSProperties;
const audiences = [
  { icon: Building2, label: "Institutions & colleges", tone: "lilac" },
  { icon: Users, label: "Student communities", tone: "mint" },
  { icon: Layers3, label: "Organisations & teams", tone: "sky" }
];
const opportunities = [
  { icon: Presentation, art: "3d-laptop", tone: "lilac", tag: "Learning & skills", title: "Bring practical learning to campus.", text: "Explore workshops, training bootcamps, and focused sessions that connect classroom knowledge with real-world application.", points: ["Workshops and learning sessions", "Practical, project-focused training", "Programs aligned with student interests"] },
  { icon: Users, art: "3d-gear", tone: "peach", tag: "Community & outreach", title: "Create a more engaged student community.", text: "Collaborate on campus initiatives that introduce students to relevant programs and encourage active participation.", points: ["Student outreach and campus programs", "Events and awareness initiatives", "Visibility through meaningful engagement"] },
  { icon: GraduationCap, art: "3d-growth", tone: "sky", tag: "Talent & careers", title: "Connect learning with the next opportunity.", text: "Build connections with motivated students through curated talent engagement, projects, and career-focused initiatives.", points: ["Student talent connections", "Internship and project conversations", "Career readiness and placement support"] }
];
const principles = [
  { icon: Target, tone: "mint", title: "Shared learning goals", text: "Keep activities focused on student learning outcomes and project readiness." },
  { icon: Handshake, tone: "peach", title: "Structured engagement", text: "Discuss roles and expectations so campus initiatives have a clear direction." },
  { icon: Building2, tone: "sky", title: "Lasting relationships", text: "Explore ongoing collaboration with institutions and student communities." }
];
const process = [
  { icon: MessagesSquare, tone: "lilac", title: "Share your goals", text: "Tell us about your institution or organisation, your student community, and what you hope to achieve." },
  { icon: Handshake, tone: "peach", title: "Shape the collaboration", text: "Discuss suitable activities, responsibilities, schedules, and partnership terms with the Joviq team." },
  { icon: Rocket, tone: "mint", title: "Plan the next step", text: "Agree on the scope and coordinate a campus initiative around your shared learning objectives." }
];
const questions = [
  { title: "Who can explore a partnership?", text: "Institutions, student communities, and organisations interested in practical learning, campus engagement, and emerging talent can start a conversation with Joviq." },
  { title: "Can we discuss a specific campus requirement?", text: "Yes. Share your intended audience, learning goals, preferred activities, and schedule so the team can discuss a suitable collaboration." },
  { title: "What should we share when contacting you?", text: "Include your institution or organisation name, your role, contact details, and a brief outline of the collaboration you have in mind." },
  { title: "How are the scope and costs decided?", text: "Discuss the proposed activities, responsibilities, schedule, and any applicable costs with the team before confirming a partnership." }
];

export function CampusPartnersPage() {
  const mainRef = useScrollReveal();
  return <div className="campus-partners-page sc-page"><PublicNavbar /><main className="sc-main" ref={mainRef}>
    <section className="sc-hero sc-hero--center sc-hero--pastel partners-hero" aria-labelledby="partners-title">
      <div className="sc-hero-copy"><span className="sc-badge"><span className="sc-pulse" aria-hidden="true" /><Handshake size={16} /> Joviq Campus Partnerships</span>
        <h1 id="partners-title"><span>Great opportunities start with</span> <em>working together.</em></h1>
        <p>Bring institutions, student communities, and industry closer. Partner with Joviq to create practical learning experiences and meaningful connections for emerging talent.</p>
        <div className="sc-actions"><Link className="sc-button" to="/request-callback">Let’s collaborate <ArrowRight size={18} /></Link><a className="sc-ghost" href="#partnership-options">Explore opportunities <ArrowRight size={17} /></a></div>
      </div>
      <div className="partners-scene" role="img" aria-label="Joviq connects institutions and colleges, student communities, and organisations and teams">
        <CampusScene />
        {audiences.map(({ icon: Icon, label, tone }, index) => <div key={label} className={`partners-label partners-label--${index + 1} tone-${tone}`} style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={18} /></span>{label}</div>)}
      </div>
    </section>

    <section className="sc-section" id="partnership-options" aria-labelledby="partners-options-title">
      <div className="sc-heading sc-heading--split" data-reveal><div><span className="sc-eyebrow">Ways to collaborate</span><h2 id="partners-options-title">One partnership.<br />Different ways to make an impact.</h2></div><p>Start with the needs of your students and build a conversation around the right opportunities.</p></div>
      <div className="sc-grid-3">{opportunities.map(({ icon: Icon, art, tone, tag, title, text, points }, index) => <article className={`sc-card partners-option tone-${tone}`} key={tag} data-reveal style={order(index)}>
        <img className="partners-option-art" src={`/assets/showcase/${art}.webp`} alt="" width={360} height={340} loading="lazy" />
        <span className="sc-icon sc-icon--tone-solid"><Icon size={22} /></span><span className="sc-pill partners-tag">{tag}</span><h3>{title}</h3><p>{text}</p>
        <ul className="sc-checklist">{points.map(point => <li key={point}><Check size={16} />{point}</li>)}</ul>
      </article>)}</div>
    </section>

    <section className="sc-band partners-principles" aria-labelledby="partners-value-title">
      <div className="sc-heading" data-reveal><span className="sc-eyebrow">Built around students</span><h2 id="partners-value-title">More than a campus connection.</h2><p>A strong collaboration gives everyone a clear purpose: relevant learning, thoughtful engagement, and opportunities to put skills into practice.</p><Link className="sc-ghost sc-ghost--light" to="/programs">Explore our learning programs <ArrowRight size={17} /></Link></div>
      <div className="partners-principle-list sc-stagger" data-reveal>{principles.map(({ icon: Icon, tone, title, text }, index) => <article className={`sc-glass tone-${tone}`} key={title} style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={20} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>

    <section className="sc-section" aria-labelledby="partners-process-title">
      <div className="sc-heading sc-heading--center" data-reveal><span className="sc-eyebrow">Getting started</span><h2 id="partners-process-title">A conversation is a good first step.</h2></div>
      <ol className="sc-steps" data-reveal>{process.map(({ icon: Icon, tone, title, text }, index) => <li key={title} className={`tone-${tone}`} style={order(index)}><span className="sc-node sc-node--tone"><Icon size={22} /><b>{index + 1}</b></span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>

    <section className="sc-section sc-faq" aria-labelledby="partners-faq-title">
      <div className="sc-heading" data-reveal><span className="sc-eyebrow">Partnership questions</span><h2 id="partners-faq-title">Before we get started.</h2><p>Have something specific in mind? The team can talk it through with you.</p></div>
      <div className="sc-faq-list" data-reveal>{questions.map(question => <details key={question.title} name="partners-faq"><summary>{question.title}<span aria-hidden="true"><Plus size={16} /></span></summary><p>{question.text}</p></details>)}</div>
    </section>

    <section className="sc-cta partners-cta" aria-labelledby="partners-cta-title" data-reveal>
      <div><span className="sc-eyebrow">Let’s build something meaningful</span><h2 id="partners-cta-title">What could we create for your campus?</h2><p>Share your goals through our callback form. Mention your institution and the partnership you have in mind.</p></div>
      <div className="sc-cta-actions"><Link className="sc-button sc-button--light" to="/request-callback">Start a partnership <ArrowRight size={18} /></Link></div>
      <img className="partners-cta-art" src="/assets/showcase/3d-helmet.webp" alt="" width={360} height={345} loading="lazy" />
    </section>
  </main><SiteFooter /></div>;
}

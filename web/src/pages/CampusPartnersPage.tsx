import { ArrowRight, Building2, Check, GraduationCap, Handshake, Layers3, Presentation, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/campus-partners.css";

const opportunities = [
  { icon: Presentation, tag: "LEARNING & SKILLS", title: "Bring practical learning to campus.", text: "Explore workshops, training bootcamps, and focused sessions that connect classroom knowledge with real-world application.", points: ["Workshops and learning sessions", "Practical, project-focused training", "Programs aligned with student interests"] },
  { icon: Users, tag: "COMMUNITY & OUTREACH", title: "Create a more engaged student community.", text: "Collaborate on campus initiatives that introduce students to relevant programs and encourage active participation.", points: ["Student outreach and campus programs", "Events and awareness initiatives", "Visibility through meaningful engagement"] },
  { icon: GraduationCap, tag: "TALENT & CAREERS", title: "Connect learning with the next opportunity.", text: "Build connections with motivated students through curated talent engagement, projects, and career-focused initiatives.", points: ["Student talent connections", "Internship and project conversations", "Career readiness and placement support"] }
];
const process = [
  { title: "Share your goals", text: "Tell us about your institution or organisation, your student community, and what you hope to achieve." },
  { title: "Shape the collaboration", text: "Discuss suitable activities, responsibilities, schedules, and partnership terms with the Joviq team." },
  { title: "Plan the next step", text: "Agree on the scope and coordinate a campus initiative around your shared learning objectives." }
];
const questions = [
  { title: "Who can explore a partnership?", text: "Institutions, student communities, and organisations interested in practical learning, campus engagement, and emerging talent can start a conversation with Joviq." },
  { title: "Can we discuss a specific campus requirement?", text: "Yes. Share your intended audience, learning goals, preferred activities, and schedule so the team can discuss a suitable collaboration." },
  { title: "What should we share when contacting you?", text: "Include your institution or organisation name, your role, contact details, and a brief outline of the collaboration you have in mind." },
  { title: "How are the scope and costs decided?", text: "Discuss the proposed activities, responsibilities, schedule, and any applicable costs with the team before confirming a partnership." }
];

export function CampusPartnersPage() {
  return <div className="campus-partners-page"><PublicNavbar /><main className="partners-main">
    <section className="partners-hero" aria-labelledby="partners-title">
      <span className="partners-kicker"><Handshake size={17} /> CAMPUS PARTNERSHIPS</span>
      <h1 id="partners-title">Great opportunities<br />start with <em>working together.</em></h1>
      <p>Bring institutions, student communities, and industry closer. Partner with Joviq to create practical learning experiences and meaningful connections for emerging talent.</p>
      <div className="partners-actions"><Link className="partners-button" to="/request-callback">Let’s collaborate <ArrowRight size={18} /></Link><a className="partners-link" href="#partnership-options">Explore opportunities <ArrowRight size={17} /></a></div>
      <div className="partners-audiences" aria-label="Who we collaborate with">{[{icon:Building2,label:"Institutions & colleges"},{icon:Users,label:"Student communities"},{icon:Layers3,label:"Organisations & teams"}].map(({icon:Icon,label}) => <div key={label}><Icon size={20} /><span>{label}</span></div>)}</div>
    </section>

    <section className="partners-section" id="partnership-options" aria-labelledby="partners-options-title">
      <div className="partners-heading"><div><span className="partners-kicker">WAYS TO COLLABORATE</span><h2 id="partners-options-title">One partnership.<br />Different ways to make an impact.</h2></div><p>Start with the needs of your students and build a conversation around the right opportunities.</p></div>
      <div className="partners-opportunities">{opportunities.map(({icon:Icon,tag,title,text,points}) => <article key={tag}><span className="partners-icon"><Icon size={25} /></span><span className="partners-card-tag">{tag}</span><h3>{title}</h3><p>{text}</p><ul>{points.map(point => <li key={point}><Check size={16} />{point}</li>)}</ul></article>)}</div>
    </section>

    <section className="partners-principles" aria-labelledby="partners-value-title"><div><span className="partners-kicker">BUILT AROUND STUDENTS</span><h2 id="partners-value-title">More than a campus connection.</h2><p>A strong collaboration gives everyone a clear purpose: relevant learning, thoughtful engagement, and opportunities to put skills into practice.</p><Link className="partners-link" to="/programs">Explore our learning programs <ArrowRight size={17} /></Link></div><div className="partners-value-list">{[{icon:Target,title:"Shared learning goals",text:"Keep activities focused on student learning outcomes and project readiness."},{icon:Handshake,title:"Structured engagement",text:"Discuss roles and expectations so campus initiatives have a clear direction."},{icon:Building2,title:"Lasting relationships",text:"Explore ongoing collaboration with institutions and student communities."}].map(({icon:Icon,title,text}) => <article key={title}><Icon size={22} /><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

    <section className="partners-section" aria-labelledby="partners-process-title"><div className="partners-heading"><div><span className="partners-kicker">GETTING STARTED</span><h2 id="partners-process-title">A conversation is a good first step.</h2></div></div><ol className="partners-process">{process.map((step,index) => <li key={step.title}><span aria-hidden="true">0{index+1}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></section>

    <section className="partners-section partners-faq" aria-labelledby="partners-faq-title"><div><span className="partners-kicker">PARTNERSHIP QUESTIONS</span><h2 id="partners-faq-title">Before we get started.</h2></div><div>{questions.map(question => <details key={question.title} name="partners-faq"><summary>{question.title}<span aria-hidden="true">+</span></summary><p>{question.text}</p></details>)}</div></section>

    <section className="partners-cta" aria-labelledby="partners-cta-title"><div><span className="partners-kicker">LET’S BUILD SOMETHING MEANINGFUL</span><h2 id="partners-cta-title">What could we create<br />for your campus?</h2><p>Share your goals through our callback form. Mention your institution and the partnership you have in mind.</p></div><Link className="partners-button" to="/request-callback">Start a partnership <ArrowRight size={18} /></Link></section>
  </main><SiteFooter /></div>;
}

import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, BookOpen, BriefcaseBusiness, Check, HeartHandshake, Lightbulb, MessageCircle, MessagesSquare, Plus, Sparkles, UserRoundSearch, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/careers.css";

const order = (index: number) => ({ "--i": index }) as CSSProperties;
const roles = [
  { title: "Student Success Manager", category: "Student Experience", icon: HeartHandshake, tone: "rose", text: "Help learners feel supported at every step, from enrollment and onboarding to engagement and outcomes.", points: ["Guide student onboarding and program navigation", "Support learner engagement and follow-up", "Bring student feedback to the team"] },
  { title: "Industry Mentor", category: "Learning & Content", icon: Users, tone: "sky", text: "Turn your industry experience into practical guidance that helps learners build confidence and stronger projects.", points: ["Review projects and share actionable feedback", "Support live mentoring and learner questions", "Coach learners on career readiness"] },
  { title: "Campus Outreach Lead", category: "Campus & Community", icon: MessageCircle, tone: "peach", text: "Build college relationships and create campus initiatives that connect students with learning opportunities.", points: ["Develop relationships with college communities", "Coordinate campus events and outreach", "Help students discover relevant programs"] },
  { title: "Content & Learning Designer", category: "Learning & Content", icon: BookOpen, tone: "mint", text: "Create practical learning journeys that make complex ideas easier to understand and apply.", points: ["Structure engaging learning content", "Connect lessons with practical activities", "Refine learning journeys around student needs"] }
];
const tags = [{ label: "Learning", icon: BookOpen, tone: "mint" }, { label: "Community", icon: Users, tone: "peach" }, { label: "Impact", icon: Sparkles, tone: "sky" }];
const teams = ["All teams", ...Array.from(new Set(roles.map(role => role.category)))];
const values = [
  { icon: HeartHandshake, tone: "rose", title: "Students at the centre", text: "Work on experiences that help people build useful skills and take their next career step." },
  { icon: Lightbulb, tone: "butter", title: "Space to contribute", text: "Bring ideas, take initiative, and help shape how practical learning reaches students." },
  { icon: Users, tone: "mint", title: "Learn from each other", text: "Collaborate across teams and grow through mentorship from experienced professionals." }
];
const steps = [
  { icon: MessagesSquare, tone: "lilac", title: "Tell us what interests you", text: "Use the callback form and mention the role or team you’d like to explore." },
  { icon: UserRoundSearch, tone: "peach", title: "Share your background", text: "Tell the team about your relevant experience, strengths, and the work you enjoy." },
  { icon: BriefcaseBusiness, tone: "mint", title: "Discuss the opportunity", text: "Ask about current openings, work arrangements, expectations, and the next steps." }
];

export function CareersPage() {
  const mainRef = useScrollReveal();
  const [team, setTeam] = useState(teams[0]);
  const visibleRoles = team === teams[0] ? roles : roles.filter(role => role.category === team);
  return <div className="careers-page sc-page"><PublicNavbar /><main className="sc-main" ref={mainRef}>
    <section className="sc-hero sc-hero--dark" aria-labelledby="careers-title"><div className="sc-hero-grid">
      <div className="sc-hero-copy"><span className="sc-badge"><span className="sc-pulse" aria-hidden="true" /><Sparkles size={16} /> Build your next chapter</span>
        <h1 id="careers-title"><span>Good work.</span> <span>Real purpose.</span> <em>A place to grow.</em></h1>
        <p>Help us make practical learning a starting point for better careers. Bring your ideas, your experience, and your curiosity to Joviq.</p>
        <div className="sc-actions"><a className="sc-button" href="#career-roles">Explore roles <ArrowDown size={17} /></a><Link className="sc-ghost" to="/about">Meet Joviq <ArrowRight size={17} /></Link></div>
      </div>
      <div className="sc-hero-visual careers-visual">
        <div className="careers-frame"><img src="/assets/showcase/team-studio.webp" alt="A Joviq team collaborating at their workstations" width={1200} height={675} fetchPriority="high" /></div>
        <aside className="careers-mission" aria-label="The work that connects us"><span className="sc-icon sc-icon--gold"><BriefcaseBusiness size={22} /></span><div><span className="sc-eyebrow">The work that connects us</span><strong>Behind every learner’s next step, there’s a team that cares.</strong></div></aside>
        <ul className="careers-tags" aria-label="What we work towards">{tags.map(({ label, icon: Icon, tone }, index) => <li key={label} className={`sc-floater tone-${tone}`} style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={17} /></span><strong>{label}</strong></li>)}</ul>
      </div>
    </div></section>

    <section className="sc-section" aria-labelledby="careers-values-title">
      <div className="sc-heading sc-heading--center" data-reveal><span className="sc-eyebrow">Why Joviq</span><h2 id="careers-values-title">Make a difference.<br />Keep becoming better.</h2></div>
      <div className="careers-bento">
        <article className="careers-life tone-lilac" data-reveal><img src="/assets/showcase/3d-desk.webp" alt="" width={900} height={600} loading="lazy" /><div><span className="sc-eyebrow">Life at Joviq</span><p>From a thoughtful lesson to a helpful conversation, your contribution can make learning feel more achievable.</p></div></article>
        {values.map(({ icon: Icon, tone, title, text }, index) => <article className={`sc-card tone-${tone}`} key={title} data-reveal style={order(index + 1)}><span className="sc-icon sc-icon--tone-solid"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section className="sc-section" id="career-roles" aria-labelledby="careers-roles-title">
      <div className="sc-heading sc-heading--split" data-reveal><div><span className="sc-eyebrow">Find your team</span><h2 id="careers-roles-title">Where could you make an impact?</h2></div><p>Explore the roles below. Contact our team for current availability and role-specific details.</p></div>
      <div className="sc-filters" role="group" aria-label="Filter roles by team">{teams.map(name => <button key={name} type="button" aria-pressed={team === name} onClick={() => setTeam(name)}>{name}<small>{name === teams[0] ? roles.length : roles.filter(role => role.category === name).length}</small></button>)}</div>
      <p className="careers-results" role="status">{visibleRoles.length} {visibleRoles.length === 1 ? "role" : "roles"} to explore</p>
      <div className="careers-roles">{visibleRoles.map(({ title, category, icon: Icon, tone, text, points }, index) => <article className={`sc-card careers-role sc-fade-in tone-${tone}`} key={`${team}-${title}`} style={order(index)}>
        <div className="careers-role-top"><span className="sc-icon sc-icon--tone-solid"><Icon size={22} /></span><span className="sc-pill">{category}</span></div>
        <h3>{title}</h3><p>{text}</p>
        <details><summary>What you’ll contribute <span aria-hidden="true"><Plus size={15} /></span></summary><ul className="sc-checklist">{points.map(point => <li key={point}><Check size={16} />{point}</li>)}</ul></details>
        <Link className="sc-ghost careers-role-link" to="/request-callback" aria-label={`Enquire about ${title}`}>Enquire about role <ArrowRight size={17} /></Link>
      </article>)}</div>
    </section>

    <section className="sc-pastel-panel" aria-labelledby="careers-next-title">
      <div className="sc-heading sc-heading--center" data-reveal><span className="sc-eyebrow">Start a conversation</span><h2 id="careers-next-title">Your next step, made simple.</h2><p>You don’t need to have every answer. Start by telling us what you’d like to contribute.</p></div>
      <ol className="sc-steps" data-reveal>{steps.map(({ icon: Icon, tone, title, text }, index) => <li key={title} className={`tone-${tone}`} style={order(index)}><span className="sc-node sc-node--tone"><Icon size={22} /><b>{index + 1}</b></span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>

    <section className="sc-cta" aria-labelledby="careers-cta-title" data-reveal>
      <div><span className="sc-eyebrow">There’s more than one way to contribute</span><h2 id="careers-cta-title">Don’t see your role? Let’s talk.</h2><p>Share what you do best and the kind of work you’re looking for.</p></div>
      <div className="sc-cta-actions"><Link className="sc-button sc-button--light" to="/request-callback">Introduce yourself <ArrowRight size={18} /></Link></div>
    </section>
  </main><SiteFooter /></div>;
}

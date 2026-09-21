import { ArrowDown, ArrowRight, BookOpen, BriefcaseBusiness, Check, HeartHandshake, Lightbulb, MessageCircle, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/careers.css";

const roles = [
  { title: "Student Success Manager", category: "Student Experience", icon: HeartHandshake, text: "Help learners feel supported at every step, from enrollment and onboarding to engagement and outcomes.", points: ["Guide student onboarding and program navigation", "Support learner engagement and follow-up", "Bring student feedback to the team"] },
  { title: "Industry Mentor", category: "Learning & Content", icon: Users, text: "Turn your industry experience into practical guidance that helps learners build confidence and stronger projects.", points: ["Review projects and share actionable feedback", "Support live mentoring and learner questions", "Coach learners on career readiness"] },
  { title: "Campus Outreach Lead", category: "Campus & Community", icon: MessageCircle, text: "Build college relationships and create campus initiatives that connect students with learning opportunities.", points: ["Develop relationships with college communities", "Coordinate campus events and outreach", "Help students discover relevant programs"] },
  { title: "Content & Learning Designer", category: "Learning & Content", icon: BookOpen, text: "Create practical learning journeys that make complex ideas easier to understand and apply.", points: ["Structure engaging learning content", "Connect lessons with practical activities", "Refine learning journeys around student needs"] }
];
const values = [
  { icon: HeartHandshake, title: "Students at the centre", text: "Work on experiences that help people build useful skills and take their next career step." },
  { icon: Lightbulb, title: "Space to contribute", text: "Bring ideas, take initiative, and help shape how practical learning reaches students." },
  { icon: Users, title: "Learn from each other", text: "Collaborate across teams and grow through mentorship from experienced professionals." }
];

export function CareersPage() {
  return <div className="careers-page"><PublicNavbar /><main className="careers-main">
    <section className="careers-hero" aria-labelledby="careers-title">
      <div className="careers-hero-copy"><span className="careers-kicker"><Sparkles size={16} /> BUILD YOUR NEXT CHAPTER</span><h1 id="careers-title">Good work.<br />Real purpose.<br /><em>A place to grow.</em></h1><p>Help us make practical learning a starting point for better careers. Bring your ideas, your experience, and your curiosity to Joviq.</p><div className="careers-actions"><a className="careers-button" href="#career-roles">Explore roles <ArrowDown size={17} /></a><Link className="careers-text-link" to="/about">Meet Joviq <ArrowRight size={17} /></Link></div></div>
      <aside className="careers-mission"><span className="careers-mission-icon"><BriefcaseBusiness size={28} /></span><span className="careers-kicker">THE WORK THAT CONNECTS US</span><h2>Behind every learner’s next step,<br />there’s a team that cares.</h2><p>From a thoughtful lesson to a helpful conversation, your contribution can make learning feel more achievable.</p><div className="careers-mission-tags"><span>Learning</span><span>Community</span><span>Impact</span></div></aside>
    </section>

    <section className="careers-values" aria-labelledby="careers-values-title"><div className="careers-section-heading"><span className="careers-kicker">WHY JOVIQ</span><h2 id="careers-values-title">Make a difference.<br />Keep becoming better.</h2></div><div className="careers-value-grid">{values.map(({icon:Icon,title,text}) => <article key={title}><Icon size={24} /><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="careers-roles" id="career-roles" aria-labelledby="careers-roles-title"><div className="careers-roles-heading"><div><span className="careers-kicker">FIND YOUR TEAM</span><h2 id="careers-roles-title">Where could you make an impact?</h2></div><p>Explore the roles below. Contact our team for current availability and role-specific details.</p></div><p className="careers-results" role="status">{roles.length} {roles.length === 1 ? "role" : "roles"} to explore</p><div className="careers-role-list">{roles.map(({title,category:team,icon:Icon,text,points}) => <article key={title}><div className="careers-role-icon"><Icon size={24} /></div><div className="careers-role-body"><span className="careers-team">{team}</span><h3>{title}</h3><p>{text}</p><details><summary>What you’ll contribute <span aria-hidden="true">+</span></summary><ul>{points.map(point => <li key={point}><Check size={16} />{point}</li>)}</ul></details></div><Link className="careers-role-link" to="/request-callback" aria-label={`Enquire about ${title}`}>Enquire about role <ArrowRight size={17} /></Link></article>)}</div></section>

    <section className="careers-next" aria-labelledby="careers-next-title"><div><span className="careers-kicker">START A CONVERSATION</span><h2 id="careers-next-title">Your next step,<br />made simple.</h2><p>You don’t need to have every answer. Start by telling us what you’d like to contribute.</p></div><ol>{[{title:"Tell us what interests you",text:"Use the callback form and mention the role or team you’d like to explore."},{title:"Share your background",text:"Tell the team about your relevant experience, strengths, and the work you enjoy."},{title:"Discuss the opportunity",text:"Ask about current openings, work arrangements, expectations, and the next steps."}].map((step,index) => <li key={step.title}><span aria-hidden="true">0{index+1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></section>

    <section className="careers-cta" aria-labelledby="careers-cta-title"><div><span className="careers-kicker">THERE’S MORE THAN ONE WAY TO CONTRIBUTE</span><h2 id="careers-cta-title">Don’t see your role? Let’s talk.</h2><p>Share what you do best and the kind of work you’re looking for.</p></div><Link className="careers-button" to="/request-callback">Introduce yourself <ArrowRight size={18} /></Link></section>
  </main><SiteFooter /></div>;
}

import { ArrowRight, BadgeCheck, BookOpen, CalendarRange, Check, GraduationCap, Megaphone, MessageCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import "../styles/campus-delegate.css";

const benefits = [
  { icon: Megaphone, title: "Find your voice", text: "Build confidence in communication, campus outreach, and leading student activities." },
  { icon: Users, title: "Grow your network", text: "Connect with peers and the Joviq team while building a learning community on campus." },
  { icon: BadgeCheck, title: "Get recognised", text: "Explore leadership recognition and referral rewards. Ask the team about the applicable terms." }
];
const responsibilities = [
  { icon: Megaphone, title: "Spread the word", text: "Introduce students to Joviq’s learning programs through campus communities, sessions, and referrals." },
  { icon: BookOpen, title: "Help peers explore", text: "Share accurate program information and connect interested students with the team for guidance." },
  { icon: CalendarRange, title: "Bring people together", text: "Coordinate workshops, demos, and student engagement activities with Joviq." },
  { icon: MessageCircle, title: "Support the next step", text: "Help interested peers navigate enrollment and share campus questions with the team." }
];
const faqs = [
  { question: "What is a campus delegate?", answer: "A student representative who introduces Joviq to their campus, helps peers explore learning opportunities, and coordinates outreach activities with the team." },
  { question: "Do I need previous leadership experience?", answer: "An interest in communication, community building, and helping peers is a good starting point. Discuss your experience and suitability with the team when you request a callback." },
  { question: "How much time will I need to commit?", answer: "Discuss the expected activities and schedule with the team before joining, so you can understand how the role fits alongside your studies." },
  { question: "How do recognition and referral rewards work?", answer: "The program includes recognition opportunities and referral rewards. The team can explain current eligibility, conditions, and reward details before you join." },
  { question: "How do I express interest?", answer: "Select “Become a delegate” and complete the callback form. Let the team know that you are interested in the campus delegate program and share your college details." }
];
const ApplyLink = () => <Link className="delegate-button" to="/request-callback">Become a delegate <ArrowRight size={18} /></Link>;

export function CampusDelegatePage() {
  return <div className="campus-delegate-page"><PublicNavbar /><main className="delegate-main">
    <section className="delegate-hero" aria-labelledby="delegate-title">
      <div><span className="delegate-eyebrow"><GraduationCap size={17} /> JOVIQ CAMPUS DELEGATE</span>
        <h1 id="delegate-title">Your campus.<br />Your community.<br /><em>Your impact.</em></h1>
        <p>Connect your peers with practical learning opportunities. Build your leadership skills as you help your campus learn, collaborate, and grow.</p>
        <div className="delegate-actions"><ApplyLink /><a className="delegate-text-link" href="#delegate-role">Explore the role <ArrowRight size={17} /></a></div>
        <span className="delegate-hero-note">Campus outreach across India · Student-first collaboration</span>
      </div>
      <aside className="delegate-role-card" aria-label="The role at a glance">
        <span className="delegate-eyebrow"><Users size={22} /> CAMPUS CONNECTIONS</span>
        <h2>Be the person<br />who brings people together.</h2><p>Represent Joviq. Share opportunities. Make learning a campus conversation.</p>
        <ul>{[["Connect", "Introduce peers to career-focused programs."], ["Collaborate", "Coordinate activities with the Joviq team."], ["Grow", "Practice leadership through real outreach."]].map(([title,text]) => <li key={title}><Check size={18} /><span><strong>{title}</strong>{text}</span></li>)}</ul>
        <div className="delegate-card-bottom">Small initiatives. Meaningful impact.</div>
      </aside>
    </section>
    <section className="delegate-section" aria-labelledby="delegate-benefits">
      <div className="delegate-heading"><span className="delegate-eyebrow">WHY JOIN</span><h2 id="delegate-benefits">Give your campus more.<br />Take your skills further.</h2></div>
      <div className="delegate-benefits">{benefits.map(({icon: Icon,title,text}) => <article key={title}><span className="delegate-icon"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className="delegate-role-section" id="delegate-role" aria-labelledby="delegate-role-title">
      <div className="delegate-heading"><span className="delegate-eyebrow">YOUR ROLE</span><h2 id="delegate-role-title">Simple actions.<br />A stronger learning community.</h2><p>Be a helpful connection between your college community and Joviq.</p><Link className="delegate-text-link" to="/programs">Get to know our programs <ArrowRight size={17} /></Link></div>
      <div className="delegate-responsibilities">{responsibilities.map(({icon: Icon,title,text}) => <article key={title}><Icon size={22} /><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </section>
    <section className="delegate-section delegate-start" aria-labelledby="delegate-fit-title">
      <div className="delegate-fit"><span className="delegate-eyebrow">IS THIS FOR YOU?</span><h2 id="delegate-fit-title">Enjoy connecting people?<br />Start here.</h2><p>This role may suit you if you’re a college student who enjoys:</p><ul>{["Helping peers discover learning opportunities", "Communicating with student groups and communities", "Taking initiative and organising campus activities", "Working with a team and following through"].map(item => <li key={item}><Check size={17} />{item}</li>)}</ul></div>
      <div className="delegate-apply"><span className="delegate-eyebrow">LET’S TALK</span><h3>Tell us about your campus.</h3><p>Use the callback form to share your interest. Mention your college and that you’d like to become a campus delegate.</p><p>Discuss responsibilities, time commitment, and reward terms with the team before deciding to join.</p><ApplyLink /></div>
    </section>
    <section className="delegate-section delegate-faq" aria-labelledby="delegate-faq-title"><div className="delegate-heading"><span className="delegate-eyebrow">GOOD TO KNOW</span><h2 id="delegate-faq-title">A few questions, answered.</h2></div><div>{faqs.map(faq => <details key={faq.question} name="delegate-faq"><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></section>
  </main><SiteFooter /></div>;
}

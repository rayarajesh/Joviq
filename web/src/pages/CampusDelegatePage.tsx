import type { CSSProperties } from "react";
import { ArrowRight, Award, BadgeCheck, BookOpen, CalendarRange, Check, GraduationCap, Handshake, MapPin, Megaphone, MessageCircle, Mic, Network, Plus, Rocket, Sparkles, Target, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/campus-delegate.css";

const img = (name: string) => `/assets/campus-delegate/${name}`;
const order = (index: number) => ({ "--i": index }) as CSSProperties;
const highlights = [
  { icon: Users, tone: "mint", title: "Connect", text: "Introduce peers to career-focused programs." },
  { icon: Handshake, tone: "peach", title: "Collaborate", text: "Coordinate activities with the Joviq team." },
  { icon: Sparkles, tone: "sky", title: "Grow", text: "Practice leadership through real outreach." }
];
const skills = [
  { icon: Mic, label: "Communication" },
  { icon: Target, label: "Leadership" },
  { icon: Megaphone, label: "Campus outreach" },
  { icon: CalendarRange, label: "Event coordination" },
  { icon: Network, label: "Networking" },
  { icon: Handshake, label: "Teamwork" },
  { icon: Rocket, label: "Initiative" }
];
const responsibilities = [
  { icon: Megaphone, tone: "peach", title: "Spread the word", text: "Introduce students to Joviq’s learning programs through campus communities, sessions, and referrals." },
  { icon: BookOpen, tone: "sky", title: "Help peers explore", text: "Share accurate program information and connect interested students with the team for guidance." },
  { icon: CalendarRange, tone: "mint", title: "Bring people together", text: "Coordinate workshops, demos, and student engagement activities with Joviq." },
  { icon: MessageCircle, tone: "rose", title: "Support the next step", text: "Help interested peers navigate enrollment and share campus questions with the team." }
];
const fitTraits = ["Helping peers discover learning opportunities", "Communicating with student groups and communities", "Taking initiative and organising campus activities", "Working with a team and following through"];
const joinSteps = [
  { title: "Request a callback", text: "Mention your college and that you’d like to become a campus delegate." },
  { title: "Talk with the team", text: "Discuss responsibilities, time commitment, and reward terms." },
  { title: "Start on campus", text: "Begin outreach with guidance from the Joviq team." }
];
const faqs = [
  { question: "What is a campus delegate?", answer: "A student representative who introduces Joviq to their campus, helps peers explore learning opportunities, and coordinates outreach activities with the team." },
  { question: "Do I need previous leadership experience?", answer: "An interest in communication, community building, and helping peers is a good starting point. Discuss your experience and suitability with the team when you request a callback." },
  { question: "How much time will I need to commit?", answer: "Discuss the expected activities and schedule with the team before joining, so you can understand how the role fits alongside your studies." },
  { question: "How do recognition and referral rewards work?", answer: "The program includes recognition opportunities and referral rewards. The team can explain current eligibility, conditions, and reward details before you join." },
  { question: "How do I express interest?", answer: "Select “Become a delegate” and complete the callback form. Let the team know that you are interested in the campus delegate program and share your college details." }
];
const ApplyLink = ({ variant }: { variant?: "light" }) => <Link className={`delegate-button${variant ? ` delegate-button--${variant}` : ""}`} to="/request-callback">Become a delegate <ArrowRight size={18} /></Link>;

export function CampusDelegatePage() {
  const mainRef = useScrollReveal("dl-reveal");
  return <div className="campus-delegate-page"><PublicNavbar /><main className="delegate-main" ref={mainRef}>
    <section className="delegate-hero" aria-labelledby="delegate-title">
      <div className="delegate-hero-copy"><span className="delegate-badge"><span className="delegate-pulse" aria-hidden="true" /><GraduationCap size={16} /> Joviq Campus Delegate</span>
        <h1 id="delegate-title"><span>Your campus.</span> <span>Your community.</span> <em>Your impact.</em></h1>
        <p>Connect your peers with practical learning opportunities. Build your leadership skills as you help your campus learn, collaborate, and grow.</p>
        <div className="delegate-actions"><ApplyLink /><a className="delegate-ghost-link" href="#delegate-role">Explore the role <ArrowRight size={17} /></a></div>
        <ul className="delegate-chips" aria-label="Program highlights"><li><MapPin size={15} /> Campus outreach across India</li><li><Users size={15} /> Student-first collaboration</li></ul>
      </div>
      <div className="delegate-hero-visual">
        <div className="delegate-orbit" aria-hidden="true"><span /><span /></div>
        <img className="delegate-hero-student" src={img("delegate-student.webp")} alt="Joviq campus delegate holding notebooks" width={680} height={1020} fetchPriority="high" />
        <ul className="delegate-floaters" aria-label="The role at a glance">{highlights.map(({ icon: Icon, tone, title, text }, index) => <li key={title} className={`tone-${tone}`} style={order(index)}><span className="delegate-icon"><Icon size={18} /></span><span><strong>{title}</strong>{text}</span></li>)}</ul>
        <div className="delegate-hero-award" aria-hidden="true"><Award size={22} /></div>
      </div>
    </section>

    <div className="delegate-marquee" role="region" aria-label="Skills you build as a delegate"><div className="delegate-marquee-track">{[0, 1].map(copy => <ul key={copy} aria-hidden={copy === 1 || undefined}>{skills.map(({ icon: Icon, label }) => <li key={label}><Icon size={18} />{label}</li>)}</ul>)}</div></div>

    <section className="delegate-section" aria-labelledby="delegate-benefits">
      <div className="delegate-heading delegate-heading--center" data-reveal><span className="delegate-eyebrow">Why join</span><h2 id="delegate-benefits">Give your campus more.<br />Take your skills further.</h2></div>
      <div className="delegate-bento">
        <article className="delegate-bento-photo" data-reveal>
          <img src={img("campus-team.webp")} alt="Students collaborating around a laptop" width={1100} height={733} loading="lazy" />
          <div><span className="delegate-eyebrow">Campus connections</span><h3>Be the person who brings people together.</h3><p>Represent Joviq. Share opportunities. Make learning a campus conversation.</p><span className="delegate-tag"><Sparkles size={14} /> Small initiatives. Meaningful impact.</span></div>
        </article>
        <article className="delegate-bento-card tone-rose" data-reveal style={order(1)}><span className="delegate-icon delegate-icon--solid"><Megaphone size={22} /></span><h3>Find your voice</h3><p>Build confidence in communication, campus outreach, and leading student activities.</p><div className="delegate-wave" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={order(index)} />)}</div></article>
        <article className="delegate-bento-card tone-sky" data-reveal style={order(2)}><span className="delegate-icon delegate-icon--solid"><Users size={22} /></span><h3>Grow your network</h3><p>Connect with peers and the Joviq team while building a learning community on campus.</p><div className="delegate-avatars" aria-hidden="true">{[1, 2, 3, 4, 5].map(n => <img key={n} src={img(`peer-${n}.webp`)} alt="" width={48} height={48} loading="lazy" />)}<span><Plus size={16} /></span></div></article>
        <article className="delegate-bento-card delegate-bento-award tone-butter" data-reveal style={order(3)}><div><span className="delegate-icon delegate-icon--solid"><BadgeCheck size={22} /></span><h3>Get recognised</h3><p>Explore leadership recognition and referral rewards. Ask the team about the applicable terms.</p></div><img src={img("recognition-trophy.webp")} alt="" width={360} height={540} loading="lazy" /></article>
      </div>
    </section>

    <section className="delegate-role-section" id="delegate-role" aria-labelledby="delegate-role-title">
      <div className="delegate-role-head" data-reveal><div className="delegate-heading"><span className="delegate-eyebrow">Your role</span><h2 id="delegate-role-title">Simple actions. A stronger learning community.</h2></div><div><p>Be a helpful connection between your college community and Joviq.</p><Link className="delegate-ghost-link" to="/programs">Get to know our programs <ArrowRight size={17} /></Link></div></div>
      <ol className="delegate-journey" data-reveal>{responsibilities.map(({ icon: Icon, tone, title, text }, index) => <li key={title} className={`tone-${tone}`} style={order(index)}><span className="delegate-node"><Icon size={22} /><b>{index + 1}</b></span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>

    <section className="delegate-section delegate-start" aria-labelledby="delegate-fit-title">
      <div className="delegate-fit-visual" data-reveal>
        <img src={img("learner-desk.webp")} alt="Student planning ideas at a desk" width={900} height={865} loading="lazy" />
        <div className="delegate-fit-badge"><span className="delegate-icon"><Trophy size={18} /></span><span><strong>Lead on campus</strong>Practice leadership through real outreach.</span></div>
      </div>
      <div className="delegate-fit" data-reveal><span className="delegate-eyebrow">Is this for you?</span><h2 id="delegate-fit-title">Enjoy connecting people? Start here.</h2><p>This role may suit you if you’re a college student who enjoys:</p><ul>{fitTraits.map((item, index) => <li key={item} style={order(index)}><span><Check size={15} /></span>{item}</li>)}</ul></div>
    </section>

    <section className="delegate-apply" aria-labelledby="delegate-apply-title" data-reveal>
      <div className="delegate-apply-copy"><span className="delegate-eyebrow">Let’s talk</span><h2 id="delegate-apply-title">Tell us about your campus.</h2><p>Share your interest through the callback form, then decide with the team.</p><ApplyLink variant="light" /></div>
      <ol>{joinSteps.map(({ title, text }, index) => <li key={title} style={order(index)}><span className="delegate-step">{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
    </section>

    <section className="delegate-section delegate-faq" aria-labelledby="delegate-faq-title">
      <div className="delegate-heading" data-reveal><span className="delegate-eyebrow">Good to know</span><h2 id="delegate-faq-title">A few questions, answered.</h2><p>Still curious? Our team is happy to walk you through the program.</p><Link className="delegate-ghost-link" to="/request-callback">Talk to the team <ArrowRight size={17} /></Link></div>
      <div className="delegate-faq-list" data-reveal>{faqs.map(faq => <details key={faq.question} name="delegate-faq"><summary>{faq.question}<span aria-hidden="true"><Plus size={16} /></span></summary><p>{faq.answer}</p></details>)}</div>
    </section>
  </main><SiteFooter /></div>;
}

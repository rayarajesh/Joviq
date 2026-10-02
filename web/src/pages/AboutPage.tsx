import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, BriefcaseBusiness, Code2, Eye, GraduationCap, Hammer, Heart, Lightbulb, Megaphone, MessagesSquare, Rocket, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { companyInformation } from "../data/companyInformation";
import { keyStatistics } from "../data/siteContent";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/about-page.css";

const order = (index: number) => ({ "--i": index }) as CSSProperties;
const initials = (name: string) => name.split(" ").map(part => part[0]).join("");
const values = [
  { icon: Heart, tone: "rose", title: "Learner First", text: "Our learners are at the heart of every decision we make." },
  { icon: Lightbulb, tone: "butter", title: "Practical Learning", text: "We focus on real-world skills and hands-on experience." },
  { icon: BarChart3, tone: "mint", title: "Continuous Growth", text: "We innovate and improve every day to create more opportunities." },
  { icon: ShieldCheck, tone: "sky", title: "Integrity", text: "We believe in transparency, trust, and doing what's right." }
];
const strengths = [
  { icon: BriefcaseBusiness, tone: "lilac", title: "Industry-Relevant Curriculum", text: "Learn the skills companies actually need." },
  { icon: Code2, tone: "mint", title: "Hands-On Projects", text: "Build, create, and showcase your work." },
  { icon: UsersRound, tone: "peach", title: "Expert Guidance", text: "Learn from industry professionals." },
  { icon: BarChart3, tone: "sky", title: "Career Support", text: "Get placement support and career resources." }
];
const path = [
  { icon: BookOpen, label: "Learn", tone: "lilac" },
  { icon: Hammer, label: "Practice", tone: "peach" },
  { icon: MessagesSquare, label: "Get feedback", tone: "sky" },
  { icon: Rocket, label: "Grow", tone: "mint" }
];
const stories = [
  { name: "Ananya Rao", program: "CSE - 3rd Year", quote: "Portfolio and resume cleanup changed the way I explained my work." },
  { name: "Ishita Sharma", program: "IT - 4th Year", quote: "Rubric-based feedback taught me to explain projects with confidence." },
  { name: "Karthik Iyer", program: "ECE - Final Year", quote: "The interview became a walkthrough of the projects I had already built." },
  { name: "Nikhil Shetty", program: "Mechanical - 4th Year", quote: "I learned to present work with clarity and evidence." },
  { name: "Tanvi Joshi", program: "CSE - Final Year", quote: "Expert feedback exposed weak spots before the real interview." },
  { name: "Sanjana Reddy", program: "CSE - 3rd Year", quote: "Timed practice fixed my speed and project storytelling." }
];
const statIcons = [BookOpen, Code2, UsersRound, Award];
const statTones = ["lilac", "mint", "peach", "sky"];

/* Counts up plain numbers ("20+", "6") once visible; other values such as "1:1" render as-is. */
function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const match = /^(\d+)(\+?)$/.exec(value);
    const element = ref.current;
    if (!match || !element || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, digits, suffix] = match;
    const target = Number(digits);
    let frame = 0;
    setShown(`0${suffix}`);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1200, 1);
        setShown(`${Math.round(target * (1 - Math.pow(1 - progress, 3)))}${suffix}`);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: .6 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); setShown(value); };
  }, [value]);
  return <strong ref={ref}>{shown}</strong>;
}

export function AboutPage() {
  const mainRef = useScrollReveal();
  const [allStories, setAllStories] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const shownStories = allStories ? stories : Array.from({ length: 3 }, (_, index) => stories[(storyIndex + index) % stories.length]);
  return <div className="about-page sc-page"><PublicNavbar /><main className="sc-main" ref={mainRef}>
    <section className="sc-hero about-hero" aria-labelledby="about-title"><div className="sc-hero-grid">
      <div className="sc-hero-copy"><span className="sc-badge"><span className="sc-pulse" aria-hidden="true" /><GraduationCap size={16} /> About Joviq</span>
        <h1 id="about-title"><span>Learning</span> <span>Without Limits</span> <span>for a Brighter</span> <em>Tomorrow</em></h1>
        <p>At Joviq, we're on a mission to make high-quality, industry-relevant education accessible to everyone. We empower learners with real-world skills, practical projects, and expert guidance to help them grow, succeed, and create a brighter future.</p>
        <div className="sc-actions"><a className="sc-button" href="#our-story">Our Story <ArrowRight size={18} /></a><Link className="sc-ghost" to="/programs">Explore programs <ArrowRight size={17} /></Link></div>
      </div>
      <div className="sc-hero-visual about-hero-visual">
        <img className="about-hero-photo" src="/assets/showcase/learners-laptop.webp" alt="Two learners smiling while working together on a laptop" width={900} height={821} fetchPriority="high" />
        <div className="sc-floater about-float about-float--1 tone-mint" style={order(0)}><span className="sc-icon sc-icon--tone-solid"><Code2 size={18} /></span><span><strong>Hands-On Projects</strong>Build, create, and showcase</span></div>
        <div className="sc-floater about-float about-float--2 tone-peach" style={order(1)}><span className="sc-icon sc-icon--tone-solid"><UsersRound size={18} /></span><span><strong>Expert Guidance</strong>Learn from professionals</span></div>
        <div className="sc-floater about-float about-float--3 tone-sky" style={order(2)}><span className="sc-icon sc-icon--tone-solid"><BriefcaseBusiness size={18} /></span><span><strong>Career Support</strong>Placement support and resources</span></div>
      </div>
    </div></section>

    <section className="about-stats" aria-label="Joviq learning at a glance" data-reveal>{keyStatistics.map((stat, index) => { const Icon = statIcons[index]; return <div key={stat.label} className={`tone-${statTones[index]}`}><span className="sc-icon sc-icon--tone"><Icon size={22} /></span><p><StatValue value={stat.value} /><small>{stat.label}</small></p></div>; })}</section>

    <section className="about-purpose sc-section">
      <article className="sc-card about-mission" data-reveal><span className="sc-icon sc-icon--solid"><Target size={22} /></span><span className="sc-eyebrow">Our mission</span><h2>To make high-quality, practical education accessible to everyone</h2><p>and bridge the gap between learning and real-world opportunities.</p></article>
      <article className="about-vision sc-dark" data-reveal style={order(1)}><span className="sc-icon sc-icon--glass"><Eye size={22} /></span><span className="sc-eyebrow">Our vision</span><h2>To be a global platform where learners build in-demand skills, gain real experience</h2><p>and unlock meaningful career opportunities.</p></article>
    </section>

    <section id="our-story" className="sc-section about-who">
      <div className="about-path" data-reveal aria-label="The Joviq learning path: learn, practice, get feedback, grow">
        <svg className="about-path-line" viewBox="0 0 400 420" preserveAspectRatio="none" aria-hidden="true"><path d="M80 50 C 260 40, 320 110, 300 160 C 280 220, 120 210, 100 270 C 80 330, 250 370, 312 378" /></svg>
        <ol className="sc-stagger" data-reveal>{path.map(({ icon: Icon, label, tone }, index) => <li key={label} className={`tone-${tone}`} style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={20} /></span><strong>{label}</strong></li>)}</ol>
        <div className="about-path-badge"><span className="sc-icon sc-icon--gold"><BarChart3 size={20} /></span><span><strong>From Learners to Doers</strong>Real Skills. Real Impact.</span></div>
      </div>
      <div className="sc-heading" data-reveal><span className="sc-eyebrow">Who we are</span><h2>A Learning Platform Built for <em className="about-accent">What's Next</em></h2><p>JoviQ Technologies is the brand of {companyInformation.legalName}.</p><p>JOVIQ is an online learning platform designed for today's learners and tomorrow's opportunities. We combine expert-led training, hands-on projects, and industry insights to help individuals upskill, switch careers, and stay ahead in a rapidly evolving world.</p><a className="sc-ghost" href="#why-joviq">More About JOVIQ <ArrowRight size={17} /></a></div>
    </section>

    <section id="why-joviq" className="sc-band about-why">
      <div className="sc-heading" data-reveal><span className="sc-eyebrow">Why Joviq</span><h2>Industry-Focused Learning, Real-World Impact</h2><p>Our programs are designed with industry experts to ensure you learn what truly matters. From live classes to real-world projects, we focus on practical skills that prepare you for real opportunities.</p></div>
      <div className="about-why-grid sc-stagger" data-reveal>{strengths.map(({ icon: Icon, tone, title, text }, index) => <article className={`sc-glass tone-${tone}`} key={title} style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="sc-section">
      <div className="sc-heading sc-heading--center" data-reveal><span className="sc-eyebrow">Our core values</span><h2>What Drives Us</h2></div>
      <div className="sc-grid-4">{values.map(({ icon: Icon, tone, title, text }, index) => <article className={`sc-card about-value tone-${tone}`} key={title} data-reveal style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="sc-section about-stories">
      <div className="about-stories-head" data-reveal><div className="sc-heading"><span className="sc-eyebrow">Success stories</span><h2>Real People. Real Progress.</h2></div>
        <div className="about-stories-controls"><button className="sc-ghost" type="button" aria-expanded={allStories} aria-controls="about-story-list" onClick={() => setAllStories(value => !value)}>{allStories ? "Show Fewer Stories" : "View All Stories"} <ArrowRight size={16} /></button>{!allStories && <><button className="sc-icon-button" type="button" aria-label="Previous stories" onClick={() => setStoryIndex(value => (value + stories.length - 1) % stories.length)}><ArrowLeft size={18} /></button><button className="sc-icon-button" type="button" aria-label="Next stories" onClick={() => setStoryIndex(value => (value + 1) % stories.length)}><ArrowRight size={18} /></button></>}</div></div>
      <div id="about-story-list" className="about-story-grid">{shownStories.map((story, index) => <article className="sc-card about-story-card sc-fade-in" key={`${storyIndex}-${allStories}-${story.name}`} style={order(index)}><blockquote>“{story.quote}”</blockquote><div><span className="about-avatar" aria-hidden="true">{initials(story.name)}</span><span><strong>{story.name}</strong><small>{story.program}</small></span></div></article>)}</div>
      <Link className="sc-ghost about-stories-more" to="/reviews">Read more learner reviews <ArrowRight size={16} /></Link>
    </section>

    <section className="sc-section about-opportunities">
      <article className="about-opportunity" data-reveal><div className="about-opportunity-art" aria-hidden="true"><span className="about-orbit" /><span className="sc-icon sc-icon--solid"><Megaphone size={30} /></span><i className="about-chip about-chip--1"><UsersRound size={14} /></i><i className="about-chip about-chip--2"><Sparkles size={14} /></i><i className="about-chip about-chip--3"><GraduationCap size={14} /></i></div><div><span className="sc-eyebrow">Campus program</span><h2>Join Our Campus Ambassador Program</h2><p>Be the voice of JOVIQ on your campus. Build leadership skills, create impact, and grow with us.</p><Link className="sc-ghost" to="/campus-delegate">Explore Campus Delegate Program <ArrowRight size={17} /></Link></div></article>
      <article className="about-opportunity about-opportunity--dark sc-dark" data-reveal style={order(1)}><div className="about-opportunity-art" aria-hidden="true"><span className="about-orbit" /><span className="sc-icon sc-icon--gold"><BriefcaseBusiness size={30} /></span><i className="about-chip about-chip--1"><Lightbulb size={14} /></i><i className="about-chip about-chip--2"><Heart size={14} /></i><i className="about-chip about-chip--3"><Rocket size={14} /></i></div><div><span className="sc-eyebrow">Work with us</span><h2>Explore Career Opportunities</h2><p>Join our growing team and help us shape the future of learning.</p><Link className="sc-ghost sc-ghost--light" to="/careers">Explore Careers <ArrowRight size={17} /></Link></div></article>
    </section>
  </main><SiteFooter /></div>;
}

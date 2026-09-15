import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, BriefcaseBusiness, Code2, Eye, Heart, Lightbulb, Play, ShieldCheck, Star, Target, UsersRound, X } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { keyStatistics } from "../data/siteContent";
import "../styles/about-page.css";

const values = [
  { icon: Heart, title: "Learner First", text: "Our learners are at the heart of every decision we make." },
  { icon: Lightbulb, title: "Practical Learning", text: "We focus on real-world skills and hands-on experience." },
  { icon: BarChart3, title: "Continuous Growth", text: "We innovate and improve every day to create more opportunities." },
  { icon: ShieldCheck, title: "Integrity", text: "We believe in transparency, trust, and doing what's right." }
];
const strengths = [
  { icon: BriefcaseBusiness, title: "Industry-Relevant Curriculum", text: "Learn the skills companies actually need." },
  { icon: Code2, title: "Hands-On Projects", text: "Build, create, and showcase your work." },
  { icon: UsersRound, title: "Expert Guidance", text: "Learn from industry professionals." },
  { icon: BarChart3, title: "Career Support", text: "Get placement support and career resources." }
];
const stories = [
  { name: "Ananya Rao", program: "CSE - 3rd Year", quote: "Portfolio and resume cleanup changed the way I explained my work.", portrait: "0% 0%" },
  { name: "Ishita Sharma", program: "IT - 4th Year", quote: "Rubric-based feedback taught me to explain projects with confidence.", portrait: "50% 0%" },
  { name: "Karthik Iyer", program: "ECE - Final Year", quote: "The interview became a walkthrough of the projects I had already built.", portrait: "100% 0%" },
  { name: "Nikhil Shetty", program: "Mechanical - 4th Year", quote: "I learned to present work with clarity and evidence.", portrait: "0% 100%" },
  { name: "Tanvi Joshi", program: "CSE - Final Year", quote: "Expert feedback exposed weak spots before the real interview.", portrait: "50% 100%" },
  { name: "Sanjana Reddy", program: "CSE - 3rd Year", quote: "Timed practice fixed my speed and project storytelling.", portrait: "100% 100%" }
];
const storySlides = [
  { title: "Learning should open doors.", text: "Joviq brings practical education, expert guidance, and career preparation together so learners can take their next step with confidence.", image: "hero" },
  { title: "Real skills come from doing.", text: "Our learning experience connects lessons with projects, feedback, and a portfolio of work that learners can explain and share.", image: "team" },
  { title: "A brighter tomorrow starts with you.", text: "Explore a program, build with guidance, and turn your learning into skills you can use.", image: "hero" }
];

export function AboutPage() {
  const [storyOpen, setStoryOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [allStories, setAllStories] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const metricsIcons = [BookOpen, Code2, UsersRound, Award];
  useEffect(() => {
    if (!storyOpen) return;
    dialog.current?.showModal();
    const timer = window.setInterval(() => setSlide(value => Math.min(value + 1, 2)), 20000);
    return () => window.clearInterval(timer);
  }, [storyOpen]);
  function closeStory() { dialog.current?.close(); setStoryOpen(false); }
  return <div className="site-page about-redesign">
    <PublicNavbar />
    <main>
      <section className="about-hero">
        <div className="about-hero__copy"><span className="about-eyebrow">ABOUT US</span><h1>Learning<br />Without Limits<br /><span>for a Brighter Tomorrow</span></h1><p>At Joviq, we're on a mission to make high-quality, industry-relevant education accessible to everyone. We empower learners with real-world skills, practical projects, and expert guidance to help them grow, succeed, and create a brighter future.</p><div className="about-hero__actions"><a className="about-button" href="#our-story">Our Story <ArrowRight size={18} /></a><button className="about-watch" onClick={() => { setSlide(0); setStoryOpen(true); }}><span><Play size={19} fill="currentColor" /></span><strong>Watch Our Story<small>(1 min)</small></strong></button></div></div>
        <div className="about-hero__visual"><img src="/assets/about/learner-hero.png" alt="Learner in a blue sweater studying at her laptop. Real Skills, Real Careers." width="1536" height="1024" /></div>
      </section>
      <div className="about-content">
        <section className="about-stats" aria-label="Joviq learning at a glance">{keyStatistics.map((stat, index) => { const Icon = metricsIcons[index]; return <div key={stat.label}><span><Icon size={29} /></span><p><strong>{stat.value}</strong><small>{stat.label}</small></p></div>; })}</section>
        <section className="about-purpose"><article><div><span><Target size={30} /></span><small className="about-eyebrow">OUR MISSION</small></div><h2>To make high-quality,<br />practical education accessible<br />to everyone</h2><p>and bridge the gap between learning<br />and real-world opportunities.</p></article><article><div><span><Eye size={30} /></span><small className="about-eyebrow">OUR VISION</small></div><h2>To be a global platform where<br />learners build in-demand skills,<br />gain real experience</h2><p>and unlock meaningful career opportunities.</p></article></section>
        <section id="our-story" className="about-story-new"><div className="about-story-new__visual"><img src="/assets/about/team.png" alt="A group of learners collaborating around a laptop" /><div className="about-image-badge"><span><BarChart3 size={29} /></span><div><strong>From Learners<br />to Doers</strong><small>Real Skills. Real Impact.</small></div></div></div><div><span className="about-eyebrow">WHO WE ARE</span><h2>A Learning Platform<br />Built for <em>What's Next</em></h2><p>JOVIQ is an online learning platform designed for today's learners and tomorrow's opportunities. We combine expert-led training, hands-on projects, and industry insights to help individuals upskill, switch careers, and stay ahead in a rapidly evolving world.</p><a className="about-text-link" href="#why-joviq">More About JOVIQ <ArrowRight size={17} /></a></div></section>
        <section id="why-joviq" className="about-why"><div><span className="about-eyebrow">WHY JOVIQ</span><h2>Industry-Focused<br />Learning, Real-World Impact</h2><p>Our programs are designed with industry experts to ensure you learn what truly matters. From live classes to real-world projects, we focus on practical skills that prepare you for real opportunities.</p></div><div className="about-why__grid">{strengths.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={29} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
        <section className="about-values"><header><div><span className="about-eyebrow">OUR CORE VALUES</span><h2>What Drives Us</h2></div></header><div>{values.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon size={29} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="about-stories"><header><div><span className="about-eyebrow">SUCCESS STORIES</span><h2>Real People. Real Progress.</h2></div><div><button className="about-text-link" aria-expanded={allStories} aria-controls="about-story-list" onClick={() => setAllStories(value => !value)}>{allStories ? "Show Fewer Stories" : "View All Stories"}<ArrowRight size={16} /></button><button aria-label="Previous stories" onClick={() => setStoryIndex(value => (value + stories.length - 1) % stories.length)}><ArrowLeft size={18} /></button><button aria-label="Next stories" onClick={() => setStoryIndex(value => (value + 1) % stories.length)}><ArrowRight size={18} /></button></div></header><div id="about-story-list" className="about-stories__grid">{(allStories ? stories : Array.from({ length: 3 }, (_, index) => stories[(storyIndex + index) % stories.length])).map(story => <article key={story.name}><span className="about-avatar" style={{ backgroundPosition: story.portrait }} aria-hidden="true" /><div><blockquote>“{story.quote}”</blockquote><strong>{story.name}</strong><small>{story.program}</small></div></article>)}</div></section>
        <section className="about-opportunities"><article><UsersRound size={30} /><h2>Join Our<br />Campus Ambassador Program</h2><p>Be the voice of JOVIQ on your campus. Build leadership skills, create impact, and grow with us.</p><Link className="about-text-link" to="/request-callback">Learn More <ArrowRight size={17} /></Link><img src="/assets/about/ambassador.png" alt="Student ambassador holding notebooks" /></article><article><BriefcaseBusiness size={30} /><h2>Explore<br />Career Opportunities</h2><p>Join our growing team and help us shape the future of learning.</p><Link className="about-text-link" to="/request-callback">Ask About Openings <ArrowRight size={17} /></Link><div className="about-opportunities__office" aria-hidden="true" /></article></section>
      </div>
    </main>
    <SiteFooter />
    {storyOpen && <dialog className="about-story-dialog" ref={dialog} onCancel={closeStory} aria-label="Our story"><button className="about-story-dialog__close" aria-label="Close story" onClick={closeStory}><X /></button><img src={`/assets/about/${storySlides[slide].image}.png`} alt="" /><div><span className="about-eyebrow">OUR STORY · {slide + 1} / 3</span><h2>{storySlides[slide].title}</h2><p>{storySlides[slide].text}</p><div className="about-story-dialog__controls">{storySlides.map((item, index) => <button key={item.title} aria-label={`Story chapter ${index + 1}`} aria-pressed={slide === index} onClick={() => setSlide(index)}>{index + 1}</button>)}</div></div></dialog>}
  </div>;
}

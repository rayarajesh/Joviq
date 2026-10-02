import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, MessageCircle, MessagesSquare, Quote, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { SiteFooter } from "./SiteFooter";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/reviews.css";

type Story = { name: string; program: string; quote: string; result: string };
const initials = (name: string) => name.split(" ").map(part => part[0]).join("");
const discipline = (story: Story) => story.program.split(" - ")[0];
const order = (index: number) => ({ "--i": index }) as CSSProperties;
const tones = ["lilac", "peach", "mint", "sky", "rose", "butter"];
const themes = [
  { icon: BookOpen, tone: "mint", title: "Practical projects", text: "Connecting learning with application." },
  { icon: MessagesSquare, tone: "peach", title: "Helpful feedback", text: "Understanding what to improve next." },
  { icon: TrendingUp, tone: "sky", title: "Greater confidence", text: "Preparing to explain and present work." }
];

export function ReviewStories({ testimonials }: { testimonials: Story[] }) {
  const mainRef = useScrollReveal();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const disciplines = ["All", ...Array.from(new Set(testimonials.map(discipline)))];
  const [filter, setFilter] = useState(disciplines[0]);
  const featured = testimonials[featuredIndex];
  const visible = filter === disciplines[0] ? testimonials : testimonials.filter(story => discipline(story) === filter);
  function move(direction: number) { setFeaturedIndex(index => (index + direction + testimonials.length) % testimonials.length); }
  return <div className="reviews-page sc-page"><PublicNavbar /><main className="sc-main" ref={mainRef}>
    <section className="sc-hero sc-hero--center reviews-hero" aria-labelledby="reviews-title">
      <ul className="reviews-cloud" aria-hidden="true">{testimonials.map((story, index) => <li key={story.name} className={`tone-${tones[index % tones.length]}`} style={order(index)}><span className="reviews-avatar">{initials(story.name)}</span><span>{discipline(story)}</span></li>)}</ul>
      <div className="sc-hero-copy"><span className="sc-badge"><span className="sc-pulse" aria-hidden="true" /><MessageCircle size={16} /> The learner perspective</span>
        <h1 id="reviews-title"><span>Every learner has a story.</span> <em>Here are theirs.</em></h1>
        <p>Projects, feedback, and the confidence to take the next step. Hear how students describe their learning experience with Joviq.</p>
        <div className="sc-actions"><a className="sc-button" href="#learner-stories">Read student stories <ArrowRight size={17} /></a><Link className="sc-ghost" to="/programs">Find your program <ArrowRight size={17} /></Link></div>
      </div>
      <div className="reviews-stage">
        <span className="reviews-stack reviews-stack--back" aria-hidden="true" /><span className="reviews-stack reviews-stack--mid" aria-hidden="true" />
        <div className="reviews-spotlight sc-dark">
          <div className="reviews-spotlight-quote"><Quote size={40} aria-hidden="true" /><span className="sc-eyebrow">In their own words</span></div>
          <div className="reviews-featured" key={featuredIndex} aria-live="polite" aria-atomic="true">
            <blockquote>“{featured.quote}”</blockquote>
            <div className="reviews-featured-meta"><div className="reviews-author"><span className="reviews-avatar" aria-hidden="true">{initials(featured.name)}</span><div><strong>{featured.name}</strong><span>{featured.program}</span></div></div><p className="reviews-result"><TrendingUp size={15} /> {featured.result}</p></div>
          </div>
          <div className="reviews-controls">
            <div className="reviews-dots" role="group" aria-label="Choose a story">{testimonials.map((story, index) => <button key={story.name} type="button" aria-label={`Show story from ${story.name}`} aria-current={index === featuredIndex || undefined} onClick={() => setFeaturedIndex(index)} />)}</div>
            <div className="reviews-arrows"><button className="sc-icon-button" type="button" aria-label="Previous student story" onClick={() => move(-1)}><ArrowLeft size={18} /></button><button className="sc-icon-button" type="button" aria-label="Next student story" onClick={() => move(1)}><ArrowRight size={18} /></button></div>
          </div>
        </div>
      </div>
    </section>

    <div className="reviews-marquee" role="region" aria-label="Outcomes learners mentioned"><div className="reviews-marquee-track">{[0, 1].map(copy => <ul key={copy} aria-hidden={copy === 1 || undefined}>{testimonials.map(story => <li key={story.name}><Sparkles size={15} />{story.result}</li>)}</ul>)}</div></div>

    <section className="reviews-themes" aria-label="Themes in student feedback">{themes.map(({ icon: Icon, tone, title, text }, index) => <article className={`sc-card tone-${tone}`} key={title} data-reveal style={order(index)}><span className="sc-icon sc-icon--tone-solid"><Icon size={21} /></span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>

    <section className="sc-section" id="learner-stories" aria-labelledby="reviews-stories-title">
      <div className="sc-heading sc-heading--split" data-reveal><div><span className="sc-eyebrow">Student stories</span><h2 id="reviews-stories-title">Different paths.<br />Personal perspectives.</h2></div><p>Explore feedback from students across different disciplines.</p></div>
      <div className="sc-filters" role="group" aria-label="Filter stories by discipline">{disciplines.map(name => <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}<small>{name === disciplines[0] ? testimonials.length : testimonials.filter(story => discipline(story) === name).length}</small></button>)}</div>
      <p className="reviews-count" role="status">Showing {visible.length} {visible.length === 1 ? "story" : "stories"}</p>
      <div className="reviews-grid">{visible.map((story, index) => <article className={`sc-card reviews-story sc-fade-in tone-${tones[(disciplines.indexOf(discipline(story)) - 1 + tones.length) % tones.length]}`} key={`${filter}-${story.name}`} style={order(index)}>
        <div className="reviews-story-top"><span className="sc-pill">{discipline(story)}</span><Quote size={26} aria-hidden="true" /></div>
        <blockquote>“{story.quote}”</blockquote>
        <div className="reviews-author"><span className="reviews-avatar" aria-hidden="true">{initials(story.name)}</span><div><h3>{story.name}</h3><span>{story.program}</span></div></div>
        <p className="reviews-result"><TrendingUp size={15} /> {story.result}</p>
      </article>)}</div>
    </section>

    <section className="sc-cta" aria-labelledby="reviews-next-title" data-reveal>
      <div><span className="sc-eyebrow">Your next chapter</span><h2 id="reviews-next-title">Find a path that fits your goals.</h2><p>Explore the programs, see what you’ll build, and talk through your questions with an advisor.</p></div>
      <div className="sc-cta-actions"><Link className="sc-button sc-button--light" to="/programs">Explore programs <ArrowRight size={17} /></Link><Link className="sc-ghost sc-ghost--light" to="/request-callback">Talk to an advisor <MessageCircle size={17} /></Link></div>
    </section>
  </main><SiteFooter /></div>;
}

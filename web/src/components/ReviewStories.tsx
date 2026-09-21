import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, MessageCircle, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { SiteFooter } from "./SiteFooter";
import "../styles/reviews.css";

type Story = { name: string; program: string; quote: string; result: string };
const initials = (name: string) => name.split(" ").map(part => part[0]).join("");

export function ReviewStories({ testimonials }: { testimonials: Story[] }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featured = testimonials[featuredIndex];
  function move(direction: number) { setFeaturedIndex(index => (index + direction + testimonials.length) % testimonials.length); }
  return <div className="reviews-page"><PublicNavbar /><main className="reviews-main">
    <section className="reviews-hero" aria-labelledby="reviews-title"><div className="reviews-intro"><span className="reviews-kicker"><MessageCircle size={16} /> THE LEARNER PERSPECTIVE</span><h1 id="reviews-title">Every learner has<br />a story.<br /><em>Here are theirs.</em></h1><p>Projects, feedback, and the confidence to take the next step. Hear how students describe their learning experience with Joviq.</p><div className="reviews-actions"><a className="reviews-button" href="#learner-stories">Read student stories <ArrowRight size={17} /></a><Link className="reviews-link" to="/programs">Find your program <ArrowRight size={17} /></Link></div></div>
    <div className="reviews-spotlight"><div className="reviews-spotlight-top"><span>IN THEIR OWN WORDS</span><Quote size={30} aria-hidden="true" /></div><div className="reviews-featured-content" aria-live="polite" aria-atomic="true"><blockquote>“{featured.quote}”</blockquote><div className="reviews-author"><span className="reviews-avatar" aria-hidden="true">{initials(featured.name)}</span><div><strong>{featured.name}</strong><span>{featured.program}</span></div></div><p className="reviews-featured-result">{featured.result}</p></div><div className="reviews-carousel-controls"><span>{featuredIndex + 1} / {testimonials.length} stories</span><div><button type="button" aria-label="Previous student story" onClick={() => move(-1)}><ArrowLeft size={19} /></button><button type="button" aria-label="Next student story" onClick={() => move(1)}><ArrowRight size={19} /></button></div></div></div></section>

    <section className="reviews-themes" aria-label="Themes in student feedback">{[{icon:BookOpen,title:"Practical projects",text:"Connecting learning with application."},{icon:MessageCircle,title:"Helpful feedback",text:"Understanding what to improve next."},{icon:ArrowRight,title:"Greater confidence",text:"Preparing to explain and present work."}].map(({icon:Icon,title,text}) => <div key={title}><span><Icon size={21} /></span><div><h2>{title}</h2><p>{text}</p></div></div>)}</section>

    <section className="reviews-stories" id="learner-stories" aria-labelledby="reviews-stories-title"><div className="reviews-heading"><div><span className="reviews-kicker">STUDENT STORIES</span><h2 id="reviews-stories-title">Different paths.<br />Personal perspectives.</h2></div><p>Explore feedback from students across different disciplines.</p></div><p className="reviews-count" role="status">Showing {testimonials.length} {testimonials.length === 1 ? "story" : "stories"}</p><div className="reviews-grid">{testimonials.map(story => <article className="reviews-story" key={story.name}><div className="reviews-story-top"><span>{story.program.split(" - ")[0]}</span><Quote size={24} aria-hidden="true" /></div><blockquote>“{story.quote}”</blockquote><div className="reviews-author"><span className="reviews-avatar" aria-hidden="true">{initials(story.name)}</span><div><h3>{story.name}</h3><span>{story.program}</span></div></div><p className="reviews-result">{story.result}</p></article>)}</div></section>

    <section className="reviews-next" aria-labelledby="reviews-next-title"><div><span className="reviews-kicker">YOUR NEXT CHAPTER</span><h2 id="reviews-next-title">Find a path that fits your goals.</h2><p>Explore the programs, see what you’ll build, and talk through your questions with an advisor.</p></div><div className="reviews-next-actions"><Link className="reviews-button" to="/programs">Explore programs <ArrowRight size={17} /></Link><Link className="reviews-link" to="/request-callback">Talk to an advisor <MessageCircle size={17} /></Link></div></section>
  </main><SiteFooter /></div>;
}

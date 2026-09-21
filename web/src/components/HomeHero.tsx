import { ArrowRight, BarChart3, Check, GraduationCap, Rocket, Star, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
const highlights = [
 { icon: GraduationCap, title: "Admissions Open", detail: "For Next Cohort", tone: "green" },
 { icon: UsersRound, title: "2,500+", detail: "Learners & Growing", tone: "purple" },
 { icon: Star, title: "4.9/5", detail: "Learner Satisfaction", tone: "yellow" }
];
export function HomeHero() {
 return <section className="learn-hero" id="home" aria-labelledby="site-title">
  <div className="learn-hero__wash learn-hero__wash--left" aria-hidden="true"/><div className="learn-hero__wash learn-hero__wash--right" aria-hidden="true"/>
  <div className="learn-hero__inner">
   <div className="learn-hero__top">
    <div className="learn-hero__copy">
     <h1 id="site-title">Learn Today.<br/><span>Lead Tomorrow.</span></h1>
     <svg className="learn-hero__underline" viewBox="0 0 240 16" aria-hidden="true"><path d="M4 11 Q110 1 218 7 M227 8 L236 8"/></svg>
     <p className="learn-hero__intro">Real projects, expert review, and practical guidance<br className="learn-hero__desktop-break"/> to go from learner to leader.</p>
     <ul className="learn-hero__benefits">{["AI-Powered Learning","Skill-Based Training","Future-Ready Career Guidance"].map(text=><li key={text}><Check size={17}/>{text}</li>)}</ul>
     <div className="learn-hero__actions"><Link className="learn-hero__browse" to="/programs">Browse Our Courses</Link></div>
    </div>
    <div className="learn-hero__visual">
     <div className="learn-hero__dots" aria-hidden="true"/>
     <div className="learn-hero__portraits">
      {["Student in a green hoodie learning on her phone", "Student with a backpack and notebooks", "Student with headphones holding a laptop"].map((alt, index) => <div className={"learn-hero__portrait learn-hero__portrait--" + index} key={alt}>
       <img src="/assets/hero-student-panels.png" alt={alt} fetchPriority={index === 0 ? "high" : "auto"} width="1536" height="1024" style={{ left: (-100 * index) + "%" }} />
       {index === 0 ? <span className="learn-hero__panel-note" aria-hidden="true">Learn<br/>Explore<br/>Grow</span> : null}
       {index === 1 ? <span className="learn-hero__panel-note learn-hero__panel-note--blue" aria-hidden="true">Better Skills<br/>Brighter You</span> : null}
      </div>)}
     </div>
     <span className="learn-hero__handwriting learn-hero__next" aria-hidden="true">Your<br/>Next Chapter<br/>Starts Here<svg viewBox="0 0 160 35"><path d="M3 30 Q70 0 155 4"/></svg></span>
     <Star className="learn-hero__doodle-star" size={35} aria-hidden="true"/>
     <div className="learn-hero__badge learn-hero__badge--learn"><GraduationCap size={36}/><span>Learn<br/>Anytime</span></div><div className="learn-hero__badge learn-hero__badge--skills"><BarChart3 size={36}/><span>Build<br/>Real Skills</span></div><div className="learn-hero__badge learn-hero__badge--career"><Rocket size={35}/><span>Step Into<br/>Your Career</span></div>
    </div>
   </div>
   <div className="learn-hero__highlights">{highlights.map((item,index)=>{const Icon=item.icon;return <div className={`learn-hero__highlight learn-hero__highlight--${item.tone}`} key={item.title} style={{animationDelay:`${450+index*90}ms`}}><span><Icon size={34} fill={item.tone==="yellow"?"currentColor":"none"}/></span><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>})}</div>
  </div>
  <span className="learn-hero__handwriting learn-hero__corner learn-hero__corner--left" aria-hidden="true">Skills<br/>Today<br/>Brighter<br/>Tomorrow</span><span className="learn-hero__handwriting learn-hero__corner learn-hero__corner--right" aria-hidden="true">Learn<br/>Grow<br/>Lead</span>
 </section>
}

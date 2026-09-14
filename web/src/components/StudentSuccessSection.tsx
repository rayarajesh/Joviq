import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, FileText, MessageSquare, Presentation, RotateCw, Send, Trophy } from "lucide-react";

function Linkedin({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true"><rect x="2" y="2" width="26" height="26" rx="4" fill="currentColor" /><text x="7" y="22" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="21">in</text></svg>;
}

const cards = [
  { title: "Resume Shortlisting Support", icon: FileText, intro: "Make your resume stronger and easier to notice.", detail: "Get suggestions to improve your resume and present your skills clearly for your target role.", tags: ["Resume Review", "Role Alignment", "Improvement Tips"], action: "Explore Support" },
  { title: "Mock Interview Feedback", icon: MessageSquare, intro: "Practice realistic interviews and improve your delivery.", detail: "Practice with realistic questions and receive detailed feedback to improve your performance.", tags: ["Mock Interviews", "Expert Feedback", "Performance Review"], action: "Practice Now" },
  { title: "Project Explanation Practice", icon: Presentation, intro: "Learn how to explain your work clearly and confidently.", detail: "Practice explaining your projects, decisions, technical approach, and results.", tags: ["Project Walkthrough", "Technical Questions", "Presentation Skills"], action: "Improve Your Pitch" },
  { title: "LinkedIn & Portfolio Review", icon: Linkedin, intro: "Turn your work into a stronger professional profile.", detail: "Get expert suggestions to strengthen your LinkedIn profile and portfolio.", tags: ["Profile Review", "Portfolio Feedback", "Personal Branding"], action: "Improve My Profile" },
  { title: "Role-Specific Question Banks", icon: BookOpen, intro: "Practice questions designed around your target role.", detail: "Explore curated questions for your target role and practice with focused preparation.", tags: ["Role-Based", "Technical", "Behavioral"], action: "Explore Questions" },
  { title: "Interview Outcome Tracking", icon: BarChart3, intro: "Track your progress and see how your preparation improves.", detail: "Review your interview progress, analyze performance, and identify areas for improvement.", tags: ["Progress", "Performance", "Insights"], action: "View Progress" }
];

function SuccessCard({ card, index }: { card: typeof cards[number]; index: number }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const flipped = pinned || hovered || focused;
  const Icon = card.icon;
  return (
    <article className={`success-flip success-flip--${index} ${flipped ? "is-flipped" : ""}`}
      onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onKeyDown={event => { if (event.key === "Escape") { setPinned(false); setHovered(false); setFocused(false); event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus(); } }}>
      <button className="success-flip__toggle" aria-label={`${flipped ? "Show overview" : "Show details"}: ${card.title}`} aria-expanded={flipped} aria-controls={`success-details-${index}`} onClick={() => { if (flipped) { setPinned(false); setHovered(false); setFocused(false); } else setPinned(true); }}><RotateCw size={16} /></button>
      <div className="success-flip__inner">
        <div className="success-flip__face success-flip__front" aria-hidden={flipped} onClick={() => setPinned(true)}>
          <span className="success-flip__icon"><Icon size={31} /></span>
          <span className="success-flip__number">0{index + 1} / 06</span>
          <div className="success-flip__front-copy"><small>CAREER PREP</small><h3>{card.title}</h3><p>{card.intro}</p></div>
          <span className="success-flip__arrow" aria-hidden="true"><ArrowRight size={19} /></span>
        </div>
        <div className="success-flip__face success-flip__back" id={`success-details-${index}`} aria-hidden={!flipped} inert={!flipped}>
          <span className="success-flip__icon"><Icon size={29} /></span>
          <div className="success-flip__back-copy"><h3>{card.title}</h3><p>{card.detail}</p><ul>{card.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><Link to="/request-callback" onFocus={() => setFocused(true)}>{card.action}<ArrowRight size={16} /></Link></div>
        </div>
      </div>
    </article>
  );
}

export function StudentSuccessSection() {
  return <section id="outcomes" className="student-success" aria-labelledby="student-success-title">
    <div className="student-success__inner">
      <header className="student-success__header"><span className="student-success__eyebrow"><Trophy size={17} /> STUDENT SUCCESS</span><h2 id="student-success-title">Turn Preparation Into<br /><span>Interview Confidence.</span></h2><p>Prepare to present your skills, explain your projects, and approach interviews with confidence.</p><span className="student-success__hint"><RotateCw size={13} /> Hover or tap to explore</span></header>
      <span className="student-success__note" aria-hidden="true">Practice<br />Present<br />Progress<svg viewBox="0 0 130 35"><path d="M5 30 Q70 0 125 4" /></svg></span>
      <div className="student-success__grid">{cards.map((card, index) => <SuccessCard card={card} index={index} key={card.title} />)}</div>
      <div className="student-success__cta"><p>Ready for your next interview?</p><Link to="/request-callback">Plan Your Next Career Step<ArrowRight size={19} /></Link></div>
    </div>
    <span className="student-success__corner" aria-hidden="true">Small<br />Steps<br />Big Opportunities</span><Send className="student-success__plane" size={68} aria-hidden="true" />
  </section>;
}

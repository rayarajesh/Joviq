import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Code2, GraduationCap, Layers3, MessagesSquare, Sparkles, Cpu, Settings, PenTool, Box, BarChart3, Blocks, Trophy, FileBadge, BriefcaseBusiness, UsersRound, BookOpen, MessageSquare } from "lucide-react";
import { keyStatistics, programCategories, recognitions, successOutcomes } from "../data/siteContent";

export function KeyStatisticsSection() {
  const details = [
    { icon: GraduationCap, text: "Find the path that fits your ambition.", tone: "purple" },
    { icon: Code2, text: "Turn what you learn into work you can show.", tone: "blue" },
    { icon: Layers3, text: "Explore technology, engineering, and business.", tone: "teal" },
    { icon: MessagesSquare, text: "Get personal feedback. Keep moving forward.", tone: "amber" }
  ];

  return (
    <section id="key-statistics" className="learning-numbers" aria-labelledby="learning-numbers-title">
      <div className="learning-numbers__inner">
        <header className="learning-numbers__header">
          <div>
            <span className="learning-numbers__eyebrow"><Sparkles size={15} aria-hidden="true" /> JOVIQ IN NUMBERS</span>
            <h2 id="learning-numbers-title">Big possibilities.<br /><span>One place to start.</span></h2>
          </div>
        </header>
        <div className="learning-numbers__grid">
          {keyStatistics.map((stat, index) => {
            const { icon: Icon, text, tone } = details[index];
            return (
              <article className={`learning-numbers__card learning-numbers__card--${tone}`} key={stat.label}>
                <span className="learning-numbers__icon"><Icon size={25} strokeWidth={1.7} aria-hidden="true" /></span>
                <strong className="learning-numbers__value">{stat.value}</strong>
                <h3>{stat.label}</h3>
                <p>{text}</p>
                <span className="learning-numbers__accent" aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProgramCategoriesSection() {
  const icons = [Code2, Cpu, Settings, PenTool, Box, BarChart3];
  return (
    <section id="program-categories" className="category-showcase" aria-labelledby="category-showcase-title">
      <div className="category-showcase__inner">
        <header className="category-showcase__header">
          <div>
            <span className="category-showcase__eyebrow"><Blocks size={16} aria-hidden="true" /> PROGRAM CATEGORIES</span>
            <h2 id="category-showcase-title">Explore Our <span>Program Categories</span></h2>
            <p>Find a learning path that fits your interests and career goals.</p>
          </div>
          <div className="category-showcase__note" aria-hidden="true"><strong>Learn. Build. Grow.</strong><svg viewBox="0 0 230 40"><path d="M20 35 Q110 0 220 5" /></svg><span>Skills for a<br />brighter tomorrow.</span></div>
        </header>
        <div className="category-showcase__grid">
          {programCategories.map((category, index) => {
            const Icon = icons[index];
            const count = category.programs.length;
            const categorySlug = category.domain.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return (
              <article className={`category-tile category-tile--${index}`} key={category.domain}>
                <div className="category-tile__top"><span className="category-tile__icon"><Icon size={29} strokeWidth={1.8} aria-hidden="true" /></span><span className="category-tile__count">{count} {count === 1 ? "program" : "programs"}</span></div>
                <span className="category-tile__art" aria-hidden="true" />
                <h3>{category.domain}</h3>
                <p>{category.description}</p>
                <div className="category-tile__links">{category.programs.slice(0, index === 0 ? 5 : 6).map(program => <Link key={program.slug} to={`/programs/${program.slug}`}>{program.title}<ArrowRight size={16} aria-hidden="true" /></Link>)}</div>
                <Link className="category-tile__all" to={`/programs?category=${categorySlug}`} aria-label={`View all ${count} ${category.domain} programs`}>View All {count} {count === 1 ? "Program" : "Programs"}<ArrowRight size={16} aria-hidden="true" /></Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function RecognitionsSection() {
  const cards = [
    { icon: FileBadge, text: "Earn industry-relevant certifications through real-world projects.", href: "#certifications" },
    { icon: GraduationCap, text: "Learn by building real projects with expert guidance.", href: "#program-search" },
    { icon: BriefcaseBusiness, text: "Stay ahead with skills designed for real career opportunities.", href: "#program-categories" }
  ];
  return (
    <section id="recognitions" className="recognition-showcase" aria-labelledby="recognition-title">
      <div className="recognition-showcase__inner">
        <header className="recognition-showcase__header">
          <span className="recognition-showcase__eyebrow"><Trophy size={19} aria-hidden="true" /> RECOGNITIONS</span>
          <h2 id="recognition-title">Recognized for <span>Real Impact</span></h2>
          <p>Recognizing skills through project work, expert review, and completion credentials.</p>
        </header>
        <div className="recognition-showcase__note" aria-hidden="true"><span>Skills<br />Today</span><span>Opportunities<br />Tomorrow</span><svg viewBox="0 0 170 40"><path d="M8 34 Q85 8 164 4" /></svg><i /></div>
        <div className="recognition-showcase__grid">
          {recognitions.slice(0, cards.length).map((title, index) => {
            const { icon: Icon, text, href } = cards[index];
            return <a className={`recognition-tile recognition-tile--${index}`} href={href} key={title}>
              <span className="recognition-tile__icon"><Icon size={43} strokeWidth={1.8} aria-hidden="true" /></span>
              <div className="recognition-tile__copy"><h3>{title}</h3><p>{text}</p></div>
              <span className="recognition-tile__arrow"><ArrowRight size={21} aria-hidden="true" /></span>
            </a>;
          })}
        </div>
      </div>
      <span className="recognition-showcase__corner" aria-hidden="true">Learn<br />Grow<br />Lead<svg viewBox="0 0 100 30"><path d="M5 25 L94 4" /></svg></span>
    </section>
  );
}

export function HiringPartnersSection() {
  return (
    <section id="hiring-partners" className="hiring-showcase" aria-labelledby="hiring-title">
      <div className="hiring-showcase__inner">
        <header className="hiring-showcase__header">
          <span className="hiring-showcase__eyebrow"><BriefcaseBusiness size={21} aria-hidden="true" /> HIRING PARTNERS</span>
          <h2 id="hiring-title">Let’s Create <span>Opportunities Together</span></h2>
          <p>Connect with our team to learn about hiring collaborations and current opportunities for learners.</p>
        </header>
        <div className="hiring-showcase__note" aria-hidden="true">Talent<br /><span>Builds</span><br />Tomorrow<svg viewBox="0 0 160 45"><path d="M5 40 Q80 5 155 4" /></svg><i /></div>
        <div className="hiring-showcase__grid">
          <article className="hiring-card">
            <span className="hiring-card__icon"><GraduationCap size={51} strokeWidth={1.8} aria-hidden="true" /></span>
            <div className="hiring-card__copy"><h3>For Learners</h3><p>Discuss career guidance, interview preparation, and available placement support.</p><Link to="/request-callback">Talk to Our Team <ArrowRight size={22} aria-hidden="true" /></Link></div>
          </article>
          <article className="hiring-card hiring-card--teams">
            <span className="hiring-card__icon"><UsersRound size={48} strokeWidth={1.8} aria-hidden="true" /></span>
            <div className="hiring-card__copy"><h3>For Hiring Teams</h3><p>Talk to Joviq about connecting with learners and reviewing their project portfolios.</p><Link to="/request-callback">Collaborate With Us <ArrowRight size={22} aria-hidden="true" /></Link></div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function TechnologySection() {
  const cards = [
    { title: "Industry tools", text: "Practice with the languages, frameworks, and tools covered in your chosen program.", icon: Code2, tags: ["Real Tools", "Hands-on Practice", "Industry Ready"], to: "/programs" },
    { title: "Your learning workspace", text: "Access lessons, assignments, and resources in your Joviq dashboard.", icon: BookOpen, tags: ["Learn", "Practice", "Track Progress"], to: "/dashboard" },
    { title: "Expert feedback", text: "Improve your work through project reviews and clear assessment criteria.", icon: MessageSquare, tags: ["Project Reviews", "Expert Insights", "Continuous Growth"], to: "/#features" }
  ];
  return (
    <section id="technology" className="technology-showcase" aria-labelledby="technology-title">
      <div className="technology-showcase__inner">
        <header className="technology-showcase__header">
          <span className="technology-showcase__eyebrow"><Layers3 size={21} aria-hidden="true" /> TECHNOLOGY / POWERED BY</span>
          <h2 id="technology-title">Built for <span>Real Learning</span></h2>
          <p>Hands-on tools and guided practice, from your first lesson to your final project.</p>
        </header>
        <div className="technology-showcase__note" aria-hidden="true">Learn Today<br /><span>Build Tomorrow</span><svg viewBox="0 0 180 45"><path d="M5 40 Q95 0 175 6" /></svg><i /></div>
        <div className="technology-showcase__grid">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return <article className={`technology-card technology-card--${index}`} key={card.title}>
              <div className="technology-card__main">
                <span className="technology-card__icon"><Icon size={48} strokeWidth={2} aria-hidden="true" /></span>
                <div className="technology-card__copy"><span className="technology-card__number">0{index + 1}</span><h3>{card.title}</h3><p>{card.text}</p></div>
              </div>
              <Link className="technology-card__arrow" to={card.to} aria-label={`Explore ${card.title.toLowerCase()}`}><ArrowRight size={25} aria-hidden="true" /></Link>
              <ul className="technology-card__tags" aria-label={`${card.title} highlights`}>{card.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}

export function StudentOutcomesSection() {
  return <section id="outcomes" className="home-content-section"><h2>Student Success / Interview Outcomes</h2><p>Prepare to present your skills, explain your projects, and approach interviews with confidence.</p><div className="home-content-grid">{successOutcomes.map(item => <article className="home-content-card" key={item}><BadgeCheck size={26}/><h3>{item}</h3></article>)}</div><Link className="home-section-link" to="/request-callback">Plan your next career step <ArrowRight size={18}/></Link></section>;
}

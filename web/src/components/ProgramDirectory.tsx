import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Search, Grid2X2, Laptop, Cpu, Settings, PenTool, Box, BarChart3, Folder, Clock3, Pause, Play } from "lucide-react";
import { allPrograms, programCategories } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";

export function ProgramDirectory() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [categoryStart, setCategoryStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const programs = useMemo(() => allPrograms.filter(program => (domain === "All" || program.domain === domain) && [program.title, program.domain, program.shortDescription, ...program.skills, ...program.tags].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [domain, query]);
  const icons = [Laptop, Cpu, Settings, PenTool, Box, BarChart3];

  function move(target: number, smooth = true) {
    const el = viewport.current;
    if (!el) return;
    el.scrollTo({ left: target * (el.clientWidth + 22), behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => { const count = Math.max(1, Math.ceil((el.scrollWidth + 22) / (el.clientWidth + 22))); setPages(count); setPage(Math.min(count - 1, Math.round(el.scrollLeft / (el.clientWidth + 22)))); };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    move(0, false);
    measure();
    return () => { observer.disconnect(); el.removeEventListener("scroll", measure); };
  }, [programs]);
  useEffect(() => {
    if (paused || interacting || query || pages < 2) return;
    const timer = window.setInterval(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) return;
      const bounds = section.current?.getBoundingClientRect();
      if (!bounds || bounds.bottom < 0 || bounds.top > innerHeight) return;
      move(page >= pages - 1 ? 0 : page + 1);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, interacting, query, page, pages]);

  return <section id="program-search" className="directory-refresh" ref={section} aria-labelledby="directory-title" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div className="directory-refresh__inner">
      <div className="directory-refresh__copy">
        <span className="directory-refresh__eyebrow"><BookOpen size={20} /> PROGRAM DIRECTORY</span>
        <h2 id="directory-title">Find the Program<br />That Moves You<br /><span>Forward</span></h2>
        <p>Explore career-focused tracks designed with real projects, expert review, and industry-ready skills.</p>
        <form className="directory-refresh__search" onSubmit={event => { event.preventDefault(); viewport.current?.focus(); }}><Search size={23} /><input aria-label="Search Joviq programs" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search any Joviq program (AI, Full Stack, DevOps...)" /><button aria-label="View matching programs"><ArrowRight size={21} /></button></form>
        <h3 className="directory-refresh__filter-title">EXPLORE CATEGORIES</h3>
        <div className="directory-refresh__category-row">
          <button className="directory-refresh__category-arrow" aria-label="Previous categories" disabled={categoryStart === 0} onClick={() => setCategoryStart(value => Math.max(0, value - 1))}><ArrowLeft size={17} /></button>
          <div className="directory-refresh__filters" aria-label="Filter programs by category">
            {[{ domain: "All", label: "All Programs", icon: Grid2X2 }, ...programCategories.map((category, index) => ({ domain: category.domain, label: category.domain === "Electrical & Electronics" ? "Electronics" : category.domain, icon: icons[index] }))].slice(categoryStart, categoryStart + 3).map(category => {
              const Icon = category.icon;
              return <button key={category.domain} title={category.label} aria-pressed={domain === category.domain} onClick={() => setDomain(category.domain)}><Icon size={17} /><span>{category.label}</span></button>;
            })}
          </div>
          <button className="directory-refresh__category-arrow" aria-label="Next categories" disabled={categoryStart >= programCategories.length - 2} onClick={() => setCategoryStart(value => Math.min(programCategories.length - 2, value + 1))}><ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="directory-refresh__carousel" aria-label="Programs carousel" aria-roledescription="carousel">
        <div className="directory-refresh__controls"><button onClick={() => setPaused(value => !value)} aria-label={paused ? "Resume program scrolling" : "Pause program scrolling"} aria-pressed={paused}>{paused ? <Play size={18} /> : <Pause size={18} />}</button><button aria-label="Previous programs" disabled={pages < 2} onClick={() => move(page === 0 ? pages - 1 : page - 1)}><ArrowLeft size={22} /></button><button aria-label="Next programs" disabled={pages < 2} onClick={() => move(page >= pages - 1 ? 0 : page + 1)}><ArrowRight size={22} /></button></div>
        <div className="directory-refresh__viewport" ref={viewport} tabIndex={0} aria-label="Matching programs" onTouchStart={() => setPaused(true)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? Math.min(page + 1, pages - 1) : Math.max(page - 1, 0)); } }}>
          {programs.map(program => <Link className="directory-course" to={`/programs/${program.slug}`} key={program.slug}>
            <div className="directory-course__image"><img src={getProgramImage(program.slug, program.domain)} alt="" loading="lazy" /><span>{program.tags[0] || "Project-based"}</span></div>
            <div className="directory-course__body"><small>{program.domain}</small><h3>{program.title}</h3><p>{program.shortDescription}</p><ul><li><Folder size={19} />{program.projects.length} Projects</li><li><Clock3 size={19} />{program.duration}</li><li><BarChart3 size={19} />{program.level}</li></ul><span className="directory-course__link">Explore Program <ArrowRight size={16} /><i><ArrowRight size={19} /></i></span></div>
          </Link>)}
          {!programs.length && <p className="directory-refresh__empty" role="status">No matching programs found. Try another skill or category.</p>}
        </div>
        <div className="directory-refresh__dots" aria-label="Program pages">{Array.from({ length: pages }, (_, index) => <button key={index} aria-label={`Go to program page ${index + 1}`} aria-current={index === page ? "true" : undefined} onClick={() => move(index)} />)}</div>
      </div>
    </div>
  </section>;
}

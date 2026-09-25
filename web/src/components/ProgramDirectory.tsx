import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Search, Grid2X2, Laptop, Cpu, Settings, PenTool, Box, BarChart3, Clock3, Pause, Play } from "lucide-react";
import { allPrograms, programCategories } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";

export function ProgramDirectory() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [categoryStart, setCategoryStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [page, setPage] = useState(0);
  const [positions, setPositions] = useState<number[]>([0]);
  const [isInViewport, setIsInViewport] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const autoplayTimer = useRef<number | null>(null);
  const directoryCategories = [
    { domain: "All", label: "All Programs", icon: Grid2X2 },
    { domain: "Computer Science & IT", label: "CSE/IT", icon: Laptop },
    { domain: "Electrical & Electronics", label: "ECE/EEE", icon: Cpu },
    { domain: "Mechanical & Civil", label: "Mechanical/Civil", icon: Settings },
    { domain: "Management", label: "Management/Commerce", icon: BarChart3 }
  ];
  const programs = useMemo(() => allPrograms.filter(program => (domain === "All" || program.domain === domain) && [program.title, program.domain, program.shortDescription, ...program.skills, ...program.tags].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [domain, query]);

  function getCarouselMetrics() {
    const el = viewport.current;
    const card = el?.querySelector<HTMLElement>(".directory-course");
    if (!el || !card) return null;
    const styles = window.getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const cardStep = card.getBoundingClientRect().width + gap;
    // +0.1 tolerance so sub-pixel rounding doesn't under-count a card that actually fits (3-up layout)
    const visibleCards = Math.max(1, Math.floor((el.clientWidth + gap) / cardStep + 0.1));
    const step = Math.min(3, visibleCards); // advance 3 programs per scroll on desktop; never skip when fewer fit (mobile)
    const maxIndex = Math.max(0, programs.length - visibleCards);
    const groupPositions = [0];
    for (let index = step; index < maxIndex; index += step) groupPositions.push(index);
    if (maxIndex > 0 && groupPositions[groupPositions.length - 1] !== maxIndex) groupPositions.push(maxIndex);
    return { el, cardStep, visibleCards, maxIndex, groupPositions };
  }

  function move(target: number, smooth = true) {
    const metrics = getCarouselMetrics();
    if (!metrics) return;
    const index = Math.max(0, Math.min(target, metrics.maxIndex));
    const lastScrollLeft = Math.max(0, metrics.el.scrollWidth - metrics.el.clientWidth);
    const left = index === metrics.maxIndex ? lastScrollLeft : index * metrics.cardStep;
    metrics.el.scrollTo({ left, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () => {
      const metrics = getCarouselMetrics();
      if (!metrics) return;
      const scrollProgress = metrics.el.scrollWidth - metrics.el.clientWidth;
      const rawIndex = scrollProgress <= 0 ? 0 : Math.min(metrics.maxIndex, Math.round(metrics.el.scrollLeft / metrics.cardStep));
      const nextPage = metrics.groupPositions.reduce((closest, position) => Math.abs(position - rawIndex) < Math.abs(closest - rawIndex) ? position : closest, 0);
      setPositions(metrics.groupPositions);
      setPage(nextPage);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    move(0, false);
    measure();
    return () => { observer.disconnect(); el.removeEventListener("scroll", measure); };
  }, [programs]);
  useEffect(() => {
    const clearAutoplay = () => {
      if (autoplayTimer.current !== null) window.clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    };
    clearAutoplay();
    if (!isInViewport || paused || query || positions.length < 2) return;
    const currentPosition = positions.indexOf(page);
    const nextPosition = currentPosition >= positions.length - 1 ? positions[0] : positions[currentPosition + 1];
    autoplayTimer.current = window.setTimeout(() => {
      if (!document.hidden) move(nextPosition);
    }, currentPosition === 0 ? 3500 : 4500);
    return clearAutoplay;
  }, [isInViewport, paused, query, positions, page]);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setIsInViewport(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function moveGroup(direction: "next" | "previous") {
    const currentPosition = positions.indexOf(page);
    const index = currentPosition < 0 ? 0 : currentPosition;
    move(positions[direction === "next" ? Math.min(index + 1, positions.length - 1) : Math.max(index - 1, 0)]);
  }

  return <section id="program-search" className="directory-refresh" ref={section} aria-labelledby="directory-title">
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
            {directoryCategories.slice(categoryStart, categoryStart + 4).map(category => {
              const Icon = category.icon;
              return <button key={category.domain} title={category.label} aria-pressed={domain === category.domain} onClick={() => setDomain(category.domain)}><Icon size={17} /><span>{category.label}</span></button>;
            })}
          </div>
          <button className="directory-refresh__category-arrow" aria-label="Next categories" disabled={categoryStart >= directoryCategories.length - 4} onClick={() => setCategoryStart(value => Math.min(directoryCategories.length - 4, value + 1))}><ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="directory-refresh__carousel" aria-label="Programs carousel" aria-roledescription="carousel">
        <div className="directory-refresh__controls"><button onClick={() => setPaused(value => !value)} aria-label={paused ? "Resume program scrolling" : "Pause program scrolling"} aria-pressed={paused}>{paused ? <Play size={18} /> : <Pause size={18} />}</button><button aria-label="Previous programs" disabled={page === 0} onClick={() => moveGroup("previous")}><ArrowLeft size={22} /></button><button aria-label="Next programs" disabled={page === positions[positions.length - 1]} onClick={() => moveGroup("next")}><ArrowRight size={22} /></button></div>
        <div className="directory-refresh__viewport" ref={viewport} tabIndex={0} aria-label="Matching programs" onTouchStart={() => setPaused(true)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); moveGroup(event.key === "ArrowRight" ? "next" : "previous"); } }}>
          {programs.map(program => <Link className="directory-course" to={`/programs/${program.slug}`} key={`${program.domain}-${program.slug}`}>
            <div className="directory-course__image"><img src={getProgramImage(program.slug, program.domain)} alt="" loading="lazy" /><span>{program.tags[0] || "Project-based"}</span></div>
            <div className="directory-course__body"><small>{program.domain}</small><h3>{program.title}</h3><p>{program.shortDescription}</p><ul><li><Clock3 size={19} />{program.duration}</li><li><BarChart3 size={19} />{program.level}</li></ul><span className="directory-course__link">Explore Program <ArrowRight size={16} /><i><ArrowRight size={19} /></i></span></div>
          </Link>)}
          {!programs.length && <p className="directory-refresh__empty" role="status">No matching programs found. Try another skill or category.</p>}
        </div>
        <div className="directory-refresh__dots" aria-label="Program positions">{positions.map((position, index) => <button key={position} aria-label={`Go to program group ${index + 1}`} aria-current={position === page ? "true" : undefined} onClick={() => move(position)} />)}</div>
      </div>
    </div>
  </section>;
}

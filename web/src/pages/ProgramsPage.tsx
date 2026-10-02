import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BarChart3, BrainCircuit, BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, Cpu, GraduationCap, Heart, LayoutGrid, Search, ShieldCheck, ShieldHalf, Sparkles, Star, UsersRound, Wrench, X, Code2 } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { allPrograms, programCategories, type Program } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../styles/showcase.css";
import "../styles/programs-catalog.css";

const PAGE_SIZE = 9;
const featured = ["full-stack-web-development", "data-science", "ui-ux-design", "machine-learning", "cyber-security-ethical-hacking", "business-analytics"];
const categoryMeta: Record<string, { icon: typeof Code2; tone: string; label?: string }> = {
  All: { icon: LayoutGrid, tone: "lilac", label: "All programs" },
  "Computer Science": { icon: Code2, tone: "sky", label: "Technology" },
  "Data Science": { icon: BarChart3, tone: "mint" },
  "AI & ML": { icon: BrainCircuit, tone: "rose" },
  "Cyber Security": { icon: ShieldHalf, tone: "peach" },
  Business: { icon: BriefcaseBusiness, tone: "butter" },
  Engineering: { icon: Wrench, tone: "lilac" }
};
const order = (index: number) => ({ "--i": index }) as CSSProperties;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function categoryOf(program: Program) {
  if (["data-science", "data-analytics"].includes(program.slug)) return "Data Science";
  if (["generative-ai", "machine-learning"].includes(program.slug)) return "AI & ML";
  if (program.slug.includes("cyber-security")) return "Cyber Security";
  if (program.domain === "Computer Science & IT") return "Computer Science";
  if (program.domain === "Management") return "Business";
  return "Engineering";
}
const categories = ["All", ...Object.keys(categoryMeta).filter(name => name !== "All" && allPrograms.some(program => categoryOf(program) === name))];
const label = (category: string) => categoryMeta[category]?.label ?? category;

export function ProgramsPage() {
  const mainRef = useScrollReveal();
  const resultsRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get("category");
  const active = categories.find(category => slugify(category) === categoryParam)
    ?? programCategories.find(category => slugify(category.domain) === categoryParam)?.domain ?? "All";
  const query = params.get("q") ?? "";
  const [sort, setSort] = useState("popular");
  const [saved, setSaved] = useState<string[]>(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem("joviq-saved-programs") ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
  });

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allPrograms.filter(program => {
      const categoryMatch = active === "All" || categoryOf(program) === active || program.domain === active;
      const textMatch = !needle || [program.title, program.shortDescription, program.domain, ...program.skills].some(value => value.toLowerCase().includes(needle));
      return categoryMatch && textMatch;
    }).sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "duration") return parseInt(a.duration, 10) - parseInt(b.duration, 10);
      const rank = (program: Program) => featured.includes(program.slug) ? featured.indexOf(program.slug) : featured.length;
      return rank(a) - rank(b);
    });
  }, [active, query, sort]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number(params.get("page")) || 1));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstShown = results.length ? (page - 1) * PAGE_SIZE + 1 : 0;

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key); });
    setParams(next, { replace: true });
  }
  function selectCategory(category: string) { update({ category: category === "All" ? null : slugify(category), page: null }); }
  function goToPage(target: number) {
    update({ page: target > 1 ? String(target) : null });
    resultsRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  function reset() { setSort("popular"); update({ category: null, q: null, page: null }); }
  function toggleSaved(slug: string) {
    const next = saved.includes(slug) ? saved.filter(item => item !== slug) : [...saved, slug];
    setSaved(next); try { localStorage.setItem("joviq-saved-programs", JSON.stringify(next)); } catch { /* Saving remains available for this session. */ }
  }
  // Clamp out-of-range or malformed ?page= values back to a real page.
  const rawPage = params.get("page");
  useEffect(() => {
    if (rawPage && page !== Number(rawPage)) update({ page: page > 1 ? String(page) : null });
  }, [rawPage, page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="programs-catalog sc-page">
      <PublicNavbar />
      <main className="sc-main" ref={mainRef}>
        <section className="sc-hero prg-hero" aria-labelledby="programs-title">
          <div className="sc-hero-grid">
            <div className="sc-hero-copy">
              <span className="sc-badge"><span className="sc-pulse" aria-hidden="true" /><GraduationCap size={16} /> {allPrograms.length} career programs</span>
              <h1 id="programs-title"><span>Career programs</span> <span>built for</span> <em>real work.</em></h1>
              <p>Learn in-demand skills, work on real projects, get expert feedback, and build a portfolio that gets you noticed.</p>
              <form className="prg-search" role="search" onSubmit={event => { event.preventDefault(); resultsRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
                <Search size={19} aria-hidden="true" />
                <input type="search" aria-label="Search programs" placeholder="Search programs or skills, e.g. Python, React, VLSI" value={query} onChange={event => update({ q: event.target.value || null, page: null })} />
                <button type="submit">Search</button>
              </form>
              <ul className="prg-benefits">
                <li className="tone-mint"><span className="sc-icon sc-icon--tone-solid"><GraduationCap size={17} /></span>Industry-relevant curriculum</li>
                <li className="tone-peach"><span className="sc-icon sc-icon--tone-solid"><UsersRound size={17} /></span>Real-world projects</li>
                <li className="tone-sky"><span className="sc-icon sc-icon--tone-solid"><ShieldCheck size={17} /></span>Certificates that matter</li>
              </ul>
            </div>
            <div className="sc-hero-visual prg-hero-visual">
              <img src="/assets/programs/career-journey.png" alt="Your career journey starts here: learn skills, work on projects, get expert feedback, and build a portfolio" width={1586} height={992} fetchPriority="high" />
            </div>
          </div>
        </section>

        <section className="prg-results" ref={resultsRef} aria-labelledby="prg-results-title">
          <div className="prg-toolbar">
            <div><span className="sc-eyebrow">Explore the catalog</span><h2 id="prg-results-title">{active === "All" ? "All Programs" : label(active)}</h2><p role="status">{results.length ? `Showing ${firstShown}–${firstShown + pageItems.length - 1} of ${results.length} programs` : "No programs match your search"}</p></div>
            <label className="prg-sort">Sort by <select aria-label="Sort programs" value={sort} onChange={event => { setSort(event.target.value); update({ page: null }); }}><option value="popular">Most Popular</option><option value="az">Name: A–Z</option><option value="duration">Shortest Duration</option></select></label>
          </div>
          <div className="prg-categories" role="group" aria-label="Filter by category">
            {categories.map(category => {
              const { icon: Icon, tone } = categoryMeta[category] ?? categoryMeta.All;
              const count = category === "All" ? allPrograms.length : allPrograms.filter(program => categoryOf(program) === category).length;
              return <button key={category} type="button" className={`tone-${tone}`} aria-pressed={active === category} onClick={() => selectCategory(category)}><span className="sc-icon sc-icon--tone-solid"><Icon size={15} /></span>{label(category)}<small>{count}</small></button>;
            })}
            {query && <button type="button" className="prg-clear" onClick={() => update({ q: null, page: null })}><X size={14} /> “{query}”</button>}
          </div>

          <div className="prg-grid" key={`${active}-${query}-${sort}-${page}`}>
            {pageItems.map((program, index) => {
              const category = categoryOf(program);
              const { icon: CategoryIcon, tone } = categoryMeta[category] ?? categoryMeta.All;
              const rank = featured.indexOf(program.slug);
              const isSaved = saved.includes(program.slug);
              return <article className={`prg-card sc-fade-in tone-${tone}`} key={program.slug} style={order(index)}>
                <div className="prg-card-media">
                  <Link to={`/programs/${program.slug}`} tabIndex={-1} aria-hidden="true"><img src={getProgramImage(program.slug, program.domain)} alt="" loading="lazy" /></Link>
                  {rank >= 0 && rank < 3 && <span className={`prg-badge prg-badge--${rank}`}>{rank === 2 ? <BriefcaseBusiness size={14} /> : rank === 1 ? <Sparkles size={14} /> : <Star size={14} />}{["Most Popular", "High Demand", "Career Focused"][rank]}</span>}
                  <button className={`prg-save${isSaved ? " is-saved" : ""}`} type="button" aria-label={`${isSaved ? "Unsave" : "Save"} ${program.title}`} aria-pressed={isSaved} onClick={() => toggleSaved(program.slug)}><Heart size={17} /></button>
                  <span className="prg-card-icon sc-icon sc-icon--tone-solid" aria-hidden="true"><CategoryIcon size={20} /></span>
                </div>
                <div className="prg-card-body">
                  <span className="sc-pill">{label(category)}</span>
                  <h3><Link to={`/programs/${program.slug}`}>{program.title}</Link></h3>
                  <p>{program.shortDescription}</p>
                  <div className="prg-skills">{program.skills.slice(0, 3).map(skill => <span key={skill} title={skill}>{skill}</span>)}</div>
                  <div className="prg-card-foot"><span><Clock3 size={14} />{program.duration}</span><span><Cpu size={14} />{program.level}</span><Link className="prg-view" to={`/programs/${program.slug}`} aria-label={`View ${program.title}`}>View <ArrowRight size={16} /></Link></div>
                </div>
              </article>;
            })}
          </div>

          {!results.length && <div className="prg-empty"><span className="sc-icon sc-icon--solid"><Search size={24} /></span><h3>No programs found</h3><p>Try a different skill, or browse every program.</p><button type="button" className="sc-button" onClick={reset}>Show all programs</button></div>}

          {pageCount > 1 && <nav className="prg-pagination" aria-label="Program pages">
            <button type="button" className="prg-page-step" disabled={page === 1} onClick={() => goToPage(page - 1)}><ChevronLeft size={18} /> <span>Previous</span></button>
            <ol>{Array.from({ length: pageCount }, (_, index) => index + 1).map(number => <li key={number}><button type="button" aria-current={number === page ? "page" : undefined} aria-label={`Page ${number}`} onClick={() => goToPage(number)}>{number}</button></li>)}</ol>
            <button type="button" className="prg-page-step" disabled={page === pageCount} onClick={() => goToPage(page + 1)}><span>Next</span> <ChevronRight size={18} /></button>
          </nav>}
        </section>

        <section className="sc-cta prg-cta" aria-labelledby="prg-cta-title" data-reveal>
          <div><span className="sc-eyebrow">Not sure where to start?</span><h2 id="prg-cta-title">Find the right program with an advisor.</h2><p>Share your goals and our team will guide you with the best program, plan, and batch — completely free.</p></div>
          <div className="sc-cta-actions"><Link className="sc-button sc-button--light" to="/request-callback">Talk to an advisor <ArrowRight size={18} /></Link></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownLeft, ArrowRight, BarChart3, BriefcaseBusiness, ChevronDown, Clock3, FolderKanban, GraduationCap, Heart, RefreshCw, Rocket, Search, ShieldCheck, Star, UsersRound } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { allPrograms, programCategories, type Program } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";

const categories = ["All", "Computer Science", "Data Science", "Design", "Business", "Engineering", "AI & ML", "Cyber Security", "Product", "More"];
const featured = ["full-stack-web-development", "data-science", "ui-ux-design", "machine-learning", "cyber-security-ethical-hacking", "business-analytics"];
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function categoryOf(program: Program) {
  if (["data-science", "data-analytics"].includes(program.slug)) return "Data Science";
  if (["generative-ai", "machine-learning"].includes(program.slug)) return "AI & ML";
  if (program.slug.includes("cyber-security")) return "Cyber Security";
  if (program.domain === "UI/UX Design") return "Design";
  if (program.domain === "Management") return "Business";
  if (program.domain === "Computer Science & IT") return "Computer Science";
  return "Engineering";
}
const filterGroups = [
  { title: "Program Type", values: ["Self-Paced", "Live Cohort", "Bootcamp", "Certification"] },
  { title: "Skill Level", values: ["Beginner", "Intermediate", "Advanced"] },
  { title: "Duration", values: ["< 3 Months", "3–6 Months", "6+ Months"] },
  { title: "Price Range", values: ["Free", "Paid"] }
];
function matchesFilter(program: Program, title: string, value: string) {
  if (title === "Skill Level") return program.level.toLowerCase().includes(value.toLowerCase());
  if (title === "Duration") {
    const weeks = parseInt(program.duration, 10) * (program.duration.includes("month") ? 4.345 : 1);
    return value === "< 3 Months" ? weeks < 12 : value === "3–6 Months" ? weeks >= 12 && weeks <= 26 : weeks > 26;
  }
  if (title === "Price Range") {
    const isFree = program.plans.some(plan => plan.isActive && plan.offerPrice === 0);
    return value === "Free" ? isFree : !isFree;
  }
  if (value === "Certification") return Boolean(program.certification);
  if (value === "Self-Paced") return /self.paced|recorded/i.test(program.mode);
  if (value === "Bootcamp") return /bootcamp/i.test(program.mode);
  return /live|online|expert|session/i.test(program.mode);
}

export function ProgramsPage() {
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get("category");
  const active = categories.find(category => slugify(category) === categoryParam)
    ?? programCategories.find(category => slugify(category.domain) === categoryParam)?.domain ?? "All";
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("popular");
  const [limit, setLimit] = useState(6);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem("joviq-saved-programs") ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
  });
  useEffect(() => { setLimit(6); }, [query, categoryParam, filters, sort]);
  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return allPrograms.filter(program => {
      const categoryMatch = active === "All" || categoryOf(program) === active || program.domain === active;
      const text = [program.title, program.shortDescription, program.domain, ...program.skills, ...program.tags].join(" ").toLowerCase();
      return categoryMatch && (!search || text.includes(search)) && Object.entries(filters).every(([group, selected]) => !selected.length || selected.some(value => matchesFilter(program, group, value)));
    }).sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "duration") return parseInt(a.duration, 10) - parseInt(b.duration, 10);
      const rank = (program: Program) => featured.includes(program.slug) ? featured.indexOf(program.slug) : featured.length;
      return rank(a) - rank(b);
    });
  }, [active, query, filters, sort]);
  function selectCategory(category: string) {
    const next = new URLSearchParams(params);
    if (category === "All") next.delete("category"); else next.set("category", slugify(category));
    setParams(next, { replace: true }); setMoreOpen(false);
  }
  function toggleFilter(group: string, value: string) {
    setFilters(current => ({ ...current, [group]: (current[group] ?? []).includes(value) ? current[group].filter(item => item !== value) : [...(current[group] ?? []), value] }));
  }
  function reset() { setMoreFiltersOpen(false); setQuery(""); setFilters({}); setSort("popular"); selectCategory("All"); }
  function toggleSaved(slug: string) {
    const next = saved.includes(slug) ? saved.filter(item => item !== slug) : [...saved, slug];
    setSaved(next); try { localStorage.setItem("joviq-saved-programs", JSON.stringify(next)); } catch { /* Saving remains available for this session. */ }
  }
  return (
    <div className="site-page programs-page">
      <PublicNavbar />
      <main className="pc-main">
        <section className="pc-hero" aria-labelledby="programs-title">
          <div className="pc-hero-copy">
            <span className="pc-eyebrow"><Rocket size={15} /> EXPLORE OUR PROGRAMS</span>
            <h1 id="programs-title">Career programs<br />built for <span>real work.</span></h1>
            <p>Learn in-demand skills, work on real projects, get expert feedback,<br className="pc-desktop-break" /> and build a portfolio that gets you noticed.</p>
            <div className="pc-benefits">
              <div><span className="pc-icon mint"><GraduationCap /></span><p><b>Industry-relevant</b><br />curriculum</p></div>
              <div><span className="pc-icon purple"><UsersRound /></span><p><b>Real-world</b><br />projects</p></div>
              <div><span className="pc-icon gold"><ShieldCheck /></span><p><b>Certificates</b><br />that matter</p></div>
            </div>
          </div>
          <div className="pc-hero-art">
            <div className="pc-art-blob" />
            <img className="pc-student" src="/assets/programs/programs-student.png" alt="Student holding a laptop and looking forward to her next chapter" />
            <div className="pc-hero-note">Your<br />Next Chapter<br />Starts Here<span><ArrowDownLeft /></span></div>
            <Star className="pc-doodle-star" size={30} />
            <div className="pc-float pc-float-skills"><BarChart3 /><b>Learn<br />In-Demand Skills</b></div>
            <div className="pc-float pc-float-portfolio"><BriefcaseBusiness /><b>Build<br />a Strong Portfolio</b></div>
            <i className="pc-rays pc-rays-left" /><i className="pc-rays pc-rays-right" />
          </div>
        </section>
        <section className="pc-stats" aria-label="Program highlights">
          {[{ icon: GraduationCap, value: `${allPrograms.length}+`, label: "Career Programs", color: "purple" }, { icon: UsersRound, value: "5K+", label: "Active Learners", color: "blue" }, { icon: Star, value: "4.8/5", label: "Learner Rating", color: "gold" }, { icon: BriefcaseBusiness, value: "85%", label: "Learners Get Hired", color: "mint" }].map(({ icon: Icon, value, label, color }) => <div key={label}><span className={`pc-icon ${color}`}><Icon /></span><p><strong>{value}</strong><span>{label}</span></p></div>)}
        </section>
        <section className="pc-discovery" aria-label="Find a program">
          <form className="pc-search" onSubmit={event => { event.preventDefault(); document.getElementById("pc-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <label><Search size={25} /><input aria-label="Search programs" placeholder="Search programs (e.g. AI, Full Stack, Data Science...)" value={query} onChange={event => setQuery(event.target.value)} /></label>
            <button type="submit" aria-label="Search programs"><ArrowRight /></button>
          </form>
          <div className="pc-tabs" aria-label="Program categories">
            {categories.slice(0, 8).map(category => <button key={category} type="button" className={active === category ? "is-active" : ""} aria-pressed={active === category} onClick={() => selectCategory(category)}>{category}</button>)}
            <div className="pc-more-wrap"><button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>More <ChevronDown size={14} /></button>{moreOpen && <div className="pc-more-menu">{programCategories.map(category => <button key={category.domain} type="button" onClick={() => selectCategory(category.domain)}>{category.domain}</button>)}</div>}</div>
          </div>
        </section>
        <div className="pc-catalog" id="pc-results">
          <aside className="pc-filters" aria-label="Program filters">
            <div className="pc-filters-heading"><strong>Filters</strong><button type="button" onClick={reset}><RefreshCw size={13} /> Reset</button></div>
            <fieldset><legend>Categories</legend>{categories.slice(0, -1).map(category => <label key={category}><input type="checkbox" checked={active === category} onChange={() => selectCategory(active === category ? "All" : category)} />{category}</label>)}<label><input type="checkbox" checked={moreFiltersOpen} onChange={() => setMoreFiltersOpen(!moreFiltersOpen)} aria-controls="pc-extra-categories" />More</label>{moreFiltersOpen && <div id="pc-extra-categories">{programCategories.map(category => <label key={category.domain}><input type="checkbox" checked={active === category.domain} onChange={() => selectCategory(active === category.domain ? "All" : category.domain)} />{category.domain}</label>)}</div>}</fieldset>
            {filterGroups.map(group => <fieldset key={group.title}><legend>{group.title}</legend>{group.values.map(value => <label key={value}><input type="checkbox" checked={(filters[group.title] ?? []).includes(value)} onChange={() => toggleFilter(group.title, value)} />{value}</label>)}</fieldset>)}
          </aside>
          <section className="pc-results" aria-labelledby="pc-results-title">
            <div className="pc-results-heading"><div><h2 id="pc-results-title">{active === "All" ? "All Programs" : active}</h2><p>Explore {results.length} programs designed for real-world careers.</p></div><label className="pc-sort">Sort by <select aria-label="Sort programs" value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Most Popular</option><option value="az">Name: A–Z</option><option value="duration">Shortest Duration</option></select></label></div>
            <div className="pc-grid">
              {results.slice(0, limit).map(program => {
                const category = categoryOf(program);
                const rank = featured.indexOf(program.slug);
                return <article className="pc-card" key={program.slug}>
                  <div className="pc-card-media"><Link to={`/programs/${program.slug}`} tabIndex={-1} aria-hidden="true"><img src={getProgramImage(program.slug, program.domain)} alt="" loading="lazy" /></Link>{rank >= 0 && rank < 3 && <span className={`pc-badge pc-badge-${rank}`}>{rank === 2 ? <BriefcaseBusiness size={15} /> : <Star size={15} />}{["Most Popular", "High Demand", "Career Focused"][rank]}</span>}<button className={`pc-save ${saved.includes(program.slug) ? "is-saved" : ""}`} type="button" aria-label={`${saved.includes(program.slug) ? "Unsave" : "Save"} ${program.title}`} aria-pressed={saved.includes(program.slug)} onClick={() => toggleSaved(program.slug)}><Heart size={17} /></button></div>
                  <div className="pc-card-body"><span className="pc-card-category">{category === "Computer Science" ? "Technology" : category}</span><h3><Link to={`/programs/${program.slug}`}>{program.title}</Link></h3><p>{program.shortDescription}</p><div className="pc-skills">{program.skills.slice(0, 3).map(skill => <span key={skill} title={skill}>{skill}</span>)}</div><div className="pc-card-meta"><span><FolderKanban size={14} />{program.projects.length} Projects</span><span><Clock3 size={14} />{program.duration}</span></div><Link className="pc-view" to={`/programs/${program.slug}`}>View Program <ArrowRight size={16} /></Link></div>
                </article>;
              })}
            </div>
            {!results.length && <div className="pc-empty"><Search size={30} /><h3>No programs found</h3><p>Try a different search or adjust your filters.</p><button type="button" onClick={reset}>Reset filters</button></div>}
            <div className="pc-load"><button type="button" disabled={limit >= results.length} onClick={() => setLimit(current => current + 6)}><RefreshCw size={18} />{limit >= results.length ? "All Programs Shown" : "Load More Programs"}</button><small aria-live="polite">Showing {Math.min(limit, results.length)} of {results.length} programs</small></div>
          </section>
        </div>
      </main>
    </div>
  );
}




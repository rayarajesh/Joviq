import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownLeft, ArrowRight, BarChart3, BriefcaseBusiness, Clock3, GraduationCap, Heart, RefreshCw, Search, ShieldCheck, Star, UsersRound } from "lucide-react";
import { PublicNavbar } from "../components/PublicNavbar";
import { SiteFooter } from "../components/SiteFooter";
import { allPrograms, programCategories, type Program } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";

const categories = ["All", "Computer Science", "Data Science", "Design", "Business", "Engineering", "AI & ML", "Cyber Security", "Product", "More"];
const featured = ["full-stack-web-development", "data-science", "ui-ux-design", "machine-learning", "cyber-security-ethical-hacking", "business-analytics"];
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function categoryOf(program: Program) {
  if (["data-science", "data-analytics"].includes(program.slug)) return "Data Science";
  if (["generative-ai", "machine-learning"].includes(program.slug)) return "AI & ML";
  if (program.slug.includes("cyber-security")) return "Cyber Security";
  if (program.domain === "Computer Science & IT") return "Computer Science";
  if (program.domain === "Management") return "Business";
  return "Engineering";
}
export function ProgramsPage() {
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get("category");
  const active = categories.find(category => slugify(category) === categoryParam)
    ?? programCategories.find(category => slugify(category.domain) === categoryParam)?.domain ?? "All";
  const [sort, setSort] = useState("popular");
  const [limit, setLimit] = useState(6);

  const [saved, setSaved] = useState<string[]>(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem("joviq-saved-programs") ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
  });
  useEffect(() => { setLimit(6); }, [categoryParam, sort]);
  const results = useMemo(() => {
    return allPrograms.filter(program => {
      const categoryMatch = active === "All" || categoryOf(program) === active || program.domain === active;
      return categoryMatch;
    }).sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "duration") return parseInt(a.duration, 10) - parseInt(b.duration, 10);
      const rank = (program: Program) => featured.includes(program.slug) ? featured.indexOf(program.slug) : featured.length;
      return rank(a) - rank(b);
    });
  }, [active, sort]);
  function selectCategory(category: string) {
    const next = new URLSearchParams(params);
    if (category === "All") next.delete("category"); else next.set("category", slugify(category));
    setParams(next, { replace: true });
  }
  function reset() { setSort("popular"); selectCategory("All"); }
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
            <h1 id="programs-title">Career programs<br />built for <span>real work.</span></h1>
            <p>Learn in-demand skills, work on real projects, get expert feedback,<br className="pc-desktop-break" /> and build a portfolio that gets you noticed.</p>
            <div className="pc-benefits">
              <div><span className="pc-icon mint"><GraduationCap /></span><p><b>Industry-relevant</b><br />curriculum</p></div>
              <div><span className="pc-icon purple"><UsersRound /></span><p><b>Real-world</b><br />projects</p></div>
              <div><span className="pc-icon gold"><ShieldCheck /></span><p><b>Certificates</b><br />that matter</p></div>
            </div>
          </div>
          <div className="pc-hero-art pc-journey-art">
            <img className="pc-journey-image" src="/assets/programs/career-journey.png" alt="Your career journey starts here: learn skills, work on projects, get expert feedback, and build a portfolio" width="1586" height="992" />
          </div>
        </section>
        <div className="pc-catalog" id="pc-results">
          <section className="pc-results" aria-labelledby="pc-results-title">
            <div className="pc-results-heading"><div><h2 id="pc-results-title">{active === "All" ? "All Programs" : active}</h2><p>Explore {results.length} programs designed for real-world careers.</p></div><label className="pc-sort">Sort by <select aria-label="Sort programs" value={sort} onChange={event => setSort(event.target.value)}><option value="popular">Most Popular</option><option value="az">Name: A–Z</option><option value="duration">Shortest Duration</option></select></label></div>
            <div className="pc-grid">
              {results.slice(0, limit).map(program => {
                const category = categoryOf(program);
                const rank = featured.indexOf(program.slug);
                return <article className="pc-card" key={program.slug}>
                  <div className="pc-card-media"><Link to={`/programs/${program.slug}`} tabIndex={-1} aria-hidden="true"><img src={getProgramImage(program.slug, program.domain)} alt="" loading="lazy" /></Link>{rank >= 0 && rank < 3 && <span className={`pc-badge pc-badge-${rank}`}>{rank === 2 ? <BriefcaseBusiness size={15} /> : <Star size={15} />}{["Most Popular", "High Demand", "Career Focused"][rank]}</span>}<button className={`pc-save ${saved.includes(program.slug) ? "is-saved" : ""}`} type="button" aria-label={`${saved.includes(program.slug) ? "Unsave" : "Save"} ${program.title}`} aria-pressed={saved.includes(program.slug)} onClick={() => toggleSaved(program.slug)}><Heart size={17} /></button></div>
                  <div className="pc-card-body"><span className="pc-card-category">{category === "Computer Science" ? "Technology" : category}</span><h3><Link to={`/programs/${program.slug}`}>{program.title}</Link></h3><p>{program.shortDescription}</p><div className="pc-skills">{program.skills.slice(0, 3).map(skill => <span key={skill} title={skill}>{skill}</span>)}</div><div className="pc-card-meta"><span><Clock3 size={14} />{program.duration}</span></div><Link className="pc-view" to={`/programs/${program.slug}`}>View Program <ArrowRight size={16} /></Link></div>
                </article>;
              })}
            </div>
            {!results.length && <div className="pc-empty"><Search size={30} /><h3>No programs found</h3><p>Browse all programs to find your next course.</p><button type="button" onClick={reset}>Show all programs</button></div>}
            <div className="pc-load"><button type="button" disabled={limit >= results.length} onClick={() => setLimit(current => current + 6)}><RefreshCw size={18} />{limit >= results.length ? "All Programs Shown" : "Load More Programs"}</button><small aria-live="polite">Showing {Math.min(limit, results.length)} of {results.length} programs</small></div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}




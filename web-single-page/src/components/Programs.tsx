import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Code2,
  Cpu,
  FolderKanban,
  GraduationCap,
  Landmark,
  Laptop,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  WalletCards,
  Wrench,
  X
} from "lucide-react";
import { findProgramBySlug, programCategories, uniquePrograms } from "../data/siteContent";
import type { ProgramPlan } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { buildProgramViewModel } from "../data/programView";
import { publicLmsApi } from "../features/lms/api/lmsApi";
import type { ProgramDetailsResponse } from "../features/lms/api/lmsTypes";
import { formatInr } from "./format";

const tones = ["lilac", "mint", "peach", "sky", "rose", "butter"];
const order = (index: number) => ({ "--i": index }) as CSSProperties;
const domainIcons = [Code2, Cpu, Wrench, Landmark];

/** Pointer-tracked tilt + spotlight for cards. */
export function tilt(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  card.style.setProperty("--mx", `${x * 100}%`);
  card.style.setProperty("--my", `${y * 100}%`);
  card.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
  card.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
}

export function untilt(event: MouseEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
}

export function ProgramExplorer({ query, onQueryChange, selectedSlug, onSelect }: {
  query: string;
  onQueryChange: (query: string) => void;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const [domain, setDomain] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    // Some programs belong to two domains; list them once under "All".
    const pool = domain === "All"
      ? uniquePrograms
      : programCategories.find((category) => category.domain === domain)?.programs ?? [];
    return pool.filter((program) =>
      (!needle || [program.title, program.domain, program.shortDescription, ...program.skills].join(" ").toLowerCase().includes(needle)));
  }, [domain, query]);
  const visible = showAll || query ? filtered : filtered.slice(0, 9);

  return (
    <section className="section programs" id="programs" aria-labelledby="programs-title">
      <div className="container">
        <div className="section-head section-head--center" data-reveal>
          <span className="eyebrow"><Sparkles size={14} /> Explore programs</span>
          <h2 id="programs-title">Find the career program <span className="text-gradient">built for you.</span></h2>
          <p>Twenty-plus project-first programs across technology, core engineering and management — each with live sessions, real projects and expert review.</p>
        </div>

        <div className="programs__toolbar" data-reveal>
          <div className="segmented" role="tablist" aria-label="Program domains">
            {["All", ...programCategories.map((category) => category.domain)].map((item) => (
              <button key={item} role="tab" aria-selected={domain === item} className={domain === item ? "is-active" : ""} type="button" onClick={() => { setDomain(item); setShowAll(false); }}>
                {item}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input aria-label="Search programs" placeholder="Search by skill or program" value={query} onChange={(event) => onQueryChange(event.target.value)} />
            {query ? <button type="button" aria-label="Clear search" onClick={() => onQueryChange("")}><X size={16} /></button> : null}
          </label>
        </div>

        {visible.length ? (
          <div className="program-grid" key={`${domain}-${query}`}>
            {visible.map((program, index) => (
              <article
                key={program.slug}
                className={`program-card tilt${selectedSlug === program.slug ? " is-selected" : ""}`}
                style={order(index % 9)}
                onMouseMove={tilt}
                onMouseLeave={untilt}
              >
                <div className="program-card__media">
                  <img src={getProgramImage(program.slug, program.domain)} alt="" loading="lazy" width="600" height="400" />
                  <span className="chip chip--glass">{program.domain}</span>
                </div>
                <div className="program-card__body">
                  <h3>{program.title}</h3>
                  <p>{program.shortDescription}</p>
                  <ul className="program-card__meta">
                    <li><CalendarClock size={15} /> {program.duration}</li>
                    <li><GraduationCap size={15} /> {program.level}</li>
                  </ul>
                  <div className="program-card__skills">{program.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div>
                  <button className="btn btn--soft btn--block" type="button" onClick={() => onSelect(program.slug)}>
                    View course &amp; plans <ArrowRight size={16} />
                  </button>
                </div>
                <span className="spotlight" aria-hidden="true" />
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state" data-reveal>
            <Search size={28} />
            <strong>No programs match “{query}”.</strong>
            <button className="btn btn--soft" type="button" onClick={() => { onQueryChange(""); setDomain("All"); }}>Show all programs</button>
          </div>
        )}

        {!showAll && !query && filtered.length > visible.length ? (
          <div className="programs__more">
            <button className="btn btn--ghost" type="button" onClick={() => setShowAll(true)}>
              Show all {filtered.length} programs <ChevronDown size={17} />
            </button>
          </div>
        ) : null}

        <div className="domain-strip">
          {programCategories.map((category, index) => {
            const Icon = domainIcons[index % domainIcons.length];
            return (
              <button key={category.domain} type="button" className={`domain-card tone-${tones[index]}`} data-reveal style={order(index)} onClick={() => { setDomain(category.domain); setShowAll(true); }}>
                <span className="icon-badge"><Icon size={20} /></span>
                <strong>{category.domain}</strong>
                <small>{category.programs.length} programs</small>
                <p>{category.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const courseTabs = ["Overview", "Curriculum", "Projects", "FAQ"] as const;

export function CourseSection({ slug, onClose, onSelectPlan }: {
  slug: string;
  onClose: () => void;
  onSelectPlan: (plan: ProgramPlan, slug: string) => void;
}) {
  const local = findProgramBySlug(slug);
  const [remote, setRemote] = useState<ProgramDetailsResponse | null>(null);
  const [tab, setTab] = useState<(typeof courseTabs)[number]>("Overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    let isCurrent = true;
    setRemote(null);
    setTab("Overview");
    void publicLmsApi.getProgram(slug)
      .then((response) => { if (isCurrent) setRemote(response.data); })
      .catch(() => {
        // Static catalog content keeps the page useful while the API is offline.
      });
    return () => { isCurrent = false; };
  }, [slug]);

  useEffect(() => {
    const active = tabsRef.current?.querySelector<HTMLElement>("[aria-selected='true']");
    if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
  }, [tab, slug]);

  const program = useMemo(() => buildProgramViewModel(local, remote), [local, remote]);
  if (!program) return null;
  const lessonCount = program.curriculum.reduce((total, module) => total + module.lessons.length, 0);

  return (
    <section className="section course" id="course" aria-labelledby="course-title">
      <div className="container">
        <div className="course__hero" data-reveal>
          <div className="course__media">
            <img src={getProgramImage(program.slug, program.domain)} alt="" width="900" height="600" />
            <div className="course__media-badge"><Award size={18} /><span><strong>Verified</strong> certificate</span></div>
          </div>
          <div className="course__intro">
            <div className="course__top">
              <span className="chip"><Sparkles size={14} /> {program.domain}</span>
              <button className="icon-button" type="button" aria-label="Close course and return to programs" onClick={onClose}><X size={18} /></button>
            </div>
            <h2 id="course-title">{program.title}</h2>
            <p>{program.shortDescription}</p>
            <ul className="course__facts">
              <li className="tone-lilac"><CalendarClock size={18} /><span><small>Duration</small>{program.duration}</span></li>
              <li className="tone-mint"><GraduationCap size={18} /><span><small>Level</small>{program.level}</span></li>
              <li className="tone-sky"><Laptop size={18} /><span><small>Mode</small>{program.mode}</span></li>
              <li className="tone-peach"><FolderKanban size={18} /><span><small>Projects</small>{program.projects.length} real projects</span></li>
            </ul>
            <div className="course__actions">
              <a className="btn btn--primary" href="#course-plans" onClick={(event) => { event.preventDefault(); document.getElementById("course-plans")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                Select a plan <ArrowRight size={17} />
              </a>
              <span className="course__from">from <strong>{formatInr(Math.min(...program.plans.map((plan) => plan.offerPrice)))}</strong></span>
            </div>
          </div>
        </div>

        <div className="tabs" ref={tabsRef} role="tablist" aria-label="Course details">
          {courseTabs.map((item) => (
            <button key={item} role="tab" id={`course-tab-${item}`} aria-controls="course-panel" aria-selected={tab === item} type="button" onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
          <span className="tabs__indicator" style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }} aria-hidden="true" />
        </div>

        <div className="course__panel" id="course-panel" role="tabpanel" aria-labelledby={`course-tab-${tab}`} key={`${slug}-${tab}`}>
          {tab === "Overview" ? (
            <div className="course-overview">
              <div>
                <h3>Build capability you can demonstrate, not just describe.</h3>
                <p>{program.overview}</p>
                <h4>Skills you’ll build</h4>
                <ul className="skill-cloud">{program.skills.map((skill, index) => <li key={skill} className={`tone-${tones[index % tones.length]}`} style={order(index)}><Code2 size={14} />{skill}</li>)}</ul>
              </div>
              <aside className="glass-card">
                <span className="icon-badge tone-mint"><UserPlus size={19} /></span>
                <h4>Who should join</h4>
                <ul className="checklist">{program.audience.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul>
                <h4>Career outcomes</h4>
                <ul className="checklist">{program.outcomes.slice(0, 5).map((item) => <li key={item}><BadgeCheck size={16} />{item}</li>)}</ul>
              </aside>
            </div>
          ) : null}

          {tab === "Curriculum" ? (
            <div>
              <div className="course__counts"><span><b>{program.curriculum.length}</b> modules</span><span><b>{lessonCount}</b> lessons</span><span><b>{program.projects.length}</b> projects</span></div>
              <ol className="modules">
                {program.curriculum.map((module, index) => (
                  <li key={module.title} style={order(index)}>
                    <details name="course-curriculum" open={index === 0}>
                      <summary>
                        <span className="modules__num">{String(index + 1).padStart(2, "0")}</span>
                        <span className="modules__title"><strong>{module.title}</strong><small>{module.text}</small></span>
                        <ChevronDown className="modules__chev" size={18} aria-hidden="true" />
                      </summary>
                      <ul>{module.lessons.map((lesson) => <li key={lesson}><PlayCircle size={15} />{lesson}</li>)}</ul>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {tab === "Projects" ? (
            <div className="project-grid">
              {program.projects.map((project, index) => (
                <article key={project.title} className={`project-card tone-${tones[index % tones.length]}`} style={order(index)}>
                  <header><span className="icon-badge"><FolderKanban size={18} /></span><small>Project {index + 1}</small></header>
                  <h4>{project.title}</h4>
                  <p>{project.text}</p>
                  <div className="tech-tags">{(project.technologies ?? project.artifacts).slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>
                </article>
              ))}
            </div>
          ) : null}

          {tab === "FAQ" ? (
            <div className="faq-list faq-list--compact">
              {program.faqs.map((faq, index) => (
                <details key={faq.question} name="course-faq" open={index === 0}>
                  <summary>{faq.question}<ChevronDown size={18} aria-hidden="true" /></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          ) : null}
        </div>

        <div className="course-plans" id="course-plans">
          <div className="section-head section-head--center" data-reveal>
            <span className="eyebrow"><WalletCards size={14} /> Program plans</span>
            <h3>Choose the support level that fits your goal.</h3>
            <p>Reserve your seat with a small token or pay in full — the plan you pick opens secure registration right here.</p>
          </div>
          <div className="plan-grid">
            {program.plans.map((plan, index) => (
              <PlanCard key={plan.code} index={index} plan={plan} onSelect={() => onSelectPlan(plan, program.slug)} />
            ))}
          </div>
          {remote ? <p className="plans-note"><ShieldCheck size={15} /> Live pricing from the Joviq catalog.</p> : null}
        </div>
      </div>
    </section>
  );
}

const planIcons = [Send, Sparkles, Award];

export function PlanCard({ index, plan, onSelect, description }: {
  index: number;
  plan: ProgramPlan;
  onSelect: () => void;
  description?: string;
}) {
  const isRecommended = plan.code === "INTERMEDIATE";
  const includedPlan = plan.code === "INTERMEDIATE" ? "Everything in Launch, plus" : plan.code === "MASTER" ? "Everything in Elevate, plus" : null;
  const savings = Math.max(0, plan.actualPrice - plan.offerPrice);
  const PlanIcon = planIcons[index % planIcons.length];

  return (
    <article
      className={`plan-card tilt tone-${["mint", "lilac", "peach"][index % 3]}${isRecommended ? " is-featured" : ""}`}
      data-reveal
      style={order(index)}
      onMouseMove={tilt}
      onMouseLeave={untilt}
    >
      {isRecommended ? <span className="plan-card__flag"><BadgeCheck size={14} /> Most popular</span> : null}
      <header>
        <span className="icon-badge"><PlanIcon size={20} /></span>
        <div><h4>{plan.name}</h4><small>{isRecommended ? "Best value for most learners" : plan.code === "MASTER" ? "Maximum support" : "Strong start"}</small></div>
      </header>
      <div className="plan-card__price">
        <strong>{formatInr(plan.offerPrice)}</strong>
        {savings > 0 ? <span><del>{formatInr(plan.actualPrice)}</del><b>Save {formatInr(savings)}</b></span> : <span>one-time · 6 months access</span>}
      </div>
      {description ? <p className="plan-card__desc">{description}</p> : null}
      {includedPlan ? <p className="plan-card__includes">{includedPlan}</p> : null}
      <ul className="checklist">{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
      <small className="plan-card__deposit"><WalletCards size={14} /> Reserve with {formatInr(plan.reserveAmount)}</small>
      <button className={`btn btn--block ${isRecommended ? "btn--primary" : "btn--soft"}`} onClick={onSelect} type="button">
        Select {plan.name} <ArrowRight size={17} />
      </button>
      <span className="spotlight" aria-hidden="true" />
    </article>
  );
}


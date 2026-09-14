import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, BriefcaseBusiness, Globe2, Layers3, Pause, Play, UsersRound } from "lucide-react";

type Company = { name: string; src: string; accent: string };

export function AlumniSection({ companies }: { companies: Company[] }) {
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return (
    <section id="alumni-companies" className={`alumni-orbit ${paused ? "is-paused" : ""}`} aria-labelledby="alumni-title">
      <div className="alumni-orbit__stage">
        <div className="alumni-orbit__rings" aria-hidden="true"><i /><i /><i /></div>
        <div className="alumni-orbit__track" aria-hidden="true">
          {companies.slice(0, 24).map((company, index) => <div className="alumni-orbit__logo" key={company.name} style={{ "--orbit-start": `${index / Math.min(companies.length, 24) * 100}%`, "--logo-accent": company.accent } as CSSProperties}><img src={company.src} alt="" /><span>{company.name}</span></div>)}
        </div>
        <div className="alumni-orbit__copy">
          <span className="alumni-orbit__eyebrow"><UsersRound size={19} /> ALUMNI COMPANIES</span>
          <h2 id="alumni-title">Your skills.<br /><span>A world of opportunities.</span></h2>
          <p>Explore the employer landscape across technology, engineering, and business. Ask our team about confirmed alumni placements.</p>
          <button className="alumni-orbit__cta" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="alumni-company-list">{expanded ? "Hide companies" : "View all companies"}<ArrowRight size={20} /></button>
        </div>
        <span className="alumni-orbit__note" aria-hidden="true">From<br />Learning<br />to Leading<svg viewBox="0 0 130 30"><path d="M5 25 L125 4" /></svg></span>
        <div className="alumni-orbit__globe" aria-hidden="true" />
        <div className="alumni-orbit__facts"><div><span><BriefcaseBusiness /></span><p><strong>{companies.length}</strong>Companies to explore</p></div><div><span><Globe2 /></span><p><strong>Global</strong>Employer landscape</p></div><div><span><Layers3 /></span><p><strong>6</strong>Learning domains</p></div></div>
        <button className="alumni-orbit__pause" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? "Resume company animation" : "Pause company animation"}>{paused ? <Play size={16} /> : <Pause size={16} />}<span>{paused ? "Resume motion" : "Pause motion"}</span></button>
      </div>
      <div id="alumni-company-list" className="alumni-orbit__directory" hidden={!expanded}>
        <h3>Explore the companies</h3>
        <ul>{companies.map(company => <li key={company.name}><img src={company.src} alt="" loading="lazy" /><span>{company.name}</span></li>)}</ul>
      </div>
    </section>
  );
}

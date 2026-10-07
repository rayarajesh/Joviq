import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent } from "react";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FolderKanban,
  Layers3,
  PhoneCall,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { useCountUp } from "../hooks/useCountUp";
import { scrollToSection } from "./Navbar";

const rotatingWords = ["Generative AI", "Full Stack", "Data Science", "VLSI", "Cyber Security", "Finance", "UI/UX Design"];
const popularSearches = ["Generative AI", "Full Stack", "Data Science", "VLSI"];

const stats = [
  { value: 20, suffix: "+", label: "Career programs", Icon: Layers3 },
  { value: 100, suffix: "+", label: "Real-time projects", Icon: FolderKanban },
  { value: 6, suffix: "", label: "Learning domains", Icon: BookOpenCheck },
  { value: 1, suffix: ":1", label: "Expert reviews", Icon: UsersRound }
];

// Deterministic star field so server and client renders match.
const stars = Array.from({ length: 34 }, (_, index) => ({
  left: (index * 37.3) % 100,
  top: (index * 53.7) % 100,
  size: 1 + (index % 3),
  delay: (index % 7) * 0.6
}));

const order = (index: number) => ({ "--i": index }) as CSSProperties;

export function Hero({ onSearch }: { onSearch: (query: string) => void }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [query, setQuery] = useState("");
  const heroRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setWordIndex((index) => (index + 1) % rotatingWords.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Pointer position drives the cursor glow and the layered parallax (CSS vars --px/--py in -1..1).
  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      hero.style.setProperty("--gx", `${x}px`);
      hero.style.setProperty("--gy", `${y}px`);
      hero.style.setProperty("--px", `${(x / rect.width) * 2 - 1}`);
      hero.style.setProperty("--py", `${(y / rect.height) * 2 - 1}`);
    });
  }

  function resetPointer() {
    heroRef.current?.style.setProperty("--px", "0");
    heroRef.current?.style.setProperty("--py", "0");
  }

  function search(value: string) {
    onSearch(value);
    scrollToSection("programs");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    search(query);
  }

  return (
    <section className="hero" id="top" aria-labelledby="hero-title" ref={heroRef} onPointerMove={trackPointer} onPointerLeave={resetPointer}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__aurora"><span /><span /><span /></div>
        <div className="hero__grid" />
        <div className="hero__beams"><span /><span /><span /></div>
        <div className="hero__stars">
          {stars.map((star, index) => (
            <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />
          ))}
        </div>
        <div className="hero__glow" />
      </div>

      <div className="hero__inner container">
        <div className="hero__copy">
          <span className="hero__chip">
            <span className="hero__chip-tag"><Sparkles size={12} /> New</span>
            Project-first career programs <ArrowRight size={14} />
          </span>
          <h1 id="hero-title">
            <span className="hero__line">Master</span>{" "}
            <span className="hero__rotator" aria-live="polite">
              <span key={wordIndex} className="hero__word">{rotatingWords[wordIndex]}</span>
              <svg key={`u-${wordIndex}`} className="hero__underline" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 13C60 5 140 2 297 9" />
              </svg>
            </span>
            <span className="hero__line hero__line--2">with real projects</span>
            <span className="hero__line hero__line--3">&amp; expert reviews.</span>
          </h1>
          <p className="hero__lead">
            Learn from industry experts, build a portfolio employers can see, and earn a QR-verified certificate — all in one guided, two-month program.
          </p>

          <form className="hero__search" onSubmit={submit} role="search">
            <Search size={19} aria-hidden="true" />
            <input aria-label="Search programs" placeholder="Search a skill or program" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button className="btn btn--primary btn--sm" type="submit">Find program <ArrowRight size={16} /></button>
          </form>
          <div className="hero__popular">
            <span><TrendingUp size={14} /> Popular:</span>
            {popularSearches.map((item, index) => (
              <button key={item} type="button" style={order(index)} onClick={() => search(item)}>{item}</button>
            ))}
          </div>

          <div className="hero__actions">
            <button className="btn btn--light btn--glow" type="button" onClick={() => scrollToSection("programs")}>Explore programs <ArrowRight size={17} /></button>
            <button className="btn btn--outline-light" type="button" onClick={() => scrollToSection("contact")}><PhoneCall size={16} /> Talk to an advisor</button>
          </div>

          <div className="hero__proof">
            <div className="hero__avatars" aria-hidden="true">
              {["0% 0%", "50% 0%", "100% 0%", "0% 100%", "100% 100%"].map((position, index) => (
                <span key={position} style={{ ...order(index), backgroundPosition: position }} />
              ))}
            </div>
            <span>
              <span className="hero__stars-row" aria-hidden="true">{[0, 1, 2, 3, 4].map((star) => <Star key={star} size={14} fill="currentColor" />)}</span>
              Loved by learners across 6 domains
            </span>
          </div>
        </div>

        <div className="hero__stage" aria-hidden="true">
          <div className="hero__halo" />
          <div className="hero__ring hero__ring--1"><i /><i /></div>
          <div className="hero__ring hero__ring--2"><i /></div>

          <div className="hero__frame layer layer--1">
            <div className="hero__frame-inner">
              <img src="/assets/hero-learners.jpg" alt="" width="1400" height="787" fetchPriority="high" />
            </div>
          </div>

          <img className="hero__obj hero__obj--laptop layer layer--3" src="/assets/3d-laptop.webp" alt="" width="338" height="360" />
          <img className="hero__obj hero__obj--growth layer layer--4" src="/assets/3d-growth.webp" alt="" width="360" height="347" />
          <img className="hero__obj hero__obj--chip layer layer--2" src="/assets/3d-chip.webp" alt="" width="360" height="316" />

          <div className="glass-pop glass-pop--live layer layer--2">
            <span className="glass-pop__live"><i /> LIVE</span>
            <strong>Generative AI · Module 4</strong>
            <div className="glass-pop__row">
              <span className="mini-avatars">{["0% 0%", "50% 0%", "100% 0%"].map((position) => <i key={position} style={{ backgroundPosition: position }} />)}</span>
              <small>Learners in session</small>
            </div>
          </div>

          <div className="glass-pop glass-pop--progress layer layer--3">
            <div className="glass-pop__head"><span className="icon-badge tone-mint"><FolderKanban size={16} /></span><span><strong>Capstone project</strong><small>Expert review in progress</small></span></div>
            <div className="progress"><span /></div>
            <small className="progress__label"><b>78%</b> complete</small>
          </div>

          <div className="glass-pop glass-pop--cert layer layer--4">
            <span className="glass-pop__check"><CheckCircle2 size={18} /></span>
            <span><strong>Certificate issued</strong><small>QR-verified · just now</small></span>
          </div>

          <div className="glass-pop glass-pop--placement layer layer--2">
            <span className="icon-badge tone-peach"><BriefcaseBusiness size={16} /></span>
            <span><strong>Placement support</strong><small>Resume → mock interview</small></span>
            <Award className="glass-pop__award" size={18} />
          </div>
        </div>
      </div>

      <div className="container">
        <ul className="hero__stats">
          {stats.map((stat, index) => <Stat key={stat.label} index={index} {...stat} />)}
        </ul>
      </div>

      <button className="hero__scroll" type="button" aria-label="Scroll to programs" onClick={() => scrollToSection("programs")}>
        <span />
      </button>
      <div className="hero__wave" aria-hidden="true">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 40c240 50 480 50 720 20s480-60 720-10v40H0z" /></svg>
      </div>
    </section>
  );
}

function Stat({ value, suffix, label, Icon, index }: { value: number; suffix: string; label: string; Icon: typeof Layers3; index: number }) {
  const { ref, value: current } = useCountUp<HTMLElement>(value);
  return (
    <li style={order(index)}>
      <span className="hero__stat-icon"><Icon size={20} /></span>
      <span>
        <strong ref={ref}>{current}{suffix}</strong>
        <small>{label}</small>
      </span>
    </li>
  );
}

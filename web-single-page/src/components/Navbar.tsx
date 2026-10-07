import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { useAuth } from "../features/auth/context/useAuth";

export const navLinks = [
  ["programs", "Programs"],
  ["why", "Why Joviq"],
  ["campus", "Campus"],
  ["certificate", "Certificate"],
  ["pricing", "Pricing"],
  ["reviews", "Reviews"],
  ["faq", "FAQ"],
  ["contact", "Contact"]
] as const;

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Navbar() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setIsScrolled(window.scrollY > 24);
        setProgress(max > 0 ? window.scrollY / max : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Highlight the link for whichever section is in view.
  useEffect(() => {
    const sections = navLinks.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", isOpen);
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function go(id: string) {
    setIsOpen(false);
    scrollToSection(id);
  }

  return (
    <header className={`nav${isScrolled ? " is-scrolled" : ""}${isOpen ? " is-open" : ""}`}>
      <div className="nav__bar">
        <a className="nav__brand" href="#top" onClick={(event) => { event.preventDefault(); go("top"); }} aria-label="Joviq Technologies home">
          <img src="/assets/joviq-logo.svg" alt="" width="44" height="42" />
          <span>Joviq<small>Technologies</small></span>
        </a>
        <nav className="nav__links" aria-label="Page sections">
          {navLinks.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined} onClick={(event) => { event.preventDefault(); go(id); }}>{label}</a>
          ))}
        </nav>
        <div className="nav__actions">
          {user ? <span className="nav__user" title={user.email}>{user.fullName.split(" ")[0]}</span> : null}
          <button className="btn btn--primary btn--sm nav__cta" type="button" onClick={() => go("programs")}>
            Enroll now <ArrowRight size={16} />
          </button>
          <button className="nav__toggle" type="button" aria-expanded={isOpen} aria-controls="mobile-nav" aria-label={isOpen ? "Close menu" : "Open menu"} onClick={() => setIsOpen((open) => !open)}>
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className="nav__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <nav id="mobile-nav" className="nav__mobile" aria-label="Mobile page sections" inert={!isOpen}>
        {navLinks.map(([id, label], index) => (
          <a key={id} href={`#${id}`} style={{ "--i": index } as React.CSSProperties} aria-current={active === id ? "true" : undefined} onClick={(event) => { event.preventDefault(); go(id); }}>
            {label}<ArrowRight size={16} />
          </a>
        ))}
        <button className="btn btn--primary btn--block" type="button" onClick={() => go("programs")}>Explore programs <ArrowRight size={16} /></button>
      </nav>
    </header>
  );
}

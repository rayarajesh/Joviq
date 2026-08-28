import type { ReactNode } from "react";
import { ArrowRight, BookOpenCheck, GraduationCap, Mail, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { allPrograms, programCategories } from "../data/siteContent";

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Features", href: "/features" },
  { label: "Campus Ambassador", href: "/campus-ambassador" },
  { label: "Reviews", href: "/reviews" },
  { label: "Careers", href: "/careers" },
  { label: "About Us", href: "/about" }
];

const lmsLinks = [
  { label: "Login to LMS", href: "/login" },
  { label: "Program Search", href: "/#program-search" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Request Callback", href: "/request-callback" }
];

export function SiteFooter() {
  const featuredPrograms = allPrograms.slice(0, 8);

  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <section className="public-footer__top">
          <div className="public-footer__brand">
            <Link className="public-footer__logo" to="/" aria-label="Joviq Technologies home">
              <BrandLogo />
            </Link>
            <p>Learn. Build. Get Certified. Get Hired.</p>
            <div className="public-footer__badges">
              <span>
                <BookOpenCheck size={16} />
                Project-first learning
              </span>
              <span>
                <GraduationCap size={16} />
                Expert mentors
              </span>
              <span>
                <ShieldCheck size={16} />
                Role based LMS
              </span>
            </div>
          </div>

          <div className="public-footer__cta">
            <span>Need help choosing a program?</span>
            <strong>Talk to a Joviq program advisor.</strong>
            <div>
              <Link to="/request-callback">
                Request Callback <ArrowRight size={17} />
              </Link>
              <Link to="/login">Login to LMS</Link>
            </div>
          </div>
        </section>

        <section className="public-footer__grid" aria-label="Footer navigation">
          <FooterColumn title="Featured Programs">
            {featuredPrograms.map((program) => (
              <Link key={program.slug} to={`/programs/${program.slug}`}>
                {program.title}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Domains">
            {programCategories.map((category) => (
              <Link key={category.domain} to="/programs">
                {category.domain}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Company">
            {companyLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="LMS">
            {lmsLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} to={link.href}>
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <div className="public-footer__contact">
            <h3>Contact</h3>
            <p>
              <PhoneCall size={17} />
              Admissions support through callback
            </p>
            <p>
              <Mail size={17} />
              Program guidance and enrollment help
            </p>
            <p>
              <MapPin size={17} />
              India-focused online learning
            </p>
          </div>
        </section>

        <section className="public-footer__bottom">
          <span>Copyright 2026 Joviq Technologies. All rights reserved.</span>
          <div>
            <Link to="/#faq">FAQ</Link>
            <Link to="/request-callback">Callback</Link>
            <Link to="/programs">Programs</Link>
          </div>
        </section>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav className="public-footer__column" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </nav>
  );
}

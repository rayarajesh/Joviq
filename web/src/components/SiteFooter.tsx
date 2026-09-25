import { socialLinks } from "./socialLinks";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  Compass,
  GraduationCap,
  Mail,
  MapPin,
  PhoneCall,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { companyInformation } from "../data/companyInformation";
import "../styles/site-footer.css";

const platformLinks = [
  { label: "Home", href: "/" },
  { label: "Joviq LMS", href: "/login" },
  { label: "Programs", href: "/programs" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Terms & Conditions", href: "/terms" }
];

const companyLinks = [
  { label: "Company Information", href: "/company-information" },
  { label: "About Us", href: "/about" },
  { label: "College Collaboration", href: "/request-callback" }
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer public-footer--restored">
      <div className="public-footer__inner">
        <section className="public-footer__grid" aria-label="Footer navigation">
          <section className="public-footer__brand">
            <Link className="public-footer__logo" to="/" aria-label="Joviq Technologies home">
              <BrandLogo />
            </Link>
            <p className="public-footer__brand-copy">
              Turn curiosity into capability with practical, project-backed learning for the careers ahead.
            </p>
            <div className="public-footer__legal-details">
              <strong>{companyInformation.legalName}</strong>
            </div>
            <div className="public-footer__promise">
              <span aria-hidden="true"><Sparkles size={17} strokeWidth={2.2} /></span>
              <div>
                <strong>Learn. Build. Launch.</strong>
                <small>Progress that feels personal.</small>
              </div>
            </div>
          </section>

          <FooterColumn title="Explore Platform" Icon={Compass}>
            {platformLinks.map((link) => (
              <FooterLink key={link.href} to={link.href}>{link.label}</FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Legal" Icon={Scale}>
            {legalLinks.map((link) => (
              <FooterLink key={link.href} to={link.href}>{link.label}</FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Company" Icon={Building2}>
            {companyLinks.map((link) => (
              <FooterLink key={link.href} to={link.href}>{link.label}</FooterLink>
            ))}
          </FooterColumn>

          <section className="public-footer__social">
            <h3><span className="public-footer__heading-icon"><Sparkles size={15} /></span>Social Media</h3>
            <div className="public-footer__social-list">
              {socialLinks.map(({ href, label, Icon, tone }) => (
                <a className="public-footer__social-link" key={label} href={href} aria-label={label} title={label} target="_blank" rel="noreferrer">
                  <span className={`public-footer__social-icon public-footer__social-icon--${tone}`} aria-hidden="true">
                    <Icon size={17} strokeWidth={2.1} />
                  </span>
                </a>
              ))}
            </div>
            <p className="public-footer__social-copy">Small steps, shared wins, and useful ideas.</p>
          </section>

          <address className="public-footer__contact">
            <div className="public-footer__contact-heading">
              <span className="public-footer__contact-heading-icon" aria-hidden="true"><GraduationCap size={18} /></span>
              <div>
                <h3>Contact Info</h3>
                <p className="public-footer__contact-copy">Have a question? We’re happy to help.</p>
              </div>
            </div>
            <a className="public-footer__contact-item" href="tel:+919281977188">
              <span className="public-footer__contact-icon" aria-hidden="true"><PhoneCall size={16} /></span>
              <span className="public-footer__contact-text"><strong>Phone</strong><span>+91 9281977188</span></span>
              <ArrowUpRight className="public-footer__contact-arrow" size={16} aria-hidden="true" />
            </a>
            <a className="public-footer__contact-item" href="mailto:info@joviqtechnologies.com">
              <span className="public-footer__contact-icon" aria-hidden="true"><Mail size={16} /></span>
              <span className="public-footer__contact-text"><strong>Email</strong><span>info@joviqtechnologies.com</span></span>
              <ArrowUpRight className="public-footer__contact-arrow" size={16} aria-hidden="true" />
            </a>
            <div className="public-footer__contact-item public-footer__contact-item--address">
              <span className="public-footer__contact-icon" aria-hidden="true"><MapPin size={16} /></span>
              <span className="public-footer__contact-text">
                <strong> Address</strong>
                <span>CS COWORKING SPACE, 6TH FLOOR, MELKIORS PRIDE, HITEX ROAD, VINAYAKA NAGAR, IZZATHNAGAR, HITECH CITY, KHANAMMET, HYDERABAD, TELANGANA 500084</span>
              </span>
            </div>
          </address>
        </section>

        <div className="public-footer__bottom">
          <span>© {currentYear} {companyInformation.legalName}. All Rights Reserved.</span>
          <span className="public-footer__bottom-note"><ShieldCheck size={15} aria-hidden="true" />Built for ambitious learners.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, Icon, children }: { title: string; Icon: LucideIcon; children: ReactNode }) {
  return (
    <nav className="public-footer__column" aria-label={title}>
      <h3><span className="public-footer__heading-icon"><Icon size={15} /></span>{title}</h3>
      {children}
    </nav>
  );
}

function FooterLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link className="public-footer__link" to={to}>
      <span>{children}</span>
      <ArrowUpRight size={14} aria-hidden="true" />
    </Link>
  );
}

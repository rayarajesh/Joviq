import { socialLinks } from "./socialLinks";
import type { ReactNode } from "react";
import { ArrowRight, Mail, MapPin, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { companyInformation } from "../data/companyInformation";
import "../styles/site-footer.css";

const platformLinks = [
  { label: "Home", href: "/" },
  { label: "Joviq LMS", href: "/login" },
  { label: "Programs", href: "/programs" },
  { label: "Learning Experience", href: "/features" },
  { label: "Learner Reviews", href: "/reviews" },
  { label: "Campus Delegate Program", href: "/campus-delegate" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Cookie Policy", href: "/cookie-policy" }
];

const companyLinks = [
  { label: "Company Information", href: "/company-information" },
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Campus Partnerships", href: "/campus-partners" },
  { label: "Contact Us", href: "/request-callback" }
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="jf">
      <div className="jf-inner">
        <div className="jf-top">
          <Link className="jf-logo" to="/" aria-label="Joviq Technologies home"><BrandLogo /></Link>
          <p>Turn curiosity into capability with practical, project-backed learning for the careers ahead.</p>
          <Link className="jf-top-link" to="/request-callback">Talk to an advisor <ArrowRight size={15} /></Link>
        </div>

        <section className="jf-grid" aria-label="Footer navigation">
          <FooterColumn title="Explore" tone="lilac">
            {platformLinks.map((link) => <FooterLink key={link.href} to={link.href}>{link.label}</FooterLink>)}
          </FooterColumn>
          <FooterColumn title="Company" tone="peach">
            {companyLinks.map((link) => <FooterLink key={link.href} to={link.href}>{link.label}</FooterLink>)}
          </FooterColumn>
          <FooterColumn title="Legal" tone="mint">
            {legalLinks.map((link) => <FooterLink key={link.href} to={link.href}>{link.label}</FooterLink>)}
          </FooterColumn>
          <address className="jf-contact jf-tone--sky">
            <h3>Contact</h3>
            <a href="tel:+919281977188"><PhoneCall size={14} aria-hidden="true" />+91 92819 77188</a>
            <a href="mailto:info@joviqtechnologies.com"><Mail size={14} aria-hidden="true" />info@joviqtechnologies.com</a>
            <span><MapPin size={14} aria-hidden="true" />CS Coworking Space, 6th Floor, Melkiors Pride, Hitex Road, Vinayaka Nagar, Izzathnagar, Hitech City, Khanammet, Hyderabad, Telangana 500084</span>
          </address>
        </section>

        <div className="jf-bottom">
          <span>© {currentYear} {companyInformation.legalName}. All rights reserved.</span>
          <div className="jf-social" aria-label="Social media">
            <span className="jf-social-label">Follow us</span>
            {socialLinks.map(({ href, label, Icon, tone }) => (
              <a key={label} className={`jf-social--${tone}`} href={href} aria-label={label} title={label} target="_blank" rel="noreferrer"><Icon size={17} strokeWidth={2.1} /></a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, tone, children }: { title: string; tone: string; children: ReactNode }) {
  return (
    <nav className={`jf-column jf-tone--${tone}`} aria-label={title}>
      <h3>{title}</h3>
      <ul>{Array.isArray(children) ? children.map((child, index) => <li key={index}>{child}</li>) : <li>{children}</li>}</ul>
    </nav>
  );
}

function FooterLink({ children, to }: { children: ReactNode; to: string }) {
  return <Link className="jf-link" to={to}>{children}</Link>;
}

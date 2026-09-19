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
  { label: "About Us", href: "/about" },
  { label: "College Collaboration", href: "/request-callback" }
];

const socialLinks = [
  { label: "Instagram", shortLabel: "IG", href: "https://www.instagram.com/joviqtechnologies?stkn=MXY1djRvd3VjNmNoMg==", Icon: InstagramIcon, tone: "instagram" },
  { label: "LinkedIn", shortLabel: "in", href: "https://www.linkedin.com/company/joviq-technologies-private-limited/", Icon: LinkedInIcon, tone: "linkedin" },
  { label: "YouTube", shortLabel: "YT", href: "https://youtube.com", Icon: YouTubeIcon, tone: "youtube" },
  { label: "Facebook", shortLabel: "f", href: "https://www.facebook.com/joviqtechnologies?rdid=SVZR8OQtIHtWHw5s&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Bx12pxKtp%2F#", Icon: FacebookIcon, tone: "facebook" }
];

type SocialIconProps = {
  size?: number;
  strokeWidth?: number;
};

function InstagramIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.1" cy="6.9" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.8A1.8 1.8 0 1 1 6.5 5.2a1.8 1.8 0 0 1 0 3.6Zm-1.4 1.7h2.8v8.5H5.1v-8.5Zm4.3 0h2.7v1.2h.1c.4-.8 1.5-1.6 3.1-1.6 3.3 0 3.9 2.2 3.9 5.1v4.8h-2.8v-4.4c0-1-.1-2.3-1.4-2.3s-1.6 1.1-1.6 2.3v4.4h-2.8v-8.5Z" fill="currentColor"/>
    </svg>
  );
}

function YouTubeIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.2 8.5a2.8 2.8 0 0 0-2-2A56.8 56.8 0 0 0 12 6a56.8 56.8 0 0 0-7.2.5 2.8 2.8 0 0 0-2 2A28.6 28.6 0 0 0 2.8 12a28.6 28.6 0 0 0 .1 3.5 2.8 2.8 0 0 0 2 2A56.8 56.8 0 0 0 12 18a56.8 56.8 0 0 0 7.2-.5 2.8 2.8 0 0 0 2-2A28.6 28.6 0 0 0 21.2 12a28.6 28.6 0 0 0 0-3.5ZM10 15.5v-7l6 3.5-6 3.5Z" fill="currentColor"/>
    </svg>
  );
}

function FacebookIcon({ size = 24 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.4 21v-8h2.6l.5-3h-3.1V7.2c0-.9.3-1.5 1.7-1.5H17V2.9c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.7-4.5 4.7V10H7v3h2.8v8h3.6Z" fill="currentColor"/>
    </svg>
  );
}

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
                <strong>Visit us</strong>
                <span>CS COWORKING SPACE, 6TH FLOOR, MELKIORS PRIDE, HITEX ROAD, VINAYAKA NAGAR, IZZATHNAGAR, HITECH CITY, KHANAMMET, HYDERABAD, TELANGANA 500084.</span>
              </span>
            </div>
          </address>
        </section>

        <div className="public-footer__bottom">
          <span>© {currentYear} Joviq Technologies. All rights reserved.</span>
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

import type { ReactNode } from "react";
import { Mail, MapPin, PhoneCall } from "lucide-react";
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
  { label: "Instagram", shortLabel: "IG", href: "https://www.instagram.com/joviqtechnologies?stkn=MXY1djRvd3VjNmNoMg==", bg: "#f1467d", Icon: InstagramIcon },
  { label: "LinkedIn", shortLabel: "in", href: "https://www.linkedin.com/company/joviq-technologies-private-limited/", bg: "#0a66c2", Icon: LinkedInIcon },
  { label: "YouTube", shortLabel: "YT", href: "https://youtube.com", bg: "#ff0000", Icon: YouTubeIcon },
  { label: "Facebook", shortLabel: "f", href: "https://www.facebook.com/joviqtechnologies?rdid=SVZR8OQtIHtWHw5s&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Bx12pxKtp%2F#", bg: "#1877f2", Icon: FacebookIcon }
];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.1" cy="6.9" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.8A1.8 1.8 0 1 1 6.5 5.2a1.8 1.8 0 0 1 0 3.6Zm-1.4 1.7h2.8v8.5H5.1v-8.5Zm4.3 0h2.7v1.2h.1c.4-.8 1.5-1.6 3.1-1.6 3.3 0 3.9 2.2 3.9 5.1v4.8h-2.8v-4.4c0-1-.1-2.3-1.4-2.3s-1.6 1.1-1.6 2.3v4.4h-2.8v-8.5Z" fill="currentColor"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.2 8.5a2.8 2.8 0 0 0-2-2A56.8 56.8 0 0 0 12 6a56.8 56.8 0 0 0-7.2.5 2.8 2.8 0 0 0-2 2A28.6 28.6 0 0 0 2.8 12a28.6 28.6 0 0 0 .1 3.5 2.8 2.8 0 0 0 2 2A56.8 56.8 0 0 0 12 18a56.8 56.8 0 0 0 7.2-.5 2.8 2.8 0 0 0 2-2A28.6 28.6 0 0 0 21.2 12a28.6 28.6 0 0 0 0-3.5ZM10 15.5v-7l6 3.5-6 3.5Z" fill="currentColor"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.4 21v-8h2.6l.5-3h-3.1V7.2c0-.9.3-1.5 1.7-1.5H17V2.9c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.7-4.5 4.7V10H7v3h2.8v8h3.6Z" fill="currentColor"/>
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="public-footer public-footer--restored">
      <div className="public-footer__inner">
        <section className="public-footer__grid" aria-label="Footer navigation">
          <div className="public-footer__brand">
            <Link className="public-footer__logo" to="/" aria-label="Joviq Technologies home">
              <BrandLogo />
            </Link>
          </div>

          <FooterColumn title="Explore Platform">
            {platformLinks.map((link) => (
              <Link key={link.href} to={link.href}>{link.label}</Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Legal">
            {legalLinks.map((link) => (
              <Link key={link.href} to={link.href}>{link.label}</Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Company">
            {companyLinks.map((link) => (
              <Link key={link.href} to={link.href}>{link.label}</Link>
            ))}
          </FooterColumn>

          <div className="public-footer__social">
            <h3>Social Media</h3>
            <div>
              {socialLinks.map(({ href, label, bg, Icon }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" title={label} style={{ backgroundColor: bg }}>
                  <Icon />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="public-footer__contact">
            <h3>Contact Info</h3>
            <p>
              <PhoneCall size={17} />
              <span><strong>Phone:</strong> +91 9281977188</span>
            </p>
            <p>
              <Mail size={17} />
              <span><strong>Email:</strong> info@joviqtechnologies.com</span>
            </p>
            <p>
              <MapPin size={17} />
              <span>
                <strong>Address:</strong>
                CS COWORKING SPACE,6TH FLOOR,MELKIORS PRIDE,HITEX ROAD,VINAYAKA NAGAR,IZZATHNAGAR,HITECH CITY,KHANAMMET,HYDERABAD,TELANGANA 500084.              </span>
            </p>
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

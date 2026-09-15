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
  { label: "Instagram", shortLabel: "IG", href: "https://instagram.com" },
  { label: "LinkedIn", shortLabel: "in", href: "https://linkedin.com" },
  { label: "YouTube", shortLabel: "YT", href: "https://youtube.com" },
  { label: "Facebook", shortLabel: "f", href: "https://facebook.com" }
];

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
              {socialLinks.map(({ href, label, shortLabel }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer">
                  {shortLabel}
                </a>
              ))}
            </div>
          </div>

          <div className="public-footer__contact">
            <h3>Contact Info</h3>
            <p>
              <PhoneCall size={17} />
              <span><strong>Phone:</strong> +91 93980 62923</span>
            </p>
            <p>
              <Mail size={17} />
              <span><strong>Email:</strong> joviqtechnologies@gmail.com</span>
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

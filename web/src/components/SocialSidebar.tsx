import { socialLinks } from "./socialLinks";
import "../styles/social-sidebar.css";

const order = ["whatsapp", "instagram", "facebook", "linkedin"];
const sidebarLinks = order.flatMap((tone) => socialLinks.filter((link) => link.tone === tone));

export function SocialSidebar() {
  return (
    <nav className="social-sidebar" aria-label="Connect with Joviq">
      {sidebarLinks.map(({ label, href, Icon, tone }) => (
        <a
          key={tone}
          className={`social-sidebar__link social-sidebar__link--${tone}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} (opens in a new tab)`}
          title={label}
        >
          <Icon size={25} />
          <span className="social-sidebar__label" aria-hidden="true">{label}</span>
        </a>
      ))}
    </nav>
  );
}

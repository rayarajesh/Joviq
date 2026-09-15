import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink, Menu, Search, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const publicNavItems = [
  { label: "Programs", to: "/programs" },
  { label: "Features", to: "/features" },
  { label: "Campus Delegate", to: "/campus-delegate" },
  { label: "Campus Partners", to: "/campus-partners" },
  { label: "Careers", to: "/careers" },
  { label: "Reviews", to: "/reviews" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/request-callback" }
];

export function PublicNavbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  function closeMenus() {
    setIsMenuOpen(false);
  }

  function isActivePath(path: string) {
    const targetPath = path.split("#")[0];

    if (path === "/programs") {
      return location.pathname === "/programs" || location.pathname.startsWith("/programs/");
    }

    return location.pathname === targetPath;
  }

  return (
    <header className={`site-header ${isMenuOpen ? "is-open" : ""}`}>
      <Link className="site-header__brand" to="/" onClick={closeMenus} aria-label="Joviq Technologies home">
        <BrandLogo />
      </Link>

      <div className="site-nav">
        <nav className="site-nav__links" aria-label="Main menu">
          {publicNavItems.map((item) => (
            <Link
              key={item.to}
              className={isActivePath(item.to) ? "is-active" : undefined}
              to={item.to}
              aria-current={isActivePath(item.to) ? "page" : undefined}
              onClick={closeMenus}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-nav__actions">
          <Link className="site-nav__search" to="/programs" onClick={closeMenus} aria-label="Search programs" title="Search programs">
            <Search size={19} />
          </Link>
          <Link to="/login" onClick={closeMenus}>
            Login <ExternalLink size={15} />
          </Link>
          <Link className="is-primary" to="/request-callback" onClick={closeMenus}>
            Request Callback
          </Link>
        </div>

        <button
          className="site-nav__menu-button"
          type="button"
          aria-controls="site-mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div id="site-mobile-menu" className="site-nav__mobile" aria-hidden={!isMenuOpen}>
          {publicNavItems.map((item) => (
            <Link
              key={item.to}
              className={isActivePath(item.to) ? "is-active" : undefined}
              to={item.to}
              onClick={closeMenus}
            >
              {item.label}
            </Link>
          ))}
          <div className="site-nav__mobile-actions">
            <Link to="/login" onClick={closeMenus}>
              Login
            </Link>
            <Link className="is-primary" to="/request-callback" onClick={closeMenus}>
              Request Callback
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ProgramsMegaMenu } from "./ProgramsMegaMenu";

const publicNavItems = [
  { label: "Programs", to: "/programs", hasMegaMenu: true },
  { label: "Features", to: "/features" },
  { label: "Campus Ambassador", to: "/campus-ambassador" },
  { label: "Reviews", to: "/reviews" },
  { label: "Careers", to: "/careers" },
  { label: "About Us", to: "/about" }
];

export function PublicNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProgramsMegaOpen, setIsProgramsMegaOpen] = useState(location.hash === "#programs-menu");

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProgramsMegaOpen(location.hash === "#programs-menu");
  }, [location.pathname, location.hash]);

  function closeMenus() {
    setIsMenuOpen(false);
    setIsProgramsMegaOpen(false);
  }

  function isActivePath(path: string) {
    if (path === "/programs") {
      return location.pathname === "/programs" || location.pathname.startsWith("/programs/");
    }

    return location.pathname === path;
  }

  return (
    <header
      className={`site-header ${isMenuOpen ? "is-open" : ""} ${isProgramsMegaOpen ? "has-mega-open" : ""}`}
      onMouseLeave={() => setIsProgramsMegaOpen(false)}
    >
      <Link className="site-header__brand" to="/" onClick={closeMenus} aria-label="Joviq Technologies home">
        <BrandLogo />
      </Link>

      <div className="site-nav">
        <nav className="site-nav__links" aria-label="Main menu">
          {publicNavItems.map((item) =>
            item.hasMegaMenu ? (
              <Link
                key={item.to}
                className={`site-nav__mega-trigger ${isProgramsMegaOpen ? "is-active" : ""} ${isActivePath(item.to) ? "is-route-active" : ""}`}
                to={item.to}
                aria-expanded={isProgramsMegaOpen}
                aria-current={isActivePath(item.to) ? "page" : undefined}
                onFocus={() => setIsProgramsMegaOpen(true)}
                onMouseEnter={() => setIsProgramsMegaOpen(true)}
                onClick={() => setIsProgramsMegaOpen(false)}
              >
                {item.label}
                <ChevronDown size={16} />
              </Link>
            ) : (
              <Link
                key={item.to}
                className={isActivePath(item.to) ? "is-active" : undefined}
                to={item.to}
                aria-current={isActivePath(item.to) ? "page" : undefined}
                onClick={closeMenus}
                onMouseEnter={() => setIsProgramsMegaOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="site-nav__actions">
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

        <ProgramsMegaMenu
          isOpen={isProgramsMegaOpen}
          onClose={() => setIsProgramsMegaOpen(false)}
          onTalkToExpert={() => {
            closeMenus();
            navigate("/request-callback");
          }}
        />
      </div>
    </header>
  );
}

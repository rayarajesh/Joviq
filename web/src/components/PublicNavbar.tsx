import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink, Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const publicNavItems = [
  { label: "Programs", to: "/programs" },
  { label: "Features", to: "/features" },
  { label: "Campus Delegate", to: "/campus-delegate" },
  { label: "Campus Partners", to: "/campus-partners" },
  { label: "Careers", to: "/careers" },
  { label: "Reviews", to: "/reviews" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/request-callback" },
];

export function PublicNavbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isMenuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    }
    const desktop = window.matchMedia("(min-width: 1221px)");
    const onResize = () => { if (desktop.matches) setIsMenuOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [isMenuOpen]);

  function closeMenus() {
    setIsMenuOpen(false);
  }

  function isActivePath(path: string) {
    const targetPath = path.split("#")[0];

    if (path === "/programs") {
      return (
        location.pathname === "/programs" ||
        location.pathname.startsWith("/programs/")
      );
    }

    return location.pathname === targetPath;
  }

  return (
    <header
      id="public-navbar"
      ref={headerRef}
      className={`site-header ${isMenuOpen ? "is-open" : ""}`}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) closeMenus();
      }}
    >
      <Link
        className="site-header__brand"
        to="/"
        onClick={closeMenus}
        aria-label="Joviq Technologies home"
      >
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
          <Link to="/login" onClick={closeMenus}>
            Login <ExternalLink size={15} />
          </Link>
          <Link
            className="is-primary"
            to="/request-callback"
            onClick={closeMenus}
          >
            Request Callback
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          className="site-nav__menu-button"
          type="button"
          aria-controls="site-mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div
          id="site-mobile-menu"
          className="site-nav__mobile"
          inert={!isMenuOpen}
          aria-hidden={!isMenuOpen}
        >
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
          <div className="site-nav__mobile-actions">
            <Link to="/login" onClick={closeMenus}>
              Login
            </Link>
            <Link
              className="is-primary"
              to="/request-callback"
              onClick={closeMenus}
            >
              Request Callback
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

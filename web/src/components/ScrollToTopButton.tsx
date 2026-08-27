import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const revealOffset = 560;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > revealOffset);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  function scrollToTop() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  return (
    <button
      aria-label="Back to top"
      className={`scroll-to-top ${isVisible ? "is-visible" : ""}`}
      onClick={scrollToTop}
      tabIndex={isVisible ? 0 : -1}
      title="Back to top"
      type="button"
    >
      <ArrowUp aria-hidden="true" size={21} strokeWidth={2.4} />
    </button>
  );
}

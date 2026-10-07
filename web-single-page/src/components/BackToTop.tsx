import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button className={`back-to-top${isVisible ? " is-visible" : ""}`} type="button" aria-label="Back to top" tabIndex={isVisible ? 0 : -1} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <ArrowUp size={20} />
    </button>
  );
}

import { useEffect, useRef } from "react";

/**
 * Fades `[data-reveal]` descendants in as they scroll into view.
 * Content stays visible without JS (prerender, crawlers) because the hidden
 * class is only applied once the observer is running.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(revealClass = "sc-reveal") {
  const rootRef = useRef<T>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    targets.forEach(element => element.classList.add(revealClass));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    targets.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [revealClass]);
  return rootRef;
}

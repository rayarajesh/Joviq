import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageSeo, siteName } from '../seo';

export function SeoMetadata() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const seo = pageSeo(pathname, import.meta.env.VITE_SEO_INDEXABLE === 'true');
    document.title = seo.title;
    function meta(key: string, value: string, property = false) {
      const attribute = property ? 'property' : 'name';
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = value;
    }
    meta('description', seo.description);
    meta('robots', seo.robots);
    for (const [key, value] of Object.entries({ 'og:title': seo.title, 'og:description': seo.description, 'og:url': seo.canonical, 'og:image': seo.image, 'og:site_name': siteName, 'og:type': 'website', 'og:locale': 'en_IN' })) meta(key, value, true);
    for (const [key, value] of Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': seo.title, 'twitter:description': seo.description, 'twitter:image': seo.image })) meta(key, value);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = seo.canonical;
    document.getElementById('seo-structured-data')?.remove();
    if (seo.structuredData) {
      const script = document.createElement('script');
      script.id = 'seo-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(seo.structuredData);
      document.head.appendChild(script);
    }
    document.documentElement.dataset.seoPath = seo.path;
  }, [pathname]);
  return null;
}

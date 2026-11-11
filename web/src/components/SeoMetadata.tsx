import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageSeo, siteName, socialPreview } from '../seo';

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
    // Social-share preview is identical and company-branded on every public page
    // (title, description and image from socialPreview); only og:url is per-page.
    // The SEO document.title and meta description above stay page-specific.
    for (const [key, value] of Object.entries({
      'og:title': socialPreview.title,
      'og:description': socialPreview.description,
      'og:url': seo.canonical,
      'og:image': socialPreview.image,
      'og:image:secure_url': socialPreview.image,
      'og:image:type': 'image/jpeg',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': socialPreview.imageAlt,
      'og:site_name': siteName,
      'og:type': 'website',
      'og:locale': 'en_IN'
    })) meta(key, value, true);
    for (const [key, value] of Object.entries({
      'twitter:card': 'summary_large_image',
      'twitter:title': socialPreview.title,
      'twitter:description': socialPreview.description,
      'twitter:image': socialPreview.image,
      'twitter:image:alt': socialPreview.imageAlt
    })) meta(key, value);
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

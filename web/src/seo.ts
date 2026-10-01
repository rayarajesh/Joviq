import { allPrograms } from './data/siteContent';
import { companyInformation } from './data/companyInformation';

export const siteUrl = 'https://joviqtechnologies.com';
export const siteName = 'Joviq Technologies';
export const publicPages = [
  { path: '/', title: 'Joviq Technologies | Online Training and Career Skills', description: 'Explore Joviq Technologies training programs in technology and business, with practical projects, guided learning, and career preparation.' },
  { path: '/programs', title: 'Training Programs', description: 'Explore technology and business training programs at Joviq Technologies. Compare skills, curriculum, projects, and learning options.' },
  { path: '/about', title: 'About Joviq Technologies', description: 'Learn about Joviq Technologies and our approach to practical learning, professional skills, and career-focused training.' },
  { path: '/features', title: 'Learning Experience', description: 'Discover the Joviq Technologies learning experience, including hands-on projects, guided training, and career preparation.' },
  { path: '/company-information', title: 'Company Information', description: 'Company and registration information for JOVIQ TECHNOLOGIES PRIVATE LIMITED, based in Hyderabad, Telangana, India.' },
  { path: '/campus-partners', title: 'Campus Partnerships', description: 'Explore campus partnerships with Joviq Technologies for student learning, practical skills, and career development.' },
  { path: '/campus-delegate', title: 'Campus Delegate Program', description: 'Discover the Joviq Technologies campus delegate program and opportunities to connect students with learning programs.' },
  { path: '/careers', title: 'Careers at Joviq Technologies', description: 'Explore careers and opportunities to work with Joviq Technologies in learning, training, and technology.' },
  { path: '/reviews', title: 'Learner Reviews', description: 'Read learner experiences with Joviq Technologies training programs and learning support.' },
  { path: '/request-callback', title: 'Contact Joviq Technologies', description: 'Request a callback from Joviq Technologies to discuss training programs, curriculum, and learning options.' },
  { path: '/privacy-policy', title: 'Privacy Policy', description: 'Read how Joviq Technologies handles personal information, privacy, and data protection.' },
  { path: '/terms', title: 'Terms and Conditions', description: 'Read the terms and conditions for using Joviq Technologies programs and services.' },
  { path: '/cookie-policy', title: 'Cookie Policy', description: 'Read the Joviq Technologies cookie policy and information about your cookie preferences.' },
  { path: '/return-policy', title: 'Refund Policy', description: 'Read the refund and cancellation policy for Joviq Technologies programs.' },
  ...allPrograms.filter((program, index, programs) => programs.findIndex(item => item.slug === program.slug) === index).map(program => ({ path: `/programs/${program.slug}`, title: `${program.title} Training`, description: `${program.shortDescription} Explore the curriculum and practical projects at Joviq Technologies.`.slice(0, 170) }))
];

export function pageSeo(pathname: string, indexable = true) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = publicPages.find(page => page.path === path);
  return {
    path,
    title: page ? (page.title.includes(siteName) ? page.title : `${page.title} | ${siteName}`) : `Account | ${siteName}`,
    description: page?.description ?? 'Secure account access for Joviq Technologies learners.',
    canonical: `${siteUrl}${path === '/' ? '/' : path}`,
    robots: page && indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    image: `${siteUrl}/assets/hero-student-panels.png`,
    structuredData: page ? {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: siteName, legalName: companyInformation.legalName, alternateName: ['JoviQ Technologies', 'Joviq'], url: siteUrl, logo: `${siteUrl}/assets/joviq-brand.png` },
        ...(path === '/' ? [{ '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: siteName, alternateName: 'JoviQ Technologies', publisher: { '@id': `${siteUrl}/#organization` } }] : [{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: siteName, item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: page.title, item: `${siteUrl}${path}` }] }])
      ]
    } : null
  };
}

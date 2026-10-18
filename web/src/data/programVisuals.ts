export const programImageBySlug: Record<string, string> = {
  "ui-ux-design": "/assets/programs/ui-ux-design.png",
  "generative-ai": "/assets/programs/generative-ai.jpg",
  "full-stack-web-development": "/assets/programs/full-stack.jpg",
  "machine-learning": "/assets/programs/machine-learning.jpg",
  "cyber-security-ethical-hacking": "/assets/programs/cyber-security-catalog.png",
  "data-analytics": "/assets/programs/data-analytics.jpg",
  "data-science": "/assets/programs/data-science-catalog.png",
  "cloud-computing": "/assets/programs/cloud-computing.jpg",
  "embedded-systems": "/assets/programs/Embedded-system.jpg",
  vlsi: "/assets/programs/Vlsi.jpg",
  devops: "/assets/programs/devops.jpg",
  finance: "/assets/programs/Finance.jpg",
  "digital-marketing": "/assets/programs/digital-marketing.jpg",
  "stock-market": "/assets/programs/stock-market.jpg",
  "hev-management": "/assets/programs/HEV-management.jpg",
  autocad: "/assets/programs/Autocad.jpg",
  "international-business-management": "/assets/programs/international-business-management.jpg",
  hrm: "/assets/programs/Human- resources.Jpg.jpg"
};

export const programSocialImageBySlug: Record<string, string> = {
  "ui-ux-design": "/assets/programs/ui-ux-design-og.jpg",
  "generative-ai": "/assets/programs/generative-ai-og.jpg",
  "full-stack-web-development": "/assets/programs/full-stack-web-development-og.jpg",
  "machine-learning": "/assets/programs/machine-learning-og.jpg",
  "cyber-security-ethical-hacking": "/assets/programs/cyber-security-ethical-hacking-og.jpg",
  "data-analytics": "/assets/programs/data-analytics-og.jpg",
  "data-science": "/assets/programs/data-science-og.jpg",
  "cloud-computing": "/assets/programs/cloud-computing-og.jpg",
  devops: "/assets/programs/devops-og.jpg",
  "embedded-systems": "/assets/programs/embedded-systems-og.jpg",
  vlsi: "/assets/programs/vlsi-og.jpg",
  "hev-management": "/assets/programs/hev-management-og.jpg",
  solidworks: "/assets/programs/solidworks-og.jpg",
  autocad: "/assets/programs/autocad-og.jpg",
  finance: "/assets/programs/finance-og.jpg",
  "stock-market": "/assets/programs/stock-market-og.jpg",
  "digital-marketing": "/assets/programs/digital-marketing-og.jpg",
  "business-analytics": "/assets/programs/business-analytics-og.jpg",
  "international-business-management": "/assets/programs/international-business-management-og.jpg",
  hrm: "/assets/programs/hrm-og.jpg"
};

export const programImageByDomain: Record<string, string> = {
  "Computer Science & IT": "/assets/programs/generative-ai.jpg",
  "Electrical & Electronics": "/assets/programs/electrical-electronics.jpg",
  "Mechanical & Civil": "/assets/programs/mechanical-civil.jpg",
  Management: "/assets/programs/business-analytics.jpg"
};

export function getProgramImage(slug: string, domain: string) {
  return programImageBySlug[slug] ?? programImageByDomain[domain] ?? "/assets/joviq-learning-studio.png";
}

export function getProgramSocialImage(slug: string, domain: string) {
  return programSocialImageBySlug[slug] ?? getProgramImage(slug, domain);
}



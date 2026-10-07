export const programImageBySlug: Record<string, string> = {
  "ui-ux-design": "/assets/programs/ui-ux-design.jpg",
  "generative-ai": "/assets/programs/generative-ai.jpg",
  "full-stack-web-development": "/assets/programs/full-stack.jpg",
  "machine-learning": "/assets/programs/machine-learning.jpg",
  "cyber-security-ethical-hacking": "/assets/programs/cyber-security.jpg",
  "data-analytics": "/assets/programs/data-analytics.jpg",
  "data-science": "/assets/programs/data-science.jpg",
  "cloud-computing": "/assets/programs/cloud-computing.jpg",
  "embedded-systems": "/assets/programs/embedded-systems.jpg",
  vlsi: "/assets/programs/vlsi.jpg",
  devops: "/assets/programs/devops.jpg",
  finance: "/assets/programs/finance.jpg",
  "digital-marketing": "/assets/programs/digital-marketing.jpg",
  "stock-market": "/assets/programs/stock-market.jpg",
  "hev-management": "/assets/programs/hev-management.jpg",
  autocad: "/assets/programs/autocad.jpg",
  "international-business-management": "/assets/programs/international-business-management.jpg",
  hrm: "/assets/programs/hrm.jpg"
};

export const programImageByDomain: Record<string, string> = {
  "Computer Science & IT": "/assets/programs/generative-ai.jpg",
  "Electrical & Electronics": "/assets/programs/electrical-electronics.jpg",
  "Mechanical & Civil": "/assets/programs/mechanical-civil.jpg",
  Management: "/assets/programs/business-analytics.jpg"
};

export function getProgramImage(slug: string, domain: string) {
  return programImageBySlug[slug] ?? programImageByDomain[domain] ?? "/assets/learning-studio.jpg";
}

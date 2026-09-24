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
  devops: "/assets/programs/devops.jpg"
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



import businessProgramContent from "./businessProgramContent.json";
import programCurriculum from "./programCurriculum.json";

export type ProgramContent = {
  title: string;
  shortDescription: string;
  overview: string;
  skills: string[];
  curriculum: { title: string; text: string; lessons: string[] }[];
  projects: { title: string; text: string; artifacts: string[]; technologies: string[] }[];
};

export type Program = {
  curriculumDetails?: ProgramContent["curriculum"];
  content?: ProgramContent;
  slug: string;
  title: string;
  domain: string;
  shortDescription: string;
  overview: string;
  audience: string[];
  skills: string[];
  curriculum: string[];
  duration: string;
  mode: string;
  expert: string;
  projects: string[];
  certification: string;
  outcomes: string[];
  interviewPrep: string[];
  pricing: string;
  plans: ProgramPlan[];
  faqs: { question: string; answer: string }[];
  tags: string[];
  level: string;
};

export type ProgramPlan = {
  id?: string;
  name: string;
  code: "SELF" | "INTERMEDIATE" | "MASTER" | string;
  actualPrice: number;
  offerPrice: number;
  reserveAmount: number;
  features: string[];
  isActive: boolean;
};

export type ProgramCategory = {
  domain: string;
  description: string;
  programs: Program[];
};

const commonFaqs = [
  {
    question: "Will I get a certificate?",
    answer: "Yes. Learners receive a Joviq completion certificate after finishing required project work and reviews."
  },
  {
    question: "Are projects included?",
    answer: "Yes. Every program includes 5 to 6 real-time project examples and expert-reviewed practice work."
  },
  {
    question: "Is placement support included?",
    answer: "Career guidance, resume review, mock interviews, and interview preparation are included in the career track."
  }
];

export const defaultProgramPlans: ProgramPlan[] = [
  {
    name: "Launch",
    code: "SELF",
    actualPrice: 8000,
    offerPrice: 8000,
    reserveAmount: 1500,
    features: [
      "16 Live Sessions",
      "Recorded Lessons",
      "Hands-on Learning",
      "Real-Time Project",
      "Doubt-Solving Support",
      "Basic Expert Support",
      "Interview Assistance",
      "6 Months LMS Access",
      "QR-Verified Certification"
    ],
    isActive: true
  },
  {
    name: "Elevate",
    code: "INTERMEDIATE",
    actualPrice: 10000,
    offerPrice: 10000,
    reserveAmount: 1500,
    features: [
      "22 Live Sessions",
      "Recorded Lessons",
      "Hands-on Learning",
      "Real-Time Projects",
      "Personal Expert Support",
      "Doubt-Solving Support",
      "Expert Guidance & Review",
      "Interview Preparation & Assistance",
      "Placement Support",
      "6 Months LMS Access",
      "QR-Verified Certification"
    ],
    isActive: true
  },
  {
    name: "Mastery",
    code: "MASTER",
    actualPrice: 15000,
    offerPrice: 15000,
    reserveAmount: 3000,
    features: [
      "28 Live Sessions",
      "Recorded Lessons",
      "Advanced Hands-on Learning",
      "Multiple Real-Time Projects",
      "Personal Expert Support",
      "Detailed Expert Review",
      "Doubt-Solving Support",
      "Advanced Interview Preparation",
      "Placement Assistance & Support",
      "Career Guidance",
      "6 Months LMS Access",
      "QR-Verified Certification"
    ],
    isActive: true
  }
];

type ProgramSeed = Omit<Program, "plans"> & { plans?: ProgramPlan[] };

const curriculumExpansionModules = [
  "Tool setup and workspace workflow",
  "Guided practice lab",
  "Industry case study",
  "Project planning and documentation",
  "Quality review and optimization",
  "Portfolio-ready capstone"
];

function ensureTenModuleCurriculum(title: string, curriculum: string[]) {
  const modules = [...curriculum];

  for (const module of curriculumExpansionModules) {
    if (modules.length >= 10) break;
    modules.push(`${title} ${module}`);
  }

  return modules.slice(0, 10);
}

function createProgram(program: ProgramSeed): Program {
  const content = (businessProgramContent as Record<string, ProgramContent>)[program.slug];
  const curriculumDetails = (programCurriculum as Record<string, ProgramContent["curriculum"]>)[program.slug];
  return {
    ...program,
    ...(content ? {
      content,
      title: content.title,
      shortDescription: content.shortDescription,
      overview: content.overview,
      skills: content.skills,
      projects: content.projects.map(project => project.title),
      tags: content.skills
    } : {}),
    curriculumDetails,
    curriculum: curriculumDetails ? curriculumDetails.map(module => module.title) : content ? content.curriculum.map(module => module.title) : ensureTenModuleCurriculum(program.title, program.curriculum),
    plans: (program.plans ?? defaultProgramPlans).map((plan) => ({ ...plan, features: [...plan.features] })),
    faqs: content ? commonFaqs.map(faq => faq.question === "Are projects included?" ? { ...faq, answer: "Yes. This program includes eight real-world projects with domain-specific features and tools." } : faq) : program.faqs.length ? program.faqs : commonFaqs
  };
}

const csPrograms = [
  createProgram({
    slug: "generative-ai",
    title: "Generative AI",
    domain: "Computer Science & IT",
    shortDescription: "Build AI copilots, prompt systems, RAG apps, and automation workflows.",
    overview: "A practical AI program for learners who want to create business-ready generative AI products using prompts, APIs, vector search, and evaluation workflows.",
    audience: ["Students starting AI careers", "Developers moving into AI products", "Analysts and product teams building copilots"],
    skills: ["Prompt engineering", "RAG architecture", "Vector databases", "AI agents", "API integration", "Evaluation and safety"],
    curriculum: ["AI foundations", "Prompt design", "Embeddings and retrieval", "RAG applications", "Agent workflows", "Deployment and monitoring"],
    duration: "10 weeks",
    mode: "Live expert-led online classes with project labs",
    expert: "AI product expert with applied GenAI project experience",
    projects: ["Resume screening assistant", "Customer support chatbot", "Document Q&A knowledge base", "AI content workflow", "Sales email copilot", "Policy search assistant"],
    certification: "Generative AI Project Certification",
    outcomes: ["AI developer intern", "Prompt engineer", "Junior AI product builder", "Automation analyst"],
    interviewPrep: ["AI fundamentals Q&A", "Portfolio walkthrough", "System design for RAG", "Mock technical interview"],
    pricing: "Career track from INR 19,999",
    faqs: [],
    tags: ["AI", "RAG", "Copilot", "Automation"],
    level: "Intermediate"
  }),
  createProgram({
    slug: "full-stack-web-development",
    title: "Full Stack Web Development",
    domain: "Computer Science & IT",
    shortDescription: "React, APIs, databases, auth, deployment, and production-style projects.",
    overview: "A complete web development track focused on building modern applications with frontend, backend, database, authentication, and deployment skills.",
    audience: ["Freshers targeting software jobs", "Students building portfolio projects", "Developers switching to full stack"],
    skills: ["React", "TypeScript", "REST APIs", "ASP.NET Core", "PostgreSQL", "Authentication", "Deployment"],
    curriculum: ["HTML/CSS fundamentals", "React components", "API design", "Database modeling", "Auth and roles", "Cloud deployment"],
    duration: "14 weeks",
    mode: "Hybrid live sessions, code labs, and expert reviews",
    expert: "Senior full stack engineer and project reviewer",
    projects: ["LMS dashboard", "E-commerce checkout flow", "Job portal", "CRM lead tracker", "Blog CMS", "Authentication system"],
    certification: "Full Stack Web Development Certification",
    outcomes: ["Frontend developer", "Backend developer", "Full stack developer", "Web application intern"],
    interviewPrep: ["DSA basics", "React interview set", "API and database Q&A", "GitHub portfolio review"],
    pricing: "Career track from INR 24,999",
    faqs: [],
    tags: ["React", "API", "Database", "Web"],
    level: "Beginner to Intermediate"
  }),
  createProgram({
    slug: "machine-learning",
    title: "Machine Learning",
    domain: "Computer Science & IT",
    shortDescription: "Learn ML models, evaluation, feature engineering, and applied prediction systems.",
    overview: "A hands-on machine learning program covering statistical foundations, supervised and unsupervised models, feature engineering, and deployment-ready workflows.",
    audience: ["Engineering students", "Python learners", "Analytics professionals", "AI career starters"],
    skills: ["Python", "Pandas", "Scikit-learn", "Feature engineering", "Model metrics", "Experiment tracking"],
    curriculum: ["Python for ML", "Data preprocessing", "Regression and classification", "Clustering", "Model selection", "ML project deployment"],
    duration: "12 weeks",
    mode: "Online expert-led with notebook labs",
    expert: "Machine learning practitioner with analytics delivery experience",
    projects: ["House price prediction", "Loan approval model", "Customer churn prediction", "Movie recommendation engine", "Fraud pattern detection", "Demand forecasting"],
    certification: "Machine Learning Certification",
    outcomes: ["ML intern", "Data science trainee", "AI analyst", "Junior ML engineer"],
    interviewPrep: ["ML algorithm Q&A", "Python coding rounds", "Project explanation practice", "Case study preparation"],
    pricing: "Career track from INR 21,999",
    faqs: [],
    tags: ["Python", "ML", "Prediction", "Models"],
    level: "Intermediate"
  }),
  createProgram({
    slug: "cyber-security-ethical-hacking",
    title: "Cyber Security / Ethical Hacking",
    domain: "Computer Science & IT",
    shortDescription: "Security foundations, vulnerability testing, network defense, and reporting.",
    overview: "A defensive and ethical cyber security program focused on safe lab practice, vulnerability discovery, reporting, and security operations fundamentals.",
    audience: ["Cyber security beginners", "Networking students", "IT support professionals", "Ethical hacking aspirants"],
    skills: ["Networking", "Linux", "Web security", "Vulnerability scanning", "OWASP", "Incident reporting"],
    curriculum: ["Security basics", "Network scanning", "Linux security", "Web app testing", "OWASP Top 10", "SOC workflows"],
    duration: "12 weeks",
    mode: "Live lab-led online training",
    expert: "Cyber security expert with ethical testing experience",
    projects: ["Web vulnerability report", "Network scan report", "Phishing awareness simulation", "Log analysis case study", "Password policy audit", "Secure API checklist"],
    certification: "Cyber Security Foundations Certification",
    outcomes: ["Security analyst intern", "SOC trainee", "Cyber security associate", "IT security support"],
    interviewPrep: ["Networking Q&A", "OWASP questions", "Scenario interviews", "Report presentation"],
    pricing: "Career track from INR 22,999",
    faqs: [],
    tags: ["Security", "OWASP", "SOC", "Linux"],
    level: "Beginner to Intermediate"
  }),
  createProgram({
    slug: "data-analytics",
    title: "Data Analytics",
    domain: "Computer Science & IT",
    shortDescription: "Excel, SQL, dashboards, business metrics, and insight storytelling.",
    overview: "A job-focused analytics program for learners who want to turn raw data into dashboards, insights, and business decisions.",
    audience: ["Fresh graduates", "Business teams", "Excel users moving to analytics", "Career switchers"],
    skills: ["Excel", "SQL", "Power BI", "Data cleaning", "Dashboard design", "Business storytelling"],
    curriculum: ["Spreadsheet analytics", "SQL queries", "Data cleaning", "Power BI dashboards", "KPI design", "Business case reporting"],
    duration: "8 weeks",
    mode: "Online classes with dashboard practice",
    expert: "Data analytics expert with reporting and BI experience",
    projects: ["Sales dashboard", "HR attrition dashboard", "Retail revenue analysis", "Finance expense tracker", "Customer segmentation report", "Marketing campaign dashboard"],
    certification: "Data Analytics Certification",
    outcomes: ["Data analyst intern", "BI trainee", "MIS executive", "Reporting analyst"],
    interviewPrep: ["SQL interview practice", "Dashboard portfolio review", "Analytics case questions", "Excel and BI rounds"],
    pricing: "Career track from INR 14,999",
    faqs: [],
    tags: ["SQL", "Power BI", "Excel", "Dashboards"],
    level: "Beginner"
  }),
  createProgram({
    slug: "data-science",
    title: "Data Science",
    domain: "Computer Science & IT",
    shortDescription: "Python, statistics, ML, dashboards, Project reviews, and career projects.",
    overview: "An industry-focused data science track covering analytics, statistics, machine learning, project delivery, and interview preparation.",
    audience: ["Students targeting data roles", "Analytics learners", "Python beginners", "Professionals moving into AI/data"],
    skills: ["Python", "Statistics", "SQL", "Machine learning", "Visualization", "Model evaluation", "Storytelling"],
    curriculum: ["Python and data wrangling", "Statistics", "SQL for analysis", "Visualization", "Machine learning", "Capstone delivery"],
    duration: "16 weeks",
    mode: "Expert-led online program with project studio",
    expert: "Data science expert with applied ML and analytics experience",
    projects: ["Customer churn prediction", "Sales forecasting model", "Credit risk analysis", "Healthcare appointment no-show prediction", "Retail basket analysis", "HR attrition prediction"],
    certification: "Data Science Career Certification",
    outcomes: ["Data analyst", "Data science intern", "ML trainee", "Business intelligence analyst"],
    interviewPrep: ["Statistics Q&A", "Python coding practice", "SQL interview rounds", "Project storytelling"],
    pricing: "Career track from INR 29,999",
    faqs: [],
    tags: ["Python", "ML", "SQL", "Statistics"],
    level: "Beginner to Intermediate"
  }),
  createProgram({
    slug: "cloud-computing",
    title: "Cloud Computing",
    domain: "Computer Science & IT",
    shortDescription: "Cloud foundations, deployment, storage, networking, and monitoring.",
    overview: "A practical cloud program focused on deployment models, compute, storage, networking, security basics, and cloud-ready project workflows.",
    audience: ["IT students", "Developers learning deployment", "Support engineers", "Cloud career starters"],
    skills: ["Cloud architecture", "Compute services", "Storage", "Networking", "IAM basics", "Monitoring"],
    curriculum: ["Cloud fundamentals", "Virtual machines", "Storage and databases", "Networking", "Security and IAM", "Deployment operations"],
    duration: "10 weeks",
    mode: "Online cloud labs with expert support",
    expert: "Cloud engineer expert with deployment experience",
    projects: ["Static website hosting", "API deployment", "Cloud database setup", "Monitoring dashboard", "Backup strategy plan", "Secure network design"],
    certification: "Cloud Computing Certification",
    outcomes: ["Cloud support associate", "Junior cloud engineer", "DevOps trainee", "Deployment engineer intern"],
    interviewPrep: ["Cloud concepts", "Architecture questions", "Cost and security cases", "Scenario mock interviews"],
    pricing: "Career track from INR 18,999",
    faqs: [],
    tags: ["Cloud", "Deploy", "IAM", "Monitoring"],
    level: "Beginner"
  }),
  createProgram({
    slug: "devops",
    title: "DevOps",
    domain: "Computer Science & IT",
    shortDescription: "CI/CD, containers, automation, monitoring, and release workflows.",
    overview: "A DevOps career program built around automation, source control, containerization, CI/CD pipelines, infrastructure basics, and production monitoring.",
    audience: ["Developers", "Cloud learners", "System admins", "Release engineering aspirants"],
    skills: ["Git", "Linux", "Docker", "CI/CD", "Scripting", "Monitoring", "Release management"],
    curriculum: ["Linux and Git", "Shell scripting", "Docker", "CI/CD pipelines", "Infrastructure basics", "Observability"],
    duration: "12 weeks",
    mode: "Live online labs and pipeline practice",
    expert: "DevOps engineer expert with release automation experience",
    projects: ["CI/CD pipeline for web app", "Dockerized API", "Monitoring dashboard", "Blue-green deployment plan", "Infrastructure checklist", "Automated backup job"],
    certification: "DevOps Engineering Certification",
    outcomes: ["DevOps trainee", "Cloud operations intern", "Release engineer", "Site reliability trainee"],
    interviewPrep: ["Linux Q&A", "Docker questions", "CI/CD scenarios", "Troubleshooting interviews"],
    pricing: "Career track from INR 23,999",
    faqs: [],
    tags: ["Docker", "CI/CD", "Linux", "Automation"],
    level: "Intermediate"
  })
];

const electricalPrograms = [
  createProgram({
    slug: "embedded-systems",
    title: "Embedded Systems",
    domain: "Electrical & Electronics",
    shortDescription: "Microcontrollers, sensors, firmware, protocols, and hardware projects.",
    overview: "A practical embedded systems program covering microcontroller programming, sensor interfacing, communication protocols, and product-style firmware projects.",
    audience: ["ECE/EEE students", "IoT learners", "Hardware project builders", "Firmware career starters"],
    skills: ["C programming", "Microcontrollers", "UART/SPI/I2C", "Sensor interfacing", "Debugging", "IoT basics"],
    curriculum: ["Embedded C", "Microcontroller architecture", "GPIO and timers", "Communication protocols", "Sensors", "IoT project integration"],
    duration: "12 weeks",
    mode: "Lab-focused online and kit-based practice",
    expert: "Embedded engineer expert with firmware project experience",
    projects: ["Smart energy meter prototype", "IoT weather station", "Line follower robot", "Sensor data logger", "Home automation controller", "Motor speed control"],
    certification: "Embedded Systems Certification",
    outcomes: ["Embedded intern", "Firmware trainee", "IoT project associate", "Hardware test trainee"],
    interviewPrep: ["Embedded C questions", "Protocol Q&A", "Hardware debugging cases", "Project explanation"],
    pricing: "Career track from INR 20,999",
    faqs: [],
    tags: ["Firmware", "IoT", "Sensors", "Microcontroller"],
    level: "Intermediate"
  }),
  createProgram({
    slug: "vlsi",
    title: "VLSI",
    domain: "Electrical & Electronics",
    shortDescription: "Digital design, verification, timing basics, and semiconductor workflows.",
    overview: "A VLSI-focused program for electronics learners who want digital design foundations, verification practice, and interview-ready semiconductor skills.",
    audience: ["ECE students", "Semiconductor aspirants", "Digital design learners", "Core engineering freshers"],
    skills: ["Digital logic", "Verilog basics", "Verification concepts", "Timing analysis", "Testbench writing", "EDA workflow"],
    curriculum: ["Digital fundamentals", "HDL basics", "Combinational design", "Sequential design", "Verification", "Timing and synthesis overview"],
    duration: "14 weeks",
    mode: "Online expert-led classes with design labs",
    expert: "VLSI expert with digital design and verification experience",
    projects: ["ALU design", "FIFO design", "UART transmitter", "Traffic light controller", "Memory controller testbench", "Simple RISC block"],
    certification: "VLSI Design Foundations Certification",
    outcomes: ["VLSI trainee", "Verification intern", "Semiconductor fresher", "Digital design trainee"],
    interviewPrep: ["Digital design Q&A", "Verilog interview set", "Timing basics", "Project walkthrough"],
    pricing: "Career track from INR 26,999",
    faqs: [],
    tags: ["Verilog", "Digital", "Verification", "Semiconductor"],
    level: "Intermediate"
  })
];

const mechanicalPrograms = [
  createProgram({
    slug: "solidworks",
    title: "SolidWorks / Creo",
    domain: "Mechanical & Civil",
    shortDescription: "3D modeling, assemblies, drawings, design validation, and portfolio work across SolidWorks and Creo.",
    overview: "A combined CAD program focused on building accurate parts, assemblies, drawings, and design-ready mechanical portfolios using SolidWorks and Creo workflows.",
    audience: ["Mechanical students", "Design interns", "Diploma learners", "Product design beginners"],
    skills: ["Part modeling", "Assemblies", "2D drawings", "Sheet metal basics", "Design intent", "Rendering", "Parametric modeling"],
    curriculum: ["Sketching", "Part features", "Assemblies", "Drawings", "Sheet metal", "Parametric modeling", "Design project"],
    duration: "8 weeks",
    mode: "Software lab sessions with expert review",
    expert: "Mechanical design expert with CAD portfolio experience",
    projects: ["Gearbox assembly", "Sheet metal enclosure", "Bottle jack model", "Conveyor roller assembly", "Bracket design", "Product casing render"],
    certification: "SolidWorks / Creo Design Certification",
    outcomes: ["CAD designer trainee", "Mechanical design intern", "Product design assistant", "Drafting associate"],
    interviewPrep: ["CAD command practice", "Drawing interpretation", "Portfolio explanation", "Design intent questions"],
    pricing: "Career track from INR 12,999",
    faqs: [],
    tags: ["SolidWorks", "Creo", "CAD", "Mechanical", "3D"],
    level: "Beginner"
  }),
  createProgram({
    slug: "autocad",
    title: "AutoCAD",
    domain: "Mechanical & Civil",
    shortDescription: "2D drafting, layouts, dimensions, plotting, and drawing standards.",
    overview: "A practical AutoCAD program for learners who need accurate drafting, layout creation, dimensioning, and professional drawing documentation.",
    audience: ["Civil students", "Mechanical students", "Drafting beginners", "Site planning trainees"],
    skills: ["2D drafting", "Layers", "Dimensioning", "Layouts", "Blocks", "Plotting"],
    curriculum: ["Drawing tools", "Modify tools", "Layers and blocks", "Annotations", "Layouts", "Project drawing"],
    duration: "6 weeks",
    mode: "Online drafting labs and drawing reviews",
    expert: "CAD drafting expert with industry drawing experience",
    projects: ["Residential floor plan", "Mechanical bracket drawing", "Electrical panel layout", "Site layout draft", "Manufacturing drawing sheet", "Office interior plan"],
    certification: "AutoCAD Drafting Certification",
    outcomes: ["CAD drafter", "Civil drafting intern", "Mechanical drafting trainee", "Design office assistant"],
    interviewPrep: ["Drawing commands", "Layer standards", "Plan reading", "Portfolio discussion"],
    pricing: "Career track from INR 9,999",
    faqs: [],
    tags: ["AutoCAD", "Drafting", "Civil", "Mechanical"],
    level: "Beginner"
  }),
  createProgram({
    slug: "hev-management",
    title: "HEV Management",
    domain: "Mechanical & Civil",
    shortDescription: "Hybrid electric vehicle systems, batteries, controls, and project analysis.",
    overview: "A hybrid electric vehicle program introducing EV/HEV architecture, battery systems, powertrain components, and system-level analysis.",
    audience: ["Mechanical students", "Automobile learners", "EV enthusiasts", "Mobility career starters"],
    skills: ["EV/HEV architecture", "Battery basics", "Motor systems", "Power electronics awareness", "Energy management", "Diagnostics"],
    curriculum: ["EV and HEV fundamentals", "Battery systems", "Motor and controller basics", "Regenerative braking", "Thermal management", "Vehicle project study"],
    duration: "10 weeks",
    mode: "Online technical sessions with case-based projects",
    expert: "Automotive systems expert with EV project exposure",
    projects: ["HEV architecture comparison", "Battery pack sizing study", "Regenerative braking model", "Thermal management case", "Charging strategy analysis", "Vehicle energy dashboard"],
    certification: "HEV Management Certification",
    outcomes: ["EV trainee", "Automotive systems intern", "Battery analysis trainee", "Mobility project associate"],
    interviewPrep: ["EV fundamentals", "Battery Q&A", "System design cases", "Automotive project walkthrough"],
    pricing: "Career track from INR 17,999",
    faqs: [],
    tags: ["EV", "HEV", "Battery", "Automotive"],
    level: "Beginner to Intermediate"
  })
];

const managementPrograms = [
  createProgram({
    slug: "finance",
    title: "Finance",
    domain: "Management",
    shortDescription: "Financial analysis, budgeting, valuation basics, and reporting.",
    overview: "A finance program for learners who want practical business finance, analysis, planning, valuation basics, and dashboard-based reporting skills.",
    audience: ["Commerce students", "MBA learners", "Business analysts", "Finance career starters"],
    skills: ["Financial statements", "Budgeting", "Ratio analysis", "Excel modeling", "Valuation basics", "Reporting"],
    curriculum: ["Accounting basics", "Financial statements", "Budgeting", "Ratio analysis", "Valuation intro", "Finance dashboard"],
    duration: "8 weeks",
    mode: "Online classes with spreadsheet labs",
    expert: "Finance expert with business analysis experience",
    projects: ["Company financial analysis", "Budget planning model", "Cash flow dashboard", "Startup valuation sheet", "Expense optimization report", "Investment comparison model"],
    certification: "Finance Analytics Certification",
    outcomes: ["Finance analyst intern", "Accounts analyst trainee", "Business finance associate", "MIS finance analyst"],
    interviewPrep: ["Finance fundamentals", "Excel rounds", "Case interviews", "Portfolio walkthrough"],
    pricing: "Career track from INR 13,999",
    faqs: [],
    tags: ["Finance", "Excel", "Analysis", "Valuation"],
    level: "Beginner"
  }),
  createProgram({
    slug: "stock-market",
    title: "Stock Market",
    domain: "Management",
    shortDescription: "Market basics, technical analysis, risk, portfolio logic, and research.",
    overview: "A stock market learning track focused on market structure, analysis methods, risk management, and disciplined research workflows.",
    audience: ["Students learning markets", "Finance beginners", "Traders building discipline", "Investment research aspirants"],
    skills: ["Market basics", "Technical analysis", "Fundamental analysis", "Risk management", "Portfolio tracking", "Research writing"],
    curriculum: ["Market foundations", "Charts and indicators", "Fundamental research", "Risk and psychology", "Portfolio basics", "Research project"],
    duration: "6 weeks",
    mode: "Online sessions with market case studies",
    expert: "Market expert with research and risk management experience",
    projects: ["Stock research report", "Technical chart journal", "Portfolio tracker", "Risk management plan", "Sector comparison dashboard", "Earnings summary note"],
    certification: "Stock Market Foundations Certification",
    outcomes: ["Research intern", "Market analyst trainee", "Finance content analyst", "Portfolio operations trainee"],
    interviewPrep: ["Market basics Q&A", "Research presentation", "Risk scenarios", "Finance interview prep"],
    pricing: "Career track from INR 9,999",
    faqs: [],
    tags: ["Markets", "Research", "Risk", "Portfolio"],
    level: "Beginner"
  }),
  createProgram({
    slug: "digital-marketing",
    title: "Digital Marketing",
    domain: "Management",
    shortDescription: "SEO, ads, social campaigns, content strategy, analytics, and growth.",
    overview: "A practical digital marketing program covering campaign planning, SEO, paid ads, social media, analytics, content, and growth experiments.",
    audience: ["Marketing beginners", "Business owners", "Students targeting growth roles", "Content creators"],
    skills: ["SEO", "Social media", "Performance ads", "Content planning", "Analytics", "Landing page optimization"],
    curriculum: ["Marketing foundations", "SEO", "Social media campaigns", "Paid ads", "Analytics", "Growth project"],
    duration: "8 weeks",
    mode: "Live online classes with campaign labs",
    expert: "Growth marketing expert with campaign delivery experience",
    projects: ["SEO audit", "Instagram campaign plan", "Google ads structure", "Lead generation landing page", "Analytics report", "Content calendar"],
    certification: "Digital Marketing Certification",
    outcomes: ["Digital marketing intern", "SEO trainee", "Social media executive", "Growth marketing associate"],
    interviewPrep: ["Marketing funnel Q&A", "Campaign case studies", "Analytics questions", "Portfolio presentation"],
    pricing: "Career track from INR 14,999",
    faqs: [],
    tags: ["SEO", "Ads", "Social", "Growth"],
    level: "Beginner"
  }),
  createProgram({
    slug: "business-analytics",
    title: "Business Analytics",
    domain: "Management",
    shortDescription: "Business metrics, dashboards, SQL, Excel, cases, and decision support.",
    overview: "A business analytics program focused on practical decision support using business metrics, data analysis, dashboards, and case-based problem solving.",
    audience: ["MBA students", "Operations learners", "Analyst aspirants", "Business teams"],
    skills: ["Business metrics", "Excel", "SQL basics", "Dashboarding", "Case analysis", "Presentation"],
    curriculum: ["Business problem framing", "Excel analytics", "SQL basics", "Dashboard design", "Forecasting basics", "Case project"],
    duration: "10 weeks",
    mode: "Online expert-led with business cases",
    expert: "Business analytics expert with BI and operations experience",
    projects: ["Sales performance dashboard", "Customer cohort analysis", "Inventory optimization case", "Revenue forecast", "Marketing ROI report", "Operations KPI scorecard"],
    certification: "Business Analytics Certification",
    outcomes: ["Business analyst intern", "Operations analyst trainee", "BI associate", "Strategy analyst trainee"],
    interviewPrep: ["Case interviews", "Metric questions", "Dashboard walkthrough", "Business communication practice"],
    pricing: "Career track from INR 16,999",
    faqs: [],
    tags: ["Analytics", "Business", "Dashboards", "SQL"],
    level: "Beginner"
  }),
  createProgram({
    slug: "international-business-management",
    title: "IBM",
    domain: "Management",
    shortDescription: "International business management, trade basics, strategy, and operations.",
    overview: "An International Business Management program for learners who want global business fundamentals, trade workflows, market entry, and operations awareness.",
    audience: ["MBA students", "Commerce learners", "Export-import beginners", "Business management aspirants"],
    skills: ["Global business", "Trade documentation", "Market entry", "Operations", "Strategy", "Business communication"],
    curriculum: ["International business basics", "Trade and documentation", "Global marketing", "Market entry strategy", "Operations", "Business project"],
    duration: "8 weeks",
    mode: "Online classes with business case projects",
    expert: "Business management expert with international operations exposure",
    projects: ["Market entry plan", "Export documentation checklist", "Country risk report", "Global competitor analysis", "Supply chain case study", "International pricing plan"],
    certification: "International Business Management Certification",
    outcomes: ["Business development intern", "Operations trainee", "Export documentation assistant", "Management trainee"],
    interviewPrep: ["Business communication", "Case questions", "Trade basics Q&A", "Presentation practice"],
    pricing: "Career track from INR 12,999",
    faqs: [],
    tags: ["IBM", "Global", "Trade", "Business"],
    level: "Beginner"
  }),
  createProgram({
    slug: "hrm",
    title: "HRM",
    domain: "Management",
    shortDescription: "Recruitment, payroll basics, employee lifecycle, HR analytics, and policy.",
    overview: "A Human Resource Management program focused on recruitment workflows, employee lifecycle, HR operations, policy basics, and HR analytics.",
    audience: ["MBA HR students", "Commerce graduates", "Recruitment beginners", "HR operations aspirants"],
    skills: ["Recruitment", "HR operations", "Payroll basics", "Policy awareness", "Employee engagement", "HR analytics"],
    curriculum: ["HR fundamentals", "Recruitment lifecycle", "Onboarding", "Payroll and compliance basics", "Employee engagement", "HR analytics project"],
    duration: "8 weeks",
    mode: "Online expert-led with HR case practice",
    expert: "HR expert with recruitment and people operations experience",
    projects: ["Recruitment funnel dashboard", "Onboarding checklist", "Employee engagement survey", "Payroll data tracker", "Policy comparison note", "Attrition analysis report"],
    certification: "HRM Career Certification",
    outcomes: ["HR intern", "Recruiter trainee", "HR operations assistant", "Talent acquisition associate"],
    interviewPrep: ["HR scenario questions", "Recruitment role play", "Communication practice", "Policy Q&A"],
    pricing: "Career track from INR 11,999",
    faqs: [],
    tags: ["HR", "Recruitment", "Operations", "Analytics"],
    level: "Beginner"
  })
];

const uiUxPrograms = [
  createProgram({
    slug: "ui-ux-design",
    title: "UI/UX Design",
    domain: "Computer Science & IT",
    shortDescription: "User research, wireframes, visual design, prototypes, testing, and portfolio case studies.",
    overview: "A practical UI/UX program for learners who want to design clean digital products, understand users, build interactive prototypes, and present job-ready case studies.",
    audience: ["Design beginners", "Frontend learners moving into product design", "Students building a UX portfolio", "Career switchers targeting UI/UX roles"],
    skills: ["User research", "Information architecture", "Wireframing", "Figma", "Prototyping", "Usability testing", "Design systems"],
    curriculum: [
      "UI/UX foundations",
      "User research and personas",
      "Information architecture",
      "Wireframing and user flows",
      "Visual design principles",
      "Figma components and variants",
      "Interactive prototyping",
      "Usability testing",
      "Design systems and handoff",
      "Portfolio case study"
    ],
    duration: "10 weeks",
    mode: "Live design studio sessions with recorded access and critique reviews",
    expert: "Product design expert with UX research, interface design, and portfolio review experience",
    projects: ["Mobile app onboarding redesign", "SaaS dashboard UX case study", "E-commerce checkout prototype", "Portfolio website design", "Design system starter kit", "Usability test report"],
    certification: "UI/UX Design QR-Verified Certification",
    outcomes: ["UI/UX designer intern", "Product design trainee", "UX research assistant", "Visual designer fresher"],
    interviewPrep: ["Portfolio storytelling", "Design challenge practice", "UX process Q&A", "Mock design interview"],
    pricing: "Launch from INR 4,000",
    faqs: [],
    tags: ["UX", "UI", "Figma", "Prototype"],
    level: "Beginner to Intermediate"
  })
];

const solidWorksCreoPrograms = [
  createProgram({
    slug: "solidworks-creo",
    title: "SolidWorks & Creo",
    domain: "SolidWorks & Creo",
    shortDescription: "Parametric CAD modeling, assemblies, drawings, surfaces, and mechanical design portfolio work.",
    overview: "A combined CAD track that helps mechanical learners build confidence in SolidWorks and Creo through part modeling, assemblies, drawing standards, and manufacturable design projects.",
    audience: ["Mechanical engineering students", "Diploma learners", "CAD beginners", "Design fresher candidates"],
    skills: ["SolidWorks", "Creo", "Parametric modeling", "Assemblies", "Manufacturing drawings", "Design intent", "Portfolio presentation"],
    curriculum: [
      "CAD fundamentals and interface setup",
      "Sketching constraints and design intent",
      "SolidWorks part modeling",
      "Creo parametric modeling",
      "Assembly constraints and mechanisms",
      "Engineering drawings and GD&T basics",
      "Sheet metal and surface modeling intro",
      "Design validation and revisions",
      "Manufacturing-ready documentation",
      "Mechanical CAD portfolio capstone"
    ],
    duration: "10 weeks",
    mode: "CAD lab training with live expert review and recorded practice access",
    expert: "Mechanical CAD expert with product modeling and drawing review experience",
    projects: ["Gearbox assembly", "Pump casing model", "Sheet metal enclosure", "Fixture design", "Consumer product housing", "Manufacturing drawing set"],
    certification: "SolidWorks & Creo QR-Verified Certification",
    outcomes: ["CAD designer trainee", "Mechanical design intern", "Drafting associate", "Product modeling assistant"],
    interviewPrep: ["CAD tool Q&A", "Drawing standards discussion", "Design intent explanation", "Portfolio walkthrough"],
    pricing: "Launch from INR 4,000",
    faqs: [],
    tags: ["SolidWorks", "Creo", "CAD", "Mechanical"],
    level: "Beginner to Intermediate"
  })
];

export const programCategories: ProgramCategory[] = [
  {
    domain: "Computer Science & IT",
    description: "Software, cloud, data, cyber security, and AI programs built around live projects.",
    programs: csPrograms
  },
  {
    domain: "Electrical & Electronics",
    description: "Core engineering paths for embedded systems, VLSI, and semiconductor readiness.",
    programs: electricalPrograms
  },
  {
    domain: "Mechanical & Civil",
    description: "CAD, mobility, drafting, and design programs for engineering portfolios.",
    programs: mechanicalPrograms
  },
  {
    domain: "UI/UX Design",
    description: "Research, wireframing, prototyping, usability testing, and design portfolio readiness.",
    programs: uiUxPrograms
  },
  {
    domain: "SolidWorks & Creo",
    description: "Combined CAD modeling, assembly, drawing, and mechanical design portfolio training.",
    programs: solidWorksCreoPrograms
  },
  {
    domain: "Management",
    description: "Business, finance, analytics, marketing, HR, and global management career tracks.",
    programs: managementPrograms
  }
];

export const allPrograms = programCategories.flatMap((category) => category.programs);

export function findProgramBySlug(slug: string | undefined) {
  return allPrograms.find((program) => program.slug === slug);
}

export const keyStatistics = [
  { value: "20+", label: "Career programs" },
  { value: "100+", label: "Real-time project ideas" },
  { value: "6", label: "Learning domains" },
  { value: "1:1", label: "Expert review loops" }
];

export const expertGuides = [
  { name: "AI and Data Experts", role: "Guide learners through ML, GenAI, analytics, and portfolio projects." },
  { name: "Software Engineers", role: "Review React, API, database, DevOps, and deployment work." },
  { name: "Core Engineering Experts", role: "Support VLSI, embedded, CAD, EV, and design practice." },
  { name: "Business Coaches", role: "Prepare learners for finance, HR, marketing, and analytics roles." }
];

export const recognitions = [
  "Project-first certification model",
  "Project-supported learning",
  "Industry-aligned curriculum",
  "Expert reviewed capstones"
];

export const poweredBy = [
  "React LMS",
  "ASP.NET Core API",
  "PostgreSQL",
  "Project reviews",
  "Expert rubrics",
  "Role based dashboards"
];

export const howItWorks = [
  { title: "Choose a program", text: "Search by domain, skill, or career goal and compare project outcomes." },
  { title: "Learn with experts", text: "Attend live sessions, complete projects, and get reviewed by experts." },
  { title: "Build real projects", text: "Create portfolio-ready work with clear rubrics and review checkpoints." },
  { title: "Get interview ready", text: "Practice resumes, mock interviews, project explanations, and role-specific Q&A." }
];

export const alumniCompanies = [
  "Amazon",
  "Deloitte",
  "EY",
  "IBM",
  "Tech Mahindra",
  "L&T",
  "Bosch",
  "Freshworks",
  "KPMG",
  "Paytm"
];

export const successOutcomes = [
  "Resume shortlisting support",
  "Mock interview feedback",
  "Project explanation practice",
  "LinkedIn and portfolio review",
  "Role-specific question banks",
  "Interview outcome tracking"
];

export const pricingPlans = [
  {
    name: "Launch",
    price: "INR 8,000",
    description: "For learners who want a strong, structured start with guided learning and essential support.",
    features: ["16 live sessions", "Real-time project", "Interview assistance", "6 months LMS access"]
  },
  {
    name: "Elevate",
    price: "INR 10,000",
    description: "For learners who want personal expert support, deeper project review, and placement readiness.",
    features: ["22 live sessions", "Personal expert support", "Expert guidance & review", "Placement support", "6 months LMS access"]
  },
  {
    name: "Mastery",
    price: "INR 15,000",
    description: "For learners who want advanced hands-on projects, detailed expert review, and full career guidance.",
    features: ["28 live sessions", "Multiple real-time projects", "Advanced interview prep", "Career guidance", "6 months LMS access"]
  }
];

export const homeFaqs = [
  {
    question: "Are programs online or offline?",
    answer: "Programs are designed for expert-led online delivery with project labs. Hybrid batches can be offered for partner institutions."
  },
  {
    question: "Can beginners join?",
    answer: "Yes. Many programs start from fundamentals and move toward career projects."
  },
  {
    question: "Do you provide interview preparation?",
    answer: "Yes. Career tracks include resume review, mock interviews, project explanation practice, and question banks."
  },
  {
    question: "Can I request a callback before enrolling?",
    answer: "Yes. Use the request callback form and the team can guide you to the right program."
  },
  {
  question: "What is the duration of each program?",
  answer: "Program duration varies by track and learning goals. Each program includes a structured schedule, hands-on projects, and guided learning."
},
{
  question: "Will I get hands-on project experience?",
  answer: "Yes. Programs include practical project labs that help learners apply concepts and build portfolio-ready projects."
},
{
  question: "Will I receive a certificate after completing the program?",
  answer: "Yes. Learners who successfully complete the required program activities and assessments receive a completion certificate."
},
{
  question: "Are live sessions recorded?",
  answer: "Yes. Recorded sessions can be made available to learners so they can revisit important concepts and catch up when needed."
},
{
  question: "How will I interact with instructors?",
  answer: "Learners can interact with instructors through live sessions, discussions, Q&A, and guided project support."
},
{
  question: "Do I need any prior technical experience?",
  answer: "Prerequisites depend on the program. Beginner-friendly tracks start with fundamentals, while advanced programs may require prior knowledge."
},
{
  question: "How do I enroll in a program?",
  answer: "Choose the program that matches your goals, submit your enrollment details, and the team will guide you through the next steps."
}
  
];

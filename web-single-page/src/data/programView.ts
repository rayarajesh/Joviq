import { defaultProgramPlans } from "./siteContent";
import type { Program, ProgramPlan } from "./siteContent";
import type { ProgramDetailsResponse } from "../features/lms/api/lmsTypes";

// Ported from /web ProgramDetailsPage: merges the static catalog with live API program data.

type DetailItem = { title: string; text: string };
export type CurriculumItem = DetailItem & { lessons: string[] };
export type ProjectItem = DetailItem & { artifacts: string[]; technologies?: string[] };

export type ProgramViewModel = {
  slug: string;
  title: string;
  domain: string;
  shortDescription: string;
  overview: string;
  audience: string[];
  skills: string[];
  curriculum: CurriculumItem[];
  duration: string;
  mode: string;
  guidance: string;
  projects: ProjectItem[];
  certification: string;
  outcomes: string[];
  interviewPrep: string[];
  plans: ProgramPlan[];
  faqs: { question: string; answer: string }[];
  level: string;
};

export function buildProgramViewModel(local: Program | undefined, remote: ProgramDetailsResponse | null): ProgramViewModel | null {
  if (!local && !remote) return null;

  const title = remote?.title ?? local?.title ?? "Career Program";
  const remoteCurriculum = remote?.curriculum.map((module) => ({
    title: module.title,
    text: module.description || `Build practical ${title} knowledge through guided lessons and checkpoints.`,
    lessons: module.lessons.map((lesson) => lesson.title)
  })) ?? [];
  const localCurriculum = (local?.curriculum ?? []).map((module) => ({
    title: module,
    text: `Learn the essential concepts, workflows, and practical decisions behind ${module.toLowerCase()}.`,
    lessons: ["Guided lesson", "Practice checkpoint", "Applied review"]
  }));
  const remoteProjects = remote?.projects.map((project) => ({ title: project.title, text: project.description, artifacts: project.requiredArtifacts })) ?? [];
  const localProjects = (local?.projects ?? []).map((project) => ({
    title: project,
    text: `Create a portfolio-ready ${project.toLowerCase()} with clear deliverables and expert feedback.`,
    artifacts: ["Project output", "Documentation", "Interview walkthrough"]
  }));
  const projects = local?.projectDetails ?? completeProjectExamples(remoteProjects.length ? remoteProjects : localProjects, title);
  const curriculum = completeCurriculum(
    remoteCurriculum.length
      ? remoteCurriculum
      : localCurriculum.length
        ? localCurriculum
        : createFallbackCurriculum(title),
    title
  );
  const remotePlans = remote?.plans.filter((plan) => plan.isActive).map((plan) => ({
    id: plan.id,
    name: plan.name,
    code: plan.code,
    actualPrice: plan.actualPrice,
    offerPrice: plan.offerPrice,
    reserveAmount: plan.reserveAmount,
    features: plan.features,
    isActive: plan.isActive
  })) ?? [];

  const view: ProgramViewModel = {
    slug: remote?.slug ?? local?.slug ?? "program",
    title,
    domain: remote?.categoryName ?? local?.domain ?? "Career Program",
    shortDescription: remote?.shortDescription ?? local?.shortDescription ?? "Practical learning, reviewed projects, and career preparation.",
    overview: remote?.overview ?? local?.overview ?? "Build practical capability through guided learning, projects, and review.",
    audience: local?.audience ?? ["Students building career skills", "Fresh graduates preparing for roles", "Working professionals changing domains"],
    skills: remote?.skills.length ? remote.skills : local?.skills.length ? local.skills : ["Core foundations", "Industry tools", "Applied problem solving", "Project delivery", "Quality review", "Interview communication"],
    curriculum: local?.curriculumDetails ?? curriculum,
    duration: local?.duration ?? remote?.duration ?? "2 months",
    mode: remote?.learningMode ?? local?.mode ?? "Live and recorded online learning",
    guidance: local?.expert ?? "Experienced domain experts provide project and interview review support.",
    projects,
    certification: remote?.certificationName ?? local?.certification ?? `Joviq ${title} Certification`,
    outcomes: remote?.outcomes.length ? remote.outcomes : local?.outcomes ?? [],
    interviewPrep: local?.interviewPrep ?? ["Resume and portfolio review", "Project explanation practice", "Technical mock interview", "HR interview preparation"],
    plans: remotePlans.length ? remotePlans : local?.plans ?? defaultProgramPlans,
    faqs: remote?.faqs.length ? remote.faqs : local?.faqs.length ? local.faqs : createFallbackFaqs(title),
    level: remote?.level ?? local?.level ?? "Beginner to job-ready"
  };
  // The PDF catalog owns these editorial fields; live enrollment plans still come from the API.
  if (local?.content) {
    const content = local.content;
    return { ...view, title: content.title, shortDescription: content.shortDescription,
      overview: content.overview, skills: content.skills, curriculum: local.curriculumDetails ?? content.curriculum,
      projects: local.projectDetails ?? content.projects, faqs: local.faqs };
  }
  return view;
}

function completeProjectExamples(projects: ProjectItem[], title: string) {
  const result = projects.slice(0, 6);
  const fallbackTitles = [
    `${title} workflow build`,
    `${title} industry case study`,
    `${title} automation challenge`,
    `${title} quality review`,
    `${title} delivery simulation`,
    `${title} portfolio capstone`
  ];

  for (const fallbackTitle of fallbackTitles) {
    if (result.length >= 6) break;
    if (result.some((project) => project.title.toLowerCase() === fallbackTitle.toLowerCase())) continue;
    result.push({
      title: fallbackTitle,
      text: `Solve a realistic ${title.toLowerCase()} brief and defend the choices made during implementation.`,
      artifacts: ["Working deliverable", "Decision log", "Portfolio walkthrough"]
    });
  }

  return result;
}

function completeCurriculum(curriculum: CurriculumItem[], title: string) {
  const result = curriculum.slice(0, 10);
  const fallbackModules = [
    "Foundations",
    "Tool setup",
    "Core workflows",
    "Guided lab practice",
    "Industry case study",
    "Real-time project build",
    "Review and optimization",
    "Documentation and handoff",
    "Interview preparation",
    "Capstone presentation"
  ];

  for (const fallbackModule of fallbackModules) {
    if (result.length >= 10) break;
    const moduleTitle = `${title} ${fallbackModule}`;
    if (result.some((module) => module.title.toLowerCase() === moduleTitle.toLowerCase())) continue;
    result.push({
      title: moduleTitle,
      text: `Build practical ${title.toLowerCase()} ability through focused content, tool practice, and reviewed output.`,
      lessons: createModuleLessons(title, fallbackModule)
    });
  }

  return result.map((module) => ({
    ...module,
    lessons: module.lessons.length >= 4 ? module.lessons.slice(0, 5) : createModuleLessons(title, module.title)
  }));
}

function createModuleLessons(title: string, module: string) {
  return [
    `${title} concepts`,
    `${module} tools and workflows`,
    "Guided practical exercise",
    "Industry use case review",
    "Feedback checkpoint"
  ];
}

function createFallbackCurriculum(title: string): CurriculumItem[] {
  return ["Foundations", "Tools and workflows", "Guided practice", "Applied delivery", "Quality and review", "Career capstone"].map((module) => ({
    title: `${title} ${module}`,
    text: `Build confidence in ${module.toLowerCase()} through guided lessons and practical checkpoints.`,
    lessons: createModuleLessons(title, module)
  }));
}

function createFallbackFaqs(title: string) {
  return [
    { question: `Do I need prior ${title} experience?`, answer: "No. The learning path begins with foundations and progresses into applied project work." },
    { question: "Are projects included?", answer: "Yes. The program includes six portfolio-oriented project examples with clear deliverables." },
    { question: "Will I receive a certificate?", answer: "Yes. Certification is issued after the required project work is completed." },
    { question: "Is interview preparation included?", answer: "Yes. Support varies by plan and can include portfolio review, mock interviews, and technical preparation." }
  ];
}

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Save,
  UploadCloud,
  UserRound,
  X
} from "lucide-react";
import { env } from "../config/env";
import { studentOnboardingApi } from "../features/student/api/studentOnboardingApi";
import type {
  StudentOnboardingResponse,
  UpdateAcademicDetailsRequest,
  UpdateCareerDetailsRequest,
  UpdatePersonalDetailsRequest
} from "../features/student/api/studentOnboardingTypes";
import { useAuth } from "../features/auth/context/useAuth";
import { formatApiError } from "../lib/api/httpClient";

type StepId = "personal" | "academic" | "career" | "resume";
type MessageState = { tone: "success" | "error"; text: string } | null;

type PersonalForm = UpdatePersonalDetailsRequest;
type AcademicForm = Omit<UpdateAcademicDetailsRequest, "graduationYear"> & { graduationYear: string };
type CareerForm = Omit<UpdateCareerDetailsRequest, "skills"> & { skillsText: string };

const steps: Array<{ id: StepId; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: "personal", label: "Personal", icon: UserRound },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "career", label: "Career", icon: BriefcaseBusiness },
  { id: "resume", label: "Resume", icon: FileText }
];

const stepMissingLabels: Record<StepId, string[]> = {
  personal: ["Date of birth", "Address", "City", "State"],
  academic: ["College", "Degree", "Branch", "Graduation year", "CGPA/Percentage"],
  career: ["Target job role", "Skills", "LinkedIn", "GitHub", "Portfolio"],
  resume: ["Resume"]
};

const initialPersonal: PersonalForm = {
  dateOfBirth: "",
  address: "",
  city: "",
  state: ""
};

const initialAcademic: AcademicForm = {
  college: "",
  degree: "",
  branch: "",
  graduationYear: "",
  cgpaOrPercentage: ""
};

const initialCareer: CareerForm = {
  targetJobRole: "",
  skillsText: "",
  linkedInUrl: "",
  gitHubUrl: "",
  portfolioUrl: ""
};

export function StudentOnboardingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentOnboardingResponse | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>("personal");
  const [personal, setPersonal] = useState<PersonalForm>(initialPersonal);
  const [academic, setAcademic] = useState<AcademicForm>(initialAcademic);
  const [career, setCareer] = useState<CareerForm>(initialCareer);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStep, setSavingStep] = useState<StepId | "complete" | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  const isStudent = auth.user?.roles.includes("Student") ?? false;

  const hydrateProfile = useCallback((nextProfile: StudentOnboardingResponse) => {
    setProfile(nextProfile);
    setPersonal({
      dateOfBirth: nextProfile.personal.dateOfBirth ?? "",
      address: nextProfile.personal.address ?? "",
      city: nextProfile.personal.city ?? "",
      state: nextProfile.personal.state ?? ""
    });
    setAcademic({
      college: nextProfile.academic.college ?? "",
      degree: nextProfile.academic.degree ?? "",
      branch: nextProfile.academic.branch ?? "",
      graduationYear: nextProfile.academic.graduationYear ? String(nextProfile.academic.graduationYear) : "",
      cgpaOrPercentage: nextProfile.academic.cgpaOrPercentage ?? ""
    });
    setCareer({
      targetJobRole: nextProfile.career.targetJobRole ?? "",
      skillsText: nextProfile.career.skills.join(", "),
      linkedInUrl: nextProfile.career.linkedInUrl ?? "",
      gitHubUrl: nextProfile.career.gitHubUrl ?? "",
      portfolioUrl: nextProfile.career.portfolioUrl ?? ""
    });

    const firstIncomplete = steps.find((step) =>
      stepMissingLabels[step.id].some((field) => nextProfile.missingFields.includes(field))
    );
    setActiveStep(firstIncomplete?.id ?? "resume");
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await studentOnboardingApi.get();
      hydrateProfile(response.data);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, [hydrateProfile]);

  useEffect(() => {
    if (isStudent) {
      void loadProfile();
    }
  }, [isStudent, loadProfile]);

  const visibleSkills = useMemo(
    () =>
      career.skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 8),
    [career.skillsText]
  );

  if (auth.user && !isStudent) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <main className="onboarding-page onboarding-page--loading">
        <Loader2 className="spin" size={30} />
        <span>Loading your student profile...</span>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="onboarding-page onboarding-page--loading">
        <section className="onboarding-empty-state">
          <Rocket size={30} />
          <h1>Profile could not be loaded.</h1>
          {message ? <p>{message.text}</p> : null}
          <button className="primary-action" type="button" onClick={loadProfile}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  async function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingStep("personal");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.updatePersonal(personal);
      hydrateProfile(response.data);
      setActiveStep("academic");
      setMessage({ tone: "success", text: "Personal details saved." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function saveAcademic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingStep("academic");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.updateAcademic({
        ...academic,
        graduationYear: Number(academic.graduationYear)
      });
      hydrateProfile(response.data);
      setActiveStep("career");
      setMessage({ tone: "success", text: "Academic details saved." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function saveCareer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingStep("career");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.updateCareer({
        targetJobRole: career.targetJobRole,
        skills: career.skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        linkedInUrl: career.linkedInUrl,
        gitHubUrl: career.gitHubUrl,
        portfolioUrl: career.portfolioUrl
      });
      hydrateProfile(response.data);
      setActiveStep("resume");
      setMessage({ tone: "success", text: "Career details saved." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function uploadResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeFile) {
      setMessage({ tone: "error", text: "Choose a PDF, DOC, or DOCX resume before uploading." });
      return;
    }

    setSavingStep("resume");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.uploadResume(resumeFile);
      hydrateProfile(response.data);
      setResumeFile(null);
      setMessage({ tone: "success", text: "Resume uploaded." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function deleteResume() {
    setSavingStep("resume");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.deleteResume();
      hydrateProfile(response.data);
      setMessage({ tone: "success", text: "Resume removed." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function completeOnboarding() {
    if (profile?.missingFields.length) {
      const firstIncomplete = steps.find((step) =>
        stepMissingLabels[step.id].some((field) => profile.missingFields.includes(field))
      );
      setActiveStep(firstIncomplete?.id ?? "personal");
      setMessage({ tone: "error", text: `Complete missing fields: ${profile.missingFields.join(", ")}.` });
      return;
    }

    setSavingStep("complete");
    setMessage(null);

    try {
      await studentOnboardingApi.complete();
      await auth.loadMe();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  const completion = profile.completionPercentage;
  const accountName = profile.fullName;

  return (
    <main className="onboarding-page">
      <section className="onboarding-hero">
        <div className="onboarding-hero__content">
          <Link className="onboarding-back-link" to="/">
            Joviq Technologies
          </Link>
          <span className="eyebrow">Student onboarding</span>
          <h1>Complete your student profile.</h1>
          <p>
            Keep registration simple, then collect academic, career, and resume details before opening the
            full student workspace.
          </p>
        </div>

        <aside className="onboarding-progress-panel" aria-label="Profile progress">
          <div className="onboarding-progress-ring" style={{ "--progress": `${completion}%` } as CSSProperties}>
            <span>{completion}%</span>
          </div>
          <div>
            <strong>{profile?.onboardingStatus ?? "Not started"}</strong>
            <p>{profile.missingFields.length ? `${profile.missingFields.length} fields remaining` : "Ready for dashboard"}</p>
          </div>
        </aside>
      </section>

      <section className="onboarding-shell">
        <aside className="onboarding-side">
          <div className="onboarding-account-card">
            <div className="onboarding-avatar" aria-hidden="true">
              {accountName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="eyebrow">Basic registration</span>
              <h2>{accountName}</h2>
            </div>
            <AccountLine icon={Mail} label={profile.email} />
            <AccountLine icon={Phone} label={profile.phoneNumber ?? "Phone not verified"} />
            <AccountLine icon={LockKeyhole} label="Name, email, and phone are already captured." />
          </div>

          <nav className="onboarding-stepper" aria-label="Onboarding steps">
            {steps.map((step) => {
              const Icon = step.icon;
              const missingCount = profile?.missingFields.filter((field) => stepMissingLabels[step.id].includes(field)).length ?? 0;

              return (
                <button
                  className={activeStep === step.id ? "is-active" : ""}
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                >
                  <Icon size={18} />
                  <span>{step.label}</span>
                  {missingCount === 0 ? <CheckCircle2 className="onboarding-stepper__check" size={17} /> : <small>{missingCount}</small>}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="onboarding-workspace">
          {message ? <div className={`onboarding-message onboarding-message--${message.tone}`}>{message.text}</div> : null}

          {activeStep === "personal" ? (
            <form className="onboarding-form" onSubmit={savePersonal}>
              <FormHeader icon={UserRound} eyebrow="Personal" title="Where should mentors understand you from?" />
              <div className="onboarding-grid onboarding-grid--two">
                <label>
                  Date of Birth
                  <input
                    required
                    type="date"
                    value={personal.dateOfBirth}
                    onChange={(event) => setPersonal((current) => ({ ...current, dateOfBirth: event.target.value }))}
                  />
                </label>
                <label>
                  City
                  <input
                    required
                    value={personal.city}
                    onChange={(event) => setPersonal((current) => ({ ...current, city: event.target.value }))}
                    placeholder="Hyderabad"
                  />
                </label>
                <label>
                  State
                  <input
                    required
                    value={personal.state}
                    onChange={(event) => setPersonal((current) => ({ ...current, state: event.target.value }))}
                    placeholder="Telangana"
                  />
                </label>
                <label className="onboarding-grid__wide">
                  Address
                  <textarea
                    required
                    value={personal.address}
                    onChange={(event) => setPersonal((current) => ({ ...current, address: event.target.value }))}
                    placeholder="House / street / area"
                  />
                </label>
              </div>
              <FormActions isSaving={savingStep === "personal"} label="Save personal details" />
            </form>
          ) : null}

          {activeStep === "academic" ? (
            <form className="onboarding-form" onSubmit={saveAcademic}>
              <FormHeader icon={GraduationCap} eyebrow="Academic" title="Add your college and education details." />
              <div className="onboarding-grid onboarding-grid--two">
                <label>
                  College
                  <input
                    required
                    value={academic.college}
                    onChange={(event) => setAcademic((current) => ({ ...current, college: event.target.value }))}
                    placeholder="College name"
                  />
                </label>
                <label>
                  Degree
                  <input
                    required
                    value={academic.degree}
                    onChange={(event) => setAcademic((current) => ({ ...current, degree: event.target.value }))}
                    placeholder="B.Tech, B.Sc, MBA"
                  />
                </label>
                <label>
                  Branch
                  <input
                    required
                    value={academic.branch}
                    onChange={(event) => setAcademic((current) => ({ ...current, branch: event.target.value }))}
                    placeholder="CSE, ECE, Finance"
                  />
                </label>
                <label>
                  Graduation Year
                  <input
                    required
                    min="2000"
                    max="2100"
                    type="number"
                    value={academic.graduationYear}
                    onChange={(event) => setAcademic((current) => ({ ...current, graduationYear: event.target.value }))}
                    placeholder="2027"
                  />
                </label>
                <label className="onboarding-grid__wide">
                  CGPA/Percentage
                  <input
                    required
                    value={academic.cgpaOrPercentage}
                    onChange={(event) => setAcademic((current) => ({ ...current, cgpaOrPercentage: event.target.value }))}
                    placeholder="8.2 CGPA or 82%"
                  />
                </label>
              </div>
              <FormActions isSaving={savingStep === "academic"} label="Save academic details" />
            </form>
          ) : null}

          {activeStep === "career" ? (
            <form className="onboarding-form" onSubmit={saveCareer}>
              <FormHeader icon={BriefcaseBusiness} eyebrow="Career" title="Tell us the role and proof you are building toward." />
              <div className="onboarding-grid onboarding-grid--two">
                <label className="onboarding-grid__wide">
                  Target Job Role
                  <input
                    required
                    value={career.targetJobRole}
                    onChange={(event) => setCareer((current) => ({ ...current, targetJobRole: event.target.value }))}
                    placeholder="Data Analyst, Full Stack Developer"
                  />
                </label>
                <label className="onboarding-grid__wide">
                  Skills
                  <textarea
                    required
                    value={career.skillsText}
                    onChange={(event) => setCareer((current) => ({ ...current, skillsText: event.target.value }))}
                    placeholder="Python, SQL, React, Machine Learning"
                  />
                </label>
                {visibleSkills.length ? (
                  <div className="onboarding-chip-row onboarding-grid__wide" aria-label="Skills preview">
                    {visibleSkills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                ) : null}
                <label>
                  LinkedIn
                  <input
                    required
                    type="url"
                    value={career.linkedInUrl}
                    onChange={(event) => setCareer((current) => ({ ...current, linkedInUrl: event.target.value }))}
                    placeholder="https://linkedin.com/in/your-name"
                  />
                </label>
                <label>
                  GitHub
                  <input
                    required
                    type="url"
                    value={career.gitHubUrl}
                    onChange={(event) => setCareer((current) => ({ ...current, gitHubUrl: event.target.value }))}
                    placeholder="https://github.com/your-name"
                  />
                </label>
                <label className="onboarding-grid__wide">
                  Portfolio
                  <input
                    required
                    type="url"
                    value={career.portfolioUrl}
                    onChange={(event) => setCareer((current) => ({ ...current, portfolioUrl: event.target.value }))}
                    placeholder="https://your-portfolio.com"
                  />
                </label>
              </div>
              <FormActions isSaving={savingStep === "career"} label="Save career details" />
            </form>
          ) : null}

          {activeStep === "resume" ? (
            <form className="onboarding-form" onSubmit={uploadResume}>
              <FormHeader icon={FileText} eyebrow="Resume" title="Upload the resume mentors should review." />
              <div className="onboarding-upload">
                <label className="onboarding-upload__drop">
                  <UploadCloud size={30} />
                  <strong>{resumeFile ? resumeFile.name : "Choose resume file"}</strong>
                  <span>PDF, DOC, or DOCX up to 5 MB</span>
                  <input
                    accept=".pdf,.doc,.docx"
                    type="file"
                    onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                  />
                </label>

                {profile?.resume.resumeUrl ? (
                  <div className="onboarding-resume-card">
                    <div>
                      <FileText size={22} />
                      <div>
                        <strong>{profile.resume.resumeFileName ?? "Uploaded resume"}</strong>
                        <span>{formatFileSize(profile.resume.resumeSizeBytes)}</span>
                      </div>
                    </div>
                    <div className="onboarding-resume-card__actions">
                      <a href={toApiFileUrl(profile.resume.resumeUrl)} target="_blank" rel="noreferrer">
                        <ExternalLink size={17} />
                        View
                      </a>
                      <button type="button" onClick={deleteResume} disabled={savingStep === "resume"}>
                        <X size={17} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <FormActions isSaving={savingStep === "resume"} label="Upload resume" />
            </form>
          ) : null}

          <section className="onboarding-complete-panel">
            <div>
              <Rocket size={24} />
              <div>
                <span className="eyebrow">Final step</span>
                <h2>Open student dashboard</h2>
                <p>
                  {profile?.missingFields.length
                    ? `${profile.missingFields.length} profile fields still need attention.`
                    : "Your profile is ready for learning, projects, and mentor review."}
                </p>
              </div>
            </div>
            <button className="primary-action" type="button" onClick={completeOnboarding} disabled={savingStep === "complete"}>
              {savingStep === "complete" ? <Loader2 className="spin" size={17} /> : <ArrowRight size={17} />}
              Complete profile
            </button>
          </section>
        </section>
      </section>
    </main>
  );
}

function AccountLine({ icon: Icon, label }: { icon: ComponentType<{ size?: number }>; label: string }) {
  return (
    <p className="onboarding-account-line">
      <Icon size={17} />
      <span>{label}</span>
    </p>
  );
}

function FormHeader({
  icon: Icon,
  eyebrow,
  title
}: {
  icon: ComponentType<{ size?: number }>;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="onboarding-form__header">
      <span>
        <Icon size={20} />
      </span>
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
    </header>
  );
}

function FormActions({ isSaving, label }: { isSaving: boolean; label: string }) {
  return (
    <div className="onboarding-form__actions">
      <button className="primary-action" type="submit" disabled={isSaving}>
        {isSaving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
        {label}
      </button>
    </div>
  );
}

function formatFileSize(size?: number) {
  if (!size) {
    return "Resume attached";
  }

  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toApiFileUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${env.apiBaseUrl}${path}`;
}

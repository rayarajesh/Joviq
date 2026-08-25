import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, CSSProperties, KeyboardEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Plus,
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
type ValidationErrors = Record<string, string>;

type PersonalForm = UpdatePersonalDetailsRequest;
type AcademicForm = Omit<UpdateAcademicDetailsRequest, "graduationYear"> & { graduationYear: string };
type CareerForm = Omit<UpdateCareerDetailsRequest, "skills"> & { skillInput: string; skills: string[] };

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
  skillInput: "",
  skills: [],
  linkedInUrl: "",
  gitHubUrl: "",
  portfolioUrl: ""
};

const jobRoleSuggestions = [
  "Data Analyst",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cyber Security Analyst",
  "VLSI Design Engineer",
  "Embedded Systems Engineer",
  "Business Analyst",
  "Finance Analyst",
  "Digital Marketing Executive",
  "HR Executive"
];

const skillSuggestions = [
  "Python",
  "SQL",
  "React",
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "Node.js",
  "ASP.NET Core",
  "PostgreSQL",
  "Machine Learning",
  "Data Science",
  "Power BI",
  "Excel",
  "Git",
  "Docker",
  "AWS",
  "Azure",
  "DevOps",
  "Cyber Security",
  "VLSI",
  "Embedded C",
  "AutoCAD",
  "SolidWorks",
  "Digital Marketing",
  "SEO",
  "Finance",
  "Stock Market",
  "Communication",
  "Problem Solving"
];

const nameLikePattern = /^[A-Za-z][A-Za-z .'-]*$/;
const rolePattern = /^[A-Za-z0-9][A-Za-z0-9 &#+./()_-]*$/;
const skillPattern = /^[A-Za-z0-9][A-Za-z0-9 #+./-]*$/;

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
  const [savingStep, setSavingStep] = useState<StepId | "profile-photo" | "complete" | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

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
      skillInput: "",
      skills: nextProfile.career.skills,
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

  const selectedSkillNames = useMemo(() => new Set(career.skills.map((skill) => skill.toLowerCase())), [career.skills]);
  const availableSkillSuggestions = useMemo(
    () => skillSuggestions.filter((skill) => !selectedSkillNames.has(skill.toLowerCase())),
    [selectedSkillNames]
  );
  const availableJobRoleSuggestions = useMemo(
    () => jobRoleSuggestions.filter((role) => role.toLowerCase() !== career.targetJobRole.trim().toLowerCase()),
    [career.targetJobRole]
  );
  const maxDateOfBirth = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    return date.toISOString().slice(0, 10);
  }, []);
  const minDateOfBirth = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 90);
    return date.toISOString().slice(0, 10);
  }, []);

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

  function clearValidation(fields?: string[]) {
    if (!fields) {
      setValidationErrors({});
      return;
    }

    setValidationErrors((current) => {
      const next = { ...current };
      fields.forEach((field) => {
        delete next[field];
      });
      return next;
    });
  }

  function failValidation(errors: ValidationErrors) {
    setValidationErrors(errors);
    const firstError = Object.values(errors)[0] ?? "Please complete the required fields correctly.";
    setMessage({ tone: "error", text: firstError });
    return false;
  }

  function validatePersonal() {
    const errors: ValidationErrors = {};
    const dob = personal.dateOfBirth.trim();
    const address = normalizeText(personal.address);
    const city = normalizeText(personal.city);
    const state = normalizeText(personal.state);

    if (!dob) {
      errors.dateOfBirth = "Date of birth is required.";
    } else {
      const date = new Date(`${dob}T00:00:00`);
      const today = new Date();
      const minDate = new Date();
      const maxDate = new Date();
      minDate.setFullYear(today.getFullYear() - 90);
      maxDate.setFullYear(today.getFullYear() - 13);

      if (Number.isNaN(date.getTime())) {
        errors.dateOfBirth = "Date of birth must be a valid date.";
      } else if (date > today) {
        errors.dateOfBirth = "Date of birth cannot be in the future.";
      } else if (date < minDate) {
        errors.dateOfBirth = "Date of birth looks too far in the past.";
      } else if (date > maxDate) {
        errors.dateOfBirth = "Student must be at least 13 years old.";
      }
    }

    if (address.length < 8) {
      errors.address = "Address must be at least 8 characters.";
    }

    if (!isNameLike(city, 2, 120)) {
      errors.city = "City must contain only letters, spaces, periods, apostrophes, or hyphens.";
    }

    if (!isNameLike(state, 2, 120)) {
      errors.state = "State must contain only letters, spaces, periods, apostrophes, or hyphens.";
    }

    if (Object.keys(errors).length > 0) {
      return failValidation(errors);
    }

    setPersonal({ dateOfBirth: dob, address, city, state });
    clearValidation();
    return true;
  }

  function validateAcademic() {
    const errors: ValidationErrors = {};
    const college = normalizeText(academic.college);
    const degree = normalizeText(academic.degree);
    const branch = normalizeText(academic.branch);
    const cgpaOrPercentage = normalizeText(academic.cgpaOrPercentage);
    const graduationYear = Number(academic.graduationYear);
    const maxGraduationYear = new Date().getFullYear() + 8;

    if (college.length < 2 || college.length > 200) {
      errors.college = "College must be 2 to 200 characters.";
    }

    if (degree.length < 2 || degree.length > 120) {
      errors.degree = "Degree must be 2 to 120 characters.";
    }

    if (branch.length < 2 || branch.length > 120) {
      errors.branch = "Branch must be 2 to 120 characters.";
    }

    if (!Number.isInteger(graduationYear) || graduationYear < 2000 || graduationYear > maxGraduationYear) {
      errors.graduationYear = `Graduation year must be between 2000 and ${maxGraduationYear}.`;
    }

    if (!isValidCgpaOrPercentage(cgpaOrPercentage)) {
      errors.cgpaOrPercentage = "Enter a valid score like 8.2 CGPA or 82%.";
    }

    if (Object.keys(errors).length > 0) {
      return failValidation(errors);
    }

    setAcademic({ college, degree, branch, graduationYear: String(graduationYear), cgpaOrPercentage });
    clearValidation();
    return true;
  }

  function validateCareer() {
    const errors: ValidationErrors = {};
    const targetJobRole = normalizeText(career.targetJobRole);
    const linkedInUrl = normalizeText(career.linkedInUrl);
    const gitHubUrl = normalizeText(career.gitHubUrl);
    const portfolioUrl = normalizeText(career.portfolioUrl);

    if (!isValidCareerToken(targetJobRole, 2, 80, rolePattern)) {
      errors.targetJobRole = "Select or enter a valid job role.";
    }

    if (career.skills.length < 3) {
      errors.skills = "Add at least 3 skills.";
    } else if (career.skills.length > 15) {
      errors.skills = "Add up to 15 focused skills.";
    } else {
      const invalidSkill = career.skills.find((skill) => !isValidCareerToken(skill, 2, 40, skillPattern));
      if (invalidSkill) {
        errors.skills = `"${invalidSkill}" is not a valid skill.`;
      }
    }

    if (!isValidUrlForHost(linkedInUrl, "linkedin.com")) {
      errors.linkedInUrl = "Enter a valid LinkedIn profile URL.";
    }

    if (!isValidUrlForHost(gitHubUrl, "github.com")) {
      errors.gitHubUrl = "Enter a valid GitHub profile URL.";
    }

    if (!isValidHttpUrl(portfolioUrl)) {
      errors.portfolioUrl = "Enter a valid portfolio URL.";
    }

    if (Object.keys(errors).length > 0) {
      return failValidation(errors);
    }

    setCareer((current) => ({ ...current, targetJobRole, linkedInUrl, gitHubUrl, portfolioUrl }));
    clearValidation();
    return true;
  }

  function validateResumeFile(file: File) {
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return "Resume must be a PDF, DOC, or DOCX file.";
    }

    if (file.size <= 0) {
      return "Resume file is empty.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Resume must be 5 MB or smaller.";
    }

    return "";
  }

  function validateProfilePhotoFile(file: File) {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";

    if (!allowedExtensions.includes(extension) || (file.type && !allowedTypes.includes(file.type))) {
      return "Profile photo must be a JPG, PNG, or WebP image.";
    }

    if (file.size <= 0) {
      return "Profile photo file is empty.";
    }

    if (file.size > 2 * 1024 * 1024) {
      return "Profile photo must be 2 MB or smaller.";
    }

    return "";
  }

  function selectJobRole(role: string) {
    setCareer((current) => ({ ...current, targetJobRole: normalizeText(role) }));
    clearValidation(["targetJobRole"]);
    setMessage(null);
  }

  function clearJobRole() {
    setCareer((current) => ({ ...current, targetJobRole: "" }));
  }

  function addSkill(rawSkill = career.skillInput) {
    const skill = normalizeText(rawSkill);

    if (!isValidCareerToken(skill, 2, 40, skillPattern)) {
      failValidation({ skills: "Enter a valid skill before adding it." });
      return;
    }

    if (selectedSkillNames.has(skill.toLowerCase())) {
      setCareer((current) => ({ ...current, skillInput: "" }));
      clearValidation(["skills"]);
      return;
    }

    if (career.skills.length >= 15) {
      failValidation({ skills: "Add up to 15 focused skills." });
      return;
    }

    setCareer((current) => ({ ...current, skills: [...current.skills, skill], skillInput: "" }));
    clearValidation(["skills"]);
    setMessage(null);
  }

  function removeSkill(skillToRemove: string) {
    setCareer((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill.toLowerCase() !== skillToRemove.toLowerCase())
    }));
  }

  function handleSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill();
    }
  }

  function chooseResumeFile(file: File | null) {
    if (!file) {
      setResumeFile(null);
      return;
    }

    const error = validateResumeFile(file);
    if (error) {
      setResumeFile(null);
      failValidation({ resume: error });
      return;
    }

    setResumeFile(file);
    clearValidation(["resume"]);
    setMessage(null);
  }

  async function changeProfilePhoto(file: File | null) {
    if (!file) {
      return;
    }

    const error = validateProfilePhotoFile(file);
    if (error) {
      setMessage({ tone: "error", text: error });
      return;
    }

    setSavingStep("profile-photo");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.uploadProfilePhoto(file);
      hydrateProfile(response.data);
      setMessage({ tone: "success", text: "Profile photo updated." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function removeProfilePhoto() {
    setSavingStep("profile-photo");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.deleteProfilePhoto();
      hydrateProfile(response.data);
      setMessage({ tone: "success", text: "Profile photo removed." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setSavingStep(null);
    }
  }

  async function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validatePersonal()) {
      return;
    }

    setSavingStep("personal");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.updatePersonal({
        dateOfBirth: personal.dateOfBirth.trim(),
        address: normalizeText(personal.address),
        city: normalizeText(personal.city),
        state: normalizeText(personal.state)
      });
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
    if (!validateAcademic()) {
      return;
    }

    setSavingStep("academic");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.updateAcademic({
        college: normalizeText(academic.college),
        degree: normalizeText(academic.degree),
        branch: normalizeText(academic.branch),
        graduationYear: Number(academic.graduationYear),
        cgpaOrPercentage: normalizeText(academic.cgpaOrPercentage)
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
    if (!validateCareer()) {
      return;
    }

    setSavingStep("career");
    setMessage(null);

    try {
      const response = await studentOnboardingApi.updateCareer({
        targetJobRole: normalizeText(career.targetJobRole),
        skills: career.skills,
        linkedInUrl: normalizeText(career.linkedInUrl),
        gitHubUrl: normalizeText(career.gitHubUrl),
        portfolioUrl: normalizeText(career.portfolioUrl)
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
      failValidation({ resume: "Choose a PDF, DOC, or DOCX resume before uploading." });
      return;
    }

    const resumeError = validateResumeFile(resumeFile);
    if (resumeError) {
      failValidation({ resume: resumeError });
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
  const profilePhotoUrl = profile.profilePhotoUrl ? toApiFileUrl(profile.profilePhotoUrl) : "";
  const fieldClass = (field: string) => (validationErrors[field] ? "is-invalid" : undefined);

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
            <div className="onboarding-photo-block">
              <div className={`onboarding-avatar ${profilePhotoUrl ? "has-photo" : ""}`}>
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={`${accountName} profile`} />
                ) : (
                  <span>{accountName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="onboarding-photo-actions">
                <label className={`onboarding-photo-button ${savingStep === "profile-photo" ? "is-saving" : ""}`}>
                  {savingStep === "profile-photo" ? <Loader2 className="spin" size={16} /> : <Camera size={16} />}
                  Change photo
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    disabled={savingStep === "profile-photo"}
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      void changeProfilePhoto(file);
                    }}
                  />
                </label>
                {profilePhotoUrl ? (
                  <button
                    className="onboarding-photo-remove"
                    type="button"
                    onClick={() => void removeProfilePhoto()}
                    disabled={savingStep === "profile-photo"}
                  >
                    <X size={15} />
                    Remove
                  </button>
                ) : null}
                <small>JPG, PNG, or WebP up to 2 MB</small>
              </div>
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
            <form className="onboarding-form" onSubmit={savePersonal} noValidate>
              <FormHeader icon={MapPin} eyebrow="Personal" title="Where should mentors understand you from?" />
              <div className="onboarding-grid onboarding-grid--two">
                <label>
                  Date of Birth
                  <input
                    className={fieldClass("dateOfBirth")}
                    required
                    min={minDateOfBirth}
                    max={maxDateOfBirth}
                    type="date"
                    value={personal.dateOfBirth}
                    onChange={(event) => {
                      setPersonal((current) => ({ ...current, dateOfBirth: event.target.value }));
                      clearValidation(["dateOfBirth"]);
                    }}
                  />
                  <FieldError error={validationErrors.dateOfBirth} />
                </label>
                <label>
                  City
                  <input
                    className={fieldClass("city")}
                    required
                    value={personal.city}
                    onChange={(event) => {
                      setPersonal((current) => ({ ...current, city: event.target.value }));
                      clearValidation(["city"]);
                    }}
                    placeholder="Hyderabad"
                  />
                  <FieldError error={validationErrors.city} />
                </label>
                <label>
                  State
                  <input
                    className={fieldClass("state")}
                    required
                    value={personal.state}
                    onChange={(event) => {
                      setPersonal((current) => ({ ...current, state: event.target.value }));
                      clearValidation(["state"]);
                    }}
                    placeholder="Telangana"
                  />
                  <FieldError error={validationErrors.state} />
                </label>
                <label className="onboarding-grid__wide">
                  Address
                  <textarea
                    className={fieldClass("address")}
                    required
                    value={personal.address}
                    onChange={(event) => {
                      setPersonal((current) => ({ ...current, address: event.target.value }));
                      clearValidation(["address"]);
                    }}
                    placeholder="House / street / area"
                  />
                  <FieldError error={validationErrors.address} />
                </label>
              </div>
              <FormActions isSaving={savingStep === "personal"} label="Save personal details" />
            </form>
          ) : null}

          {activeStep === "academic" ? (
            <form className="onboarding-form" onSubmit={saveAcademic} noValidate>
              <FormHeader icon={GraduationCap} eyebrow="Academic" title="Add your college and education details." />
              <div className="onboarding-grid onboarding-grid--two">
                <label>
                  College
                  <input
                    className={fieldClass("college")}
                    required
                    value={academic.college}
                    onChange={(event) => {
                      setAcademic((current) => ({ ...current, college: event.target.value }));
                      clearValidation(["college"]);
                    }}
                    placeholder="College name"
                  />
                  <FieldError error={validationErrors.college} />
                </label>
                <label>
                  Degree
                  <input
                    className={fieldClass("degree")}
                    required
                    value={academic.degree}
                    onChange={(event) => {
                      setAcademic((current) => ({ ...current, degree: event.target.value }));
                      clearValidation(["degree"]);
                    }}
                    placeholder="B.Tech, B.Sc, MBA"
                  />
                  <FieldError error={validationErrors.degree} />
                </label>
                <label>
                  Branch
                  <input
                    className={fieldClass("branch")}
                    required
                    value={academic.branch}
                    onChange={(event) => {
                      setAcademic((current) => ({ ...current, branch: event.target.value }));
                      clearValidation(["branch"]);
                    }}
                    placeholder="CSE, ECE, Finance"
                  />
                  <FieldError error={validationErrors.branch} />
                </label>
                <label>
                  Graduation Year
                  <input
                    className={fieldClass("graduationYear")}
                    required
                    min="2000"
                    max={new Date().getFullYear() + 8}
                    type="number"
                    value={academic.graduationYear}
                    onChange={(event) => {
                      setAcademic((current) => ({ ...current, graduationYear: event.target.value }));
                      clearValidation(["graduationYear"]);
                    }}
                    placeholder="2027"
                  />
                  <FieldError error={validationErrors.graduationYear} />
                </label>
                <label className="onboarding-grid__wide">
                  CGPA/Percentage
                  <input
                    className={fieldClass("cgpaOrPercentage")}
                    required
                    value={academic.cgpaOrPercentage}
                    onChange={(event) => {
                      setAcademic((current) => ({ ...current, cgpaOrPercentage: event.target.value }));
                      clearValidation(["cgpaOrPercentage"]);
                    }}
                    placeholder="8.2 CGPA or 82%"
                  />
                  <FieldError error={validationErrors.cgpaOrPercentage} />
                </label>
              </div>
              <FormActions isSaving={savingStep === "academic"} label="Save academic details" />
            </form>
          ) : null}

          {activeStep === "career" ? (
            <form className="onboarding-form" onSubmit={saveCareer} noValidate>
              <FormHeader icon={BriefcaseBusiness} eyebrow="Career" title="Tell us the role and proof you are building toward." />
              <div className="onboarding-grid onboarding-grid--two">
                <div className="onboarding-picker onboarding-grid__wide">
                  <label htmlFor="targetJobRole">Target Job Role</label>
                  <div className="onboarding-combo">
                    <input
                      className={fieldClass("targetJobRole")}
                      id="targetJobRole"
                      required
                      value={career.targetJobRole}
                      onChange={(event) => {
                        setCareer((current) => ({ ...current, targetJobRole: event.target.value }));
                        clearValidation(["targetJobRole"]);
                      }}
                      placeholder="Search or choose a role"
                    />
                    <button type="button" onClick={() => selectJobRole(career.targetJobRole)} aria-label="Set target job role">
                      <Plus size={18} />
                    </button>
                  </div>
                  <FieldError error={validationErrors.targetJobRole} />
                  {career.targetJobRole ? (
                    <div className="onboarding-selected-pills" aria-label="Selected job role">
                      <span>
                        {career.targetJobRole}
                        <button type="button" onClick={clearJobRole} aria-label="Remove selected job role">
                          <X size={15} />
                        </button>
                      </span>
                    </div>
                  ) : null}
                  <SuggestionPills items={availableJobRoleSuggestions} onSelect={selectJobRole} />
                </div>

                <div className="onboarding-picker onboarding-grid__wide">
                  <label htmlFor="skillInput">Skills</label>
                  <div className="onboarding-combo">
                    <input
                      className={fieldClass("skills")}
                      id="skillInput"
                      value={career.skillInput}
                      onChange={(event) => {
                        setCareer((current) => ({ ...current, skillInput: event.target.value }));
                        clearValidation(["skills"]);
                      }}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Type a skill and press +"
                    />
                    <button type="button" onClick={() => addSkill()} aria-label="Add skill">
                      <Plus size={18} />
                    </button>
                  </div>
                  <FieldError error={validationErrors.skills} />
                  {career.skills.length ? (
                    <div className="onboarding-selected-pills" aria-label="Selected skills">
                      {career.skills.map((skill) => (
                        <span key={skill}>
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                            <X size={15} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <SuggestionPills items={availableSkillSuggestions} onSelect={addSkill} />
                </div>

                <label>
                  LinkedIn
                  <input
                    className={fieldClass("linkedInUrl")}
                    required
                    type="url"
                    value={career.linkedInUrl}
                    onChange={(event) => {
                      setCareer((current) => ({ ...current, linkedInUrl: event.target.value }));
                      clearValidation(["linkedInUrl"]);
                    }}
                    placeholder="https://linkedin.com/in/your-name"
                  />
                  <FieldError error={validationErrors.linkedInUrl} />
                </label>
                <label>
                  GitHub
                  <input
                    className={fieldClass("gitHubUrl")}
                    required
                    type="url"
                    value={career.gitHubUrl}
                    onChange={(event) => {
                      setCareer((current) => ({ ...current, gitHubUrl: event.target.value }));
                      clearValidation(["gitHubUrl"]);
                    }}
                    placeholder="https://github.com/your-name"
                  />
                  <FieldError error={validationErrors.gitHubUrl} />
                </label>
                <label className="onboarding-grid__wide">
                  Portfolio
                  <input
                    className={fieldClass("portfolioUrl")}
                    required
                    type="url"
                    value={career.portfolioUrl}
                    onChange={(event) => {
                      setCareer((current) => ({ ...current, portfolioUrl: event.target.value }));
                      clearValidation(["portfolioUrl"]);
                    }}
                    placeholder="https://your-portfolio.com"
                  />
                  <FieldError error={validationErrors.portfolioUrl} />
                </label>
              </div>
              <FormActions isSaving={savingStep === "career"} label="Save career details" />
            </form>
          ) : null}

          {activeStep === "resume" ? (
            <form className="onboarding-form" onSubmit={uploadResume} noValidate>
              <FormHeader icon={FileText} eyebrow="Resume" title="Upload the resume mentors should review." />
              <div className="onboarding-upload">
                <label className={`onboarding-upload__drop ${validationErrors.resume ? "is-invalid" : ""}`}>
                  <UploadCloud size={30} />
                  <strong>{resumeFile ? resumeFile.name : "Choose resume file"}</strong>
                  <span>PDF, DOC, or DOCX up to 5 MB</span>
                  <input
                    accept=".pdf,.doc,.docx"
                    type="file"
                    onChange={(event) => chooseResumeFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <FieldError error={validationErrors.resume} />

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

function SuggestionPills({ items, onSelect }: { items: string[]; onSelect: (item: string) => void }) {
  return (
    <div className="onboarding-suggestion-pills" aria-label="Suggestions">
      {items.slice(0, 12).map((item) => (
        <button key={item} type="button" onClick={() => onSelect(item)}>
          <Plus size={14} />
          {item}
        </button>
      ))}
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <small className="onboarding-field-error">{error}</small> : null;
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

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isNameLike(value: string, minLength: number, maxLength: number) {
  return value.length >= minLength && value.length <= maxLength && nameLikePattern.test(value);
}

function isValidCareerToken(value: string, minLength: number, maxLength: number, pattern: RegExp) {
  return value.length >= minLength && value.length <= maxLength && pattern.test(value);
}

function isValidCgpaOrPercentage(value: string) {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d{1,3}(?:\.\d{1,2})?)\s*(%|percentage|cgpa)?$/);

  if (!match) {
    return false;
  }

  const numericValue = Number(match[1]);
  const unit = match[2];

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return false;
  }

  if (unit === "%" || unit === "percentage") {
    return numericValue <= 100;
  }

  if (unit === "cgpa") {
    return numericValue <= 10;
  }

  return numericValue <= 10 || numericValue <= 100;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function isValidUrlForHost(value: string, expectedHost: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      ["http:", "https:"].includes(url.protocol) &&
      (hostname === expectedHost || hostname.endsWith(`.${expectedHost}`))
    );
  } catch {
    return false;
  }
}

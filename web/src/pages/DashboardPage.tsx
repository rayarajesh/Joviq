import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Award,
  BadgePercent,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCopy,
  ClipboardList,
  BriefcaseBusiness,
  CreditCard,
  Eye,
  EyeOff,
  FolderKanban,
  GraduationCap,
  Image,
  Layers3,
  LayoutDashboard,
  Lock,
  Mail,
  Pencil,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Trophy,
  Unlock,
  UploadCloud,
  UserRoundCheck,
  UserPlus,
  WalletCards,
  X,
  Zap,
  ListChecks,
  UsersRound
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { env } from "../config/env";
import { assetsApi } from "../features/assets/api/assetsApi";
import { assetPurposes, assetTypes, assetVisibilities } from "../features/assets/api/assetsTypes";
import { adminUsersApi } from "../features/auth/api/authApi";
import type {
  AdminUserResponse,
  AdminUserSummaryResponse,
  AssignableRoleName,
  PagedResult
} from "../features/auth/api/authTypes";
import { useAuth } from "../features/auth/context/useAuth";
import { adminLmsApi, publicLmsApi, studentLmsApi } from "../features/lms/api/lmsApi";
import type {
  AdminNotificationResponse,
  AdminLmsSummaryResponse,
  AuditLogResponse,
  CertificateResponse,
  CouponResponse,
  CurriculumModuleResponse,
  EnrollmentResponse,
  LessonResponse,
  PaymentTransactionResponse,
  ProgramCategoryResponse,
  ProgramDetailsResponse,
  ProgramPlanResponse,
  ProgramSummaryResponse,
  ProjectResponse,
  StudentLmsDashboardResponse,
  StudentProgramWorkspaceResponse,
  SubmissionResponse
} from "../features/lms/api/lmsTypes";
import { defaultProgramPlans } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

type PrimaryRole = "Admin" | "Student";
type DashboardNavGroup = { label?: string; items: string[] };
type MessageState = { tone: "success" | "error"; text: string } | null;
type PeopleStatusFilter = "All" | "Active" | "PendingEmailVerification" | "Locked";
type PeopleSortBy = "fullName" | "email" | "accountStatus" | "createdAt" | "lastLoginAt";
type PeopleSortDirection = "asc" | "desc";
type PeopleQueryState = {
  search: string;
  status: PeopleStatusFilter;
  sortBy: PeopleSortBy;
  sortDirection: PeopleSortDirection;
  page: number;
  pageSize: number;
};

const peoplePageSize = 6;
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const initialPeopleQuery: PeopleQueryState = {
  search: "",
  status: "All",
  sortBy: "createdAt",
  sortDirection: "desc",
  page: 1,
  pageSize: peoplePageSize
};
const peopleStatusOptions: { label: string; value: PeopleStatusFilter }[] = [
  { label: "All status", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Pending email", value: "PendingEmailVerification" },
  { label: "Locked", value: "Locked" }
];
const peopleSortOptions: { label: string; sortBy: PeopleSortBy; sortDirection: PeopleSortDirection }[] = [
  { label: "Newest first", sortBy: "createdAt", sortDirection: "desc" },
  { label: "Oldest first", sortBy: "createdAt", sortDirection: "asc" },
  { label: "Name A-Z", sortBy: "fullName", sortDirection: "asc" },
  { label: "Name Z-A", sortBy: "fullName", sortDirection: "desc" },
  { label: "Email A-Z", sortBy: "email", sortDirection: "asc" },
  { label: "Status", sortBy: "accountStatus", sortDirection: "asc" }
];
const programThumbnailOptions = [
  { label: "Generative AI", url: "/assets/programs/generative-ai.jpg" },
  { label: "Full Stack", url: "/assets/programs/full-stack.jpg" },
  { label: "Machine Learning", url: "/assets/programs/machine-learning.jpg" },
  { label: "Cyber Security", url: "/assets/programs/cyber-security.jpg" },
  { label: "Data Analytics", url: "/assets/programs/data-analytics.jpg" },
  { label: "Data Science", url: "/assets/programs/data-science.jpg" },
  { label: "Cloud Computing", url: "/assets/programs/cloud-computing.jpg" },
  { label: "DevOps", url: "/assets/programs/devops.jpg" },
  { label: "Electrical", url: "/assets/programs/electrical-electronics.jpg" },
  { label: "Mechanical", url: "/assets/programs/mechanical-civil.jpg" },
  { label: "Management", url: "/assets/programs/management.jpg" },
  { label: "Studio", url: "/assets/joviq-learning-studio.png" }
];
const dashboardNavItems: Record<PrimaryRole, string[]> = {
  Admin: [
    "Overview",
    "Categories",
    "Programs",
    "Curriculum",
    "Lessons",
    "Projects",
    "Certificates",
    "Students",
    "Enrollments",
    "Payments",
    "Coupons",
    "Audit Logs"
  ],
  Student: [
    "Overview",
    "My Program",
    "Projects",
    "Payments",
    "Certificates"
  ]
};

const studentNavGroups: DashboardNavGroup[] = [
  { items: ["Overview", "My Program", "Projects", "Certificates", "Payments"] }
];

const adminNavGroups: DashboardNavGroup[] = [
  { label: "Main", items: ["Overview"] },
  { label: "Learning", items: ["Categories", "Programs", "Curriculum", "Lessons", "Projects", "Certificates"] },
  { label: "People", items: ["Students", "Enrollments"] },
  { label: "Billing", items: ["Payments", "Coupons"] },
  { label: "System", items: ["Audit Logs"] }
];

const moduleIconMap: Record<string, ComponentType<{ size?: number }>> = {
  Overview: LayoutDashboard,
  "My Program": BookMarked,
  Students: UsersRound,
  Categories: Tags,
  Programs: BookOpen,
  Curriculum: ListChecks,
  Lessons: PlayCircle,
  Projects: FolderKanban,
  Enrollments: ClipboardList,
  Payments: CreditCard,
  Coupons: BadgePercent,
  Certificates: Award,
  Notifications: Bell,
  Profile: UserRoundCheck,
  "Audit Logs": ShieldCheck,
  Learners: GraduationCap
};

function getModuleDisplayName(module: string) {
  return module === "Overview" ? "Dashboard" : module;
}

export function DashboardPage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roles = auth.user?.roles ?? [];
  const primaryRole: PrimaryRole = roles.includes("Admin") ? "Admin" : "Student";
  const requestedModule = searchParams.get("section");
  const normalizedRequestedModule = requestedModule === "Dashboard" ? "Overview" : requestedModule;
  const canOpenRequestedModule = normalizedRequestedModule
    && dashboardNavItems[primaryRole].includes(normalizedRequestedModule);
  const initialModule = canOpenRequestedModule
    ? normalizedRequestedModule
    : "Overview";
  const [activeModule, setActiveModule] = useState(initialModule);

  useEffect(() => {
    setActiveModule(initialModule);
  }, [initialModule, primaryRole]);

  function selectModule(module: string) {
    setActiveModule(module);
    const nextSearchParams = new URLSearchParams(searchParams);
    if (module === "Overview") {
      nextSearchParams.delete("section");
    } else {
      nextSearchParams.set("section", module);
    }
    setSearchParams(nextSearchParams, { replace: true });
  }

  const usesAdminModuleHero = primaryRole === "Admin"
    && (activeModule === "Students" || activeModule === "Categories" || activeModule === "Programs");

  return (
    <main className={`dashboard-shell dashboard-shell--${primaryRole.toLowerCase()}`}>
      <DashboardSidebar activeModule={activeModule} onModuleChange={selectModule} role={primaryRole} />
      <section className="dashboard-main">
        {!usesAdminModuleHero ? (
          <header className="dashboard-header">
            <div>
              <span className="eyebrow">Joviq LMS</span>
              <h1>{getModuleDisplayName(activeModule)}</h1>
              {auth.user?.fullName ? <p>{auth.user.fullName}</p> : null}
            </div>
          </header>
        ) : null}

        {primaryRole === "Admin" ? <AdminDashboard activeModule={activeModule} currentUserId={auth.user?.id} /> : null}
        {primaryRole === "Student" ? <StudentDashboard activeModule={activeModule} /> : null}
      </section>
    </main>
  );
}

function DashboardSidebar({
  activeModule,
  onModuleChange,
  role
}: {
  activeModule: string;
  onModuleChange: (module: string) => void;
  role: PrimaryRole;
}) {
  const navGroups = role === "Student"
    ? studentNavGroups
    : adminNavGroups;
  return (
    <aside className={`dashboard-sidebar dashboard-sidebar--${role.toLowerCase()}`}>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navGroups.map((group) => (
          <div className="sidebar-nav__group" key={group.label ?? group.items.join("-")}>
            {group.label ? <span className="sidebar-nav__label">
              <span>{group.label}</span>
            </span> : null}
            {group.items.map((item) => {
              const Icon = moduleIconMap[item] ?? BarChart3;
              const label = getModuleDisplayName(item);
              return (
                <button
                  aria-current={activeModule === item ? "page" : undefined}
                  className={activeModule === item ? "is-active" : ""}
                  key={item}
                  type="button"
                  onClick={() => onModuleChange(item)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function AdminDashboard({ activeModule, currentUserId }: { activeModule: string; currentUserId?: string }) {
  const [studentQuery, setStudentQuery] = useState<PeopleQueryState>(() => ({ ...initialPeopleQuery }));
  const [studentsPage, setStudentsPage] = useState<PagedResult<AdminUserResponse> | null>(null);
  const [summary, setSummary] = useState<AdminUserSummaryResponse | null>(null);
  const [lmsSummary, setLmsSummary] = useState<AdminLmsSummaryResponse | null>(null);
  const [lmsPrograms, setLmsPrograms] = useState<ProgramSummaryResponse[]>([]);
  const [programCategories, setProgramCategories] = useState<ProgramCategoryResponse[]>([]);
  const [adminCurriculum, setAdminCurriculum] = useState<CurriculumModuleResponse[]>([]);
  const [adminProjects, setAdminProjects] = useState<ProjectResponse[]>([]);
  const [adminEnrollments, setAdminEnrollments] = useState<EnrollmentResponse[]>([]);
  const [adminPayments, setAdminPayments] = useState<PaymentTransactionResponse[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<CouponResponse[]>([]);
  const [adminCertificates, setAdminCertificates] = useState<CertificateResponse[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingRole, setCreatingRole] = useState<AssignableRoleName | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const students = studentsPage?.items ?? [];

  const metrics = useMemo(
    () => [
      { icon: UsersRound, label: "Total users", value: summary?.totalUsers ?? "-" },
      { icon: GraduationCap, label: "Students", value: summary?.students ?? "-" },
      { icon: ShieldCheck, label: "Admins", value: summary?.admins ?? "-" }
    ],
    [summary]
  );

  const lmsMetrics = useMemo(
    () => [
      { icon: BookOpen, label: "Programs", value: lmsSummary?.programs ?? "-" },
      { icon: GraduationCap, label: "Enrollments", value: lmsSummary?.enrollments ?? "-" },
      { icon: CircleDollarSign, label: "Verified revenue", value: formatCurrency(lmsSummary?.verifiedRevenue ?? 0) },
      { icon: FolderKanban, label: "Project reviews", value: lmsSummary?.pendingProjectReviews ?? "-" }
    ],
    [lmsSummary]
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const [
        summaryResponse,
        studentsResponse,
        lmsSummaryResponse,
        lmsProgramsResponse,
        categoriesResponse,
        curriculumResponse,
        projectsResponse,
        enrollmentsResponse,
        paymentsResponse,
        couponsResponse,
        certificatesResponse,
        notificationsResponse,
        auditLogsResponse
      ] = await Promise.all([
        adminUsersApi.getSummary(),
        adminUsersApi.getUsers(toPeopleListParams("Student", studentQuery)),
        adminLmsApi.getSummary(),
        adminLmsApi.getPrograms(),
        adminLmsApi.getCategories(),
        adminLmsApi.getCurriculum(),
        adminLmsApi.getProjects(),
        adminLmsApi.getEnrollments(),
        adminLmsApi.getPayments(),
        adminLmsApi.getCoupons(),
        adminLmsApi.getCertificates(),
        adminLmsApi.getNotifications(),
        adminLmsApi.getAuditLogs(1, 20)
      ]);

      setSummary(summaryResponse.data);
      setStudentsPage(studentsResponse.data);
      setLmsSummary(lmsSummaryResponse.data);
      setLmsPrograms(lmsProgramsResponse.data);
      setProgramCategories(categoriesResponse.data);
      setAdminCurriculum(curriculumResponse.data);
      setAdminProjects(projectsResponse.data);
      setAdminEnrollments(enrollmentsResponse.data);
      setAdminPayments(paymentsResponse.data);
      setAdminCoupons(couponsResponse.data);
      setAdminCertificates(certificatesResponse.data);
      setAdminNotifications(notificationsResponse.data);
      setAuditLogs(auditLogsResponse.data.items);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, [studentQuery]);

  async function createRoleUser(event: FormEvent<HTMLFormElement>, role: AssignableRoleName) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setCreatingRole(role);
    setMessage(null);

    const form = new FormData(formElement);
    const phoneNumber = toIndiaMobileNumber(form.get("phoneNumber"));
    if (!phoneNumber) {
      setCreatingRole(null);
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return false;
    }

    try {
      await adminUsersApi.createUser({
        fullName: String(form.get("fullName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim().toLowerCase(),
        phoneNumber,
        role,
        temporaryPassword: String(form.get("temporaryPassword") ?? "")
      });

      formElement.reset();
      setMessage({ tone: "success", text: `${role} account created successfully.` });
      await loadDashboard();
      return true;
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
      return false;
    } finally {
      setCreatingRole(null);
    }
  }

  async function runUserAction(user: AdminUserResponse, action: "lock" | "unlock" | "reset") {
    const actionKey = `${user.id}-${action}`;
    setActionUserId(actionKey);
    setMessage(null);

    try {
      if (action === "lock") {
        await adminUsersApi.lockUser(user.id);
      }

      if (action === "unlock") {
        await adminUsersApi.unlockUser(user.id);
      }

      if (action === "reset") {
        await adminUsersApi.sendResetPasswordLink(user.id);
      }

      setMessage({ tone: "success", text: actionMessage(action, user.fullName) });
      await loadDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionUserId(null);
    }
  }

  async function saveUserEdit(event: FormEvent<HTMLFormElement>, user: AdminUserResponse) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const phoneNumber = toIndiaMobileNumber(form.get("phoneNumber"));
    const accountStatus = String(form.get("accountStatus") ?? user.accountStatus);
    const role = String(form.get("role") ?? getAssignableUserRole(user)) as AssignableRoleName;
    const actionKey = `${user.id}-edit`;

    if (!fullName) {
      setMessage({ tone: "error", text: "Full name is required." });
      return false;
    }

    if (!phoneNumber) {
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return false;
    }

    setActionUserId(actionKey);
    setMessage(null);

    try {
      await adminUsersApi.updateUser(user.id, {
        fullName,
        email,
        phoneNumber,
        accountStatus,
        role
      });

      setMessage({ tone: "success", text: `${user.fullName} updated successfully.` });
      await loadDashboard();
      return true;
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
      return false;
    } finally {
      setActionUserId(null);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const showOverview = activeModule === "Overview";
  const showPeopleModule = activeModule === "Students";

  return (
    <section className="dashboard-stack">
      {showOverview ? (
        <section className="metric-grid">
          {metrics.map((metric) => (
            <DashboardMetric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
          ))}
        </section>
      ) : null}

      {showOverview ? (
        <section className="metric-grid metric-grid--lms">
          {lmsMetrics.map((metric) => (
            <DashboardMetric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
          ))}
        </section>
      ) : null}

      {message ? <MessageBox message={message} /> : null}

      {activeModule === "Students" ? (
        <AdminPeoplePanel
          actionUserId={actionUserId}
          currentUserId={currentUserId}
          emptyText="No student accounts yet."
          enrollments={adminEnrollments}
          isCreating={creatingRole === "Student"}
          isLoading={isLoading}
          page={studentsPage}
          query={studentQuery}
          role="Student"
          title="Students"
          users={students}
          onCreateUser={createRoleUser}
          onMessage={setMessage}
          onQueryChange={setStudentQuery}
          onSaveUserEdit={saveUserEdit}
          onUserAction={runUserAction}
        />
      ) : null}

      {!showPeopleModule ? <AdminLmsPanel
        activeModule={activeModule}
        adminCertificates={adminCertificates}
        adminCoupons={adminCoupons}
        adminCurriculum={adminCurriculum}
        adminEnrollments={adminEnrollments}
        adminNotifications={adminNotifications}
        adminPayments={adminPayments}
        adminProjects={adminProjects}
        auditLogs={auditLogs}
        categories={programCategories}
        programs={lmsPrograms}
        students={students}
        summary={lmsSummary}
        onMessage={setMessage}
        onRefresh={loadDashboard}
      /> : null}
    </section>
  );
}

function AdminLmsPanel({
  activeModule,
  adminCertificates,
  adminCoupons,
  adminCurriculum,
  adminEnrollments,
  adminNotifications,
  adminPayments,
  adminProjects,
  auditLogs,
  categories,
  programs,
  students,
  summary,
  onMessage,
  onRefresh
}: {
  activeModule: string;
  adminCertificates: CertificateResponse[];
  adminCoupons: CouponResponse[];
  adminCurriculum: CurriculumModuleResponse[];
  adminEnrollments: EnrollmentResponse[];
  adminNotifications: AdminNotificationResponse[];
  adminPayments: PaymentTransactionResponse[];
  adminProjects: ProjectResponse[];
  auditLogs: AuditLogResponse[];
  categories: ProgramCategoryResponse[];
  programs: ProgramSummaryResponse[];
  students: AdminUserResponse[];
  summary: AdminLmsSummaryResponse | null;
  onMessage: (message: MessageState) => void;
  onRefresh: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  const [isPlanEditorLoading, setIsPlanEditorLoading] = useState(false);
  const [planEditorProgram, setPlanEditorProgram] = useState<ProgramDetailsResponse | null>(null);
  const [programDialogMode, setProgramDialogMode] = useState<"create" | "edit" | null>(null);
  const [programEditor, setProgramEditor] = useState<ProgramDetailsResponse | null>(null);
  const [programEditorLoadingId, setProgramEditorLoadingId] = useState<string | null>(null);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [programThumbnailUrl, setProgramThumbnailUrl] = useState("");
  const [programThumbnailFile, setProgramThumbnailFile] = useState<File | null>(null);
  const [programThumbnailPreviewUrl, setProgramThumbnailPreviewUrl] = useState("");
  const [categoryDialogMode, setCategoryDialogMode] = useState<"create" | "edit" | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<ProgramCategoryResponse | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const hasOpenAdminDialog = Boolean(categoryDialogMode || programDialogMode || planEditorProgram);

  useEffect(() => {
    if (!hasOpenAdminDialog) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasOpenAdminDialog]);

  async function createProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const categoryId = String(form.get("categoryId") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const domain = categories.find((category) => category.id === categoryId)?.name ?? "Career";

    if (!categoryId || !title) {
      onMessage({ tone: "error", text: "Choose a category and enter a program title." });
      return;
    }

    setIsCreatingProgram(true);
    onMessage(null);

    try {
      await adminLmsApi.createProgram({
        categoryId,
        title,
        slug: toSlug(title),
        shortDescription: `A structured ${title} program with practical projects and expert review.`,
        overview: `${title} helps learners build strong ${domain} foundations, complete portfolio projects, receive expert feedback, and prepare for interview conversations with proof of skill.`,
        level: String(form.get("level") ?? "Beginner to job-ready"),
        duration: String(form.get("duration") ?? "8 to 16 weeks"),
        learningMode: String(form.get("learningMode") ?? "Live + recorded + project practice"),
        certificationName: `Joviq ${title} Career Program Certification`,
        skills: parseCommaList(String(form.get("skills") ?? "")),
        outcomes: [
          "Portfolio-ready projects",
          "Reviewed project work",
          "Project-backed certification",
          "Interview preparation support"
        ],
        faqs: [
          { question: "Can beginners join?", answer: "Yes. The program starts from foundations and moves into projects." },
          { question: "Will I get certification?", answer: "Yes. Certification is linked to completed project work." }
        ],
        status: 2
      });

      formElement.reset();
      onMessage({ tone: "success", text: `${title} program created.` });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsCreatingProgram(false);
    }
  }

  async function openPlanEditor(program: ProgramSummaryResponse) {
    setIsPlanEditorLoading(true);
    onMessage(null);

    try {
      const response = await adminLmsApi.getProgram(program.id);
      setPlanEditorProgram(response.data);
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsPlanEditorLoading(false);
    }
  }

  function closePlanEditor() {
    setPlanEditorProgram(null);
  }

  async function openProgramDialog(program?: ProgramSummaryResponse) {
    setProgramThumbnailFile(null);
    setProgramThumbnailPreviewUrl("");

    if (!program) {
      setProgramEditor(null);
      setProgramThumbnailUrl(selectedProgramCategory ? getProgramImage("", selectedProgramCategory.name) : "");
      setProgramDialogMode("create");
      return;
    }

    setProgramEditorLoadingId(program.id);
    onMessage(null);

    try {
      const response = await adminLmsApi.getProgram(program.id);
      setProgramEditor(response.data);
      setProgramThumbnailUrl(toApiAcceptableThumbnailUrl(response.data.thumbnailUrl) || getProgramImage(response.data.slug, response.data.categoryName));
      setProgramDialogMode("edit");
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setProgramEditorLoadingId(null);
    }
  }

  function closeProgramDialog() {
    setProgramDialogMode(null);
    setProgramEditor(null);
    setProgramThumbnailUrl("");
    setProgramThumbnailFile(null);
    if (programThumbnailPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(programThumbnailPreviewUrl);
    }
    setProgramThumbnailPreviewUrl("");
  }

  function chooseProgramThumbnailUrl(url: string) {
    setProgramThumbnailUrl(url);
    setProgramThumbnailFile(null);
    if (programThumbnailPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(programThumbnailPreviewUrl);
    }
    setProgramThumbnailPreviewUrl("");
  }

  function chooseProgramThumbnailFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onMessage({ tone: "error", text: "Choose a JPG, PNG, WebP, or GIF image." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onMessage({ tone: "error", text: "Thumbnail image must be 10 MB or smaller." });
      return;
    }

    if (programThumbnailPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(programThumbnailPreviewUrl);
    }

    setProgramThumbnailFile(file);
    setProgramThumbnailUrl("");
    setProgramThumbnailPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadProgramThumbnail(programId: string, file: File) {
    const uploadResponse = await assetsApi.uploadFile(file, {
      type: assetTypes.image,
      purpose: assetPurposes.programThumbnail,
      visibility: assetVisibilities.public,
      programId
    });

    if (uploadResponse.data.deliveryUrl || uploadResponse.data.publicUrl) {
      return toApiAcceptableThumbnailUrl(uploadResponse.data.deliveryUrl ?? uploadResponse.data.publicUrl ?? "") ?? "";
    }

    const accessResponse = await assetsApi.getAccessUrl(uploadResponse.data.id);
    return toApiAcceptableThumbnailUrl(accessResponse.data.url) ?? "";
  }

  async function saveProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const categoryId = String(form.get("categoryId") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const categoryName = categories.find((category) => category.id === categoryId)?.name ?? "Career";
    const skills = parseCommaList(String(form.get("skills") ?? ""));
    const outcomes = parseMultilineList(String(form.get("outcomes") ?? ""));

    if (!categoryId || !title) {
      onMessage({ tone: "error", text: "Choose a category and enter a program title." });
      return;
    }

    const fallbackOverview = `${title} helps learners build strong ${categoryName} foundations, complete portfolio projects, receive expert feedback, and prepare for interview conversations with proof of skill.`;
    const selectedThumbnailUrl = toApiAcceptableThumbnailUrl(programThumbnailUrl);
    const payload = {
      categoryId,
      title,
      slug: toSlug(String(form.get("slug") ?? "").trim() || title),
      shortDescription:
        String(form.get("shortDescription") ?? "").trim()
        || programEditor?.shortDescription
        || `A structured ${title} program with practical projects and expert review.`,
      overview: String(form.get("overview") ?? "").trim() || programEditor?.overview || fallbackOverview,
      level: String(form.get("level") ?? "").trim() || programEditor?.level || "Beginner to job-ready",
      duration: String(form.get("duration") ?? "").trim() || programEditor?.duration || "8 to 16 weeks",
      learningMode:
        String(form.get("learningMode") ?? "").trim()
        || programEditor?.learningMode
        || "Live + recorded + project practice",
      certificationName:
        String(form.get("certificationName") ?? "").trim()
        || programEditor?.certificationName
        || `Joviq ${title} Career Program Certification`,
      thumbnailUrl: selectedThumbnailUrl,
      skills: skills.length ? skills : programEditor?.skills ?? [],
      outcomes: outcomes.length
        ? outcomes
        : programEditor?.outcomes ?? [
          "Portfolio-ready projects",
          "Reviewed project work",
          "Project-backed certification",
          "Interview preparation support"
        ],
      faqs: programEditor?.faqs?.length
        ? programEditor.faqs
        : [
          { question: "Can beginners join?", answer: "Yes. The program starts from foundations and moves into projects." },
          { question: "Will I get certification?", answer: "Yes. Certification is linked to completed project work." }
        ],
      status: Number(form.get("status") ?? 2)
    };

    setIsSavingProgram(true);
    onMessage(null);

    try {
      if (programEditor) {
        const uploadedThumbnailUrl = programThumbnailFile
          ? await uploadProgramThumbnail(programEditor.id, programThumbnailFile)
          : "";
        await adminLmsApi.updateProgram(programEditor.id, {
          ...payload,
          thumbnailUrl: uploadedThumbnailUrl || payload.thumbnailUrl
        });
      } else {
        const response = await adminLmsApi.createProgram(payload);
        if (programThumbnailFile) {
          const uploadedThumbnailUrl = await uploadProgramThumbnail(response.data.id, programThumbnailFile);
          await adminLmsApi.updateProgram(response.data.id, {
            ...payload,
            thumbnailUrl: uploadedThumbnailUrl
          });
        }
      }

      formElement.reset();
      closeProgramDialog();
      onMessage({ tone: "success", text: programEditor ? "Program updated." : `${title} program created.` });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSavingProgram(false);
    }
  }

  async function updateProgramPlan(event: FormEvent<HTMLFormElement>, plan: ProgramPlanResponse) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await adminLmsApi.updatePlan(plan.id, {
        name: String(form.get("name") ?? "").trim(),
        code: String(form.get("code") ?? "").trim(),
        actualPrice: Number(form.get("actualPrice") ?? 0),
        offerPrice: Number(form.get("offerPrice") ?? 0),
        reserveAmount: Number(form.get("reserveAmount") ?? 0),
        features: parseMultilineList(String(form.get("features") ?? "")),
        isActive: form.get("isActive") === "on"
      });
      onMessage({ tone: "success", text: `${plan.name} plan updated.` });
      if (planEditorProgram) {
        const response = await adminLmsApi.getProgram(planEditorProgram.id);
        setPlanEditorProgram(response.data);
      }
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function restoreMissingPlans() {
    if (!planEditorProgram) return;

    const existingCodes = new Set(planEditorProgram.plans.map((plan) => plan.code));
    const missingPlans = defaultProgramPlans.filter((plan) => !existingCodes.has(plan.code));

    if (missingPlans.length === 0) {
      onMessage({ tone: "success", text: "All three plans are already configured." });
      return;
    }

    try {
      await Promise.all(missingPlans.map((plan) => adminLmsApi.createPlan(planEditorProgram.id, {
        name: plan.name,
        code: plan.code,
        actualPrice: plan.actualPrice,
        offerPrice: plan.offerPrice,
        reserveAmount: plan.reserveAmount,
        features: plan.features,
        isActive: true
      })));
      const response = await adminLmsApi.getProgram(planEditorProgram.id);
      setPlanEditorProgram(response.data);
      onMessage({ tone: "success", text: "Missing program plans restored." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  function openCategoryDialog(category?: ProgramCategoryResponse) {
    setCategoryEditor(category ?? null);
    setCategoryDialogMode(category ? "edit" : "create");
  }

  function closeCategoryDialog() {
    setCategoryDialogMode(null);
    setCategoryEditor(null);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const isPublished = String(form.get("isPublished") ?? "true") === "true";
    const payload = {
      name,
      slug: toSlug(slug || name),
      description,
      isPublished
    };

    setIsSavingCategory(true);
    onMessage(null);
    try {
      if (categoryEditor) {
        await adminLmsApi.updateCategory(categoryEditor.id, payload);
      } else {
        await adminLmsApi.createCategory(payload);
      }

      formElement.reset();
      closeCategoryDialog();
      onMessage({ tone: "success", text: categoryEditor ? "Category updated." : "Category created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function createModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const programId = String(form.get("programId") ?? "");

    try {
      await adminLmsApi.createModule(programId, {
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim()
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Curriculum module created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editModule(module: CurriculumModuleResponse) {
    const title = window.prompt("Module title", module.title);
    if (title === null) {
      return;
    }

    const description = window.prompt("Module description", module.description);
    if (description === null) {
      return;
    }

    try {
      await adminLmsApi.updateModule(module.id, { title, description });
      onMessage({ tone: "success", text: "Curriculum module updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function addLesson(module: CurriculumModuleResponse) {
    const title = window.prompt("Lesson title");
    if (!title) {
      return;
    }

    const summary = window.prompt("Lesson summary");
    if (!summary) {
      return;
    }

    try {
      await adminLmsApi.createLesson(module.id, {
        title,
        summary,
        durationMinutes: 45,
        accessLevel: 3
      });
      onMessage({ tone: "success", text: "Lesson created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await adminLmsApi.createProject({
        programId: String(form.get("programId") ?? ""),
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        requiredArtifacts: parseCommaList(String(form.get("requiredArtifacts") ?? "")),
        maxScore: Number(form.get("maxScore") ?? 100),
        isPublished: form.get("isPublished") === "on"
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Project created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editProject(project: ProjectResponse) {
    const title = window.prompt("Project title", project.title);
    if (title === null) {
      return;
    }

    try {
      await adminLmsApi.updateProject(project.id, {
        programId: project.programId,
        title,
        description: project.description,
        requiredArtifacts: project.requiredArtifacts,
        maxScore: project.maxScore,
        isPublished: project.isPublished
      });
      onMessage({ tone: "success", text: "Project updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await adminLmsApi.createCoupon({
        code: String(form.get("code") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        discountValue: Number(form.get("discountValue") ?? 0),
        isPercentage: form.get("isPercentage") === "on",
        isActive: form.get("isActive") === "on"
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Coupon created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editCoupon(coupon: CouponResponse) {
    const description = window.prompt("Coupon description", coupon.description);
    if (description === null) {
      return;
    }

    try {
      await adminLmsApi.updateCoupon(coupon.id, {
        code: coupon.code,
        description,
        discountValue: coupon.discountValue,
        isPercentage: coupon.isPercentage,
        isActive: coupon.isActive,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt
      });
      onMessage({ tone: "success", text: "Coupon updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function verifyPayment(payment: PaymentTransactionResponse) {
    const reference = window.prompt("Payment reference", payment.gatewayPaymentId ?? "");
    if (reference === null) {
      return;
    }

    try {
      await adminLmsApi.updatePaymentStatus(payment.id, {
        status: 2,
        gatewayPaymentId: reference.trim() || undefined
      });
      onMessage({ tone: "success", text: "Payment verified." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function revokeCertificate(certificate: CertificateResponse) {
    try {
      await adminLmsApi.updateCertificateStatus(certificate.id, { status: 3 });
      onMessage({ tone: "success", text: "Certificate revoked." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const moduleId = String(form.get("moduleId") ?? "");

    try {
      await adminLmsApi.createLesson(moduleId, {
        title: String(form.get("title") ?? "").trim(),
        summary: String(form.get("summary") ?? "").trim(),
        videoUrl: String(form.get("videoUrl") ?? "").trim() || undefined,
        notesUrl: String(form.get("notesUrl") ?? "").trim() || undefined,
        durationMinutes: Number(form.get("durationMinutes") ?? 45),
        accessLevel: Number(form.get("accessLevel") ?? 3)
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Lesson created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editLesson(lesson: LessonResponse) {
    const title = window.prompt("Lesson title", lesson.title);
    if (title === null) {
      return;
    }

    const summaryText = window.prompt("Lesson summary", lesson.summary);
    if (summaryText === null) {
      return;
    }

    try {
      await adminLmsApi.updateLesson(lesson.id, {
        title,
        summary: summaryText,
        videoUrl: lesson.videoUrl,
        notesUrl: lesson.notesUrl,
        durationMinutes: lesson.durationMinutes,
        accessLevel: accessLevelValue(lesson.accessLevel)
      });
      onMessage({ tone: "success", text: "Lesson updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function updateEnrollment(enrollment: EnrollmentResponse, status: number) {
    try {
      await adminLmsApi.updateEnrollmentStatus(enrollment.id, {
        status,
        lockedReason: status === 2 ? undefined : "Updated by admin."
      });
      onMessage({ tone: "success", text: "Enrollment updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function createNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const target = String(form.get("target") ?? "Students");
    const userId = String(form.get("userId") ?? "");

    if (target === "User" && !userId) {
      onMessage({ tone: "error", text: "Choose a user for the notification." });
      return;
    }

    try {
      await adminLmsApi.createNotification({
        userId: target === "User" ? userId : undefined,
        title: String(form.get("title") ?? "").trim(),
        body: String(form.get("body") ?? "").trim(),
        actionUrl: String(form.get("actionUrl") ?? "").trim() || undefined,
        sendToAllUsers: target === "All",
        sendToAllStudents: target === "Students"
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Notification sent." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  const isCategoriesModule = activeModule === "Categories";
  const isProgramsModule = activeModule === "Programs";
  const usesCatalogModuleHero = isCategoriesModule || isProgramsModule;
  const selectedCategorySlug = searchParams.get("category");
  const selectedProgramCategory = selectedCategorySlug
    ? categories.find((category) => category.slug.toLowerCase() === selectedCategorySlug.toLowerCase())
    : null;
  const selectedProgramId = searchParams.get("programId");
  const visiblePrograms = selectedProgramCategory
    ? programs.filter((program) => program.categoryId === selectedProgramCategory.id)
    : programs;
  const visibleCurriculum = selectedProgramId
    ? adminCurriculum.filter((module) => module.programId === selectedProgramId)
    : adminCurriculum;
  const selectedCurriculumProgram = selectedProgramId
    ? programs.find((program) => program.id === selectedProgramId)
    : null;
  const categoryProgramCount = categories.reduce((total, category) => total + category.programs.length, 0);
  const visibleProgramCounts = {
    total: visiblePrograms.length,
    published: visiblePrograms.filter((program) => program.status === "Published").length,
    draft: visiblePrograms.filter((program) => program.status === "Draft").length,
    archived: visiblePrograms.filter((program) => program.status === "Archived").length
  };
  const lessons = adminCurriculum.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      programTitle: programs.find((program) => program.id === module.programId)?.title ?? "Program"
    }))
  );

  const showPrograms = activeModule === "Overview" || activeModule === "Programs";
  const showModule = (module: string) => activeModule === module;

  return (
    <section className={`dashboard-card lms-admin-panel${usesCatalogModuleHero ? " lms-admin-panel--categories" : ""}`}>
      {usesCatalogModuleHero ? (
        <div className="category-page-header">
          <div>
            <span className="eyebrow">LMS engine</span>
            <h2>{isProgramsModule ? "Programs" : "Categories"}</h2>
            <p>
              {isProgramsModule
                ? selectedProgramCategory
                  ? `${selectedProgramCategory.name} programs ready to edit, plan, and organize.`
                  : `${programs.length} programs ready to edit, plan, and organize.`
                : `${categories.length} domains and ${categoryProgramCount} programs organized for the website.`}
            </p>
          </div>
          <button
            className="primary-action category-create-button"
            type="button"
            onClick={() => isProgramsModule ? void openProgramDialog() : openCategoryDialog()}
          >
            {isProgramsModule ? <BookOpen size={18} /> : <Layers3 size={18} />}
            {isProgramsModule ? "Create program" : "Create category"}
          </button>
        </div>
      ) : (
        <div className="card-title-row">
          <div>
            <span className="eyebrow">LMS engine</span>
            <h2>{activeModule === "Overview" ? "Programs, payments, and operations" : activeModule}</h2>
            <p>
              {summary?.publishedPrograms ?? 0} published programs, {summary?.activeEnrollments ?? 0} active enrollments.
            </p>
          </div>
          <Layers3 size={23} />
        </div>
      )}

      <div className={usesCatalogModuleHero ? "category-admin-layout" : "lms-admin-grid"}>
        {showModule("Categories") ? (
          <section className="category-admin-panel">
            <div className="category-admin-grid">
              {categories.length === 0 ? <div className="table-state">No categories yet.</div> : null}
              {categories.map((category) => (
                <article
                  key={category.id}
                  className={`category-admin-card${category.isPublished === false ? " is-inactive" : ""}`}
                >
                  <div className="category-admin-card__top">
                    <span className={category.isPublished === false ? "status-pill status-pill--soft" : "status-pill status-pill--active"}>
                      {category.isPublished === false ? "Inactive" : "Active"}
                    </span>
                    <button
                      className="category-admin-card__edit"
                      type="button"
                      onClick={() => openCategoryDialog(category)}
                      title={`Edit ${category.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>

                  <div className="category-admin-card__body">
                    <div className="category-admin-card__title-row">
                      <span className="category-admin-card__icon">
                        <Layers3 size={20} />
                      </span>
                      <div>
                        <strong>{category.name}</strong>
                        <small>{category.isPublished === false ? "Hidden from website" : "Visible on website"}</small>
                      </div>
                    </div>
                    <p>{category.description || "No description added yet."}</p>
                  </div>

                  <div className="category-admin-card__footer">
                    <small>{category.programs.length} program{category.programs.length === 1 ? "" : "s"}</small>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard?section=Programs&category=${encodeURIComponent(category.slug)}`)}
                    >
                      Explore programs
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Categories") && categoryDialogMode ? createPortal((
          <div className="category-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCategoryDialog();
            }
          }}>
            <section className="category-dialog" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title">
              <div className="category-dialog__header">
                <span className="category-dialog__icon">
                  <Layers3 size={22} />
                </span>
                <div>
                  <span className="eyebrow">Category</span>
                  <h3 id="category-dialog-title">{categoryDialogMode === "edit" ? "Edit category" : "Create category"}</h3>
                  <p>{categoryDialogMode === "edit" ? "Update how this category appears across admin and website pages." : "Create a clean learning domain for programs on the website."}</p>
                </div>
                <button type="button" onClick={closeCategoryDialog} title="Close dialog">
                  <X size={18} />
                </button>
              </div>

              <form
                className="category-dialog__form"
                key={categoryEditor?.id ?? "create-category"}
                onSubmit={saveCategory}
              >
                <label>
                  <span>Name</span>
                  <input name="name" defaultValue={categoryEditor?.name ?? ""} minLength={2} placeholder="Example: Healthcare" required />
                </label>
                <label>
                  <span>Slug</span>
                  <input
                    name="slug"
                    defaultValue={categoryEditor?.slug ?? ""}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="healthcare"
                    required
                    title="Use lowercase letters, numbers, and hyphens only."
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    name="description"
                    defaultValue={categoryEditor?.description ?? ""}
                    minLength={10}
                    placeholder="Describe this learning domain"
                    required
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select name="isPublished" defaultValue={categoryEditor?.isPublished === false ? "false" : "true"}>
                    <option value="true">Active - show on website</option>
                    <option value="false">Inactive - hide from website</option>
                  </select>
                </label>
                <div className="category-dialog__actions">
                  <button className="secondary-action" type="button" onClick={closeCategoryDialog}>
                    Cancel
                  </button>
                  <button className="primary-action" type="submit" disabled={isSavingCategory}>
                    <Save size={18} />
                    {isSavingCategory ? "Saving" : "Save category"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ), document.body) : null}

        {isProgramsModule ? (
          <section className="program-admin-panel">
            <div className="program-admin-summary" aria-label="Program status summary">
              <span>
                <strong>{visibleProgramCounts.total}</strong>
                Total
              </span>
              <span>
                <strong>{visibleProgramCounts.published}</strong>
                Published
              </span>
              <span>
                <strong>{visibleProgramCounts.draft}</strong>
                Draft
              </span>
              <span>
                <strong>{visibleProgramCounts.archived}</strong>
                Archived
              </span>
            </div>

            {selectedProgramCategory ? (
              <div className="program-filter-banner">
                <div>
                  <span>Category filter</span>
                  <strong>{selectedProgramCategory.name}</strong>
                </div>
                <button type="button" onClick={() => navigate("/dashboard?section=Programs")}>
                  Show all programs
                </button>
              </div>
            ) : null}

            <div className="program-admin-grid">
              {visiblePrograms.length === 0 ? <div className="table-state">No programs found.</div> : null}
              {visiblePrograms.map((program) => (
                <article
                  key={program.id}
                  className={`program-admin-card${program.status === "Published" ? "" : " is-inactive"}`}
                >
                  <div className="program-admin-card__media">
                    <img
                      alt={`${program.title} thumbnail`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getProgramImage(program.slug, program.categoryName);
                      }}
                      src={toApiAcceptableThumbnailUrl(program.thumbnailUrl) || getProgramImage(program.slug, program.categoryName)}
                    />
                    <div className="program-admin-card__media-actions">
                      <span className={statusClassName(program.status)}>{formatStatusLabel(program.status)}</span>
                      <button
                        type="button"
                        onClick={() => void openProgramDialog(program)}
                        disabled={programEditorLoadingId === program.id}
                        title={`Edit ${program.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="program-admin-card__body">
                    <div>
                      <strong>{program.title}</strong>
                      <small>{program.categoryName}</small>
                    </div>
                    <p>{program.shortDescription}</p>
                  </div>

                  <div className="program-admin-card__footer">
                    <button type="button" onClick={() => navigate(`/dashboard?section=Curriculum&programId=${program.id}`)}>
                      <ListChecks size={16} />
                      Manage curriculum
                    </button>
                    <button
                      type="button"
                      disabled={isPlanEditorLoading}
                      onClick={() => void openPlanEditor(program)}
                    >
                      <WalletCards size={16} />
                      Manage plans
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {isProgramsModule && programDialogMode ? createPortal((
          <div className="category-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProgramDialog();
            }
          }}>
            <section className="category-dialog program-dialog" role="dialog" aria-modal="true" aria-labelledby="program-dialog-title">
              <div className="category-dialog__header">
                <span className="category-dialog__icon">
                  <BookOpen size={22} />
                </span>
                <div>
                  <span className="eyebrow">Program</span>
                  <h3 id="program-dialog-title">{programDialogMode === "edit" ? "Edit program" : "Create program"}</h3>
                  <p>{programDialogMode === "edit" ? "Update the public program card, status, and learning details." : "Create a program and keep it ready for curriculum and pricing setup."}</p>
                </div>
                <button type="button" onClick={closeProgramDialog} title="Close dialog">
                  <X size={18} />
                </button>
              </div>

              <form
                className="category-dialog__form program-dialog__form"
                key={programEditor?.id ?? selectedProgramCategory?.id ?? "create-program"}
                onSubmit={saveProgram}
              >
                <div className="program-thumbnail-field">
                  <div className="program-thumbnail-field__preview">
                    <img
                      alt="Program thumbnail preview"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getProgramImage(programEditor?.slug ?? "", programEditor?.categoryName ?? selectedProgramCategory?.name ?? "");
                      }}
                      src={programThumbnailPreviewUrl || programThumbnailUrl || getProgramImage(programEditor?.slug ?? "", programEditor?.categoryName ?? selectedProgramCategory?.name ?? "")}
                    />
                  </div>
                  <div className="program-thumbnail-field__controls">
                    <div>
                      <span>Thumbnail</span>
                      <strong>Choose from media or upload an image</strong>
                    </div>
                    <div className="program-thumbnail-media">
                      {programThumbnailOptions.map((option) => (
                        <button
                          key={option.url}
                          className={programThumbnailUrl === option.url ? "is-selected" : undefined}
                          data-label={option.label}
                          type="button"
                          onClick={() => chooseProgramThumbnailUrl(option.url)}
                        >
                          <img alt="" src={option.url} />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="program-thumbnail-actions">
                      <label>
                        <UploadCloud size={17} />
                        Upload image
                        <input
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          type="file"
                          onChange={(event) => chooseProgramThumbnailFile(event.currentTarget.files?.[0] ?? null)}
                        />
                      </label>
                      <label>
                        <Image size={17} />
                        <input
                          aria-label="Thumbnail URL"
                          placeholder="Paste image URL"
                          value={programThumbnailUrl}
                          onChange={(event) => chooseProgramThumbnailUrl(event.currentTarget.value)}
                        />
                      </label>
                    </div>
                    {programThumbnailFile ? <small>{programThumbnailFile.name} selected</small> : null}
                  </div>
                </div>
                <label>
                  <span>Domain</span>
                  <select name="categoryId" defaultValue={programEditor?.categoryId ?? selectedProgramCategory?.id ?? ""} required>
                    <option value="">Choose domain</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select name="status" defaultValue={programStatusValue(programEditor?.status ?? "Published")}>
                    <option value="1">Draft</option>
                    <option value="2">Published</option>
                    <option value="3">Archived</option>
                  </select>
                </label>
                <label>
                  <span>Program title</span>
                  <input name="title" defaultValue={programEditor?.title ?? ""} placeholder="Example: Robotics" required />
                </label>
                <label>
                  <span>Slug</span>
                  <input
                    name="slug"
                    defaultValue={programEditor?.slug ?? ""}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="robotics"
                    title="Use lowercase letters, numbers, and hyphens only."
                  />
                </label>
                <label className="program-dialog__wide-field">
                  <span>Short description</span>
                  <textarea
                    name="shortDescription"
                    defaultValue={programEditor?.shortDescription ?? ""}
                    placeholder="Short website card description"
                    required
                  />
                </label>
                <label className="program-dialog__wide-field">
                  <span>Overview</span>
                  <textarea
                    name="overview"
                    defaultValue={programEditor?.overview ?? ""}
                    placeholder="Detailed program overview"
                  />
                </label>
                <label>
                  <span>Duration</span>
                  <input name="duration" defaultValue={programEditor?.duration ?? "8 to 16 weeks"} />
                </label>
                <label>
                  <span>Level</span>
                  <input name="level" defaultValue={programEditor?.level ?? "Beginner to job-ready"} />
                </label>
                <label>
                  <span>Learning mode</span>
                  <input name="learningMode" defaultValue={programEditor?.learningMode ?? "Live + recorded + project practice"} />
                </label>
                <label>
                  <span>Skills</span>
                  <input name="skills" defaultValue={programEditor?.skills.join(", ") ?? ""} placeholder="Python, SQL, Projects" />
                </label>
                <label>
                  <span>Certification name</span>
                  <input name="certificationName" defaultValue={programEditor?.certificationName ?? ""} placeholder="Joviq program certification" />
                </label>
                <label className="program-dialog__wide-field">
                  <span>Outcomes</span>
                  <textarea
                    name="outcomes"
                    defaultValue={programEditor?.outcomes.join("\n") ?? ""}
                    placeholder={"Portfolio-ready projects\nReviewed project work\nInterview preparation support"}
                  />
                </label>
                <div className="category-dialog__actions">
                  <button className="secondary-action" type="button" onClick={closeProgramDialog}>
                    Cancel
                  </button>
                  <button className="primary-action" type="submit" disabled={isSavingProgram || categories.length === 0}>
                    <Save size={18} />
                    {isSavingProgram ? "Saving" : "Save program"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ), document.body) : null}

        {showPrograms && !isProgramsModule ? (
          <form className="lms-mini-form" onSubmit={createProgram}>
            <h3>Create program</h3>
            <label>
              Domain
              <select name="categoryId" required>
                <option value="">Choose domain</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Program title
              <input name="title" placeholder="Example: Robotics" required />
            </label>
            <div className="lms-form-two">
              <label>
                Duration
                <input name="duration" defaultValue="8 to 16 weeks" />
              </label>
              <label>
                Level
                <input name="level" defaultValue="Beginner to job-ready" />
              </label>
            </div>
            <label>
              Learning mode
              <input name="learningMode" defaultValue="Live + recorded + project practice" />
            </label>
            <label>
              Skills
              <input name="skills" placeholder="Python, SQL, Projects, Interview prep" />
            </label>
            <button className="primary-action" type="submit" disabled={isCreatingProgram || categories.length === 0}>
              <UserPlus size={18} />
              {isCreatingProgram ? "Creating" : "Create program"}
            </button>
          </form>
        ) : null}

        {showPrograms && !isProgramsModule ? (
          <section className="lms-list-panel">
            <h3>Catalog</h3>
            <div className="lms-scroll-list">
              {programs.map((program) => (
                <article key={program.id} className="lms-list-item">
                  <div>
                    <strong>{program.title}</strong>
                    <span>{program.categoryName} - {program.duration}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{program.status}</small>
                    <button
                      type="button"
                      disabled={isPlanEditorLoading}
                      onClick={() => void openPlanEditor(program)}
                    >
                      {isPlanEditorLoading ? "Loading" : "Manage plans"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeModule === "Programs" && planEditorProgram ? createPortal((
          <div className="category-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePlanEditor();
            }
          }}>
            <section className="category-dialog admin-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-plan-dialog-title">
              <div className="admin-plan-editor" id="admin-plan-editor">
                <div className="admin-plan-editor__header">
                  <span className="category-dialog__icon">
                    <WalletCards size={22} />
                  </span>
                  <div>
                    <span>Pricing and access</span>
                    <h3 id="admin-plan-dialog-title">{planEditorProgram.title}</h3>
                    <p>Update plan prices, access amount, features, and website visibility.</p>
                  </div>
                  <div className="admin-plan-editor__actions">
                    <button type="button" onClick={() => void restoreMissingPlans()}>
                      <RotateCcw size={16} />
                      Restore plans
                    </button>
                    <button type="button" onClick={closePlanEditor} title="Close dialog">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="admin-plan-editor__grid">
                  {planEditorProgram.plans.map((plan) => (
                    <form
                      key={`${plan.id}-${plan.actualPrice}-${plan.offerPrice}-${plan.features.join("|")}-${plan.isActive}`}
                      className="lms-mini-form admin-plan-form"
                      onSubmit={(event) => void updateProgramPlan(event, plan)}
                    >
                      <div className="admin-plan-form__title">
                        <strong>{plan.name}</strong>
                        <span>{plan.code}</span>
                      </div>
                      <div className="lms-form-two">
                        <label>
                          Plan name
                          <input name="name" defaultValue={plan.name} required />
                        </label>
                        <label>
                          Plan code
                          <input name="code" defaultValue={plan.code} required />
                        </label>
                      </div>
                      <div className="lms-form-two">
                        <label>
                          Actual price (INR)
                          <input name="actualPrice" type="number" min="0" defaultValue={plan.actualPrice} required />
                        </label>
                        <label>
                          Offer price (INR)
                          <input name="offerPrice" type="number" min="0" defaultValue={plan.offerPrice} required />
                        </label>
                      </div>
                      <label>
                        Enrollment amount (INR)
                        <input name="reserveAmount" type="number" min="0" defaultValue={plan.reserveAmount} required />
                      </label>
                      <label>
                        Features
                        <textarea name="features" defaultValue={plan.features.join("\n")} required />
                      </label>
                      <label className="inline-check">
                        <input name="isActive" type="checkbox" defaultChecked={plan.isActive} />
                        Show this plan publicly
                      </label>
                      <button className="primary-action" type="submit">Save plan</button>
                    </form>
                  ))}
                  {planEditorProgram.plans.length === 0 ? (
                    <div className="table-state">No plans configured. Use Restore plans to create all three.</div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ), document.body) : null}

        {showModule("Curriculum") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <div className="curriculum-admin-heading">
              <div>
                <h3>Curriculum modules</h3>
                {selectedCurriculumProgram ? <p>Managing curriculum for {selectedCurriculumProgram.title}.</p> : null}
              </div>
              {selectedCurriculumProgram ? (
                <button type="button" onClick={() => navigate("/dashboard?section=Curriculum")}>
                  Show all modules
                </button>
              ) : null}
            </div>
            <form
              className="lms-mini-form lms-mini-form--inline"
              key={selectedCurriculumProgram?.id ?? "all-curriculum"}
              onSubmit={createModule}
            >
              <select name="programId" defaultValue={selectedCurriculumProgram?.id ?? ""} required>
                <option value="">Choose program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
              <input name="title" placeholder="Module title" required />
              <input name="description" placeholder="Module description" required />
              <button className="primary-action" type="submit">Create module</button>
            </form>
            <div className="lms-scroll-list">
              {visibleCurriculum.length === 0 ? <div className="table-state">No curriculum modules yet.</div> : null}
              {visibleCurriculum.map((module) => (
                <article key={module.id} className="lms-list-item">
                  <div>
                    <strong>{module.title}</strong>
                    <span>{module.description || `${module.lessons.length} lessons configured`}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{module.lessons.length} lessons</small>
                    <button type="button" onClick={() => void editModule(module)}>Edit</button>
                    <button type="button" onClick={() => void addLesson(module)}>Add lesson</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Lessons") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Lessons</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createLesson}>
              <select name="moduleId" required>
                <option value="">Choose module</option>
                {adminCurriculum.map((module) => (
                  <option key={module.id} value={module.id}>
                    {programs.find((program) => program.id === module.programId)?.title ?? "Program"} - {module.title}
                  </option>
                ))}
              </select>
              <input name="title" placeholder="Lesson title" required />
              <input name="summary" placeholder="Lesson summary" required />
              <input name="durationMinutes" type="number" min="1" defaultValue="45" />
              <select name="accessLevel" defaultValue="3">
                <option value="1">Preview</option>
                <option value="2">Reserved</option>
                <option value="3">Full</option>
              </select>
              <input name="videoUrl" placeholder="Video URL" />
              <input name="notesUrl" placeholder="Notes URL" />
              <button className="primary-action" type="submit">Create lesson</button>
            </form>
            <div className="lms-scroll-list">
              {lessons.length === 0 ? <div className="table-state">No lessons yet.</div> : null}
              {lessons.map((lesson) => (
                <article key={lesson.id} className="lms-list-item">
                  <div>
                    <strong>{lesson.title}</strong>
                    <span>{lesson.programTitle} - {lesson.moduleTitle} - {lesson.durationMinutes} min</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{lesson.accessLevel}</small>
                    <button type="button" onClick={() => void editLesson(lesson)}>Edit</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Projects") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Projects</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createProject}>
              <select name="programId" required>
                <option value="">Choose program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
              <input name="title" placeholder="Project title" required />
              <input name="description" placeholder="Project description" required />
              <input name="requiredArtifacts" placeholder="GitHub, Demo, Report" />
              <input name="maxScore" type="number" min="1" max="100" defaultValue="100" />
              <label className="inline-check">
                <input name="isPublished" type="checkbox" defaultChecked />
                Published
              </label>
              <button className="primary-action" type="submit">Create project</button>
            </form>
            <div className="lms-scroll-list">
              {adminProjects.length === 0 ? <div className="table-state">No projects yet.</div> : null}
              {adminProjects.map((project) => (
                <article key={project.id} className="lms-list-item">
                  <div>
                    <strong>{project.title}</strong>
                    <span>{project.requiredArtifacts.join(", ") || project.description}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{project.isPublished ? "Published" : "Draft"}</small>
                    <button type="button" onClick={() => void editProject(project)}>Edit</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Enrollments") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Enrollments</h3>
            <div className="lms-scroll-list">
              {adminEnrollments.length === 0 ? <div className="table-state">No enrollments yet.</div> : null}
              {adminEnrollments.map((enrollment) => (
                <article key={enrollment.id} className="lms-list-item">
                  <div>
                    <strong>{enrollment.programTitle}</strong>
                    <span>{formatCurrency(enrollment.paidAmount)} paid of {formatCurrency(enrollment.totalAmount)}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{enrollment.status}</small>
                    {enrollment.status !== "Active" ? (
                      <button type="button" onClick={() => void updateEnrollment(enrollment, 2)}>Activate</button>
                    ) : null}
                    {enrollment.status !== "Cancelled" ? (
                      <button type="button" onClick={() => void updateEnrollment(enrollment, 4)}>Cancel</button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Payments") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Payments</h3>
            <div className="lms-scroll-list">
              {adminPayments.length === 0 ? <div className="table-state">No payments yet.</div> : null}
              {adminPayments.map((payment) => (
                <article key={payment.id} className="lms-list-item">
                  <div>
                    <strong>{formatCurrency(payment.amount)}</strong>
                    <span>{payment.mode} - {formatDate(payment.createdAt)}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{payment.status}</small>
                    {payment.status !== "Verified" ? (
                      <button type="button" onClick={() => void verifyPayment(payment)}>Verify</button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Coupons") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Coupons</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createCoupon}>
              <input name="code" placeholder="Code" required />
              <input name="description" placeholder="Description" required />
              <input name="discountValue" type="number" min="1" defaultValue="10" required />
              <label className="inline-check">
                <input name="isPercentage" type="checkbox" defaultChecked />
                Percentage
              </label>
              <label className="inline-check">
                <input name="isActive" type="checkbox" defaultChecked />
                Active
              </label>
              <button className="primary-action" type="submit">Create coupon</button>
            </form>
            <div className="lms-scroll-list">
              {adminCoupons.length === 0 ? <div className="table-state">No coupons yet.</div> : null}
              {adminCoupons.map((coupon) => (
                <article key={coupon.id} className="lms-list-item">
                  <div>
                    <strong>{coupon.code}</strong>
                    <span>{coupon.description}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{coupon.isPercentage ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</small>
                    <button type="button" onClick={() => void editCoupon(coupon)}>Edit</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Certificates") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Certificates</h3>
            <div className="lms-scroll-list">
              {adminCertificates.length === 0 ? <div className="table-state">No certificates issued yet.</div> : null}
              {adminCertificates.map((certificate) => (
                <article key={certificate.id} className="lms-list-item">
                  <div>
                    <strong>{certificate.certificateId}</strong>
                    <span>{certificate.programTitle} - {certificate.type}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{certificate.status}</small>
                    {certificate.status !== "Revoked" ? (
                      <button type="button" onClick={() => void revokeCertificate(certificate)}>Revoke</button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Notifications") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Notifications</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createNotification}>
              <select name="target" defaultValue="Students">
                <option value="Students">All students</option>
                <option value="All">All users</option>
                <option value="User">One user</option>
              </select>
              <select name="userId">
                <option value="">Choose user</option>
                {students.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} - {user.email}
                  </option>
                ))}
              </select>
              <input name="title" placeholder="Title" required />
              <input name="body" placeholder="Message" required />
              <input name="actionUrl" placeholder="/dashboard" />
              <button className="primary-action" type="submit">Send notification</button>
            </form>
            <div className="lms-scroll-list">
              {adminNotifications.length === 0 ? <div className="table-state">No notifications yet.</div> : null}
              {adminNotifications.map((notification) => (
                <article key={notification.id} className="lms-list-item">
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                    <span>{notification.userName ?? "User"} - {notification.userEmail ?? notification.userId}</span>
                  </div>
                  <small>{notification.status}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Audit Logs") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Audit logs</h3>
            <div className="lms-scroll-list">
              {auditLogs.length === 0 ? <div className="table-state">No audit logs in the last 15 days.</div> : null}
              {auditLogs.map((log) => (
                <article key={log.id} className="lms-list-item">
                  <div>
                    <strong>{log.eventType}</strong>
                    <span>{formatDateTime(log.createdAt)} - {log.userId ?? "public"}</span>
                    {log.metadataJson ? <span>{compactJson(log.metadataJson)}</span> : null}
                  </div>
                  <small>15 day retention</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

      </div>
    </section>
  );
}

type AdminPeoplePanelProps = {
  actionUserId: string | null;
  currentUserId?: string;
  emptyText: string;
  enrollments: EnrollmentResponse[];
  isCreating: boolean;
  isLoading: boolean;
  page: PagedResult<AdminUserResponse> | null;
  query: PeopleQueryState;
  role: AssignableRoleName;
  title: string;
  users: AdminUserResponse[];
  onCreateUser: (event: FormEvent<HTMLFormElement>, role: AssignableRoleName) => Promise<boolean>;
  onMessage: (message: MessageState) => void;
  onQueryChange: (query: PeopleQueryState) => void;
  onSaveUserEdit: (event: FormEvent<HTMLFormElement>, user: AdminUserResponse) => Promise<boolean>;
  onUserAction: (user: AdminUserResponse, action: "lock" | "unlock" | "reset") => Promise<void>;
};

function AdminPeoplePanel({
  actionUserId,
  currentUserId,
  emptyText,
  enrollments,
  isCreating,
  isLoading,
  page,
  query,
  role,
  title,
  users,
  onCreateUser,
  onMessage,
  onQueryChange,
  onSaveUserEdit,
  onUserAction
}: AdminPeoplePanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [temporaryPassword, setTemporaryPassword] = useState(() => generateTemporaryPassword());
  const [showPassword, setShowPassword] = useState(false);
  const Icon = role === "Student" ? GraduationCap : BriefcaseBusiness;
  const roleLabel = role.toLowerCase();
  const activeCount = users.filter((user) => user.accountStatus === "Active").length;
  const onboardedCount = users.filter((user) => user.onboardingStatus === "Completed").length;
  const pendingCount = users.filter((user) => user.accountStatus === "PendingEmailVerification").length;
  const totalCount = page?.totalCount ?? users.length;
  const totalPages = Math.max(page?.totalPages ?? 1, 1);
  const startResult = totalCount === 0 ? 0 : ((page?.page ?? query.page) - 1) * query.pageSize + 1;
  const endResult = totalCount === 0 ? 0 : Math.min(startResult + users.length - 1, totalCount);
  const selectedSort = `${query.sortBy}:${query.sortDirection}`;

  useEffect(() => {
    setSearchDraft(query.search);
  }, [query.search]);

  async function copyTemporaryPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      onMessage({ tone: "success", text: "Temporary password copied." });
    } catch {
      onMessage({ tone: "error", text: "Could not copy password. Copy it manually from the field." });
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    const created = await onCreateUser(event, role);
    if (created) {
      setTemporaryPassword(generateTemporaryPassword());
      setShowPassword(false);
      setIsAdding(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>, user: AdminUserResponse) {
    const saved = await onSaveUserEdit(event, user);
    if (saved) {
      setEditingUserId(null);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onQueryChange({ ...query, search: searchDraft.trim(), page: 1 });
  }

  function changeStatus(status: PeopleStatusFilter) {
    onQueryChange({ ...query, status, page: 1 });
  }

  function changeSort(value: string) {
    const [sortBy, sortDirection] = value.split(":") as [PeopleSortBy, PeopleSortDirection];
    onQueryChange({ ...query, sortBy, sortDirection, page: 1 });
  }

  function changePage(nextPage: number) {
    onQueryChange({ ...query, page: Math.min(Math.max(nextPage, 1), totalPages) });
  }

  return (
    <section className={`admin-people-page admin-people-page--${roleLabel}`}>
      <div className="admin-people-hero">
        <div className="admin-people-hero__copy">
          <div className="admin-people-hero__icon">
            <Icon size={30} />
          </div>
          <div>
            <div className="admin-people-hero__kicker">
              <span>Joviq LMS</span>
              <span>People workspace</span>
            </div>
            <h2>{title}</h2>
            <p>Add learners, review onboarding, and keep account access under control.</p>
          </div>
        </div>
        <div className="admin-people-actions">
          <button className="primary-action" type="button" onClick={() => setIsAdding((value) => !value)}>
            {isAdding ? <X size={18} /> : <UserPlus size={18} />}
            {isAdding ? "Close" : `Add ${role}`}
          </button>
        </div>
        <div className="admin-people-hero__metrics" aria-label={`${title} summary`}>
          <span>
            <strong>{totalCount}</strong>
            Total
          </span>
          <span>
            <strong>{activeCount}</strong>
            Active
          </span>
          <span>
            <strong>{onboardedCount}</strong>
            Onboarded
          </span>
          <span>
            <strong>{pendingCount}</strong>
            Pending email
          </span>
        </div>
      </div>

      {isAdding ? (
        <form className="dashboard-card admin-people-create" onSubmit={(event) => void submitCreate(event)}>
          <div className="admin-people-create__header">
            <div>
              <span className="eyebrow">New {roleLabel}</span>
              <h3>Add {role}</h3>
            </div>
            <span className="status-pill status-pill--soft">{role}</span>
          </div>

          <div className="admin-people-create__grid">
            <label>
              Full name
              <input name="fullName" placeholder={`${role} name`} required />
            </label>
            <label>
              Email
              <input name="email" type="email" pattern={emailPattern} placeholder="name@example.com" required />
            </label>
            <IndiaMobileInput label="Phone number" name="phoneNumber" required />
            <label>
              Temporary password
              <div className="password-field">
                <input
                  name="temporaryPassword"
                  type={showPassword ? "text" : "password"}
                  value={temporaryPassword}
                  readOnly
                />
                <button type="button" onClick={() => setTemporaryPassword(generateTemporaryPassword())} title="Generate password">
                  <Zap size={17} />
                </button>
                <button type="button" onClick={() => setShowPassword((value) => !value)} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
                <button type="button" onClick={() => void copyTemporaryPassword()} title="Copy password">
                  <ClipboardCopy size={17} />
                </button>
              </div>
            </label>
          </div>

          <div className="admin-people-create__actions">
            <button className="secondary-action" type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
            <button className="primary-action" type="submit" disabled={isCreating}>
              <UserPlus size={18} />
              {isCreating ? "Adding" : `Add ${role}`}
            </button>
          </div>
        </form>
      ) : null}

      <div className="admin-people-toolbar">
        <form className="admin-people-search" onSubmit={submitSearch}>
          <Search size={17} />
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={`Search ${roleLabel}s`}
          />
          <button className="secondary-action" type="submit">Search</button>
        </form>
        <label>
          <SlidersHorizontal size={16} />
          <select value={query.status} onChange={(event) => changeStatus(event.target.value as PeopleStatusFilter)}>
            {peopleStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <SlidersHorizontal size={16} />
          <select value={selectedSort} onChange={(event) => changeSort(event.target.value)}>
            {peopleSortOptions.map((option) => (
              <option key={`${option.sortBy}:${option.sortDirection}`} value={`${option.sortBy}:${option.sortDirection}`}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-people-list">
        {isLoading ? <div className="table-state">Loading {roleLabel}s...</div> : null}
        {!isLoading && users.length === 0 ? <div className="table-state">{emptyText}</div> : null}
        {!isLoading
          ? users.map((user) => {
              const phone = formatPhoneForDisplay(user.phoneNumber);
              const isEditing = editingUserId === user.id;
              const isExpanded = expandedUserId === user.id;
              const isLocked = user.accountStatus === "Locked";
              const isCurrentUser = user.id === currentUserId;
              const assignedRole = getAssignableUserRole(user);
              const profilePhotoUrl = user.profilePhotoUrl ? toApiFileUrl(user.profilePhotoUrl) : "";
              const userEnrollments = enrollments.filter((enrollment) => enrollment.studentId === user.id);
              const activeCourses = userEnrollments.filter((enrollment) => enrollment.status === "Active" || enrollment.status === "Reserved");
              const completedCourses = userEnrollments.filter((enrollment) => enrollment.status === "Completed");

              return (
                <article
                  key={user.id}
                  className={`admin-person-card${isEditing ? " is-editing" : ""}${isExpanded ? " is-expanded" : ""}`}
                >
                  <button
                    className="admin-person-card__profile"
                    type="button"
                    onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                    aria-expanded={isExpanded}
                    title={`View ${user.fullName}`}
                  >
                    <span className={`admin-person-card__avatar ${profilePhotoUrl ? "has-photo" : ""}`}>
                      {profilePhotoUrl ? <img src={profilePhotoUrl} alt={`${user.fullName} profile`} /> : getInitials(user.fullName)}
                    </span>
                    <span className="admin-person-card__identity">
                      <strong>{user.fullName}</strong>
                    </span>
                  </button>
                  <div className="admin-person-card__badges">
                    <span className={statusClassName(user.accountStatus)}>{formatStatusLabel(user.accountStatus)}</span>
                  </div>
                  <div className="admin-person-card__actions">
                    <button
                      type="button"
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      title={isExpanded ? "Hide details" : "View details"}
                    >
                      {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(isEditing ? null : user.id);
                        setExpandedUserId(null);
                      }}
                      title={isEditing ? "Close edit" : `Edit ${user.fullName}`}
                    >
                      {isEditing ? <X size={16} /> : <Pencil size={16} />}
                    </button>
                    <button
                      type="button"
                      disabled={isCurrentUser || actionUserId === `${user.id}-${isLocked ? "unlock" : "lock"}`}
                      onClick={() => void onUserAction(user, isLocked ? "unlock" : "lock")}
                      title={isLocked ? "Unlock account" : "Lock account"}
                    >
                      {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                    <button
                      type="button"
                      disabled={actionUserId === `${user.id}-reset`}
                      onClick={() => void onUserAction(user, "reset")}
                      title="Send reset link"
                    >
                      <Mail size={16} />
                    </button>
                  </div>

                  {isEditing ? (
                    <form className="admin-person-edit" onSubmit={(event) => void submitEdit(event, user)}>
                      <label>
                        Full name
                        <input name="fullName" defaultValue={user.fullName} required />
                      </label>
                      <label>
                        Email
                        <input name="email" type="email" pattern={emailPattern} defaultValue={user.email} required />
                      </label>
                      <IndiaMobileInput
                        label="Phone number"
                        name="phoneNumber"
                        defaultValue={toIndiaMobileDigits(user.phoneNumber)}
                        required
                      />
                      <label>
                        Account status
                        <select name="accountStatus" defaultValue={user.accountStatus}>
                          <option value="Active">Active</option>
                          <option value="PendingEmailVerification">Pending email verification</option>
                          <option value="Locked">Locked</option>
                        </select>
                      </label>
                      <label>
                        Role
                        <select name="role" defaultValue={assignedRole}>
                          <option value="Student">Student</option>
                        </select>
                      </label>
                      <div className="admin-person-edit__actions">
                        <button className="secondary-action" type="button" onClick={() => setEditingUserId(null)}>
                          Cancel
                        </button>
                        <button className="primary-action" type="submit" disabled={actionUserId === `${user.id}-edit`}>
                          <Save size={17} />
                          {actionUserId === `${user.id}-edit` ? "Saving" : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {!isEditing && isExpanded ? (
                    <div className="admin-person-detail">
                      <div className="admin-person-detail__contact">
                        <div>
                          <span>Email</span>
                          <strong>{user.email}</strong>
                        </div>
                        <div>
                          <span>Phone</span>
                          <strong>{phone?.text ?? "Phone missing"}</strong>
                        </div>
                      </div>

                      {role === "Student" ? (
                        <div className="admin-person-courses">
                          <div>
                            <h4>Active courses</h4>
                            {activeCourses.length === 0 ? <p>No active courses.</p> : null}
                            {activeCourses.map((course) => (
                              <span key={course.id}>{course.programTitle}</span>
                            ))}
                          </div>
                          <div>
                            <h4>Completed courses</h4>
                            {completedCourses.length === 0 ? <p>No completed courses.</p> : null}
                            {completedCourses.map((course) => (
                              <span key={course.id}>{course.programTitle}</span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          : null}
      </div>

      <div className="admin-people-pagination">
        <span>{totalCount === 0 ? "No results" : `${startResult}-${endResult} of ${totalCount}`}</span>
        <div>
          <button type="button" onClick={() => changePage(query.page - 1)} disabled={query.page <= 1 || isLoading} title="Previous page">
            <ChevronLeft size={16} />
            Previous
          </button>
          <strong>Page {Math.min(query.page, totalPages)} of {totalPages}</strong>
          <button type="button" onClick={() => changePage(query.page + 1)} disabled={query.page >= totalPages || isLoading} title="Next page">
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function StudentDashboard({ activeModule }: { activeModule: string }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<StudentLmsDashboardResponse | null>(null);
  const [workspace, setWorkspace] = useState<StudentProgramWorkspaceResponse | null>(null);
  const [programs, setPrograms] = useState<ProgramSummaryResponse[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});

  const loadStudentDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashboardResponse, workspaceResponse, programsResponse] = await Promise.all([
        studentLmsApi.getDashboard(),
        studentLmsApi.getWorkspace(),
        publicLmsApi.getPrograms()
      ]);

      setDashboard(dashboardResponse.data);
      setWorkspace(workspaceResponse.data);
      setPrograms(programsResponse.data);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function enroll(program: ProgramSummaryResponse, mode: 1 | 2) {
    setActionId(`${program.id}-${mode}`);
    setMessage(null);

    try {
      const details = await publicLmsApi.getProgram(program.slug);
      const plan =
        details.data.plans.find((item) => item.code === "INTERMEDIATE" && item.isActive) ??
        details.data.plans.find((item) => item.isActive);

      const enrollmentResponse = await studentLmsApi.createEnrollment({
        programId: program.id,
        programPlanId: plan?.id
      });

      await studentLmsApi.createPaymentCheckout({
        programId: program.id,
        programPlanId: plan?.id,
        enrollmentId: enrollmentResponse.data.id,
        mode
      });

      setMessage({
        tone: "success",
        text: mode === 1
          ? "Seat reserved. Payment is pending verification from admin."
          : "Enrollment created. Payment is pending verification from admin."
      });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function payBalance(mode: 1 | 2 | 3) {
    const enrollment = workspace?.enrollment ?? dashboard?.enrollment;
    if (!enrollment) {
      return;
    }

    setActionId(`payment-${mode}`);
    setMessage(null);

    try {
      await studentLmsApi.createPaymentCheckout({
        programId: enrollment.programId,
        programPlanId: enrollment.programPlanId,
        enrollmentId: enrollment.id,
        mode
      });
      setMessage({ tone: "success", text: "Payment request created. Admin verification will update access." });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function submitProject(projectId: string) {
    const value = projectDrafts[projectId]?.trim();
    if (!value) {
      setMessage({ tone: "error", text: "Add a GitHub, demo, or document URL first." });
      return;
    }

    setActionId(`project-${projectId}`);
    setMessage(null);

    try {
      await studentLmsApi.submitProject(projectId, { gitHubUrl: value });
      setProjectDrafts((drafts) => ({ ...drafts, [projectId]: "" }));
      setMessage({ tone: "success", text: "Project submitted for review." });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function markNotificationRead(notificationId: string) {
    setActionId(`notification-${notificationId}`);
    setMessage(null);

    try {
      await studentLmsApi.markNotificationRead(notificationId);
      setMessage({ tone: "success", text: "Notification marked as read." });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    void loadStudentDashboard();
  }, [loadStudentDashboard]);

  const enrollment = workspace?.enrollment ?? dashboard?.enrollment;
  const projects = workspace?.projects ?? [];
  const payments = workspace?.payments ?? [];
  const certificates = workspace?.certificates ?? [];
  const notifications = dashboard?.notifications ?? [];
  const showOverview = activeModule === "Overview";
  const showStudentModule = (...modules: string[]) => activeModule === "Overview" || modules.includes(activeModule);

  return (
    <section className="dashboard-stack">
      {showOverview ? (
        <section className="metric-grid">
          <DashboardMetric icon={BookOpen} label="Program status" value={dashboard?.programStatus ?? "-"} />
          <DashboardMetric icon={BarChart3} label="Learning progress" value={`${dashboard?.learningProgressPercentage ?? 0}%`} />
          <DashboardMetric icon={FolderKanban} label="Pending projects" value={dashboard?.pendingProjects ?? 0} />
          <DashboardMetric icon={WalletCards} label="Balance due" value={formatCurrency(dashboard?.balanceDue ?? 0)} />
        </section>
      ) : null}

      {message ? <MessageBox message={message} /> : null}
      {isLoading ? <section className="dashboard-card"><div className="table-state">Loading LMS workspace...</div></section> : null}

      {!isLoading && activeModule === "Profile" ? (
        <section className="dashboard-card student-program-hero">
          <div>
            <span className="eyebrow">Profile</span>
            <h2>Keep your student profile fresh.</h2>
            <p>Add personal, academic, resume, LinkedIn, GitHub, portfolio, skills, and target role details whenever they are ready.</p>
          </div>
          <button className="primary-action" type="button" onClick={() => navigate("/student/onboarding")}>
            <UserPlus size={18} />
            Open profile
          </button>
        </section>
      ) : null}

      {!isLoading && !enrollment && activeModule !== "Profile" ? (
        <section className="dashboard-card student-marketplace">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Choose your track</span>
              <h2>Start with reserve access or unlock the full LMS.</h2>
              <p>Each program includes curriculum, projects, and certification.</p>
            </div>
            <Zap size={23} />
          </div>
          <div className="program-pick-grid">
            {programs.slice(0, 8).map((program) => (
              <article key={program.id} className="program-pick-card">
                <img src={program.thumbnailUrl} alt="" />
                <div>
                  <span>{program.categoryName}</span>
                  <h3>{program.title}</h3>
                  <p>{program.shortDescription}</p>
                  <strong>From {formatCurrency(program.startingPrice)}</strong>
                </div>
                <div className="program-pick-actions">
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={actionId === `${program.id}-1`}
                    onClick={() => void enroll(program, 1)}
                  >
                    <CreditCard size={16} />
                    Reserve
                  </button>
                  <button
                    className="primary-action"
                    type="button"
                    disabled={actionId === `${program.id}-2`}
                    onClick={() => void enroll(program, 2)}
                  >
                    <PlayCircle size={16} />
                    Start
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading && enrollment ? (
        <section className="student-lms-grid">
          {showStudentModule("My Program") ? (
          <section className="dashboard-card student-program-hero">
            <div>
              <span className="eyebrow">My program</span>
              <h2>{enrollment.programTitle}</h2>
              <p>{enrollment.lockedReason ?? "Full LMS access is active. Keep building proof through lessons and reviews."}</p>
            </div>
            <div className="student-progress-block">
              <strong>{dashboard?.learningProgressPercentage ?? 0}%</strong>
              <span>{dashboard?.completedLessons ?? 0} of {dashboard?.totalLessons ?? 0} lessons complete</span>
            </div>
          </section>
          ) : null}

          {showStudentModule("Payments", "My Program") ? (
          <section className="dashboard-card payment-access-card">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Payments</span>
                <h2>Access status</h2>
                <p>{enrollment.status} - paid {formatCurrency(enrollment.paidAmount)} of {formatCurrency(enrollment.totalAmount)}.</p>
              </div>
              <CreditCard size={23} />
            </div>
            {enrollment.balanceAmount > 0 ? (
              <div className="payment-actions">
                <button className="secondary-action" type="button" onClick={() => void payBalance(1)} disabled={actionId === "payment-1"}>
                  Reserve
                </button>
                <button className="primary-action" type="button" onClick={() => void payBalance(3)} disabled={actionId === "payment-3"}>
                  Pay balance
                </button>
              </div>
            ) : (
              <span className="status-pill status-pill--active">Full access unlocked</span>
            )}
            <div className="payment-history">
              {payments.slice(0, 4).map((payment) => (
                <article key={payment.id}>
                  <span>{payment.mode}</span>
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <small>{payment.status}</small>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Projects") ? (
          <section className="dashboard-card work-submit-card">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Projects</span>
                <h2>Portfolio proof</h2>
              </div>
              <FolderKanban size={23} />
            </div>
            <div className="submission-list">
              {projects.slice(0, 5).map((project) => (
                <article key={project.id}>
                  <div>
                    <strong>{project.title}</strong>
                    <span>{project.latestSubmission ? `Status: ${project.latestSubmission.status}` : project.requiredArtifacts.join(", ")}</span>
                  </div>
                  <div className="submission-inline-form">
                    <input
                      value={projectDrafts[project.id] ?? ""}
                      onChange={(event) => setProjectDrafts((drafts) => ({ ...drafts, [project.id]: event.target.value }))}
                      placeholder="https://github.com/your/project"
                    />
                    <button type="button" onClick={() => void submitProject(project.id)} disabled={actionId === `project-${project.id}`}>
                      <Send size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Certificates") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Certificates</span>
                <h2>Credentials</h2>
              </div>
              <Award size={23} />
            </div>
            {certificates.length === 0 ? <p>Certificates will appear after project completion.</p> : null}
            {certificates.map((certificate) => (
              <article key={certificate.id} className="certificate-mini">
                <Trophy size={18} />
                <div>
                  <strong>{certificate.certificateId}</strong>
                  <span>{certificate.status} - {certificate.type}</span>
                </div>
              </article>
            ))}
          </section>
          ) : null}

          {showStudentModule("Notifications") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Notifications</span>
                <h2>Latest updates</h2>
              </div>
              <Bell size={23} />
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? <div className="table-state">No notifications yet.</div> : null}
              {notifications.map((notification) => (
                <article key={notification.id}>
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                  </div>
                  <button
                    type="button"
                    disabled={notification.status === "Read" || actionId === `notification-${notification.id}`}
                    onClick={() => void markNotificationRead(notification.id)}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          </section>
          ) : null}

        </section>
      ) : null}
    </section>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
}) {
  return (
    <article className="metric-card">
      <Icon size={24} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="dashboard-card">
      <h2>{title}</h2>
      <div className="task-list">
        {items.map((item) => (
          <article key={item}>
            <CheckCircle2 size={18} />
            <span>{item}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function MessageBox({ message }: { message: NonNullable<MessageState> }) {
  return <div className={`dashboard-message dashboard-message--${message.tone}`}>{message.text}</div>;
}

function generateTemporaryPassword() {
  const randomText = Math.random().toString(36).slice(2, 8);
  const randomNumber = Math.floor(100 + Math.random() * 900);
  return `Joviq@${randomText}${randomNumber}A`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function toPeopleListParams(role: AssignableRoleName, query: PeopleQueryState) {
  return {
    role,
    search: query.search || undefined,
    status: query.status === "All" ? undefined : query.status,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    page: query.page,
    pageSize: query.pageSize
  };
}

function toApiFileUrl(path: string) {
  return /^https?:\/\//i.test(path) ? path : `${env.apiBaseUrl}${path}`;
}

function toApiAcceptableThumbnailUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const oldLocalAssetMatch = trimmed.match(/\/api\/v1\/assets\/local-files\/([0-9a-f-]{36})/i);
    if (oldLocalAssetMatch?.[1]) {
      return normalizeThumbnailUrl(new URL(`/api/v1/assets/public-files/${oldLocalAssetMatch[1]}`, env.apiBaseUrl));
    }

    const url = new URL(trimmed, window.location.origin);
    return normalizeThumbnailUrl(url);
  } catch {
    return trimmed;
  }
}

function normalizeThumbnailUrl(url: URL) {
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
    if (url.protocol === "https:" && url.port === "7001") {
      url.protocol = "http:";
      url.port = "5001";
    }
  }

  return url.toString();
}

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMultilineList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compactJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function accessLevelValue(accessLevel: string) {
  if (accessLevel === "Preview") return 1;
  if (accessLevel === "Reserved") return 2;
  return 3;
}

function programStatusValue(status: string) {
  if (status === "Draft") return 1;
  if (status === "Archived") return 3;
  return 2;
}

function formatPhoneForDisplay(phone?: string) {
  if (!phone) {
    return null;
  }

  const compact = phone.replace(/\D/g, "");
  const indiaDigits = compact.startsWith("91") && compact.length === 12 ? compact.slice(2) : compact;

  if (/^[6-9]\d{9}$/.test(indiaDigits)) {
    return {
      isValid: true,
      text: `+91 ${indiaDigits.slice(0, 5)} ${indiaDigits.slice(5)}`
    };
  }

  return {
    isValid: false,
    text: "Needs phone update"
  };
}

function toIndiaMobileDigits(phone?: string) {
  if (!phone) {
    return "";
  }

  const compact = phone.replace(/\D/g, "");
  return compact.startsWith("91") && compact.length === 12 ? compact.slice(2) : compact;
}

function getInitials(value: string) {
  const initials = value
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "JA";
}

function getAssignableUserRole(_user: AdminUserResponse): AssignableRoleName {
  return "Student";
}

function statusClassName(status: string) {
  return `status-pill status-pill--${toKebabCase(status)}`;
}

function formatStatusLabel(status: string) {
  if (status === "PendingEmailVerification") {
    return "Pending email";
  }

  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function toKebabCase(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function actionMessage(action: "lock" | "unlock" | "reset", fullName: string) {
  if (action === "lock") {
    return `${fullName} locked successfully.`;
  }

  if (action === "unlock") {
    return `${fullName} unlocked successfully.`;
  }

  if (action === "reset") {
    return `Password reset message prepared for ${fullName}.`;
  }

  return `${fullName} updated successfully.`;
}

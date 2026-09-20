import "../styles/admin-modules.css";
import { AcademyOverview } from "../components/AcademyOverview";
import { CertificateArtwork } from "../components/CertificateArtwork";
import { StudentOverview } from "../components/StudentOverview";
import { StudentModuleHeader, StudentModuleEmpty, StudentCertificates, StudentPayments } from "../components/StudentModules";
import { studentPreviewDashboard, studentPreviewWorkspace } from "../data/studentPreview";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Award,
  ArrowRight,
  BadgePercent,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CalendarDays,
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
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Image,
  Layers3,
  Link2,
  LayoutDashboard,
  Lock,
  Mail,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Trash2,
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
import { CurriculumAdminPanel } from "../components/CurriculumAdminPanel";
import { StudentMyProgramLibrary } from "../components/StudentMyProgramLibrary";
import { ToastMessage } from "../components/ToastMessage";
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
import { savePendingEnrollment } from "../features/lms/checkout";
import type {
  AdminNotificationResponse,
  AdminLmsSummaryResponse,
  AuditLogResponse,
  CertificateResponse,
  CouponResponse,
  CurriculumModuleResponse,
  EnrollmentResponse,
  IssueCertificateRequest,
  PaymentTransactionResponse,
  ProgramCategoryResponse,
  ProgramDetailsResponse,
  ProgramPlanResponse,
  ProgramSummaryResponse,
  ProjectResponse,
  ProjectSubmissionReviewResponse,
  ProjectStudentResponse,
  StudentLmsDashboardResponse,
  StudentMyProgramsResponse,
  StudentProgramWorkspaceResponse,
  SubmissionResponse
} from "../features/lms/api/lmsTypes";
import { defaultProgramPlans } from "../data/siteContent";
import { getProgramImage } from "../data/programVisuals";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

export type PrimaryRole = "Admin" | "Student";
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
    "Notifications",
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
  { label: "Learning", items: ["Categories", "Programs", "Curriculum", "Projects", "Certificates"] },
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

export function DashboardPage({ studentPreview = false }: { studentPreview?: boolean } = {}) {
  const isPreview = import.meta.env.DEV && studentPreview;
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roles = auth.user?.roles ?? [];
  const primaryRole: PrimaryRole = !isPreview && roles.includes("Admin") ? "Admin" : "Student";
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
    && (activeModule === "Students" || activeModule === "Categories" || activeModule === "Programs" || activeModule === "Curriculum");
  const hideDashboardHeader = usesAdminModuleHero
    || (primaryRole === "Admin" && ["Overview", "Enrollments", "Payments"].includes(activeModule))
    || (primaryRole === "Student" && ["My Program", "Overview", "Projects", "Certificates", "Payments"].includes(activeModule));

  return (
    <main className={`dashboard-shell dashboard-shell--${primaryRole.toLowerCase()}`}>
      <DashboardSidebar activeModule={activeModule} onModuleChange={selectModule} role={primaryRole} />
      <section className="dashboard-main">
        {!hideDashboardHeader ? (
          <header className="dashboard-header">
            <div>
              <span className="eyebrow">Joviq LMS</span>
              <h1>{getModuleDisplayName(activeModule)}</h1>
              {isPreview ? <p>Student Preview</p> : auth.user?.fullName ? <p>{auth.user.fullName}</p> : null}
            </div>
          </header>
        ) : null}

        {primaryRole === "Admin" ? <AdminDashboard activeModule={activeModule} currentUserId={auth.user?.id} /> : null}
        {primaryRole === "Student" ? <StudentDashboard activeModule={activeModule} preview={isPreview} openModule={selectModule} /> : null}
      </section>
    </main>
  );
}

export function DashboardSidebar({
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
      {role === "Student" && <><Link className="student-sidebar-support" to="/request-callback"><UserRoundCheck size={17} />Help &amp; Support</Link><div className="student-sidebar-promo"><GraduationCap size={46} /><strong>Keep<br />Learning<br />Keep Growing</strong><span /><p>“Small progress<br />every day leads to<br />big results.”</p></div></>}
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
      ] = await Promise.allSettled([
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

      if (summaryResponse.status === "fulfilled") setSummary(summaryResponse.value.data);
      if (studentsResponse.status === "fulfilled") setStudentsPage(studentsResponse.value.data);
      if (lmsSummaryResponse.status === "fulfilled") setLmsSummary(lmsSummaryResponse.value.data);
      if (lmsProgramsResponse.status === "fulfilled") setLmsPrograms(lmsProgramsResponse.value.data);
      if (categoriesResponse.status === "fulfilled") setProgramCategories(categoriesResponse.value.data);
      if (curriculumResponse.status === "fulfilled") setAdminCurriculum(curriculumResponse.value.data);
      if (projectsResponse.status === "fulfilled") setAdminProjects(projectsResponse.value.data);
      if (enrollmentsResponse.status === "fulfilled") setAdminEnrollments(enrollmentsResponse.value.data);
      if (paymentsResponse.status === "fulfilled") setAdminPayments(paymentsResponse.value.data);
      if (couponsResponse.status === "fulfilled") setAdminCoupons(couponsResponse.value.data);
      if (certificatesResponse.status === "fulfilled") setAdminCertificates(certificatesResponse.value.data);
      if (notificationsResponse.status === "fulfilled") setAdminNotifications(notificationsResponse.value.data);
      if (auditLogsResponse.status === "fulfilled") setAuditLogs(auditLogsResponse.value.data.items);
      const results = [{ name: "Summary", result: summaryResponse },{ name: "Students Page", result: studentsResponse },{ name: "Lms Summary", result: lmsSummaryResponse },{ name: "Lms Programs", result: lmsProgramsResponse },{ name: "Program Categories", result: categoriesResponse },{ name: "Admin Curriculum", result: curriculumResponse },{ name: "Admin Projects", result: projectsResponse },{ name: "Admin Enrollments", result: enrollmentsResponse },{ name: "Admin Payments", result: paymentsResponse },{ name: "Admin Coupons", result: couponsResponse },{ name: "Admin Certificates", result: certificatesResponse },{ name: "Admin Notifications", result: notificationsResponse }];
      const failed = results.filter(item => item.result.status === "rejected");
      if (failed.length) setMessage({ tone: "error", text: `Some data is unavailable: ${failed.map(item=>item.name).join(", ")}. The server could not load these records.` });
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
        <AdminOverview
          auditLogs={auditLogs}
          categories={programCategories}
          certificates={adminCertificates}
          coupons={adminCoupons}
          enrollments={adminEnrollments}
          isLoading={isLoading}
          payments={adminPayments}
          programs={lmsPrograms}
          projects={adminProjects}
          summary={summary}
          lmsSummary={lmsSummary}
        />
      ) : null}

      <ToastMessage message={message} onDismiss={() => setMessage(null)} />

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

      {!showOverview && !showPeopleModule ? <AdminLmsPanel
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

function AdminOverview({
  auditLogs,
  categories,
  certificates,
  coupons,
  enrollments,
  isLoading,
  lmsSummary,
  payments,
  programs,
  projects,
  summary
}: {
  auditLogs: AuditLogResponse[];
  categories: ProgramCategoryResponse[];
  certificates: CertificateResponse[];
  coupons: CouponResponse[];
  enrollments: EnrollmentResponse[];
  isLoading: boolean;
  lmsSummary: AdminLmsSummaryResponse | null;
  payments: PaymentTransactionResponse[];
  programs: ProgramSummaryResponse[];
  projects: ProjectResponse[];
  summary: AdminUserSummaryResponse | null;
}) {
  const navigate = useNavigate();
  const totalUsers = summary?.totalUsers ?? 0;
  const activeUsers = summary?.active ?? 0;
  const pendingUsers = summary?.pendingEmailVerification ?? 0;
  const publishedPrograms = lmsSummary?.publishedPrograms ?? programs.filter((program) => program.status === "Published").length;
  const totalPrograms = lmsSummary?.programs ?? programs.length;
  const totalEnrollments = lmsSummary?.enrollments ?? enrollments.length;
  const activeEnrollments = lmsSummary?.activeEnrollments ?? enrollments.filter((enrollment) => enrollment.status === "Active").length;
  const projectReviews = lmsSummary?.pendingProjectReviews ?? projects.filter((project) => !project.latestSubmission).length;
  const activeCoupons = coupons.filter((coupon) => coupon.isActive).length;
  const issuedCertificates = certificates.filter((certificate) => certificate.status === "Issued").length;
  const kpis = [
    { icon: UsersRound, label: "Users", value: totalUsers, detail: `${activeUsers} active`, tone: "violet" },
    { icon: GraduationCap, label: "Students", value: summary?.students ?? 0, detail: `${pendingUsers} pending email`, tone: "blue" },
    { icon: Tags, label: "Categories", value: categories.length, detail: `${totalPrograms} programs`, tone: "green" },
    { icon: BookOpen, label: "Programs", value: publishedPrograms, detail: `${totalPrograms} total`, tone: "amber" },
    { icon: ClipboardList, label: "Enrollments", value: totalEnrollments, detail: `${activeEnrollments} active`, tone: "teal" },
    { icon: FolderKanban, label: "Reviews", value: projectReviews, detail: "Project queue", tone: "rose" }
  ];

  const priorities = [
    { icon: FolderKanban, label: "Project reviews", value: projectReviews, module: "Projects" },
    { icon: Mail, label: "Pending email", value: pendingUsers, module: "Students" },
    { icon: BadgePercent, label: "Active coupons", value: activeCoupons, module: "Coupons" },
    { icon: Award, label: "Issued certificates", value: issuedCertificates, module: "Certificates" }
  ];

  function openModule(module: string) {
    navigate(`/dashboard?section=${encodeURIComponent(module)}`);
  }

  return <AcademyOverview revenue={lmsSummary?.verifiedRevenue ?? payments.filter(item=>item.status === "Verified").reduce((sum,item)=>sum+item.amount,0)} revenueRecords={payments.filter(item=>item.status === "Verified").map(item=>({date:item.verifiedAt ?? item.createdAt,amount:item.amount}))} kpis={kpis} priorities={priorities} logs={auditLogs} loading={isLoading} openModule={openModule} enrollmentDates={enrollments.map(item => item.enrolledAt)} paymentDates={payments.filter(item => item.status === "Verified").map(item => item.verifiedAt ?? item.createdAt)} />;
}

type ProgramProjectDraft = {
  id?: string;
  title: string;
  description: string;
};

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
  const [programDialogStep, setProgramDialogStep] = useState<1 | 2>(1);
  const [programProjects, setProgramProjects] = useState<ProgramProjectDraft[]>([]);
  const [programThumbnailUrl, setProgramThumbnailUrl] = useState("");
  const [programThumbnailFile, setProgramThumbnailFile] = useState<File | null>(null);
  const [programThumbnailPreviewUrl, setProgramThumbnailPreviewUrl] = useState("");
  const [certificateDraft, setCertificateDraft] = useState<IssueCertificateRequest>(() => ({
    studentId: "",
    programId: "",
    enrollmentId: "",
    type: 1,
    studentName: "",
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    authorizedSignatory: "M VIJAYARAMARAJU",
    signatureText: "Executive Director"
  }));
  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<"create" | "edit" | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<ProgramCategoryResponse | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"create" | "edit" | null>(null);
  const [projectEditor, setProjectEditor] = useState<ProjectResponse | null>(null);
  const [projectReferenceFile, setProjectReferenceFile] = useState<File | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectAudience, setProjectAudience] = useState<ProjectResponse | null>(null);
  const [projectStudents, setProjectStudents] = useState<ProjectStudentResponse[]>([]);
  const [selectedProjectStudentIds, setSelectedProjectStudentIds] = useState<string[]>([]);
  const [projectStudentSearch, setProjectStudentSearch] = useState("");
  const [isProjectStudentsLoading, setIsProjectStudentsLoading] = useState(false);
  const [isPublishingProject, setIsPublishingProject] = useState(false);
  const [projectReviewProject, setProjectReviewProject] = useState<ProjectResponse | null>(null);
  const [projectReviews, setProjectReviews] = useState<ProjectSubmissionReviewResponse[]>([]);
  const [isProjectReviewsLoading, setIsProjectReviewsLoading] = useState(false);
  const [projectReviewDrafts, setProjectReviewDrafts] = useState<Record<string, { status: "NeedsRevision" | "Approved"; score: string; feedback: string }>>({});
  const [isReviewingProject, setIsReviewingProject] = useState<string | null>(null);
  const [workflowInfo, setWorkflowInfo] = useState<"enrollment" | "payment" | null>(null);
  const [paymentPeriod, setPaymentPeriod] = useState("all");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentCategoryFilter, setEnrollmentCategoryFilter] = useState("All");
  const [enrollmentProgramFilter, setEnrollmentProgramFilter] = useState("All");
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState("All");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const hasOpenAdminDialog = Boolean(categoryDialogMode || programDialogMode || planEditorProgram || projectDialogMode || projectAudience || projectReviewProject);

  const enrollmentProgramOptions = useMemo(() => {
    return programs
      .filter((program) => enrollmentCategoryFilter === "All" || program.categoryId === enrollmentCategoryFilter)
      .sort((first, second) => first.title.localeCompare(second.title));
  }, [programs, enrollmentCategoryFilter]);

  const enrollmentProgramCategoryById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.categoryId])),
    [programs]
  );

  const enrollmentStats = useMemo(() => {
    const expiringSoon = adminEnrollments.filter((enrollment) => {
      if (!enrollment.accessExpiresAt || enrollment.isAccessExpired) {
        return false;
      }

      const daysUntilExpiry = (new Date(enrollment.accessExpiresAt).getTime() - Date.now()) / 86400000;
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    return {
      total: adminEnrollments.length,
      active: adminEnrollments.filter((enrollment) => enrollment.status === "Active").length,
      reserved: adminEnrollments.filter((enrollment) => enrollment.status === "Reserved").length,
      completed: adminEnrollments.filter((enrollment) => enrollment.status === "Completed").length,
      expiringSoon,
      collected: adminEnrollments.reduce((total, enrollment) => total + enrollment.paidAmount, 0)
    };
  }, [adminEnrollments]);

  const visibleEnrollments = useMemo(() => {
    const query = enrollmentSearch.trim().toLowerCase();

    return adminEnrollments.filter((enrollment) => {
      const matchesCategory = enrollmentCategoryFilter === "All" || enrollmentProgramCategoryById.get(enrollment.programId) === enrollmentCategoryFilter;
      const matchesProgram = enrollmentProgramFilter === "All" || enrollment.programId === enrollmentProgramFilter;
      const matchesStatus = enrollmentStatusFilter === "All" || enrollment.status === enrollmentStatusFilter;
      const searchText = [
        enrollment.studentName,
        enrollment.studentEmail,
        enrollment.studentPhone,
        enrollment.programTitle,
        enrollment.programPlanName,
        enrollment.programPlanCode
      ].filter(Boolean).join(" ").toLowerCase();

      return matchesCategory && matchesProgram && matchesStatus && (!query || searchText.includes(query));
    });
  }, [adminEnrollments, enrollmentCategoryFilter, enrollmentProgramCategoryById, enrollmentProgramFilter, enrollmentSearch, enrollmentStatusFilter]);

  const paymentStats = useMemo(() => ({
    pending: adminPayments.filter((payment) => payment.status === "Pending"),
    verified: adminPayments.filter((payment) => payment.status === "Verified"),
    failed: adminPayments.filter((payment) => payment.status === "Failed")
  }), [adminPayments]);

  const visiblePayments = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();
    return adminPayments.filter((payment) => {
      if (paymentPeriod === "month" && new Date(payment.createdAt) < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) return false;
      if (paymentStatusFilter !== "All" && payment.status !== paymentStatusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        payment.studentName,
        payment.studentEmail,
        payment.programTitle,
        payment.programPlanName,
        payment.invoiceNumber,
        payment.gatewayOrderId,
        payment.gatewayPaymentId,
        payment.couponCode,
        payment.studentId
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [adminPayments, paymentSearch, paymentStatusFilter, paymentPeriod]);

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
    setProgramDialogStep(1);

    if (!program) {
      setProgramEditor(null);
      setProgramProjects([{ title: "", description: "" }]);
      setProgramThumbnailUrl(selectedProgramCategory ? getProgramImage("", selectedProgramCategory.name) : "");
      setProgramDialogMode("create");
      return;
    }

    setProgramEditorLoadingId(program.id);
    onMessage(null);

    try {
      const response = await adminLmsApi.getProgram(program.id);
      setProgramEditor(response.data);
      setProgramProjects(response.data.projects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description
      })));
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
    setProgramDialogStep(1);
    setProgramProjects([]);
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

    const projectPayloads = programProjects
      .map((project) => ({ ...project, title: project.title.trim(), description: project.description.trim() }))
      .filter((project) => project.title || project.description);

    if (projectPayloads.some((project) => !project.title || !project.description)) {
      onMessage({ tone: "error", text: "Complete or remove every project before saving the program." });
      setProgramDialogStep(2);
      return;
    }

    setIsSavingProgram(true);
    onMessage(null);

    try {
      let savedProgramId = programEditor?.id;
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
        savedProgramId = response.data.id;
        if (programThumbnailFile) {
          const uploadedThumbnailUrl = await uploadProgramThumbnail(response.data.id, programThumbnailFile);
          await adminLmsApi.updateProgram(response.data.id, {
            ...payload,
            thumbnailUrl: uploadedThumbnailUrl
          });
        }
      }

      if (savedProgramId) {
        const existingProjects = programEditor?.projects ?? [];
        const retainedProjectIds = new Set(projectPayloads.flatMap((project) => project.id ? [project.id] : []));
        await Promise.all(existingProjects
          .filter((project) => !retainedProjectIds.has(project.id) && !projectPayloads.some((item) => item.id === project.id))
          .map((project) => adminLmsApi.deleteProject(project.id)));
        await Promise.all(projectPayloads.map((project) => {
          const request = {
            programId: savedProgramId,
            title: project.title,
            description: project.description,
            requiredArtifacts: [],
            usefulLinks: [],
            maxScore: 100,
            isPublished: payload.status === 2
          };
          return project.id
            ? adminLmsApi.updateProject(project.id, request)
            : adminLmsApi.createProject(request);
        }));
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

  function openProjectDialog(project?: ProjectResponse) {
    setProjectEditor(project ?? null);
    setProjectReferenceFile(null);
    setProjectDialogMode(project ? "edit" : "create");
  }

  function closeProjectDialog() {
    setProjectDialogMode(null);
    setProjectEditor(null);
    setProjectReferenceFile(null);
  }

  async function uploadProjectReference(file: File, programId: string) {
    const type = file.type.startsWith("image/")
      ? assetTypes.image
      : file.type.startsWith("video/")
        ? assetTypes.video
        : file.type.startsWith("text/") || file.type.includes("pdf") || file.type.includes("document")
          ? assetTypes.document
          : assetTypes.other;
    const uploadResponse = await assetsApi.uploadFile(file, {
      type,
      purpose: assetPurposes.projectReference,
      visibility: assetVisibilities.public,
      programId
    });

    if (uploadResponse.data.deliveryUrl || uploadResponse.data.publicUrl) {
      return toApiAcceptableThumbnailUrl(uploadResponse.data.deliveryUrl ?? uploadResponse.data.publicUrl ?? "") ?? "";
    }

    const accessResponse = await assetsApi.getAccessUrl(uploadResponse.data.id);
    return toApiAcceptableThumbnailUrl(accessResponse.data.url) ?? "";
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const programId = String(form.get("programId") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const labels = form.getAll("linkLabel").map(String);
    const urls = form.getAll("linkUrl").map(String);
    const usefulLinks = labels
      .map((label, index) => ({ label: label.trim(), url: (urls[index] ?? "").trim() }))
      .filter((link) => link.label || link.url);
    const deadlineInput = String(form.get("deadline") ?? "");
    const wantsPublish = form.get("status") === "publish";
    const payload = {
      programId,
      title,
      description,
      requiredArtifacts: parseCommaList(String(form.get("requiredArtifacts") ?? "")),
      usefulLinks,
      referenceMediaUrl: projectEditor?.referenceMediaUrl,
      deadline: deadlineInput ? new Date(deadlineInput).toISOString() : undefined,
      maxScore: Number(form.get("maxScore") ?? 100),
      isPublished: false
    };

    if (!programId || !title || !description) {
      onMessage({ tone: "error", text: "Choose a program and complete the project title and description." });
      return;
    }

    setIsSavingProject(true);
    onMessage(null);

    try {
      let savedProject = projectEditor
        ? (await adminLmsApi.updateProject(projectEditor.id, payload)).data
        : (await adminLmsApi.createProject(payload)).data;

      if (projectReferenceFile) {
        const referenceMediaUrl = await uploadProjectReference(projectReferenceFile, programId);
        savedProject = (await adminLmsApi.updateProject(savedProject.id, {
          ...payload,
          referenceMediaUrl,
          isPublished: false
        })).data;
      }

      closeProjectDialog();
      await onRefresh();

      if (wantsPublish) {
        onMessage({ tone: "success", text: "Project saved. Choose the active students who should receive it." });
        await openProjectAudience(savedProject);
      } else {
        onMessage({ tone: "success", text: projectEditor ? "Project updated as a draft." : "Project saved as a draft." });
      }
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSavingProject(false);
    }
  }

  async function openProjectAudience(project: ProjectResponse) {
    setProjectAudience(project);
    setSelectedProjectStudentIds([]);
    setProjectStudentSearch("");
    setIsProjectStudentsLoading(true);

    try {
      const response = await adminLmsApi.getProjectStudents(project.programId);
      setProjectStudents(response.data);
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsProjectStudentsLoading(false);
    }
  }

  async function openProjectReviews(project: ProjectResponse) {
    setProjectReviewProject(project);
    setProjectReviews([]);
    setProjectReviewDrafts({});
    setIsProjectReviewsLoading(true);

    try {
      const response = await adminLmsApi.getProjectSubmissions(project.id);
      setProjectReviews(response.data);
      setProjectReviewDrafts(Object.fromEntries(response.data.map((review) => [review.id, {
        status: review.submission.status === "NeedsRevision" ? "NeedsRevision" : "Approved",
        score: review.submission.score === undefined || review.submission.score === null ? "" : String(review.submission.score),
        feedback: review.submission.feedback ?? ""
      }])));
    } catch (error) {
      setProjectReviewProject(null);
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsProjectReviewsLoading(false);
    }
  }

  async function openProjectSubmissionFile(fileAssetId: string) {
    try {
      const response = await assetsApi.getAccessUrl(fileAssetId);
      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  function closeProjectReviews() {
    setProjectReviewProject(null);
    setProjectReviews([]);
    setProjectReviewDrafts({});
  }

  async function reviewProjectSubmission(review: ProjectSubmissionReviewResponse) {
    const draft = projectReviewDrafts[review.id];
    if (!draft) return;

    if (draft.status === "Approved" && !draft.score.trim()) {
      onMessage({ tone: "error", text: "Add the awarded score before approving the submission." });
      return;
    }

    const score = draft.score.trim() ? Number(draft.score) : undefined;
    if (score !== undefined && (!Number.isFinite(score) || score < 0 || score > review.maxScore)) {
      onMessage({ tone: "error", text: `Score must be between 0 and ${review.maxScore}.` });
      return;
    }

    setIsReviewingProject(review.id);
    try {
      await adminLmsApi.reviewProjectSubmission(review.id, {
        status: draft.status,
        score,
        feedback: draft.feedback.trim() || undefined
      });
      onMessage({ tone: "success", text: `${review.studentName}'s submission was reviewed.` });
      const refreshed = await adminLmsApi.getProjectSubmissions(review.projectId);
      setProjectReviews(refreshed.data);
      setProjectReviewDrafts(Object.fromEntries(refreshed.data.map((item) => [item.id, {
        status: item.submission.status === "NeedsRevision" ? "NeedsRevision" : "Approved",
        score: item.submission.score === undefined || item.submission.score === null ? "" : String(item.submission.score),
        feedback: item.submission.feedback ?? ""
      }])));
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsReviewingProject(null);
    }
  }

  function closeProjectAudience() {
    setProjectAudience(null);
    setProjectStudents([]);
    setSelectedProjectStudentIds([]);
    setProjectStudentSearch("");
  }

  function toggleProjectStudent(studentId: string) {
    setSelectedProjectStudentIds((selected) => selected.includes(studentId)
      ? selected.filter((id) => id !== studentId)
      : [...selected, studentId]);
  }

  function toggleAllProjectStudents() {
    const visibleIds = filteredProjectStudents.map((student) => student.studentId);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProjectStudentIds.includes(id));
    setSelectedProjectStudentIds((selected) => allVisibleSelected
      ? selected.filter((id) => !visibleIds.includes(id))
      : [...new Set([...selected, ...visibleIds])]);
  }

  async function publishProject() {
    if (!projectAudience || selectedProjectStudentIds.length === 0) {
      onMessage({ tone: "error", text: "Select at least one active student before publishing." });
      return;
    }

    setIsPublishingProject(true);
    try {
      await adminLmsApi.publishProject(projectAudience.id, { studentIds: selectedProjectStudentIds });
      closeProjectAudience();
      onMessage({ tone: "success", text: `Project published to ${selectedProjectStudentIds.length} student${selectedProjectStudentIds.length === 1 ? "" : "s"}.` });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsPublishingProject(false);
    }
  }

  async function deleteProject(project: ProjectResponse) {
    if (!window.confirm(`Delete “${project.title}”? This will also remove its student submissions.`)) {
      return;
    }

    try {
      await adminLmsApi.deleteProject(project.id);
      onMessage({ tone: "success", text: "Project deleted." });
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
        isPercentage: form.get("discountType") === "percentage",
        isActive: form.get("isActive") === "on",
        audienceType: Number(form.get("audienceType") ?? 1) as 1 | 2 | 3 | 4,
        minimumOrderAmount: Number(form.get("minimumOrderAmount") || 0) || undefined,
        maximumDiscountAmount: Number(form.get("maximumDiscountAmount") || 0) || undefined,
        maxRedemptions: Number(form.get("maxRedemptions") || 0) || undefined,
        maxRedemptionsPerStudent: Number(form.get("maxRedemptionsPerStudent") || 1),
        startsAt: String(form.get("startsAt") ?? "") || undefined,
        expiresAt: String(form.get("expiresAt") ?? "") || undefined,
        targetStudentIds: form.getAll("targetStudentIds").map(String),
        targetStudentEmails: String(form.get("targetStudentEmails") ?? "").split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean),
        targetProgramIds: form.getAll("targetProgramIds").map(String),
        targetCategoryIds: form.getAll("targetCategoryIds").map(String)
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
        expiresAt: coupon.expiresAt,
        audienceType: coupon.audienceType,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscountAmount: coupon.maximumDiscountAmount,
        maxRedemptions: coupon.maxRedemptions,
        maxRedemptionsPerStudent: coupon.maxRedemptionsPerStudent,
        targetStudentIds: coupon.targetStudentIds,
        targetStudentEmails: coupon.targetStudentEmails,
        targetProgramIds: coupon.targetProgramIds,
        targetCategoryIds: coupon.targetCategoryIds
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

  async function failPayment(payment: PaymentTransactionResponse) {
    const reason = window.prompt("Why is this payment being marked failed?", payment.failureReason ?? "Payment could not be confirmed.");
    if (reason === null) {
      return;
    }

    try {
      await adminLmsApi.updatePaymentStatus(payment.id, {
        status: 3,
        failureReason: reason.trim() || "Payment could not be confirmed."
      });
      onMessage({ tone: "success", text: "Payment marked as failed." });
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

  function selectCertificateEnrollment(enrollmentId: string) {
    const enrollment = adminEnrollments.find((item) => item.id === enrollmentId);
    setCertificateDraft((current) => ({
      ...current,
      enrollmentId,
      studentId: enrollment?.studentId ?? "",
      programId: enrollment?.programId ?? "",
      studentName: enrollment?.studentName ?? students.find((student) => student.id === enrollment?.studentId)?.fullName ?? "",
      fromDate: enrollment?.startDate ?? current.fromDate,
      toDate: enrollment?.accessExpiresAt?.slice(0, 10) ?? current.toDate
    }));
  }

  async function issueCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsIssuingCertificate(true);
    onMessage(null);
    try {
      await adminLmsApi.issueCertificate({
        ...certificateDraft,
        enrollmentId: certificateDraft.enrollmentId || undefined,
        type: Number(certificateDraft.type),
        authorizedSignatory: certificateDraft.authorizedSignatory?.trim() || undefined,
        signatureText: certificateDraft.signatureText?.trim() || undefined
      });
      onMessage({ tone: "success", text: "Certificate issued and added to the certificate register." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsIssuingCertificate(false);
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
  const isCurriculumModule = activeModule === "Curriculum";
  const usesCatalogModuleHero = isCategoriesModule || isProgramsModule;
  const showGenericLmsHero = !isCurriculumModule && !["Enrollments", "Payments"].includes(activeModule);
  const selectedCategorySlug = searchParams.get("category");
  const selectedProgramCategory = selectedCategorySlug
    ? categories.find((category) => category.slug.toLowerCase() === selectedCategorySlug.toLowerCase())
    : null;
  const selectedProgramId = searchParams.get("programId");
  const visiblePrograms = selectedProgramCategory
    ? programs.filter((program) => program.categoryId === selectedProgramCategory.id)
    : programs;
  const categoryProgramCount = categories.reduce((total, category) => total + category.programs.length, 0);
  const visibleProgramCounts = {
    total: visiblePrograms.length,
    published: visiblePrograms.filter((program) => program.status === "Published").length,
    draft: visiblePrograms.filter((program) => program.status === "Draft").length,
    archived: visiblePrograms.filter((program) => program.status === "Archived").length
  };
  const filteredProjectStudents = projectStudents.filter((student) => {
    const query = projectStudentSearch.trim().toLowerCase();
    return !query || `${student.fullName} ${student.email}`.toLowerCase().includes(query);
  });
  const allVisibleProjectStudentsSelected = filteredProjectStudents.length > 0 &&
    filteredProjectStudents.every((student) => selectedProjectStudentIds.includes(student.studentId));
  const showPrograms = activeModule === "Programs";
  const showModule = (module: string) => activeModule === module;

  return (
    <section className={`dashboard-card lms-admin-panel${usesCatalogModuleHero ? " lms-admin-panel--categories" : ""}${isCurriculumModule ? " lms-admin-panel--curriculum" : ""}`}>
      {usesCatalogModuleHero ? (
        <div className="category-page-header">
          <div>
            <span className="eyebrow"><Link to="/dashboard">Dashboard</Link> / {isProgramsModule ? "Programs" : "Categories"}</span>
            <h2>{isProgramsModule ? "Programs" : "Categories"}</h2>
            <p>
              {isProgramsModule
                ? selectedProgramCategory
                  ? `${selectedProgramCategory.name} programs ready to edit, plan, and organize.`
                  : `${programs.length} programs ready to edit, plan, and organize.`
                : `Organize your programs into categories for a better learning experience. ${categoryProgramCount} programs.`}
            </p>
          </div>
          <button
            className="primary-action category-create-button"
            type="button"
            onClick={() => isProgramsModule ? void openProgramDialog() : openCategoryDialog()}
          >
            <Plus size={18} />
            {isProgramsModule ? "Create program" : "Create category"}
          </button>
        </div>
      ) : showGenericLmsHero ? (
        <div className="card-title-row">
          <div>
            <span className="eyebrow">LMS engine</span>
            <h2>{activeModule}</h2>
            <p>
              {summary?.publishedPrograms ?? 0} published programs, {summary?.activeEnrollments ?? 0} active enrollments.
            </p>
          </div>
          <Layers3 size={23} />
        </div>
      ) : null}

      {workflowInfo && <div className="admin-workflow-backdrop"><dialog className="admin-workflow-dialog" ref={node=>{if(node&&!node.open)node.showModal();}} onCancel={()=>setWorkflowInfo(null)} aria-labelledby="workflow-title"><button className="admin-dialog-close" aria-label="Close workflow" onClick={() => setWorkflowInfo(null)}><X size={20}/></button><h2 id="workflow-title">{workflowInfo === "enrollment" ? "Add an enrollment" : "Payment settings"}</h2><p>{workflowInfo === "enrollment" ? "Students enroll by choosing a program and completing checkout from their student account. Admins can review and manage the enrollment here afterward. Direct admin enrollment creation is not available in the current backend." : "Payments are configured on the server. This workspace supports reviewing transactions, verifying pending payments, marking failed payments, and viewing receipts. Payment gateway settings are not editable from this account."}</p><button className="primary-action" onClick={() => setWorkflowInfo(null)}>Got it</button></dialog></div>}
      <div className={usesCatalogModuleHero ? "category-admin-layout" : isCurriculumModule ? "lms-admin-curriculum-layout" : "lms-admin-grid"}>
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
                        <small>{category.programs.length} programs{category.isPublished === false ? " � Inactive" : ""}</small>
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
                      <span className="sr-only">Explore {category.name} programs</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
              <button className="admin-category-add" onClick={() => openCategoryDialog()}><span><Plus size={30}/></span><strong>Create a new category</strong><small>Add a category to organize<br/>more programs.</small></button>
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
                <div className="program-dialog__steps" aria-label="Program setup steps">
                  <span className={programDialogStep === 1 ? "is-active" : ""}>1. Program details</span>
                  <span className={programDialogStep === 2 ? "is-active" : ""}>2. Projects</span>
                </div>
                <div className={`program-dialog__step-one${programDialogStep === 1 ? "" : " is-hidden"}`}>
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
                </div>
                <div className={`program-dialog__step-two${programDialogStep === 2 ? "" : " is-hidden"}`}>
                  <div className="program-project-step">
                    <div className="program-project-step__heading">
                      <div>
                        <span className="eyebrow">Step 2</span>
                        <strong>Real-world hands-on projects</strong>
                        <p>Add the project cards students should see for this program.</p>
                      </div>
                      <button
                        className="secondary-action"
                        type="button"
                        onClick={() => setProgramProjects((current) => [...current, { title: "", description: "" }])}
                      >
                        <Plus size={16} /> Add project
                      </button>
                    </div>
                    <div className="program-project-list">
                      {programProjects.map((project, index) => (
                        <div className="program-project-row" key={project.id ?? `new-${index}`}>
                          <span className="program-project-row__number">{index + 1}</span>
                          <label>
                            <span>Project title</span>
                            <input
                              value={project.title}
                              placeholder="Example: AI interview question generator"
                              onChange={(event) => setProgramProjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}
                            />
                          </label>
                          <label>
                            <span>Description</span>
                            <textarea
                              value={project.description}
                              placeholder="Describe the portfolio outcome and review expectations."
                              onChange={(event) => setProgramProjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))}
                            />
                          </label>
                          <button
                            className="icon-button is-danger"
                            type="button"
                            aria-label={`Remove project ${index + 1}`}
                            onClick={() => setProgramProjects((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {programProjects.length === 0 ? <p className="table-state">No projects added yet. Use Add project to create the first card.</p> : null}
                    </div>
                  </div>
                </div>
                <div className="category-dialog__actions">
                  <button className="secondary-action" type="button" onClick={closeProgramDialog}>
                    Cancel
                  </button>
                  {programDialogStep === 1 ? (
                    <button
                      className="primary-action"
                      type="button"
                      onClick={(event) => {
                        if (event.currentTarget.form?.reportValidity()) setProgramDialogStep(2);
                      }}
                      disabled={isSavingProgram || categories.length === 0}
                    >
                      Next: projects <ChevronRight size={18} />
                    </button>
                  ) : (
                    <>
                      <button className="secondary-action" type="button" onClick={() => setProgramDialogStep(1)}>
                        Back
                      </button>
                      <button className="primary-action" type="submit" disabled={isSavingProgram || categories.length === 0}>
                        <Save size={18} />
                        {isSavingProgram ? "Saving" : "Save program"}
                      </button>
                    </>
                  )}
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
          <CurriculumAdminPanel
            modules={adminCurriculum}
            programs={programs}
            initialProgramId={selectedProgramId}
            onMessage={onMessage}
            onRefresh={onRefresh}
          />
        ) : null}

        {showModule("Projects") ? (
          <section className="project-admin-workspace">
            <div className="project-admin-hero">
              <div>
                <span className="eyebrow">Project studio</span>
                <h2>Build work that proves the skill</h2>
                <p>Create a brief, attach helpful references, set the rubric, then publish it only to active students in the program.</p>
              </div>
              <button className="primary-action project-create-button" type="button" onClick={() => openProjectDialog()}>
                <Plus size={18} />
                Create project
              </button>
            </div>

            <div className="project-admin-stats" aria-label="Project summary">
              <span><strong>{adminProjects.length}</strong><small>Total projects</small></span>
              <span><strong>{adminProjects.filter((project) => project.isPublished).length}</strong><small>Published</small></span>
              <span><strong>{adminProjects.filter((project) => !project.isPublished).length}</strong><small>Drafts</small></span>
              <span><strong>{adminProjects.reduce((total, project) => total + (project.assignedStudentCount ?? 0), 0)}</strong><small>Student assignments</small></span>
            </div>

            <div className="project-admin-grid">
              {adminProjects.length === 0 ? (
                <div className="project-empty-state">
                  <span className="project-empty-state__icon"><FolderKanban size={24} /></span>
                  <strong>Your project board is ready.</strong>
                  <p>Start with a clear brief and give students the references they need to do their best work.</p>
                  <button className="secondary-action" type="button" onClick={() => openProjectDialog()}>
                    <Plus size={17} /> Create the first project
                  </button>
                </div>
              ) : null}
              {adminProjects.map((project) => {
                const programTitle = programs.find((program) => program.id === project.programId)?.title ?? "Program not found";
                const usefulLinks = project.usefulLinks ?? [];
                return (
                  <article key={project.id} className={`project-admin-card${project.isPublished ? " is-published" : " is-draft"}`}>
                    <div className="project-admin-card__topline">
                      <span className="project-program-label"><FolderKanban size={15} /> {programTitle}</span>
                      <span className={`project-status-badge${project.isPublished ? " is-published" : " is-draft"}`}>
                        <span /> {project.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="project-admin-card__body">
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                    </div>
                    <div className="project-admin-card__meta">
                      <span><CalendarDays size={15} /> {project.deadline ? `Due ${formatDateTime(project.deadline)}` : "No deadline"}</span>
                      <span><Trophy size={15} /> {project.maxScore} points</span>
                      <span><UsersRound size={15} /> {project.assignedStudentCount ?? 0} assigned</span>
                    </div>
                    {usefulLinks.length > 0 ? (
                      <div className="project-admin-card__links">
                        {usefulLinks.map((link) => (
                          <a key={`${project.id}-${link.url}`} href={toApiAcceptableThumbnailUrl(link.url)} target="_blank" rel="noreferrer">
                            <Link2 size={14} /> {link.label} <ExternalLink size={13} />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {project.referenceMediaUrl ? (
                      <a className="project-reference-chip" href={toApiAcceptableThumbnailUrl(project.referenceMediaUrl)} target="_blank" rel="noreferrer">
                        <FileText size={15} /> View reference media <ExternalLink size={13} />
                      </a>
                    ) : null}
                    <div className="project-admin-card__actions">
                      <button type="button" onClick={() => openProjectDialog(project)}><Pencil size={16} /> Edit</button>
                      <button type="button" onClick={() => void openProjectReviews(project)}><ClipboardList size={16} /> Review submissions</button>
                      <button type="button" onClick={() => void openProjectAudience(project)}>
                        <UsersRound size={16} /> {project.isPublished ? "Manage students" : "Publish to students"}
                      </button>
                      <button className="is-danger" type="button" onClick={() => void deleteProject(project)}><Trash2 size={16} /> Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {showModule("Projects") && projectDialogMode ? createPortal((
          <div className="category-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectDialog();
            }
          }}>
            <section className="project-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="project-editor-dialog-title">
              <div className="project-editor-dialog__header">
                <span className="project-editor-dialog__icon"><FolderKanban size={22} /></span>
                <div>
                  <span className="eyebrow">Project brief</span>
                  <h3 id="project-editor-dialog-title">{projectDialogMode === "edit" ? "Edit project" : "Create project"}</h3>
                  <p>Give students a focused outcome, practical references, and a clear finish line.</p>
                </div>
                <button type="button" onClick={closeProjectDialog} title="Close dialog"><X size={19} /></button>
              </div>

              <form className="project-editor-dialog__form" key={projectEditor?.id ?? "create-project"} onSubmit={saveProject}>
                <div className="project-form-section">
                  <div className="project-form-section__heading"><span>01</span><div><strong>Project basics</strong><small>What should students build?</small></div></div>
                  <label>
                    <span>Program</span>
                    <select name="programId" defaultValue={projectEditor?.programId ?? ""} required>
                      <option value="">Choose the program</option>
                      {programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Project title</span>
                    <input name="title" defaultValue={projectEditor?.title ?? ""} minLength={2} placeholder="Example: Build a finance KPI dashboard" required />
                  </label>
                  <label>
                    <span>Project description</span>
                    <textarea name="description" defaultValue={projectEditor?.description ?? ""} minLength={10} placeholder="Explain the outcome, context, and what a good submission should demonstrate." required />
                  </label>
                </div>

                <div className="project-form-section">
                  <div className="project-form-section__heading"><span>02</span><div><strong>Helpful references</strong><small>Links and media students can use</small></div></div>
                  <div className="project-link-fields">
                    {[0, 1, 2].map((index) => (
                      <div className="project-link-row" key={index}>
                        <input name="linkLabel" defaultValue={projectEditor?.usefulLinks?.[index]?.label ?? ""} placeholder={index === 0 ? "GitHub" : index === 1 ? "Reference" : "Demo / docs"} aria-label={`Reference link ${index + 1} label`} />
                        <input name="linkUrl" type="url" defaultValue={projectEditor?.usefulLinks?.[index]?.url ?? ""} placeholder="https://..." aria-label={`Reference link ${index + 1} URL`} />
                      </div>
                    ))}
                  </div>
                  <label>
                    <span>Submission requirements <small>(comma separated)</small></span>
                    <input name="requiredArtifacts" defaultValue={projectEditor?.requiredArtifacts?.join(", ") ?? "GitHub link, Demo, Report"} placeholder="GitHub link, Demo, Report" />
                  </label>
                  <label className="project-upload-field">
                    <span>Reference media <small>(image, video, PDF, or document)</small></span>
                    <span className="project-upload-control">
                      <UploadCloud size={18} />
                      <span>{projectReferenceFile?.name ?? (projectEditor?.referenceMediaUrl ? "Replace attached reference media" : "Upload a reference file")}</span>
                      <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip" onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (file && file.size > 25 * 1024 * 1024) {
                          onMessage({ tone: "error", text: "Reference media must be 25 MB or smaller." });
                          event.currentTarget.value = "";
                          return;
                        }
                        setProjectReferenceFile(file);
                      }} />
                    </span>
                  </label>
                </div>

                <div className="project-form-section project-form-section--compact">
                  <div className="project-form-section__heading"><span>03</span><div><strong>Scoring and access</strong><small>Set expectations before you publish</small></div></div>
                  <div className="project-form-grid">
                    <label>
                      <span>Deadline</span>
                      <input name="deadline" type="datetime-local" defaultValue={toDateTimeLocalValue(projectEditor?.deadline)} />
                    </label>
                    <label>
                      <span>Grade points</span>
                      <input name="maxScore" type="number" min="1" max="100" defaultValue={projectEditor?.maxScore ?? 100} required />
                    </label>
                  </div>
                  <label>
                    <span>Project status</span>
                    <select name="status" defaultValue={projectEditor?.isPublished ? "publish" : "draft"}>
                      <option value="draft">Save as draft</option>
                      <option value="publish">Publish to selected students</option>
                    </select>
                  </label>
                </div>

                <div className="project-editor-dialog__actions">
                  <button className="secondary-action" type="button" onClick={closeProjectDialog}>Cancel</button>
                  <button className="primary-action" type="submit" disabled={isSavingProject}>
                    <Save size={17} /> {isSavingProject ? "Saving project..." : projectDialogMode === "edit" ? "Save changes" : "Save project"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ), document.body) : null}

        {showModule("Projects") && projectAudience ? createPortal((
          <div className="category-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectAudience();
            }
          }}>
            <section className="project-audience-dialog" role="dialog" aria-modal="true" aria-labelledby="project-audience-dialog-title">
              <div className="project-audience-dialog__header">
                <span className="project-editor-dialog__icon"><UsersRound size={22} /></span>
                <div>
                  <span className="eyebrow">Publish audience</span>
                  <h3 id="project-audience-dialog-title">Choose active students</h3>
                  <p>{projectAudience.title} will appear only for the students you select.</p>
                </div>
                <button type="button" onClick={closeProjectAudience} title="Close dialog"><X size={19} /></button>
              </div>

              <div className="project-audience-dialog__content">
                <div className="project-audience-toolbar">
                  <label className="project-student-search">
                    <Search size={17} />
                    <input value={projectStudentSearch} onChange={(event) => setProjectStudentSearch(event.target.value)} placeholder="Search active students" />
                  </label>
                  <label className="project-select-all">
                    <input type="checkbox" checked={allVisibleProjectStudentsSelected} onChange={toggleAllProjectStudents} disabled={filteredProjectStudents.length === 0} />
                    <span>Select all</span>
                  </label>
                </div>
                <div className="project-audience-summary">
                  <strong>{selectedProjectStudentIds.length} selected</strong>
                  <span>{isProjectStudentsLoading ? "Loading active enrollments..." : `${projectStudents.length} active student${projectStudents.length === 1 ? "" : "s"} in this program`}</span>
                </div>
                <div className="project-student-list">
                  {isProjectStudentsLoading ? <div className="project-student-empty">Finding active students...</div> : null}
                  {!isProjectStudentsLoading && filteredProjectStudents.length === 0 ? <div className="project-student-empty">No active students found for this program.</div> : null}
                  {!isProjectStudentsLoading ? filteredProjectStudents.map((student) => (
                    <label className={`project-student-option${selectedProjectStudentIds.includes(student.studentId) ? " is-selected" : ""}`} key={student.studentId}>
                      <input type="checkbox" checked={selectedProjectStudentIds.includes(student.studentId)} onChange={() => toggleProjectStudent(student.studentId)} />
                      <span className="project-student-avatar">{student.fullName.trim().slice(0, 1).toUpperCase() || "S"}</span>
                      <span className="project-student-option__details"><strong>{student.fullName}</strong><small>{student.email}</small></span>
                      {selectedProjectStudentIds.includes(student.studentId) ? <CheckCircle2 size={18} /> : null}
                    </label>
                  )) : null}
                </div>
              </div>

              <div className="project-audience-dialog__actions">
                <button className="secondary-action" type="button" onClick={closeProjectAudience}>Cancel</button>
                <button className="primary-action" type="button" onClick={() => void publishProject()} disabled={isPublishingProject || isProjectStudentsLoading || selectedProjectStudentIds.length === 0}>
                  <Send size={17} /> {isPublishingProject ? "Publishing..." : `Publish to ${selectedProjectStudentIds.length || "selected"}`}
                </button>
              </div>
            </section>
          </div>
        ), document.body) : null}

        {showModule("Projects") && projectReviewProject ? createPortal((
          <div className="category-dialog-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectReviews();
            }
          }}>
            <section className="project-review-dialog" role="dialog" aria-modal="true" aria-labelledby="project-review-dialog-title">
              <div className="project-audience-dialog__header">
                <span className="project-editor-dialog__icon"><ClipboardList size={22} /></span>
                <div>
                  <span className="eyebrow">Project review queue</span>
                  <h3 id="project-review-dialog-title">Review submissions</h3>
                  <p>{projectReviewProject.title} · award points and send feedback to each student.</p>
                </div>
                <button type="button" onClick={closeProjectReviews} title="Close dialog"><X size={19} /></button>
              </div>

              <div className="project-review-dialog__content">
                {isProjectReviewsLoading ? <div className="project-student-empty">Loading student submissions...</div> : null}
                {!isProjectReviewsLoading && projectReviews.length === 0 ? (
                  <div className="project-student-empty">No student submissions have been received yet.</div>
                ) : null}
                {!isProjectReviewsLoading ? projectReviews.map((review) => {
                  const draft = projectReviewDrafts[review.id] ?? {
                    status: "Approved" as const,
                    score: review.submission.score === undefined || review.submission.score === null ? "" : String(review.submission.score),
                    feedback: review.submission.feedback ?? ""
                  };
                  return (
                    <article className="project-review-card" key={review.id}>
                      <div className="project-review-card__student">
                        <span className="project-student-avatar">{review.studentName.trim().slice(0, 1).toUpperCase() || "S"}</span>
                        <div><strong>{review.studentName}</strong><small>{review.studentEmail}</small></div>
                        <span className={`project-review-status is-${review.submission.status.toLowerCase()}`}>{review.submission.status}</span>
                      </div>
                      <div className="project-review-card__artifacts">
                        {review.submission.fileAssetId ? (
                          <button type="button" onClick={() => void openProjectSubmissionFile(review.submission.fileAssetId!)}><FileText size={14} /> Open submitted file</button>
                        ) : null}
                        {review.submission.gitHubUrl ? <a href={review.submission.gitHubUrl} target="_blank" rel="noreferrer"><Link2 size={14} /> GitHub</a> : null}
                        {review.submission.demoUrl ? <a href={review.submission.demoUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Demo</a> : null}
                        <small>Submitted {formatDateTime(review.submission.createdAt)}</small>
                      </div>
                      <div className="project-review-card__form">
                        <label>Status<select value={draft.status} onChange={(event) => setProjectReviewDrafts((items) => ({ ...items, [review.id]: { ...draft, status: event.target.value as "NeedsRevision" | "Approved" } }))}><option value="Approved">Approved</option><option value="NeedsRevision">Needs revision</option></select></label>
                        <label>Score / {review.maxScore}<input type="number" min="0" max={review.maxScore} step="0.5" value={draft.score} onChange={(event) => setProjectReviewDrafts((items) => ({ ...items, [review.id]: { ...draft, score: event.target.value } }))} /></label>
                        <label className="project-review-card__feedback">Message / feedback<textarea value={draft.feedback} maxLength={2500} placeholder="Share clear next steps or encouragement..." onChange={(event) => setProjectReviewDrafts((items) => ({ ...items, [review.id]: { ...draft, feedback: event.target.value } }))} /></label>
                      </div>
                      <button className="primary-action project-review-card__save" type="button" onClick={() => void reviewProjectSubmission(review)} disabled={isReviewingProject === review.id}><Save size={16} /> {isReviewingProject === review.id ? "Saving review..." : "Save review"}</button>
                    </article>
                  );
                }) : null}
              </div>

              <div className="project-audience-dialog__actions"><button className="secondary-action" type="button" onClick={closeProjectReviews}>Close</button></div>
            </section>
          </div>
        ), document.body) : null}

        {showModule("Enrollments") ? (
          <section className="enrollment-admin-page">
            <section className="enrollment-admin-hero">
              <div className="enrollment-admin-hero__copy">
                <span className="enrollment-admin-eyebrow"><Link to="/dashboard">Dashboard</Link> / Enrollments</span>
                <h2>Enrollments</h2>
                <p>Track learner enrollments across all programs and keep learning journeys on track.</p>
              </div>
              <button className="primary-action" onClick={() => setWorkflowInfo("enrollment")}><Plus size={18}/>Add Enrollment</button><div className="enrollment-admin-hero__badge">
                <ShieldCheck size={22} />
                <strong>{enrollmentStats.active} active</strong>
                <span>currently learning</span>
              </div>
            </section>

            <section className="enrollment-admin-kpis" aria-label="Enrollment summary">
              <article className="enrollment-admin-kpi enrollment-admin-kpi--purple"><span><UsersRound size={18} /> Total enrollments</span><strong>{enrollmentStats.total}</strong><small>All learner records</small></article>
              <article className="enrollment-admin-kpi enrollment-admin-kpi--green"><span><CheckCircle2 size={18} /> Active access</span><strong>{enrollmentStats.active}</strong><small>Access is available</small></article>
              <article className="enrollment-admin-kpi enrollment-admin-kpi--gold"><span><WalletCards size={18} /> Pending Enrollments</span><strong>{adminEnrollments.filter(item => item.status === "Reserved").length}</strong><small>Awaiting activation</small></article>
              <article className="enrollment-admin-kpi enrollment-admin-kpi--rose"><span><CheckCircle2 size={18} /> Completed Enrollments</span><strong>{adminEnrollments.filter(item => item.status === "Completed").length}</strong><small>Learning completed</small></article>
            </section>

            <section className="enrollment-admin-workspace">
              <div className="enrollment-admin-toolbar">
                <div>
                  <span className="enrollment-admin-eyebrow">Learner register</span>
                  <h3>All enrollments</h3>
                  <p>{visibleEnrollments.length} of {adminEnrollments.length} enrollment{adminEnrollments.length === 1 ? "" : "s"} shown</p>
                </div>
                <div className="enrollment-admin-toolbar__controls"><button className="secondary-action admin-enrollment-reset" onClick={()=>{setEnrollmentSearch("");setEnrollmentCategoryFilter("All");setEnrollmentProgramFilter("All");setEnrollmentStatusFilter("All");}}><RotateCcw size={16}/>Reset</button>
                  <label className="enrollment-admin-search"><Search size={17} /><span className="sr-only">Search enrollments</span><input value={enrollmentSearch} onChange={(event) => setEnrollmentSearch(event.target.value)} placeholder="Search student or program" /></label>
                  <label className="enrollment-admin-filter"><Layers3 size={16} /><span className="sr-only">Filter by category</span><select value={enrollmentCategoryFilter} onChange={(event) => { setEnrollmentCategoryFilter(event.target.value); setEnrollmentProgramFilter("All"); }}><option value="All">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <label className="enrollment-admin-filter"><BookOpen size={16} /><span className="sr-only">Filter by program</span><select value={enrollmentProgramFilter} onChange={(event) => setEnrollmentProgramFilter(event.target.value)}><option value="All">All programs</option>{enrollmentProgramOptions.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></label>
                  <label className="enrollment-admin-filter"><SlidersHorizontal size={16} /><span className="sr-only">Filter by status</span><select value={enrollmentStatusFilter} onChange={(event) => setEnrollmentStatusFilter(event.target.value)}><option value="All">All statuses</option><option value="Active">Active</option><option value="Reserved">Reserved</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></label>
                </div>
              </div>

              <div className="enrollment-admin-list">
                {visibleEnrollments.length === 0 ? (
                  <div className="enrollment-admin-empty admin-reference-empty"><span className="admin-empty-art"><ClipboardList size={60}/></span><h3>{adminEnrollments.length === 0 ? "No enrollments to display" : "No enrollments match your filters"}</h3><p>Enroll students into programs to track their learning journey and progress here.</p><button className="primary-action" onClick={() => setWorkflowInfo("enrollment")}><Plus size={18}/>Add Enrollment</button></div>
                ) : null}
                {visibleEnrollments.map((enrollment) => {
                  const relatedPayments = adminPayments.filter((payment) => payment.enrollmentId === enrollment.id);
                  const paidPercent = enrollment.totalAmount > 0 ? Math.min(100, Math.round((enrollment.paidAmount / enrollment.totalAmount) * 100)) : 0;
                  const studentName = enrollment.studentName || `Student ${enrollment.studentId.slice(0, 8)}`;
                  const accessLabel = enrollment.isAccessExpired
                    ? "Access expired"
                    : enrollment.accessExpiresAt
                      ? `Access until ${formatDate(enrollment.accessExpiresAt)}`
                      : "Access expiry not set";

                  return (
                    <article key={enrollment.id} className="enrollment-admin-card">
                      <div className="enrollment-admin-card__header">
                        <div className="enrollment-admin-card__student">
                          <span className="enrollment-admin-avatar">{getInitials(studentName)}</span>
                          <div><strong>{studentName}</strong><span>{enrollment.studentEmail || "Student account"}</span>{enrollment.studentPhone ? <small>{enrollment.studentPhone}</small> : null}</div>
                        </div>
                        <div className="enrollment-admin-card__heading">
                          <span className={`enrollment-admin-status is-${toKebabCase(enrollment.status)}`}>{formatStatusLabel(enrollment.status)}</span>
                          <strong>{enrollment.programTitle}</strong>
                          <span>{enrollment.programPlanName || enrollment.programPlanCode || "Standard enrollment"}</span>
                        </div>
                        <div className="enrollment-admin-card__actions">
                          {enrollment.status !== "Active" ? <button className="enrollment-admin-button enrollment-admin-button--primary" type="button" onClick={() => void updateEnrollment(enrollment, 2)}>Activate</button> : null}
                          {enrollment.status !== "Cancelled" ? <button className="enrollment-admin-button" type="button" onClick={() => void updateEnrollment(enrollment, 4)}>Cancel</button> : null}
                        </div>
                      </div>

                      <div className="enrollment-admin-card__grid">
                        <div className="enrollment-admin-detail"><span>Enrollment date</span><strong>{formatDate(enrollment.enrolledAt)}</strong><small>Cycle {enrollment.accessCycle || 1}</small></div>
                        <div className="enrollment-admin-detail"><span>Plan total</span><strong>{formatCurrency(enrollment.totalAmount)}</strong><small>{enrollment.programPlanCode || "Plan pricing"}</small></div>
                        <div className="enrollment-admin-detail"><span>Paid so far</span><strong>{formatCurrency(enrollment.paidAmount)}</strong><small>{enrollment.hasFullAccess ? "Full access unlocked" : "Partial access"}</small></div>
                        <div className={`enrollment-admin-detail ${enrollment.balanceAmount > 0 ? "is-warning" : "is-success"}`}><span>Balance due</span><strong>{formatCurrency(enrollment.balanceAmount)}</strong><small>{enrollment.balanceAmount > 0 ? "Payment remains" : "Paid in full"}</small></div>
                      </div>

                      <div className="enrollment-admin-card__footer">
                        <div className="enrollment-admin-progress"><div className="enrollment-admin-progress__label"><span>Payment progress</span><strong>{paidPercent}%</strong></div><div className="enrollment-admin-progress__track"><span style={{ width: `${paidPercent}%` }} /></div></div>
                        <div className={`enrollment-admin-access ${enrollment.isAccessExpired ? "is-expired" : ""}`}><span><GraduationCap size={16} /> {accessLabel}</span>{enrollment.lockedReason ? <small>{enrollment.lockedReason}</small> : <small>{enrollment.hasFullAccess ? "Projects, reviews and certificate enabled" : "Full payment unlocks all course content"}</small>}</div>
                      </div>

                      <details className="enrollment-admin-payments">
                        <summary><span><CreditCard size={17} /> Payment history</span><strong>{relatedPayments.length} transaction{relatedPayments.length === 1 ? "" : "s"}</strong></summary>
                        <div className="enrollment-admin-payment-list">
                          {relatedPayments.length === 0 ? <p className="enrollment-admin-payment-empty">No payment transactions are linked to this enrollment yet.</p> : relatedPayments.map((payment) => (
                            <div className="enrollment-admin-payment" key={payment.id}><div><strong>{formatCurrency(payment.amount)}</strong><span>{payment.mode} · {formatDateTime(payment.createdAt)}</span></div><div><span className={`enrollment-admin-payment-status is-${toKebabCase(payment.status)}`}>{formatStatusLabel(payment.status)}</span>{payment.invoiceNumber ? <small>Invoice {payment.invoiceNumber}</small> : null}</div></div>
                          ))}
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>
        ) : null}

        {showModule("Payments") ? (
          <section className="lms-list-panel lms-list-panel--wide payments-admin-panel">
            <div className="payments-admin-heading">
              <div>
                <span className="enrollment-admin-eyebrow"><Link to="/dashboard">Dashboard</Link> / Payments</span>
                <h3>Payments</h3>
                <p>Track and manage all payments in one place.</p>
              </div>
              <div className="payments-admin-controls"><label className="payments-admin-filter"><CalendarDays size={16}/><select aria-label="Payment period" value={paymentPeriod} onChange={event => setPaymentPeriod(event.target.value)}><option value="all">All time</option><option value="month">This month</option></select></label><button className="secondary-action" onClick={() => {setPaymentSearch("");setPaymentStatusFilter("All");setPaymentPeriod("all");}}><RotateCcw size={16}/>Reset</button>
                <label className="payments-admin-search"><Search size={16} /><span className="sr-only">Search payments</span><input value={paymentSearch} onChange={(event) => setPaymentSearch(event.target.value)} placeholder="Search student, program, invoice..." /></label>
                <label className="payments-admin-filter"><SlidersHorizontal size={16} /><span className="sr-only">Filter payments by status</span><select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}><option value="All">All statuses</option><option value="Pending">Pending review</option><option value="Verified">Verified</option><option value="Failed">Failed</option></select></label>
              </div>
            </div>

            <div className="payments-admin-kpis" aria-label="Payment summary">
              <article><span><CircleDollarSign size={16} /> Collected</span><strong>{formatCurrency(paymentStats.verified.reduce((total, payment) => total + payment.amount, 0))}</strong><small>{paymentStats.verified.length} verified payment{paymentStats.verified.length === 1 ? "" : "s"}</small></article>
              <article className="is-pending"><span><RefreshCw size={16} /> Pending review</span><strong>{formatCurrency(paymentStats.pending.reduce((total, payment) => total + payment.amount, 0))}</strong><small>{paymentStats.pending.length} payment{paymentStats.pending.length === 1 ? "" : "s"} need action</small></article>
              <article className="is-discount"><span><BadgePercent size={16} /> Discounts</span><strong>{formatCurrency(paymentStats.verified.reduce((total, payment) => total + payment.discountAmount, 0))}</strong><small>Applied on verified payments</small></article>
              <article className="is-failed"><span><X size={16} /> Failed attempts</span><strong>{paymentStats.failed.length}</strong><small>Kept for payment history</small></article>
            </div>

            <div className="payments-admin-list">
              {visiblePayments.length === 0 ? <div className="admin-reference-empty"><span className="admin-empty-art"><FileText size={62}/></span><h3>{adminPayments.length === 0 ? "No payments to display" : "No payments match your filters"}</h3><p>Once you start receiving payments, they will appear here.</p><button className="primary-action" onClick={() => setWorkflowInfo("payment")}><CreditCard size={17}/>View Payment Settings</button></div> : null}
              {visiblePayments.map((payment) => {
                const studentName = payment.studentName || `Student ${payment.studentId.slice(0, 8)}`;
                const isPending = payment.status === "Pending";
                return (
                  <article key={payment.id} className={`payment-admin-card is-${toKebabCase(payment.status)}`}>
                    <div className="payment-admin-card__header">
                      <div className="payment-admin-student">
                        <span className="enrollment-admin-avatar">{getInitials(studentName)}</span>
                        <div><strong>{studentName}</strong><span>{payment.studentEmail || "Student account"}</span></div>
                      </div>
                      <div className="payment-admin-card__title">
                        <span className={`enrollment-admin-payment-status is-${toKebabCase(payment.status)}`}>{formatStatusLabel(payment.status)}</span>
                        <strong>{formatPaymentMode(payment.mode)}</strong>
                        <span>{formatDateTime(payment.createdAt)}</span>
                      </div>
                      <div className="payment-admin-card__actions">
                        {isPending ? <button className="enrollment-admin-button enrollment-admin-button--primary" type="button" onClick={() => void verifyPayment(payment)}>Verify payment</button> : null}
                        {isPending ? <button className="enrollment-admin-button" type="button" onClick={() => void failPayment(payment)}>Mark failed</button> : null}
                        {payment.status === "Verified" ? <button className="enrollment-admin-button" type="button" onClick={() => void openPaymentReceipt(payment.id, "admin")}><FileText size={15} /> View receipt</button> : null}
                      </div>
                    </div>

                    <div className="payment-admin-card__grid">
                      <div><span>Amount paid</span><strong>{formatCurrency(payment.amount)}</strong><small>{payment.status === "Verified" ? `Verified ${formatDateTime(payment.verifiedAt ?? payment.createdAt)}` : payment.status === "Pending" ? "Awaiting admin confirmation" : "Not collected"}</small></div>
                      <div><span>Program & plan</span><strong>{payment.programTitle || "Program unavailable"}</strong><small>{payment.programPlanName || "Plan unavailable"}</small></div>
                      <div><span>Payment method</span><strong>{payment.gateway || "Not selected"}</strong><small>Order {payment.gatewayOrderId || "Not generated"}</small></div>
                      <div><span>Coupon & pricing</span><strong>{payment.couponCode || "No coupon"}</strong><small>{payment.discountAmount > 0 ? `${formatCurrency(payment.discountAmount)} off ${formatCurrency(payment.originalAmount)}` : `Original ${formatCurrency(payment.originalAmount)}`}</small></div>
                    </div>

                    <div className="payment-admin-card__footer">
                      <span>{payment.invoiceNumber ? `Invoice ${payment.invoiceNumber}` : "Invoice generated after verification"}</span>
                      <span>{payment.gatewayPaymentId ? `Payment ID ${payment.gatewayPaymentId}` : "Gateway payment ID pending"}</span>
                      {payment.failureReason ? <span className="is-error">Reason: {payment.failureReason}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {showModule("Coupons") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Coupons</h3>
            <form className="lms-mini-form coupon-admin-form" onSubmit={createCoupon}>
              <div className="coupon-admin-form__grid">
                <label>Code<input name="code" placeholder="WELCOME20" required /></label>
                <label>Description<input name="description" placeholder="Early learner launch discount" required /></label>
                <label>Discount type<select name="discountType" defaultValue="percentage"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label>
                <label>Discount value<input name="discountValue" type="number" min="0.01" step="0.01" defaultValue="10" required /></label>
                <label>Eligible audience<select name="audienceType" defaultValue="1"><option value="1">All students</option><option value="2">New students</option><option value="3">Existing students</option><option value="4">Selected students</option></select></label>
                <label>Minimum remaining balance<input name="minimumOrderAmount" type="number" min="0" step="0.01" placeholder="No minimum" /></label>
                <label>Maximum discount<input name="maximumDiscountAmount" type="number" min="0" step="0.01" placeholder="No cap" /></label>
                <label>Maximum total uses<input name="maxRedemptions" type="number" min="1" placeholder="Unlimited" /></label>
                <label>Uses per student<input name="maxRedemptionsPerStudent" type="number" min="1" defaultValue="1" required /></label>
                <label>Starts at<input name="startsAt" type="datetime-local" /></label>
                <label>Expires at<input name="expiresAt" type="datetime-local" /></label>
                <label className="inline-check"><input name="isActive" type="checkbox" defaultChecked />Active</label>
              </div>
              <div className="coupon-admin-form__targets">
                <label>Target categories<select name="targetCategoryIds" multiple size={4}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><small>Leave empty for every category.</small></label>
                <label>Target programs<select name="targetProgramIds" multiple size={4}>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select><small>Leave empty for every program.</small></label>
                <label>Selected student accounts<select name="targetStudentIds" multiple size={4}>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} · {student.email}</option>)}</select><small>Use this with “Selected students”.</small></label>
                <label>Student emails<textarea name="targetStudentEmails" rows={4} placeholder="student@example.com, another@example.com" /><small>Comma, semicolon, or newline separated. Works even when the student is not on the current page.</small></label>
              </div>
              <p className="coupon-admin-form__note">Coupons are validated server-side and apply only to remaining-balance payments. The initial reserve payment, including ₹1,500, is never discounted.</p>
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
            <div className="certificate-admin-heading"><div><span className="eyebrow">CERTIFICATE ISSUANCE</span><h3>Create certificate</h3><p>Select a fully paid enrollment, complete the certificate details, preview it, then issue.</p></div><Award size={28} /></div>
            <form className="certificate-admin-form" onSubmit={issueCertificate}>
              <div className="certificate-admin-fields">
                <label>Paid student<select required value={certificateDraft.enrollmentId} onChange={(event) => selectCertificateEnrollment(event.currentTarget.value)}><option value="">Select a fully paid enrollment</option>{adminEnrollments.filter((enrollment) => enrollment.hasFullAccess && !enrollment.isAccessExpired).map((enrollment) => <option key={enrollment.id} value={enrollment.id}>{enrollment.studentName ?? enrollment.studentEmail ?? enrollment.studentId} · {enrollment.programTitle}</option>)}</select></label>
                <label>Certificate type<select value={certificateDraft.type} onChange={(event) => setCertificateDraft((current) => ({ ...current, type: Number(event.currentTarget.value) }))}><option value={1}>Training Certificate</option><option value={2}>Internship Certificate</option></select></label>
                <label>Student full name<input required value={certificateDraft.studentName} onChange={(event) => setCertificateDraft((current) => ({ ...current, studentName: event.currentTarget.value }))} placeholder="Full name on certificate" /></label>
                <label>Program<input readOnly value={adminEnrollments.find((item) => item.id === certificateDraft.enrollmentId)?.programTitle ?? "Select an enrollment"} /></label>
                <label>Starting date<input required type="date" value={certificateDraft.fromDate} onChange={(event) => setCertificateDraft((current) => ({ ...current, fromDate: event.currentTarget.value }))} /></label>
                <label>Ending date<input required type="date" value={certificateDraft.toDate} onChange={(event) => setCertificateDraft((current) => ({ ...current, toDate: event.currentTarget.value }))} /></label>
                <label>Director name<input value={certificateDraft.authorizedSignatory} onChange={(event) => setCertificateDraft((current) => ({ ...current, authorizedSignatory: event.currentTarget.value }))} placeholder="Director name" /></label>
                <label>Signature label<input value={certificateDraft.signatureText} onChange={(event) => setCertificateDraft((current) => ({ ...current, signatureText: event.currentTarget.value }))} placeholder="Executive Director" /></label>
              </div>
              <CertificateArtwork
                type={certificateDraft.type === 2 ? "Internship" : "Training"}
                studentName={certificateDraft.studentName}
                programTitle={adminEnrollments.find((item) => item.id === certificateDraft.enrollmentId)?.programTitle}
                fromDate={certificateDraft.fromDate}
                toDate={certificateDraft.toDate}
                authorizedSignatory={certificateDraft.authorizedSignatory}
                signatureText={certificateDraft.signatureText}
              />
              <button className="primary-action" type="submit" disabled={isIssuingCertificate || !certificateDraft.enrollmentId}>{isIssuingCertificate ? "Issuing certificate..." : "Issue certificate"}<ArrowRight size={16} /></button>
            </form>
            <h3>Issued certificates</h3>
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
              <Link to="/dashboard">Dashboard</Link><span>/</span><span>Students</span>
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
            placeholder={`Search ${roleLabel}s by name or email...`}
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
        <button className="admin-students-reset secondary-action" onClick={() => { setSearchDraft(""); onQueryChange({ ...initialPeopleQuery }); }}>Reset filters</button>
      </div>
      <div className="admin-people-list">
        {isLoading ? <div className="table-state">Loading {roleLabel}s...</div> : null}
        {!isLoading && users.length === 0 ? <div className="admin-reference-empty"><span className="admin-empty-art"><GraduationCap size={68}/></span><h3>{query.search || query.status !== initialPeopleQuery.status ? "No students match your filters" : "No students yet"}</h3><p>{query.search ? emptyText : "Start by adding your first student and give them access to learn, practice and grow."}</p><button className="primary-action" onClick={() => setIsAdding(true)}><Plus size={18}/>Add Student</button></div> : null}
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

function StudentDashboard({ activeModule, preview = false, openModule }: { activeModule: string; preview?: boolean; openModule: (module: string) => void }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [dashboard, setDashboard] = useState<StudentLmsDashboardResponse | null>(null);
  const [workspace, setWorkspace] = useState<StudentProgramWorkspaceResponse | null>(null);
  const [myPrograms, setMyPrograms] = useState<StudentMyProgramsResponse | null>(null);
  const [programs, setPrograms] = useState<ProgramSummaryResponse[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [projectSubmissionNotes, setProjectSubmissionNotes] = useState<Record<string, string>>({});
  const [projectSubmissionFiles, setProjectSubmissionFiles] = useState<Record<string, File | null>>({});
  const [projectFilter, setProjectFilter] = useState("All Projects");

  const loadStudentDashboard = useCallback(async () => {
    if (preview) {
      setDashboard(studentPreviewDashboard);
      setWorkspace(studentPreviewWorkspace);
      setPrograms([]);
      setMyPrograms({ programs: [] });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [dashboardResponse, workspaceResponse, programsResponse, myProgramsResponse] = await Promise.all([
        studentLmsApi.getDashboard(),
        studentLmsApi.getWorkspace(),
        publicLmsApi.getPrograms(),
        studentLmsApi.getMyPrograms()
      ]);

      setDashboard(dashboardResponse.data);
      setWorkspace(workspaceResponse.data);
      setPrograms(programsResponse.data);
      setMyPrograms(myProgramsResponse.data);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, [preview]);

  function previewAction() {
    if (!preview) return false;
    setMessage({ tone: "success", text: "Design preview: this action is available after signing in to a student account." });
    return true;
  }

  async function enroll(program: ProgramSummaryResponse, mode: 1 | 2) {
    if (previewAction()) return;
    setActionId(`${program.id}-${mode}`);
    setMessage(null);

    try {
      const details = await publicLmsApi.getProgram(program.slug);
      const plan =
        details.data.plans.find((item) => item.code === "INTERMEDIATE" && item.isActive) ??
        details.data.plans.find((item) => item.isActive);

      if (!plan) throw new Error("This program has no active plan available.");
      savePendingEnrollment({
        slug: program.slug,
        programId: program.id,
        planId: plan.id,
        planCode: plan.code,
        programTitle: program.title,
        paymentMode: 1
      });
      navigate("/checkout");
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function payBalance(mode: 1 | 2 | 3, targetEnrollment?: EnrollmentResponse) {
    if (previewAction()) return;
    const enrollment = targetEnrollment ?? workspace?.enrollment ?? dashboard?.enrollment;
    if (!enrollment) {
      return;
    }

    setActionId(`payment-${mode}`);
    setMessage(null);

    try {
      savePendingEnrollment({
        slug: enrollment.programSlug,
        programId: enrollment.programId,
        planId: enrollment.programPlanId,
        planCode: enrollment.programPlanCode ?? "INTERMEDIATE",
        programTitle: enrollment.programTitle,
        paymentMode: mode === 1 ? 1 : 3,
        amount: mode === 1 ? undefined : enrollment.balanceAmount
      });
      navigate("/checkout");
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function viewReceipt(paymentId: string) {
    if (previewAction()) return;
    setActionId(`receipt-${paymentId}`);
    setMessage(null);
    try {
      await openPaymentReceipt(paymentId);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function submitProject(projectId: string) {
    if (previewAction()) return;
    const value = projectDrafts[projectId]?.trim();
    const notes = projectSubmissionNotes[projectId]?.trim();
    const file = projectSubmissionFiles[projectId] ?? null;
    if (!value && !notes && !file) {
      setMessage({ tone: "error", text: "Attach your project work, add a project link, or write submission notes." });
      return;
    }

    setActionId(`project-${projectId}`);
    setMessage(null);

    try {
      const project = projects.find((item) => item.id === projectId);
      const fileAssetId = file
        ? (await assetsApi.uploadFile(file, {
            type: file.type.startsWith("image/")
              ? assetTypes.image
              : file.type.startsWith("video/")
                ? assetTypes.video
                : file.type.startsWith("text/") || file.type.includes("pdf") || file.type.includes("document")
                  ? assetTypes.document
                  : assetTypes.other,
            purpose: assetPurposes.projectSubmission,
            visibility: assetVisibilities.private,
            programId: project?.programId
          })).data.id
        : undefined;

      await studentLmsApi.submitProject(projectId, { gitHubUrl: value || undefined, fileAssetId, notes: notes || undefined });
      setProjectDrafts((drafts) => ({ ...drafts, [projectId]: "" }));
      setProjectSubmissionNotes((items) => ({ ...items, [projectId]: "" }));
      setProjectSubmissionFiles((items) => ({ ...items, [projectId]: null }));
      setMessage({ tone: "success", text: "Project submitted for review." });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function openStudentSubmissionFile(fileAssetId: string) {
    if (previewAction()) return;
    try {
      const response = await assetsApi.getAccessUrl(fileAssetId);
      window.open(response.data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function markNotificationRead(notificationId: string) {
    if (previewAction()) return;
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

  if (showOverview) return <><ToastMessage message={message} onDismiss={() => setMessage(null)} /><StudentOverview name={preview ? "Student" : auth.user?.fullName?.split(" ")[0] ?? "Student"} dashboard={dashboard} workspace={workspace} loading={isLoading} openModule={openModule} continueLearning={programId => { if (!previewAction()) navigate(`/learning/${programId}`); }} /></>;

  if (activeModule === "Certificates" || activeModule === "Payments") return <section className="student-module-page"><StudentModuleHeader module={activeModule} onDashboard={() => openModule("Overview")} /><ToastMessage message={message} onDismiss={() => setMessage(null)} />{isLoading ? <div className="student-module-surface" role="status">Loading your {activeModule.toLowerCase()}...</div> : activeModule === "Certificates" ? <StudentCertificates certificates={certificates} onProgram={() => openModule("My Program")} /> : <StudentPayments enrollment={enrollment} payments={payments} onReceipt={id => void viewReceipt(id)} onPay={() => void payBalance(enrollment?.isAccessExpired || !enrollment?.paidAmount ? 1 : 3)} actionId={actionId} />}</section>;

  const filteredProjects = projects.filter(project => projectFilter === "All Projects" || (projectFilter === "In Progress" ? !project.latestSubmission || ["Draft", "NeedsRevision"].includes(project.latestSubmission.status) : projectFilter === "Submitted" ? project.latestSubmission?.status === "Submitted" : ["Approved", "Rejected", "NeedsRevision"].includes(project.latestSubmission?.status ?? "")));

  return (
    <section className={`dashboard-stack ${activeModule === "Projects" ? "student-module-page student-projects-page" : ""}`}>
      {activeModule === "Projects" && <><StudentModuleHeader module="Projects" onDashboard={() => openModule("Overview")} /><div className="student-project-tabs" aria-label="Filter projects">{["All Projects", "In Progress", "Submitted", "Reviewed"].map(filter => <button key={filter} aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)}>{filter}</button>)}</div>{!isLoading && projects.length === 0 && <StudentModuleEmpty kind="Projects" onProgram={() => openModule("My Program")} />}</>}
      {showOverview ? (
        <section className="metric-grid">
          <DashboardMetric icon={BookOpen} label="Program status" value={dashboard?.programStatus ?? "-"} />
          <DashboardMetric icon={BarChart3} label="Learning progress" value={`${dashboard?.learningProgressPercentage ?? 0}%`} />
          <DashboardMetric icon={FolderKanban} label="Pending projects" value={dashboard?.pendingProjects ?? 0} />
          <DashboardMetric icon={WalletCards} label="Balance due" value={formatCurrency(dashboard?.balanceDue ?? 0)} />
        </section>
      ) : null}

      <ToastMessage message={message} onDismiss={() => setMessage(null)} />
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

      {!isLoading && !enrollment && activeModule !== "Profile" && activeModule !== "My Program" && activeModule !== "Projects" ? (
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

      {!isLoading && activeModule === "My Program" ? (
        <StudentMyProgramLibrary
          programs={myPrograms?.programs ?? []}
          onOpenCourse={(programId) => navigate(`/learning/${programId}`)}
          onPay={(courseEnrollment, mode) => void payBalance(mode, courseEnrollment)}
        />
      ) : null}

      {!isLoading && enrollment && activeModule !== "My Program" ? (
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
                <small>{enrollment.isAccessExpired ? "Access expired — renew to continue." : enrollment.accessExpiresAt ? `Access until ${formatDateTime(enrollment.accessExpiresAt)}.` : "Access begins after payment verification."}</small>
              </div>
              <CreditCard size={23} />
            </div>
            {enrollment.isAccessExpired || enrollment.balanceAmount > 0 ? (
              <div className="payment-actions">
                {enrollment.isAccessExpired || enrollment.paidAmount <= 0 ? (
                  <button className="primary-action" type="button" onClick={() => void payBalance(1)} disabled={actionId === "payment-1"}>
                    <CreditCard size={16} /> Pay initial amount
                  </button>
                ) : (
                  <button className="primary-action" type="button" onClick={() => void payBalance(3)} disabled={actionId === "payment-3"}>
                    <CreditCard size={16} /> Pay balance
                  </button>
                )}
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
                  {payment.status === "Verified" ? (
                    <button type="button" onClick={() => void viewReceipt(payment.id)} disabled={actionId === `receipt-${payment.id}`} title="View receipt">
                      <FileText size={14} /> Receipt
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Projects") && projects.length > 0 ? (
          <section className="dashboard-card work-submit-card">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Projects</span>
                <h2>Portfolio proof</h2>
              </div>
              <FolderKanban size={23} />
            </div>
            <div className="submission-list">
              {!enrollment.hasFullAccess ? (
                <div className="access-locked-notice">
                  <Lock size={18} />
                  <div><strong>Projects are locked</strong><span>{enrollment.isAccessExpired ? "Renew your six-month access first." : "Pay the remaining balance to submit projects and unlock your certificate."}</span></div>
                  <button className="secondary-action" type="button" onClick={() => void payBalance(enrollment.isAccessExpired || enrollment.paidAmount <= 0 ? 1 : 3)}>Open payment</button>
                </div>
              ) : null}
              {enrollment.hasFullAccess && projects.length === 0 ? <div className="project-empty-state"><FolderKanban size={24} /><strong>No projects assigned yet.</strong><p>Your assigned project work will appear here when the admin publishes it to you.</p></div> : null}
              {filteredProjects.length === 0 && <div className="student-module-empty"><h2>No projects in this view.</h2><p>Choose another filter to see your assigned work.</p></div>}
              {filteredProjects.map((project) => {
                const submission = project.latestSubmission;
                const selectedFile = projectSubmissionFiles[project.id];
                return (
                  <article key={project.id} className="student-project-card">
                    <div className="student-project-card__header">
                      <div><span className="eyebrow">Assigned project</span><h3>{project.title}</h3></div>
                      {submission ? <span className={`project-review-status is-${submission.status.toLowerCase()}`}>{submission.status === "NeedsRevision" ? "Needs revision" : submission.status}</span> : <span className="project-review-status is-pending">Not submitted</span>}
                    </div>
                    <p className="student-project-card__description">{project.description}</p>
                    <div className="student-project-meta"><small><CalendarDays size={14} /> {project.deadline ? `Due ${formatDateTime(project.deadline)}` : "No deadline"}</small><small><Trophy size={14} /> {project.maxScore} grade points</small></div>
                    {project.requiredArtifacts.length > 0 ? <div className="student-project-requirements"><strong>Submit</strong>{project.requiredArtifacts.map((artifact) => <span key={artifact}>{artifact}</span>)}</div> : null}
                    {(project.usefulLinks?.length ?? 0) > 0 || project.referenceMediaUrl ? (
                      <div className="student-project-resources">
                        {(project.usefulLinks ?? []).map((link) => <a key={`${project.id}-${link.url}`} href={toApiAcceptableThumbnailUrl(link.url)} target="_blank" rel="noreferrer"><Link2 size={13} /> {link.label}</a>)}
                        {project.referenceMediaUrl ? <a href={toApiAcceptableThumbnailUrl(project.referenceMediaUrl)} target="_blank" rel="noreferrer"><FileText size={13} /> Reference media</a> : null}
                      </div>
                    ) : null}
                    {submission?.score !== undefined || submission?.feedback ? (
                      <div className="student-project-review">
                        <div><strong>{submission.score !== undefined && submission.score !== null ? `Awarded ${submission.score} / ${project.maxScore}` : "Admin feedback"}</strong>{submission.reviewedAt ? <small>Reviewed {formatDateTime(submission.reviewedAt)}</small> : null}</div>
                        {submission.feedback ? <p>{submission.feedback}</p> : null}
                        {submission.fileAssetId ? <button type="button" onClick={() => void openStudentSubmissionFile(submission.fileAssetId!)}><FileText size={14} /> Open submitted file</button> : null}
                      </div>
                    ) : null}
                    <div className="student-project-submit-form">
                      <label><span>GitHub or project link <small>optional</small></span><input value={projectDrafts[project.id] ?? ""} onChange={(event) => setProjectDrafts((drafts) => ({ ...drafts, [project.id]: event.target.value }))} placeholder="https://github.com/your/project" disabled={!enrollment.hasFullAccess} /></label>
                      <label className="student-project-file"><span>Project work / media <small>PDF, ZIP, image, video · max 25 MB</small></span><span className="student-project-file__control"><UploadCloud size={17} /><span>{selectedFile?.name ?? "Choose your project file"}</span><input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.md" disabled={!enrollment.hasFullAccess} onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && file.size > 25 * 1024 * 1024) { setMessage({ tone: "error", text: "Project files must be 25 MB or smaller." }); event.currentTarget.value = ""; return; } setProjectSubmissionFiles((items) => ({ ...items, [project.id]: file })); }} /></span></label>
                      <label><span>Notes for admin <small>explain your work or add context</small></span><textarea value={projectSubmissionNotes[project.id] ?? ""} onChange={(event) => setProjectSubmissionNotes((items) => ({ ...items, [project.id]: event.target.value }))} placeholder="Tell the reviewer what you built, what to test, and anything you want feedback on..." disabled={!enrollment.hasFullAccess} /></label>
                      <button className="primary-action" type="button" onClick={() => void submitProject(project.id)} disabled={!enrollment.hasFullAccess || actionId === `project-${project.id}`}><Send size={16} /> {actionId === `project-${project.id}` ? "Submitting..." : submission?.status === "NeedsRevision" ? "Resubmit project" : "Submit project"}</button>
                    </div>
                  </article>
                );
              })}
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

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character] ?? character);
}

async function openPaymentReceipt(paymentId: string, audience: "student" | "admin" = "student") {
  const receiptWindow = window.open("", "_blank", "width=760,height=820");
  if (!receiptWindow) {
    throw new Error("Allow pop-ups to view your payment receipt.");
  }

  try {
    const response = audience === "admin"
      ? await adminLmsApi.getPaymentReceipt(paymentId)
      : await studentLmsApi.getPaymentReceipt(paymentId);
    const receipt = response.data;
    const discountRows = receipt.discountAmount > 0
      ? `<div class="row"><span>Amount before coupon</span><strong>${escapeHtml(formatCurrency(receipt.originalAmount))}</strong></div><div class="row"><span>Coupon${receipt.couponCode ? ` (${escapeHtml(receipt.couponCode)})` : ""}</span><strong>-${escapeHtml(formatCurrency(receipt.discountAmount))}</strong></div>`
      : "";
    receiptWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(receipt.invoiceNumber)}</title><style>body{font-family:Arial,sans-serif;color:#182744;padding:44px;max-width:680px;margin:auto}header{display:flex;justify-content:space-between;border-bottom:2px solid #5148a8;padding-bottom:24px;margin-bottom:30px}h1{margin:0 0 8px}p{color:#61718b}.row{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid #e7ebf2;padding:13px 0}.total{font-size:22px;font-weight:700;color:#5148a8}@media print{button{display:none}}</style></head><body><header><div><h1>Joviq Technologies</h1><p>Payment receipt</p></div><strong>${escapeHtml(receipt.invoiceNumber)}</strong></header><p><strong>Billed to:</strong><br>${escapeHtml(receipt.studentName)}<br>${escapeHtml(receipt.studentEmail)}</p><div class="row"><span>Program</span><strong>${escapeHtml(receipt.programTitle)}</strong></div><div class="row"><span>Plan</span><strong>${escapeHtml(receipt.planName)}</strong></div><div class="row"><span>Payment type</span><strong>${escapeHtml(receipt.paymentMode)}</strong></div>${discountRows}<div class="row total"><span>Amount paid</span><strong>${escapeHtml(formatCurrency(receipt.amount))}</strong></div><div class="row"><span>Gateway</span><span>${escapeHtml(receipt.gateway)}</span></div><div class="row"><span>Gateway payment ID</span><span>${escapeHtml(receipt.gatewayPaymentId ?? "-")}</span></div><p>Paid on ${escapeHtml(formatDateTime(receipt.paidAt ?? receipt.createdAt))}</p><button onclick="window.print()">Print / Save as PDF</button></body></html>`);
    receiptWindow.document.close();
  } catch (error) {
    receiptWindow.close();
    throw error;
  }
}

function formatShortDate(value?: string) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatEventType(value: string) {
  return value
    .replace(/\./g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function percent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
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

function formatPaymentMode(mode: string) {
  if (mode === "ReserveSeat") {
    return "Initial reserve payment";
  }

  if (mode === "RemainingBalance") {
    return "Remaining balance payment";
  }

  if (mode === "PayInFull") {
    return "Paid in full";
  }

  return formatStatusLabel(mode);
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

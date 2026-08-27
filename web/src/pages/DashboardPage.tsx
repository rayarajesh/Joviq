import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCopy,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  Filter,
  FolderKanban,
  GraduationCap,
  Headphones,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Lock,
  Mail,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unlock,
  UserPlus,
  WalletCards,
  Zap,
  UsersRound
} from "lucide-react";
import { IndiaMobileInput } from "../components/IndiaMobileInput";
import { adminUsersApi } from "../features/auth/api/authApi";
import type {
  AdminUserResponse,
  AdminUserSummaryResponse,
  AssignableRoleName,
  RoleName
} from "../features/auth/api/authTypes";
import { useAuth } from "../features/auth/context/useAuth";
import { adminLmsApi, mentorLmsApi, publicLmsApi, studentLmsApi } from "../features/lms/api/lmsApi";
import type {
  AdminReportResponse,
  AdminLmsSummaryResponse,
  AssessmentAttemptResponse,
  AssessmentResponse,
  AssignmentResponse,
  AuditLogResponse,
  AiInterviewAttemptResponse,
  CareerSupportResponse,
  CertificateResponse,
  CouponResponse,
  CurriculumModuleResponse,
  EnrollmentResponse,
  LiveClassResponse,
  MentorDashboardResponse,
  MentorLearnerResponse,
  MentorReviewQueueResponse,
  PaymentTransactionResponse,
  ProgramCategoryResponse,
  ProgramDetailsResponse,
  ProgramPlanResponse,
  ProgramSummaryResponse,
  ProjectResponse,
  RecordedClassResponse,
  StudentLmsDashboardResponse,
  StudentProgramWorkspaceResponse,
  SubmissionResponse,
  SupportTicketResponse
} from "../features/lms/api/lmsTypes";
import { defaultProgramPlans } from "../data/siteContent";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

type PrimaryRole = "Admin" | "Mentor" | "Student";
type RoleFilter = "All" | RoleName;
type MessageState = { tone: "success" | "error"; text: string } | null;

const pageSize = 8;
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const dashboardNavItems: Record<PrimaryRole, string[]> = {
  Admin: [
    "Overview",
    "Users",
    "Categories",
    "Programs",
    "Curriculum",
    "Live Classes",
    "Assignments",
    "Projects",
    "Assessments",
    "Enrollments",
    "Payments",
    "Coupons",
    "Certificates",
    "Support",
    "Audit Logs",
    "Reports"
  ],
  Mentor: ["Overview", "Learners", "Reviews", "Live Classes", "Projects", "Assessments", "Support"],
  Student: [
    "Overview",
    "My Program",
    "Continue Learning",
    "Live Classes",
    "Recorded Classes",
    "Assignments",
    "Projects",
    "Assessments",
    "AI Assessment",
    "AI Interview",
    "Mentor Support",
    "Career Support",
    "Payments",
    "Certificates"
  ]
};

const studentNavGroups = [
  { label: "Workspace", items: ["Overview", "My Program", "Continue Learning"] },
  { label: "Classes", items: ["Live Classes", "Recorded Classes"] },
  { label: "Practice and proof", items: ["Assignments", "Projects", "Assessments", "AI Assessment", "AI Interview"] },
  { label: "Guidance", items: ["Mentor Support", "Career Support"] },
  { label: "Account", items: ["Payments", "Certificates"] }
];

const moduleIconMap: Record<string, ComponentType<{ size?: number }>> = {
  Overview: LayoutDashboard,
  Users: UsersRound,
  Categories: Layers3,
  Programs: BookOpen,
  Curriculum: Layers3,
  "Live Classes": CalendarClock,
  "Recorded Classes": PlayCircle,
  Assignments: ListChecks,
  Projects: FolderKanban,
  Assessments: FileCheck2,
  "AI Assessment": Sparkles,
  "AI Interview": BriefcaseBusiness,
  "Mentor Support": Headphones,
  "Career Support": Trophy,
  Enrollments: GraduationCap,
  Payments: CreditCard,
  Coupons: CircleDollarSign,
  Certificates: Award,
  Notifications: Bell,
  Profile: ShieldCheck,
  Support: LifeBuoy,
  "Audit Logs": ShieldCheck,
  Reports: BarChart3,
  Reviews: FileCheck2,
  Learners: GraduationCap
};

export function DashboardPage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const roles = auth.user?.roles ?? [];
  const primaryRole: PrimaryRole = roles.includes("Admin") ? "Admin" : roles.includes("Mentor") ? "Mentor" : "Student";
  const requestedModule = searchParams.get("section");
  const canOpenRequestedModule = requestedModule
    && (dashboardNavItems[primaryRole].includes(requestedModule) || (primaryRole === "Student" && requestedModule === "Support"));
  const initialModule = canOpenRequestedModule
    ? requestedModule
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

  return (
    <main className="dashboard-shell">
      <DashboardSidebar activeModule={activeModule} onModuleChange={selectModule} role={primaryRole} />
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Joviq LMS</span>
            <h1>{activeModule}</h1>
            <p>{auth.user?.fullName} - {auth.user?.email}</p>
          </div>
        </header>

        {primaryRole === "Admin" ? <AdminDashboard activeModule={activeModule} currentUserId={auth.user?.id} /> : null}
        {primaryRole === "Mentor" ? <MentorDashboard activeModule={activeModule} /> : null}
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
  const navItems = dashboardNavItems[role];
  const navGroups = role === "Student"
    ? studentNavGroups
    : [{ label: "Workspace", items: navItems }];
  return (
    <aside className={`dashboard-sidebar dashboard-sidebar--${role.toLowerCase()}`}>
      {role !== "Student" ? (
        <div className="sidebar-brand">
          <Sparkles size={21} />
          <div>
            <strong>Joviq</strong>
            <span>{role} workspace</span>
          </div>
        </div>
      ) : null}
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navGroups.map((group) => (
          <div className="sidebar-nav__group" key={group.label}>
            <span className="sidebar-nav__label">{group.label}</span>
            {group.items.map((item) => {
              const Icon = moduleIconMap[item] ?? BarChart3;
              return (
                <button
                  className={activeModule === item ? "is-active" : ""}
                  key={item}
                  type="button"
                  onClick={() => onModuleChange(item)}
                >
                  <Icon size={17} />
                  <span>{item}</span>
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
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [summary, setSummary] = useState<AdminUserSummaryResponse | null>(null);
  const [lmsSummary, setLmsSummary] = useState<AdminLmsSummaryResponse | null>(null);
  const [lmsPrograms, setLmsPrograms] = useState<ProgramSummaryResponse[]>([]);
  const [programCategories, setProgramCategories] = useState<ProgramCategoryResponse[]>([]);
  const [adminCurriculum, setAdminCurriculum] = useState<CurriculumModuleResponse[]>([]);
  const [adminLiveClasses, setAdminLiveClasses] = useState<LiveClassResponse[]>([]);
  const [adminAssignments, setAdminAssignments] = useState<AssignmentResponse[]>([]);
  const [adminProjects, setAdminProjects] = useState<ProjectResponse[]>([]);
  const [adminAssessments, setAdminAssessments] = useState<AssessmentResponse[]>([]);
  const [adminEnrollments, setAdminEnrollments] = useState<EnrollmentResponse[]>([]);
  const [adminPayments, setAdminPayments] = useState<PaymentTransactionResponse[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<CouponResponse[]>([]);
  const [adminCertificates, setAdminCertificates] = useState<CertificateResponse[]>([]);
  const [adminReports, setAdminReports] = useState<AdminReportResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicketResponse[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword);
  const [showPassword, setShowPassword] = useState(false);

  const roleTabs: RoleFilter[] = ["All", "Student", "Mentor", "Admin"];

  const metrics = useMemo(
    () => [
      { icon: UsersRound, label: "Total users", value: summary?.totalUsers ?? "-" },
      { icon: GraduationCap, label: "Students", value: summary?.students ?? "-" },
      { icon: BriefcaseBusiness, label: "Mentors", value: summary?.mentors ?? "-" },
      { icon: ShieldCheck, label: "Admins", value: summary?.admins ?? "-" }
    ],
    [summary]
  );

  const lmsMetrics = useMemo(
    () => [
      { icon: BookOpen, label: "Programs", value: lmsSummary?.programs ?? "-" },
      { icon: GraduationCap, label: "Enrollments", value: lmsSummary?.enrollments ?? "-" },
      { icon: CircleDollarSign, label: "Verified revenue", value: formatCurrency(lmsSummary?.verifiedRevenue ?? 0) },
      { icon: LifeBuoy, label: "Open tickets", value: lmsSummary?.openSupportTickets ?? "-" }
    ],
    [lmsSummary]
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const [
        summaryResponse,
        usersResponse,
        lmsSummaryResponse,
        lmsProgramsResponse,
        categoriesResponse,
        supportTicketsResponse,
        curriculumResponse,
        liveClassesResponse,
        assignmentsResponse,
        projectsResponse,
        assessmentsResponse,
        enrollmentsResponse,
        paymentsResponse,
        couponsResponse,
        certificatesResponse,
        reportsResponse,
        auditLogsResponse
      ] = await Promise.all([
        adminUsersApi.getSummary(),
        adminUsersApi.getUsers({
          search,
          role: roleFilter === "All" ? undefined : roleFilter,
          page,
          pageSize
        }),
        adminLmsApi.getSummary(),
        adminLmsApi.getPrograms(),
        adminLmsApi.getCategories(),
        adminLmsApi.getSupportTickets(1, 8),
        adminLmsApi.getCurriculum(),
        adminLmsApi.getLiveClasses(),
        adminLmsApi.getAssignments(),
        adminLmsApi.getProjects(),
        adminLmsApi.getAssessments(),
        adminLmsApi.getEnrollments(),
        adminLmsApi.getPayments(),
        adminLmsApi.getCoupons(),
        adminLmsApi.getCertificates(),
        adminLmsApi.getReports(),
        adminLmsApi.getAuditLogs(1, 20)
      ]);

      setSummary(summaryResponse.data);
      setUsers(usersResponse.data.items);
      setLmsSummary(lmsSummaryResponse.data);
      setLmsPrograms(lmsProgramsResponse.data);
      setProgramCategories(categoriesResponse.data);
      setSupportTickets(supportTicketsResponse.data.items);
      setAdminCurriculum(curriculumResponse.data);
      setAdminLiveClasses(liveClassesResponse.data);
      setAdminAssignments(assignmentsResponse.data);
      setAdminProjects(projectsResponse.data);
      setAdminAssessments(assessmentsResponse.data);
      setAdminEnrollments(enrollmentsResponse.data);
      setAdminPayments(paymentsResponse.data);
      setAdminCoupons(couponsResponse.data);
      setAdminCertificates(certificatesResponse.data);
      setAdminReports(reportsResponse.data);
      setAuditLogs(auditLogsResponse.data.items);
      setTotalPages(Math.max(usersResponse.data.totalPages, 1));
      setTotalCount(usersResponse.data.totalCount);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, search]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setIsCreating(true);
    setMessage(null);

    const form = new FormData(formElement);
    const phoneNumber = toIndiaMobileNumber(form.get("phoneNumber"));
    if (!phoneNumber) {
      setIsCreating(false);
      setMessage({ tone: "error", text: "Phone must be a valid India +91 mobile number with exactly 10 digits." });
      return;
    }

    try {
      await adminUsersApi.createUser({
        fullName: String(form.get("fullName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        phoneNumber,
        role: String(form.get("role") ?? "Student") as AssignableRoleName,
        temporaryPassword
      });

      formElement.reset();
      setTemporaryPassword(generateTemporaryPassword());
      setMessage({ tone: "success", text: "User created successfully." });
      setPage(1);
      await loadDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsCreating(false);
    }
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setPage(1);
  }

  function changeRoleFilter(nextRole: RoleFilter) {
    setRoleFilter(nextRole);
    setPage(1);
  }

  async function copyTemporaryPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setMessage({ tone: "success", text: "Temporary password copied." });
    } catch {
      setMessage({ tone: "error", text: "Could not copy password from this browser." });
    }
  }

  async function runUserAction(user: AdminUserResponse, action: "lock" | "unlock" | "reset" | "logout") {
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

      if (action === "logout") {
        await adminUsersApi.logoutAll(user.id);
      }

      setMessage({ tone: "success", text: actionMessage(action, user.fullName) });
      await loadDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionUserId(null);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const showOverview = activeModule === "Overview";
  const showUsers = activeModule === "Overview" || activeModule === "Users";

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

      {showUsers ? (
      <section className="admin-layout">
        <form className="dashboard-card admin-form" onSubmit={createUser}>
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Access</span>
              <h2>Add mentor or student</h2>
              <p>Admin-created accounts are active immediately.</p>
            </div>
            <UserPlus size={23} />
          </div>
          <div className="form-grid">
            <label>
              Full name
              <input name="fullName" placeholder="Example: Ganesh Kumar" required />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={256}
                pattern={emailPattern}
                placeholder="name@example.com"
                title="Enter a valid email address."
                required
              />
            </label>
            <IndiaMobileInput label="Phone" name="phoneNumber" required />
            <label>
              Role
              <select name="role" defaultValue="Student">
                <option value="Student">Student</option>
                <option value="Mentor">Mentor</option>
              </select>
            </label>
            <label>
              Temporary password
              <div className="password-field">
                <input
                  name="temporaryPassword"
                  type={showPassword ? "text" : "password"}
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} title="Show or hide password">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
                <button type="button" onClick={() => setTemporaryPassword(generateTemporaryPassword())} title="Generate password">
                  <RefreshCw size={17} />
                </button>
                <button type="button" onClick={copyTemporaryPassword} title="Copy password">
                  <ClipboardCopy size={17} />
                </button>
              </div>
            </label>
          </div>
          <button className="primary-action" type="submit" disabled={isCreating}>
            <UserPlus size={18} />
            {isCreating ? "Creating user" : "Add user"}
          </button>
        </form>

        <section className="dashboard-card user-table-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Directory</span>
              <h2>Users</h2>
              <p>{totalCount} matching account{totalCount === 1 ? "" : "s"}.</p>
            </div>
            <button className="icon-action" type="button" onClick={() => void loadDashboard()} title="Refresh users">
              <RefreshCw size={18} />
            </button>
          </div>

          <form className="admin-toolbar" onSubmit={applySearch}>
            <label className="search-field">
              <Search size={17} />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search by name, email, or phone"
              />
            </label>
            <button className="secondary-action" type="submit">
              Search
            </button>
          </form>

          <div className="role-filter" aria-label="Filter users by role">
            <Filter size={17} />
            {roleTabs.map((role) => (
              <button
                className={roleFilter === role ? "is-active" : ""}
                key={role}
                type="button"
                onClick={() => changeRoleFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="admin-table">
            <div className="admin-table__head">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Activity</span>
              <span>Actions</span>
            </div>

            {isLoading ? <div className="table-state">Loading users...</div> : null}
            {!isLoading && users.length === 0 ? <div className="table-state">No users found.</div> : null}

            {!isLoading
              ? users.map((user) => {
                  const isLocked = user.accountStatus === "Locked";
                  const isCurrentUser = user.id === currentUserId;
                  const phone = formatPhoneForDisplay(user.phoneNumber);

                  return (
                    <article key={user.id} className="admin-table__row">
                      <div className="user-cell">
                        <strong title={user.fullName}>{user.fullName}</strong>
                        <span title={user.email}>{user.email}</span>
                        {phone ? (
                          <small className={phone.isValid ? undefined : "is-warning"} title={user.phoneNumber}>
                            {phone.text}
                          </small>
                        ) : (
                          <small className="is-warning">Phone missing</small>
                        )}
                      </div>
                      <div className="role-pills">
                        {user.roles.map((role) => (
                          <span key={role}>{role}</span>
                        ))}
                      </div>
                      <span className={statusClassName(user.accountStatus)} title={formatStatusLabel(user.accountStatus)}>
                        {formatStatusLabel(user.accountStatus)}
                      </span>
                      <div className="activity-cell">
                        <span>Created {formatDate(user.createdAt)}</span>
                        <small>{user.lastLoginAt ? `Last login ${formatDate(user.lastLoginAt)}` : "No login yet"}</small>
                      </div>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => void runUserAction(user, isLocked ? "unlock" : "lock")}
                          disabled={isCurrentUser || actionUserId === `${user.id}-${isLocked ? "unlock" : "lock"}`}
                          title={isCurrentUser ? "Current admin cannot lock own account" : isLocked ? "Unlock user" : "Lock user"}
                          aria-label={isCurrentUser ? "Current admin cannot lock own account" : isLocked ? `Unlock ${user.fullName}` : `Lock ${user.fullName}`}
                        >
                          {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void runUserAction(user, "reset")}
                          disabled={actionUserId === `${user.id}-reset`}
                          title="Send password reset"
                          aria-label={`Send password reset to ${user.fullName}`}
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void runUserAction(user, "logout")}
                          disabled={actionUserId === `${user.id}-logout`}
                          title="Logout all sessions"
                          aria-label={`Logout all sessions for ${user.fullName}`}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })
              : null}
          </div>

          <div className="pagination-row">
            <span>
              Page {page} of {totalPages}
            </span>
            <div>
              <button type="button" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page <= 1}>
                <ChevronLeft size={17} />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </section>
      ) : null}

      <AdminLmsPanel
        activeModule={activeModule}
        adminAssessments={adminAssessments}
        adminAssignments={adminAssignments}
        adminCertificates={adminCertificates}
        adminCoupons={adminCoupons}
        adminCurriculum={adminCurriculum}
        adminEnrollments={adminEnrollments}
        adminLiveClasses={adminLiveClasses}
        adminPayments={adminPayments}
        adminProjects={adminProjects}
        adminReports={adminReports}
        auditLogs={auditLogs}
        categories={programCategories}
        programs={lmsPrograms}
        summary={lmsSummary}
        supportTickets={supportTickets}
        onMessage={setMessage}
        onRefresh={loadDashboard}
      />
    </section>
  );
}

function AdminLmsPanel({
  activeModule,
  adminAssessments,
  adminAssignments,
  adminCertificates,
  adminCoupons,
  adminCurriculum,
  adminEnrollments,
  adminLiveClasses,
  adminPayments,
  adminProjects,
  adminReports,
  auditLogs,
  categories,
  programs,
  summary,
  supportTickets,
  onMessage,
  onRefresh
}: {
  activeModule: string;
  adminAssessments: AssessmentResponse[];
  adminAssignments: AssignmentResponse[];
  adminCertificates: CertificateResponse[];
  adminCoupons: CouponResponse[];
  adminCurriculum: CurriculumModuleResponse[];
  adminEnrollments: EnrollmentResponse[];
  adminLiveClasses: LiveClassResponse[];
  adminPayments: PaymentTransactionResponse[];
  adminProjects: ProjectResponse[];
  adminReports: AdminReportResponse | null;
  auditLogs: AuditLogResponse[];
  categories: ProgramCategoryResponse[];
  programs: ProgramSummaryResponse[];
  summary: AdminLmsSummaryResponse | null;
  supportTickets: SupportTicketResponse[];
  onMessage: (message: MessageState) => void;
  onRefresh: () => Promise<void>;
}) {
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  const [isPlanEditorLoading, setIsPlanEditorLoading] = useState(false);
  const [planEditorProgram, setPlanEditorProgram] = useState<ProgramDetailsResponse | null>(null);

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
        shortDescription: `A mentor-guided ${title} program with practical projects, assessments, and career support.`,
        overview: `${title} helps learners build strong ${domain} foundations, complete portfolio projects, receive mentor feedback, and prepare for interview conversations with proof of skill.`,
        level: String(form.get("level") ?? "Beginner to job-ready"),
        duration: String(form.get("duration") ?? "8 to 16 weeks"),
        learningMode: String(form.get("learningMode") ?? "Live + recorded + project mentoring"),
        mentorSummary: `Experienced ${title} mentors guide lessons, project reviews, and interview readiness.`,
        certificationName: `Joviq ${title} Career Program Certification`,
        skills: parseCommaList(String(form.get("skills") ?? "")),
        outcomes: [
          "Portfolio-ready projects",
          "Mentor-reviewed assignments",
          "Assessment-backed certification",
          "Interview preparation support"
        ],
        faqs: [
          { question: "Can beginners join?", answer: "Yes. The program starts from foundations and moves into projects." },
          { question: "Will I get certification?", answer: "Yes. Certification is linked to projects and assessments." }
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

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();

    try {
      await adminLmsApi.createCategory({
        name,
        slug: toSlug(String(form.get("slug") ?? name)),
        description: String(form.get("description") ?? "").trim(),
        isPublished: form.get("isPublished") === "on"
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Category created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editCategory(category: ProgramCategoryResponse) {
    const name = window.prompt("Category name", category.name);
    if (name === null) {
      return;
    }

    const description = window.prompt("Category description", category.description);
    if (description === null) {
      return;
    }

    try {
      await adminLmsApi.updateCategory(category.id, {
        name,
        slug: category.slug,
        description,
        isPublished: true
      });
      onMessage({ tone: "success", text: "Category updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
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

  async function createLiveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await adminLmsApi.createLiveClass({
        programId: String(form.get("programId") ?? ""),
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        startsAt: toIsoDateTime(String(form.get("startsAt") ?? "")),
        endsAt: toIsoDateTime(String(form.get("endsAt") ?? "")),
        joinUrl: String(form.get("joinUrl") ?? "").trim() || undefined,
        recordingUrl: String(form.get("recordingUrl") ?? "").trim() || undefined
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Live class created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editLiveClass(liveClass: LiveClassResponse) {
    const title = window.prompt("Live class title", liveClass.title);
    if (title === null) {
      return;
    }

    try {
      await adminLmsApi.updateLiveClass(liveClass.id, {
        programId: liveClass.programId,
        title,
        description: liveClass.description,
        startsAt: liveClass.startsAt,
        endsAt: liveClass.endsAt,
        joinUrl: liveClass.joinUrl,
        recordingUrl: liveClass.recordingUrl
      });
      onMessage({ tone: "success", text: "Live class updated." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await adminLmsApi.createAssignment({
        programId: String(form.get("programId") ?? ""),
        title: String(form.get("title") ?? "").trim(),
        instructions: String(form.get("instructions") ?? "").trim(),
        dueAt: String(form.get("dueAt") ?? "") ? toIsoDateTime(String(form.get("dueAt") ?? "")) : undefined,
        maxScore: Number(form.get("maxScore") ?? 100),
        isPublished: form.get("isPublished") === "on"
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Assignment created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editAssignment(assignment: AssignmentResponse) {
    const title = window.prompt("Assignment title", assignment.title);
    if (title === null) {
      return;
    }

    try {
      await adminLmsApi.updateAssignment(assignment.id, {
        programId: assignment.programId,
        title,
        instructions: assignment.instructions,
        dueAt: assignment.dueAt,
        maxScore: assignment.maxScore,
        isPublished: assignment.isPublished
      });
      onMessage({ tone: "success", text: "Assignment updated." });
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

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await adminLmsApi.createAssessment({
        programId: String(form.get("programId") ?? ""),
        title: String(form.get("title") ?? "").trim(),
        assessmentType: String(form.get("assessmentType") ?? "").trim(),
        instructions: String(form.get("instructions") ?? "").trim(),
        durationMinutes: Number(form.get("durationMinutes") ?? 45),
        passingPercentage: Number(form.get("passingPercentage") ?? 70),
        isAiPowered: form.get("isAiPowered") === "on",
        isPublished: form.get("isPublished") === "on"
      });
      formElement.reset();
      onMessage({ tone: "success", text: "Assessment created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  async function editAssessment(assessment: AssessmentResponse) {
    const title = window.prompt("Assessment title", assessment.title);
    if (title === null) {
      return;
    }

    try {
      await adminLmsApi.updateAssessment(assessment.id, {
        programId: assessment.programId,
        title,
        assessmentType: assessment.assessmentType,
        instructions: assessment.instructions,
        durationMinutes: assessment.durationMinutes,
        passingPercentage: assessment.passingPercentage,
        isAiPowered: assessment.isAiPowered,
        isPublished: assessment.isPublished
      });
      onMessage({ tone: "success", text: "Assessment updated." });
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

  const showPrograms = activeModule === "Overview" || activeModule === "Programs";
  const showSupport = activeModule === "Overview" || activeModule === "Support";
  const showModule = (module: string) => activeModule === module;

  if (activeModule === "Users") {
    return null;
  }

  return (
    <section className="dashboard-card lms-admin-panel">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">LMS engine</span>
          <h2>{activeModule === "Overview" ? "Programs, reviews, payments, and support" : activeModule}</h2>
          <p>
            {summary?.publishedPrograms ?? 0} published programs, {summary?.activeEnrollments ?? 0} active enrollments.
          </p>
        </div>
        <Layers3 size={23} />
      </div>

      <div className="lms-admin-grid">
        {showModule("Categories") ? (
          <form className="lms-mini-form" onSubmit={createCategory}>
            <h3>Create category</h3>
            <label>
              Name
              <input name="name" placeholder="Example: Healthcare" required />
            </label>
            <label>
              Slug
              <input name="slug" placeholder="healthcare" required />
            </label>
            <label>
              Description
              <textarea name="description" placeholder="Describe this learning domain" required />
            </label>
            <label className="inline-check">
              <input name="isPublished" type="checkbox" defaultChecked />
              Published
            </label>
            <button className="primary-action" type="submit">
              <UserPlus size={18} />
              Create category
            </button>
          </form>
        ) : null}

        {showModule("Categories") ? (
          <section className="lms-list-panel">
            <h3>Categories</h3>
            <div className="lms-scroll-list">
              {categories.map((category) => (
                <article key={category.id} className="lms-list-item">
                  <div>
                    <strong>{category.name}</strong>
                    <span>{category.slug} - {category.programs.length} programs</span>
                  </div>
                  <button type="button" onClick={() => void editCategory(category)}>Edit</button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showPrograms ? (
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
              <input name="learningMode" defaultValue="Live + recorded + project mentoring" />
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

        {showPrograms ? (
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

        {activeModule === "Programs" && planEditorProgram ? (
          <section className="lms-list-panel lms-list-panel--wide admin-plan-editor">
            <div className="admin-plan-editor__header">
              <div>
                <span>Pricing and access</span>
                <h3>{planEditorProgram.title}</h3>
                <p>Changes here are shown on this program's public details page.</p>
              </div>
              <button type="button" onClick={() => void restoreMissingPlans()}>
                <RotateCcw size={16} />
                Restore missing plans
              </button>
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
                    Features (one per line)
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
                <div className="table-state">No plans configured. Use Restore missing plans to create all three.</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {showModule("Curriculum") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Curriculum modules</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createModule}>
              <select name="programId" required>
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
              {adminCurriculum.length === 0 ? <div className="table-state">No curriculum modules yet.</div> : null}
              {adminCurriculum.map((module) => (
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

        {showModule("Live Classes") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Live class schedule</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createLiveClass}>
              <select name="programId" required>
                <option value="">Choose program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
              <input name="title" placeholder="Class title" required />
              <input name="description" placeholder="Class description" required />
              <input name="startsAt" type="datetime-local" required />
              <input name="endsAt" type="datetime-local" required />
              <input name="joinUrl" placeholder="Join URL" />
              <input name="recordingUrl" placeholder="Recording URL" />
              <button className="primary-action" type="submit">Create class</button>
            </form>
            <div className="lms-scroll-list">
              {adminLiveClasses.length === 0 ? <div className="table-state">No live classes scheduled.</div> : null}
              {adminLiveClasses.map((liveClass) => (
                <article key={liveClass.id} className="lms-list-item">
                  <div>
                    <strong>{liveClass.title}</strong>
                    <span>{formatDateTime(liveClass.startsAt)} - {liveClass.description}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{liveClass.status}</small>
                    <button type="button" onClick={() => void editLiveClass(liveClass)}>Edit</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {showModule("Assignments") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Assignments</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createAssignment}>
              <select name="programId" required>
                <option value="">Choose program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
              <input name="title" placeholder="Assignment title" required />
              <input name="instructions" placeholder="Instructions" required />
              <input name="dueAt" type="datetime-local" />
              <input name="maxScore" type="number" min="1" max="100" defaultValue="100" />
              <label className="inline-check">
                <input name="isPublished" type="checkbox" defaultChecked />
                Published
              </label>
              <button className="primary-action" type="submit">Create assignment</button>
            </form>
            <div className="lms-scroll-list">
              {adminAssignments.length === 0 ? <div className="table-state">No assignments yet.</div> : null}
              {adminAssignments.map((assignment) => (
                <article key={assignment.id} className="lms-list-item">
                  <div>
                    <strong>{assignment.title}</strong>
                    <span>{assignment.instructions}</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{assignment.isPublished ? "Published" : "Draft"}</small>
                    <button type="button" onClick={() => void editAssignment(assignment)}>Edit</button>
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

        {showModule("Assessments") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Assessments</h3>
            <form className="lms-mini-form lms-mini-form--inline" onSubmit={createAssessment}>
              <select name="programId" required>
                <option value="">Choose program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
              <input name="title" placeholder="Assessment title" required />
              <input name="assessmentType" placeholder="Quiz / Practical / Viva" required />
              <input name="instructions" placeholder="Instructions" required />
              <input name="durationMinutes" type="number" min="5" defaultValue="45" />
              <input name="passingPercentage" type="number" min="1" max="100" defaultValue="70" />
              <label className="inline-check">
                <input name="isAiPowered" type="checkbox" />
                AI
              </label>
              <label className="inline-check">
                <input name="isPublished" type="checkbox" defaultChecked />
                Published
              </label>
              <button className="primary-action" type="submit">Create assessment</button>
            </form>
            <div className="lms-scroll-list">
              {adminAssessments.length === 0 ? <div className="table-state">No assessments yet.</div> : null}
              {adminAssessments.map((assessment) => (
                <article key={assessment.id} className="lms-list-item">
                  <div>
                    <strong>{assessment.title}</strong>
                    <span>{assessment.assessmentType} - {assessment.durationMinutes} min</span>
                  </div>
                  <div className="lms-row-actions">
                    <small>{assessment.isAiPowered ? "AI" : "Manual"}</small>
                    <button type="button" onClick={() => void editAssessment(assessment)}>Edit</button>
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
                  <small>{enrollment.status}</small>
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

        {showSupport ? (
          <section className="lms-list-panel">
            <h3>Support queue</h3>
            <div className="lms-scroll-list">
              {supportTickets.length === 0 ? <div className="table-state">No support tickets yet.</div> : null}
              {supportTickets.map((ticket) => (
                <article key={ticket.id} className="lms-list-item">
                  <div>
                    <strong>{ticket.issue}</strong>
                    <span>{ticket.name} - {formatDate(ticket.createdAt)}</span>
                  </div>
                  <small>{ticket.status}</small>
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

        {showModule("Reports") ? (
          <section className="lms-list-panel lms-list-panel--wide">
            <h3>Reports snapshot</h3>
            <div className="module-stat-strip">
              <article>
                <span>Programs</span>
                <strong>{adminReports?.summary.programs ?? 0}</strong>
              </article>
              <article>
                <span>Active enrollments</span>
                <strong>{adminReports?.summary.activeEnrollments ?? 0}</strong>
              </article>
              <article>
                <span>Revenue</span>
                <strong>{formatCurrency(adminReports?.summary.verifiedRevenue ?? 0)}</strong>
              </article>
            </div>
            <div className="lms-scroll-list">
              {(adminReports?.recentPayments ?? []).slice(0, 8).map((payment) => (
                <article key={payment.id} className="lms-list-item">
                  <div>
                    <strong>{formatCurrency(payment.amount)}</strong>
                    <span>{payment.status} - {formatDate(payment.createdAt)}</span>
                  </div>
                  <small>{payment.mode}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function MentorDashboard({ activeModule }: { activeModule: string }) {
  const [summary, setSummary] = useState<MentorDashboardResponse | null>(null);
  const [queue, setQueue] = useState<MentorReviewQueueResponse | null>(null);
  const [learners, setLearners] = useState<MentorLearnerResponse[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassResponse[]>([]);
  const [assessmentAttempts, setAssessmentAttempts] = useState<AssessmentAttemptResponse[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportTicketResponse[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadMentorDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, queueResponse, learnersResponse, liveClassesResponse, assessmentAttemptsResponse, supportRequestsResponse] = await Promise.all([
        mentorLmsApi.getDashboard(),
        mentorLmsApi.getReviewQueue(),
        mentorLmsApi.getLearners(),
        mentorLmsApi.getLiveClasses(),
        mentorLmsApi.getAssessmentReviewQueue(),
        mentorLmsApi.getSupportRequests()
      ]);
      setSummary(summaryResponse.data);
      setQueue(queueResponse.data);
      setLearners(learnersResponse.data);
      setLiveClasses(liveClassesResponse.data);
      setAssessmentAttempts(assessmentAttemptsResponse.data);
      setSupportRequests(supportRequestsResponse.data);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function reviewSubmission(submission: SubmissionResponse) {
    const scoreText = window.prompt("Enter score from 0 to 100", submission.score?.toString() ?? "90");
    if (scoreText === null) {
      return;
    }

    const score = Number(scoreText);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setMessage({ tone: "error", text: "Score must be a number between 0 and 100." });
      return;
    }

    const feedback = window.prompt("Enter mentor feedback", submission.feedback ?? "");
    if (feedback === null) {
      return;
    }

    if (feedback.trim().length < 3) {
      setMessage({ tone: "error", text: "Feedback must contain at least 3 characters." });
      return;
    }

    setActionId(submission.id);
    setMessage(null);
    const body = {
      score,
      feedback: feedback.trim(),
      status: 4 as const
    };

    try {
      if (submission.itemType === "Assignment") {
        await mentorLmsApi.reviewAssignmentSubmission(submission.id, body);
      } else {
        await mentorLmsApi.reviewProjectSubmission(submission.id, body);
      }

      setMessage({ tone: "success", text: `${submission.itemType} feedback saved.` });
      await loadMentorDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function reviewAssessment(attempt: AssessmentAttemptResponse) {
    const scoreText = window.prompt("Enter assessment score from 0 to 100", attempt.score?.toString() ?? "90");
    if (scoreText === null) {
      return;
    }

    const score = Number(scoreText);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setMessage({ tone: "error", text: "Score must be a number between 0 and 100." });
      return;
    }

    const feedback = window.prompt("Enter assessment feedback", "");
    if (feedback === null) {
      return;
    }

    if (feedback.trim().length < 3) {
      setMessage({ tone: "error", text: "Feedback must contain at least 3 characters." });
      return;
    }

    setActionId(attempt.id);
    setMessage(null);

    try {
      await mentorLmsApi.reviewAssessmentAttempt(attempt.id, {
        score,
        resultJson: JSON.stringify({
          feedback: feedback.trim()
        })
      });

      setMessage({ tone: "success", text: "Assessment feedback saved." });
      await loadMentorDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    void loadMentorDashboard();
  }, [loadMentorDashboard]);

  const submissions = [
    ...(queue?.assignmentSubmissions ?? []),
    ...(queue?.projectSubmissions ?? [])
  ];
  const visibleSubmissions = activeModule === "Projects"
    ? submissions.filter((submission) => submission.itemType === "Project")
    : submissions;
  const showOverview = activeModule === "Overview";
  const showReviews = activeModule === "Overview" || activeModule === "Reviews" || activeModule === "Projects";

  return (
    <section className="dashboard-stack">
      {showOverview ? (
        <section className="metric-grid">
          <DashboardMetric icon={CalendarClock} label="Live sessions" value={summary?.assignedLiveClasses ?? "-"} />
          <DashboardMetric icon={ListChecks} label="Assignments pending" value={summary?.pendingAssignmentReviews ?? "-"} />
          <DashboardMetric icon={FolderKanban} label="Projects pending" value={summary?.pendingProjectReviews ?? "-"} />
          <DashboardMetric icon={CheckCircle2} label="Reviewed" value={summary?.reviewedSubmissions ?? "-"} />
        </section>
      ) : null}

      {message ? <MessageBox message={message} /> : null}

      {activeModule === "Learners" ? (
        <section className="dashboard-card mentor-review-panel">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Learners</span>
              <h2>Assigned student progress</h2>
              <p>Track active enrollments, learning progress, and program context.</p>
            </div>
            <GraduationCap size={23} />
          </div>
          <div className="mentor-review-list">
            {learners.length === 0 ? <div className="table-state">No learners assigned yet.</div> : null}
            {learners.map((learner) => (
              <article key={learner.enrollmentId} className="mentor-review-card">
                <div>
                  <span className="status-pill status-pill--active">{learner.enrollmentStatus}</span>
                  <h3>{learner.fullName}</h3>
                  <p>{learner.programTitle} - {learner.progressPercentage}% complete - {learner.email}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeModule === "Live Classes" ? (
        <section className="dashboard-card mentor-review-panel">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Live classes</span>
              <h2>Mentor session calendar</h2>
              <p>Upcoming and shared sessions visible to this mentor workspace.</p>
            </div>
            <CalendarClock size={23} />
          </div>
          <div className="mentor-review-list">
            {liveClasses.length === 0 ? <div className="table-state">No live classes scheduled.</div> : null}
            {liveClasses.map((liveClass) => (
              <article key={liveClass.id} className="mentor-review-card">
                <div>
                  <span className="status-pill status-pill--active">{liveClass.status}</span>
                  <h3>{liveClass.title}</h3>
                  <p>{formatDateTime(liveClass.startsAt)} - {liveClass.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeModule === "Assessments" ? (
        <section className="dashboard-card mentor-review-panel">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Assessments</span>
              <h2>Evaluation queue</h2>
              <p>Review submitted assessment attempts and save scored feedback.</p>
            </div>
            <FileCheck2 size={23} />
          </div>
          <div className="mentor-review-list">
            {assessmentAttempts.length === 0 ? <div className="table-state">No assessment attempts waiting for review.</div> : null}
            {assessmentAttempts.map((attempt) => (
              <article key={attempt.id} className="mentor-review-card">
                <div>
                  <span className="status-pill status-pill--active">{attempt.status}</span>
                  <h3>{attempt.assessmentTitle}</h3>
                  <p>Submitted {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : "recently"}</p>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  disabled={actionId === attempt.id}
                  onClick={() => void reviewAssessment(attempt)}
                >
                  <CheckCircle2 size={17} />
                  {actionId === attempt.id ? "Saving" : "Approve"}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeModule === "Support" ? (
        <section className="dashboard-card mentor-review-panel">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Support</span>
              <h2>Mentor support requests</h2>
              <p>Questions related to reviews, projects, assignments, and mentor help.</p>
            </div>
            <Headphones size={23} />
          </div>
          <div className="mentor-review-list">
            {supportRequests.length === 0 ? <div className="table-state">No mentor support requests yet.</div> : null}
            {supportRequests.map((ticket) => (
              <article key={ticket.id} className="mentor-review-card">
                <div>
                  <span className="status-pill status-pill--active">{ticket.status}</span>
                  <h3>{ticket.issue}</h3>
                  <p>{ticket.name} - {ticket.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {showReviews ? (
      <section className="dashboard-card mentor-review-panel">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">Mentor reviews</span>
            <h2>{activeModule === "Projects" ? "Project queue" : "Submission queue"}</h2>
            <p>Review project work, assignment checkpoints, and career-readiness proof.</p>
          </div>
          <FileCheck2 size={23} />
        </div>

        {isLoading ? <div className="table-state">Loading review queue...</div> : null}
        {!isLoading && visibleSubmissions.length === 0 ? <div className="table-state">No submissions waiting for review.</div> : null}

        <div className="mentor-review-list">
          {visibleSubmissions.map((submission) => (
            <article key={submission.id} className="mentor-review-card">
              <div>
                <span className="status-pill status-pill--active">{submission.itemType}</span>
                <h3>{submission.submissionUrl ?? submission.gitHubUrl ?? submission.demoUrl ?? "Learner submission"}</h3>
                <p>{submission.notes ?? "Review the submitted artifact and send scored feedback."}</p>
              </div>
              <button
                className="secondary-action"
                type="button"
                disabled={actionId === submission.id}
                onClick={() => void reviewSubmission(submission)}
              >
                <CheckCircle2 size={17} />
                {actionId === submission.id ? "Saving" : "Approve"}
              </button>
            </article>
          ))}
        </div>
      </section>
      ) : null}
    </section>
  );
}

function StudentDashboard({ activeModule }: { activeModule: string }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<StudentLmsDashboardResponse | null>(null);
  const [workspace, setWorkspace] = useState<StudentProgramWorkspaceResponse | null>(null);
  const [programs, setPrograms] = useState<ProgramSummaryResponse[]>([]);
  const [recordedClasses, setRecordedClasses] = useState<RecordedClassResponse[]>([]);
  const [aiAssessments, setAiAssessments] = useState<AssessmentResponse[]>([]);
  const [aiInterviews, setAiInterviews] = useState<AiInterviewAttemptResponse[]>([]);
  const [mentorSupport, setMentorSupport] = useState<SupportTicketResponse[]>([]);
  const [careerSupport, setCareerSupport] = useState<CareerSupportResponse | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});
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

      const [recordedResponse, aiAssessmentResponse, aiInterviewResponse, mentorSupportResponse, careerSupportResponse] =
        await Promise.allSettled([
          studentLmsApi.getRecordedClasses(),
          studentLmsApi.getAiAssessments(),
          studentLmsApi.getAiInterviews(),
          studentLmsApi.getMentorSupport(),
          studentLmsApi.getCareerSupport()
        ]);

      setRecordedClasses(recordedResponse.status === "fulfilled" ? recordedResponse.value.data : []);
      setAiAssessments(aiAssessmentResponse.status === "fulfilled" ? aiAssessmentResponse.value.data : []);
      setAiInterviews(aiInterviewResponse.status === "fulfilled" ? aiInterviewResponse.value.data : []);
      setMentorSupport(mentorSupportResponse.status === "fulfilled" ? mentorSupportResponse.value.data : []);
      setCareerSupport(careerSupportResponse.status === "fulfilled" ? careerSupportResponse.value.data : null);
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

  async function completeLesson(lessonId: string) {
    setActionId(`lesson-${lessonId}`);
    setMessage(null);

    try {
      await studentLmsApi.updateLessonProgress(lessonId, 100);
      setMessage({ tone: "success", text: "Lesson marked complete." });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function submitAssignment(assignment: AssignmentResponse) {
    const value = assignmentDrafts[assignment.id]?.trim();
    if (!value) {
      setMessage({ tone: "error", text: "Add an assignment submission URL first." });
      return;
    }

    setActionId(`assignment-${assignment.id}`);
    setMessage(null);

    try {
      await studentLmsApi.submitAssignment(assignment.id, { submissionUrl: value });
      setAssignmentDrafts((drafts) => ({ ...drafts, [assignment.id]: "" }));
      setMessage({ tone: "success", text: "Assignment submitted for mentor review." });
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
      setMessage({ tone: "success", text: "Project submitted for mentor review." });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function startAssessment(assessment: AssessmentResponse, isAiPowered = false) {
    setActionId(`assessment-${assessment.id}`);
    setMessage(null);

    try {
      if (isAiPowered) {
        await studentLmsApi.startAiAssessmentAttempt(assessment.id);
      } else {
        await studentLmsApi.startAssessmentAttempt(assessment.id);
      }

      setMessage({ tone: "success", text: `${assessment.title} attempt started.` });
      await loadStudentDashboard();
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionId(null);
    }
  }

  async function startAiInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setActionId("ai-interview");
    setMessage(null);

    try {
      await studentLmsApi.startAiInterview({
        jobRole: String(form.get("jobRole") ?? ""),
        domain: String(form.get("domain") ?? ""),
        interviewType: String(form.get("interviewType") ?? "Technical")
      });
      formElement.reset();
      setMessage({ tone: "success", text: "AI interview practice started." });
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

  async function createSupportTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const enrollment = workspace?.enrollment ?? dashboard?.enrollment;

    setActionId("support");
    setMessage(null);

    try {
      await studentLmsApi.createSupportTicket({
        programId: enrollment?.programId,
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        issue: String(form.get("issue") ?? ""),
        description: String(form.get("description") ?? ""),
        priority: String(form.get("priority") ?? "Normal")
      });
      formElement.reset();
      setMessage({ tone: "success", text: "Support ticket created. The team can now track it from admin." });
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
  const curriculum = workspace?.curriculum ?? [];
  const assignments = workspace?.assignments ?? [];
  const projects = workspace?.projects ?? [];
  const payments = workspace?.payments ?? [];
  const certificates = workspace?.certificates ?? [];
  const liveClasses = workspace?.liveClasses ?? [];
  const assessments = workspace?.assessments ?? [];
  const notifications = dashboard?.notifications ?? [];
  const showOverview = activeModule === "Overview";
  const showStudentModule = (...modules: string[]) => activeModule === "Overview" || modules.includes(activeModule);

  return (
    <section className="dashboard-stack">
      {showOverview ? (
        <section className="metric-grid">
          <DashboardMetric icon={BookOpen} label="Program status" value={dashboard?.programStatus ?? "-"} />
          <DashboardMetric icon={BarChart3} label="Learning progress" value={`${dashboard?.learningProgressPercentage ?? 0}%`} />
          <DashboardMetric icon={ListChecks} label="Pending work" value={(dashboard?.pendingAssignments ?? 0) + (dashboard?.pendingProjects ?? 0)} />
          <DashboardMetric icon={WalletCards} label="Balance due" value={formatCurrency(dashboard?.balanceDue ?? 0)} />
        </section>
      ) : null}

      {message ? <MessageBox message={message} /> : null}
      {isLoading ? <section className="dashboard-card"><div className="table-state">Loading LMS workspace...</div></section> : null}

      {!isLoading && activeModule === "Profile" ? (
        <section className="dashboard-card student-program-hero">
          <div>
            <span className="eyebrow">Profile</span>
            <h2>Complete your student onboarding profile.</h2>
            <p>Keep personal, academic, resume, LinkedIn, GitHub, portfolio, skills, and target role details ready for mentors and career support.</p>
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
              <p>Each program includes curriculum, projects, assignments, assessments, certification, and career support.</p>
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

          {showStudentModule("Continue Learning") ? (
          <section className="dashboard-card learning-path-card">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Continue learning</span>
                <h2>Curriculum</h2>
                <p>Complete lessons, unlock full content after payment, and keep progress visible.</p>
              </div>
              <BookOpen size={23} />
            </div>
            <div className="module-list">
              {curriculum.map((module) => (
                <article key={module.id} className="module-card">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <div className="lesson-list">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="lesson-row">
                        <div>
                          <strong>{lesson.title}</strong>
                          <span>{lesson.durationMinutes} min - {lesson.isLocked ? "Locked" : `${lesson.progressPercentage}%`}</span>
                        </div>
                        <button
                          type="button"
                          disabled={lesson.isLocked || lesson.isCompleted || actionId === `lesson-${lesson.id}`}
                          onClick={() => void completeLesson(lesson.id)}
                          title={lesson.isLocked ? "Pay balance to unlock this lesson" : "Mark lesson complete"}
                        >
                          {lesson.isCompleted ? <CheckCircle2 size={17} /> : lesson.isLocked ? <Lock size={17} /> : <PlayCircle size={17} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Assignments") ? (
          <section className="dashboard-card work-submit-card">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Assignments</span>
                <h2>Submit for review</h2>
              </div>
              <ListChecks size={23} />
            </div>
            <div className="submission-list">
              {assignments.slice(0, 4).map((assignment) => (
                <article key={assignment.id}>
                  <div>
                    <strong>{assignment.title}</strong>
                    <span>{assignment.latestSubmission ? `Status: ${assignment.latestSubmission.status}` : "Pending submission"}</span>
                  </div>
                  <div className="submission-inline-form">
                    <input
                      value={assignmentDrafts[assignment.id] ?? ""}
                      onChange={(event) => setAssignmentDrafts((drafts) => ({ ...drafts, [assignment.id]: event.target.value }))}
                      placeholder="https://submission-link.com"
                    />
                    <button type="button" onClick={() => void submitAssignment(assignment)} disabled={actionId === `assignment-${assignment.id}`}>
                      <Send size={16} />
                    </button>
                  </div>
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

          {showStudentModule("Live Classes") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Live classes</span>
                <h2>Upcoming sessions</h2>
              </div>
              <CalendarClock size={23} />
            </div>
            <div className="lms-timeline">
              {liveClasses.length === 0 ? <div className="table-state">No live classes scheduled.</div> : null}
              {liveClasses.slice(0, 6).map((liveClass) => (
                <article key={liveClass.id}>
                  <strong>{liveClass.title}</strong>
                  <span>{formatDateTime(liveClass.startsAt)}</span>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Assessments") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Assessments</span>
                <h2>Practice and scoring</h2>
              </div>
              <FileCheck2 size={23} />
            </div>
            <div className="lms-timeline">
              {assessments.length === 0 ? <div className="table-state">No assessments published yet.</div> : null}
              {assessments.slice(0, 8).map((assessment) => (
                <article key={assessment.id}>
                  <div>
                    <strong>{assessment.title}</strong>
                    <span>{assessment.assessmentType} - {assessment.durationMinutes} min</span>
                  </div>
                  <button
                    type="button"
                    disabled={actionId === `assessment-${assessment.id}`}
                    onClick={() => void startAssessment(assessment)}
                  >
                    <PlayCircle size={16} />
                  </button>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Recorded Classes") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Recorded classes</span>
                <h2>Replay lessons</h2>
              </div>
              <PlayCircle size={23} />
            </div>
            <div className="lms-timeline">
              {recordedClasses.length === 0 ? <div className="table-state">No recordings available yet.</div> : null}
              {recordedClasses.slice(0, 8).map((recording) => (
                <article key={recording.lessonId}>
                  <div>
                    <strong>{recording.title}</strong>
                    <span>{recording.moduleTitle} - {recording.durationMinutes} min - {recording.isLocked ? "Locked" : `${recording.progressPercentage}%`}</span>
                  </div>
                  <button type="button" disabled={recording.isLocked} title={recording.isLocked ? "Complete payment to unlock" : "Open recording"}>
                    {recording.isLocked ? <Lock size={16} /> : <PlayCircle size={16} />}
                  </button>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("AI Assessment") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">AI assessment</span>
                <h2>Adaptive practice</h2>
              </div>
              <Sparkles size={23} />
            </div>
            <div className="lms-timeline">
              {aiAssessments.length === 0 ? <div className="table-state">No AI assessments published yet.</div> : null}
              {aiAssessments.map((assessment) => (
                <article key={assessment.id}>
                  <div>
                    <strong>{assessment.title}</strong>
                    <span>{assessment.durationMinutes} min - passing {assessment.passingPercentage}%</span>
                  </div>
                  <button
                    type="button"
                    disabled={actionId === `assessment-${assessment.id}`}
                    onClick={() => void startAssessment(assessment, true)}
                  >
                    <Sparkles size={16} />
                  </button>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("AI Interview") ? (
          <form className="dashboard-card support-ticket-form" onSubmit={startAiInterview}>
            <div className="card-title-row">
              <div>
                <span className="eyebrow">AI interview</span>
                <h2>Start practice</h2>
              </div>
              <BriefcaseBusiness size={23} />
            </div>
            <input name="jobRole" placeholder="Target role, e.g. Data Analyst" required />
            <input name="domain" placeholder="Domain, e.g. Data Science" required />
            <select name="interviewType" defaultValue="Technical">
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="Project">Project explanation</option>
            </select>
            <button className="primary-action" type="submit" disabled={actionId === "ai-interview"}>
              <Sparkles size={17} />
              Start interview
            </button>
            <div className="lms-timeline">
              {aiInterviews.length === 0 ? <div className="table-state">No AI interview attempts yet.</div> : null}
              {aiInterviews.slice(0, 4).map((attempt) => (
                <article key={attempt.id}>
                  <strong>{attempt.jobRole}</strong>
                  <span>{attempt.domain} - {attempt.status} - {formatDateTime(attempt.startedAt)}</span>
                </article>
              ))}
            </div>
          </form>
          ) : null}

          {showStudentModule("Career Support") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Career support</span>
                <h2>Readiness tracker</h2>
              </div>
              <Trophy size={23} />
            </div>
            <div className="module-stat-strip module-stat-strip--compact">
              <article>
                <span>Resume</span>
                <strong>{careerSupport?.resumeStatus ?? "Pending"}</strong>
              </article>
              <article>
                <span>LinkedIn</span>
                <strong>{careerSupport?.linkedInStatus ?? "Pending"}</strong>
              </article>
              <article>
                <span>Portfolio</span>
                <strong>{careerSupport?.portfolioStatus ?? "Pending"}</strong>
              </article>
            </div>
            <div className="task-list">
              {(careerSupport?.interviewFocusAreas ?? ["Resume review", "Mock interview", "Project explanation"]).map((item) => (
                <article key={item}>
                  <CheckCircle2 size={18} />
                  <span>{item}</span>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          {showStudentModule("Mentor Support") ? (
          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Mentor support</span>
                <h2>Review requests</h2>
              </div>
              <Headphones size={23} />
            </div>
            <div className="lms-timeline">
              {mentorSupport.length === 0 ? <div className="table-state">No mentor support tickets yet.</div> : null}
              {mentorSupport.slice(0, 8).map((ticket) => (
                <article key={ticket.id}>
                  <strong>{ticket.issue}</strong>
                  <span>{ticket.status} - {formatDate(ticket.createdAt)}</span>
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
            {certificates.length === 0 ? <p>Certificates will appear after project and assessment completion.</p> : null}
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

          {showStudentModule("Support", "Mentor Support") ? (
          <form className="dashboard-card support-ticket-form" onSubmit={createSupportTicket}>
            <div className="card-title-row">
              <div>
                <span className="eyebrow">{activeModule === "Mentor Support" ? "Mentor support" : "Support"}</span>
                <h2>Raise a ticket</h2>
              </div>
              <Headphones size={23} />
            </div>
            <input name="name" placeholder="Your name" required />
            <input name="email" type="email" placeholder="name@example.com" required />
            <select name="priority" defaultValue="Normal">
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
            <input name="issue" placeholder="Issue title" required />
            <textarea name="description" placeholder="Explain the issue" required />
            <button className="primary-action" type="submit" disabled={actionId === "support"}>
              <LifeBuoy size={17} />
              Create ticket
            </button>
          </form>
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

function toIsoDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Choose a valid date and time.");
  }

  return date.toISOString();
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

function actionMessage(action: "lock" | "unlock" | "reset" | "logout", fullName: string) {
  if (action === "lock") {
    return `${fullName} locked successfully.`;
  }

  if (action === "unlock") {
    return `${fullName} unlocked successfully.`;
  }

  if (action === "reset") {
    return `Password reset message prepared for ${fullName}.`;
  }

  return `All sessions logged out for ${fullName}.`;
}

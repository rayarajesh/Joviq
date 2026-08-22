import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
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
  LogOut,
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
  AdminLmsSummaryResponse,
  AssignmentResponse,
  MentorDashboardResponse,
  MentorReviewQueueResponse,
  ProgramCategoryResponse,
  ProgramSummaryResponse,
  StudentLmsDashboardResponse,
  StudentProgramWorkspaceResponse,
  SubmissionResponse,
  SupportTicketResponse
} from "../features/lms/api/lmsTypes";
import { formatApiError } from "../lib/api/httpClient";
import { toIndiaMobileNumber } from "../lib/validation/indiaMobile";

type PrimaryRole = "Admin" | "Mentor" | "Student";
type RoleFilter = "All" | RoleName;
type MessageState = { tone: "success" | "error"; text: string } | null;

const pageSize = 8;
const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const roles = auth.user?.roles ?? [];
  const primaryRole: PrimaryRole = roles.includes("Admin") ? "Admin" : roles.includes("Mentor") ? "Mentor" : "Student";

  async function logout() {
    await auth.logout();
    navigate("/");
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar role={primaryRole} />
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Joviq LMS</span>
            <h1>{primaryRole} Dashboard</h1>
            <p>{auth.user?.fullName} - {auth.user?.email}</p>
          </div>
          <button className="ghost-button" type="button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </header>

        {primaryRole === "Admin" ? <AdminDashboard currentUserId={auth.user?.id} /> : null}
        {primaryRole === "Mentor" ? <MentorDashboard /> : null}
        {primaryRole === "Student" ? <StudentDashboard /> : null}
      </section>
    </main>
  );
}

function DashboardSidebar({ role }: { role: PrimaryRole }) {
  const navItems =
    role === "Admin"
      ? ["Overview", "Users", "Programs", "Payments", "Support", "Reports"]
      : role === "Mentor"
        ? ["Overview", "Learners", "Reviews", "Live Classes", "Projects"]
        : [
            "Overview",
            "My Program",
            "Continue Learning",
            "Live Classes",
            "Assignments",
            "Projects",
            "Assessments",
            "Career Support",
            "Payments",
            "Certificates",
            "Support"
          ];

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <Sparkles size={21} />
        <div>
          <strong>Joviq</strong>
          <span>{role} workspace</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navItems.map((item, index) => (
          <button className={index === 0 ? "is-active" : ""} key={item} type="button">
            {index === 0 ? <LayoutDashboard size={18} /> : <BarChart3 size={18} />}
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function AdminDashboard({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [summary, setSummary] = useState<AdminUserSummaryResponse | null>(null);
  const [lmsSummary, setLmsSummary] = useState<AdminLmsSummaryResponse | null>(null);
  const [lmsPrograms, setLmsPrograms] = useState<ProgramSummaryResponse[]>([]);
  const [programCategories, setProgramCategories] = useState<ProgramCategoryResponse[]>([]);
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
        supportTicketsResponse
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
        publicLmsApi.getCategories(),
        adminLmsApi.getSupportTickets(1, 8)
      ]);

      setSummary(summaryResponse.data);
      setUsers(usersResponse.data.items);
      setLmsSummary(lmsSummaryResponse.data);
      setLmsPrograms(lmsProgramsResponse.data);
      setProgramCategories(categoriesResponse.data);
      setSupportTickets(supportTicketsResponse.data.items);
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

  return (
    <section className="dashboard-stack">
      <section className="metric-grid">
        {metrics.map((metric) => (
          <DashboardMetric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="metric-grid metric-grid--lms">
        {lmsMetrics.map((metric) => (
          <DashboardMetric key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
        ))}
      </section>

      {message ? <MessageBox message={message} /> : null}

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

      <AdminLmsPanel
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
  categories,
  programs,
  summary,
  supportTickets,
  onMessage,
  onRefresh
}: {
  categories: ProgramCategoryResponse[];
  programs: ProgramSummaryResponse[];
  summary: AdminLmsSummaryResponse | null;
  supportTickets: SupportTicketResponse[];
  onMessage: (message: MessageState) => void;
  onRefresh: () => Promise<void>;
}) {
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);

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

  return (
    <section className="dashboard-card lms-admin-panel">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">LMS engine</span>
          <h2>Programs, reviews, payments, and support</h2>
          <p>
            {summary?.publishedPrograms ?? 0} published programs, {summary?.activeEnrollments ?? 0} active enrollments.
          </p>
        </div>
        <Layers3 size={23} />
      </div>

      <div className="lms-admin-grid">
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

        <section className="lms-list-panel">
          <h3>Catalog</h3>
          <div className="lms-scroll-list">
            {programs.slice(0, 10).map((program) => (
              <article key={program.id} className="lms-list-item">
                <div>
                  <strong>{program.title}</strong>
                  <span>{program.categoryName} - {program.duration}</span>
                </div>
                <small>{program.status}</small>
              </article>
            ))}
          </div>
        </section>

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
      </div>
    </section>
  );
}

function MentorDashboard() {
  const [summary, setSummary] = useState<MentorDashboardResponse | null>(null);
  const [queue, setQueue] = useState<MentorReviewQueueResponse | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadMentorDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, queueResponse] = await Promise.all([
        mentorLmsApi.getDashboard(),
        mentorLmsApi.getReviewQueue()
      ]);
      setSummary(summaryResponse.data);
      setQueue(queueResponse.data);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function reviewSubmission(submission: SubmissionResponse) {
    setActionId(submission.id);
    setMessage(null);
    const body = {
      score: 90,
      feedback: "Reviewed by mentor. Strong submission with clear project explanation.",
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

  useEffect(() => {
    void loadMentorDashboard();
  }, [loadMentorDashboard]);

  const submissions = [
    ...(queue?.assignmentSubmissions ?? []),
    ...(queue?.projectSubmissions ?? [])
  ];

  return (
    <section className="dashboard-stack">
      <section className="metric-grid">
        <DashboardMetric icon={CalendarClock} label="Live sessions" value={summary?.assignedLiveClasses ?? "-"} />
        <DashboardMetric icon={ListChecks} label="Assignments pending" value={summary?.pendingAssignmentReviews ?? "-"} />
        <DashboardMetric icon={FolderKanban} label="Projects pending" value={summary?.pendingProjectReviews ?? "-"} />
        <DashboardMetric icon={CheckCircle2} label="Reviewed" value={summary?.reviewedSubmissions ?? "-"} />
      </section>

      {message ? <MessageBox message={message} /> : null}

      <section className="dashboard-card mentor-review-panel">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">Mentor reviews</span>
            <h2>Submission queue</h2>
            <p>Review project work, assignment checkpoints, and career-readiness proof.</p>
          </div>
          <FileCheck2 size={23} />
        </div>

        {isLoading ? <div className="table-state">Loading review queue...</div> : null}
        {!isLoading && submissions.length === 0 ? <div className="table-state">No submissions waiting for review.</div> : null}

        <div className="mentor-review-list">
          {submissions.map((submission) => (
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
    </section>
  );
}

function StudentDashboard() {
  const [dashboard, setDashboard] = useState<StudentLmsDashboardResponse | null>(null);
  const [workspace, setWorkspace] = useState<StudentProgramWorkspaceResponse | null>(null);
  const [programs, setPrograms] = useState<ProgramSummaryResponse[]>([]);
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

      const payment = await studentLmsApi.createPaymentCheckout({
        programId: program.id,
        programPlanId: plan?.id,
        enrollmentId: enrollmentResponse.data.id,
        mode
      });

      await studentLmsApi.verifyPayment({
        paymentTransactionId: payment.data.id,
        gatewayPaymentId: `demo_${Date.now()}`
      });

      setMessage({
        tone: "success",
        text: mode === 1 ? "Seat reserved and LMS preview unlocked." : "Program payment completed and LMS unlocked."
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
      const payment = await studentLmsApi.createPaymentCheckout({
        programId: enrollment.programId,
        programPlanId: enrollment.programPlanId,
        enrollmentId: enrollment.id,
        mode
      });
      await studentLmsApi.verifyPayment({
        paymentTransactionId: payment.data.id,
        gatewayPaymentId: `demo_${Date.now()}`
      });
      setMessage({ tone: "success", text: "Payment verified and access updated." });
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

  return (
    <section className="dashboard-stack">
      <section className="metric-grid">
        <DashboardMetric icon={BookOpen} label="Program status" value={dashboard?.programStatus ?? "-"} />
        <DashboardMetric icon={BarChart3} label="Learning progress" value={`${dashboard?.learningProgressPercentage ?? 0}%`} />
        <DashboardMetric icon={ListChecks} label="Pending work" value={(dashboard?.pendingAssignments ?? 0) + (dashboard?.pendingProjects ?? 0)} />
        <DashboardMetric icon={WalletCards} label="Balance due" value={formatCurrency(dashboard?.balanceDue ?? 0)} />
      </section>

      {message ? <MessageBox message={message} /> : null}
      {isLoading ? <section className="dashboard-card"><div className="table-state">Loading LMS workspace...</div></section> : null}

      {!isLoading && !enrollment ? (
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

          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Live and assessment</span>
                <h2>Upcoming</h2>
              </div>
              <CalendarClock size={23} />
            </div>
            <div className="lms-timeline">
              {workspace?.liveClasses.slice(0, 3).map((liveClass) => (
                <article key={liveClass.id}>
                  <strong>{liveClass.title}</strong>
                  <span>{formatDateTime(liveClass.startsAt)}</span>
                </article>
              ))}
              {workspace?.assessments.slice(0, 3).map((assessment) => (
                <article key={assessment.id}>
                  <strong>{assessment.title}</strong>
                  <span>{assessment.assessmentType} - {assessment.durationMinutes} min</span>
                </article>
              ))}
            </div>
          </section>

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

          <section className="dashboard-card lms-side-panel">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Notifications</span>
                <h2>Latest updates</h2>
              </div>
              <Bell size={23} />
            </div>
            <div className="notification-list">
              {(dashboard?.notifications ?? []).map((notification) => (
                <article key={notification.id}>
                  <strong>{notification.title}</strong>
                  <span>{notification.body}</span>
                </article>
              ))}
            </div>
          </section>

          <form className="dashboard-card support-ticket-form" onSubmit={createSupportTicket}>
            <div className="card-title-row">
              <div>
                <span className="eyebrow">Support</span>
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

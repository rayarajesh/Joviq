import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Unlock,
  UserPlus,
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
      ? ["Overview", "Users", "Programs", "Reports"]
      : role === "Mentor"
        ? ["Overview", "Learners", "Reviews", "Sessions"]
        : ["Overview", "Courses", "Assignments", "Certificates"];

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

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const [summaryResponse, usersResponse] = await Promise.all([
        adminUsersApi.getSummary(),
        adminUsersApi.getUsers({
          search,
          role: roleFilter === "All" ? undefined : roleFilter,
          page,
          pageSize
        })
      ]);

      setSummary(summaryResponse.data);
      setUsers(usersResponse.data.items);
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
    setIsCreating(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
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

      event.currentTarget.reset();
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
    </section>
  );
}

function MentorDashboard() {
  return (
    <section className="dashboard-stack">
      <section className="metric-grid">
        <DashboardMetric icon={UsersRound} label="Assigned learners" value="Not assigned" />
        <DashboardMetric icon={CheckCircle2} label="Reviews pending" value="0" />
        <DashboardMetric icon={CalendarClock} label="Live sessions" value="0" />
      </section>
      <DashboardPanel
        title="Mentor workspace"
        items={["Review project submissions", "Schedule mentor sessions", "Send feedback", "Track interview readiness"]}
      />
    </section>
  );
}

function StudentDashboard() {
  return (
    <section className="dashboard-stack">
      <section className="metric-grid">
        <DashboardMetric icon={BookOpen} label="Program status" value="Not enrolled" />
        <DashboardMetric icon={CheckCircle2} label="Assignments" value="0" />
        <DashboardMetric icon={BarChart3} label="Assessment score" value="--" />
      </section>
      <DashboardPanel
        title="Student workspace"
        items={["Continue learning", "Upload assignments", "Submit projects", "Track certification readiness"]}
      />
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

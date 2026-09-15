import { ArrowRight, Award, Bell, BookOpen, CheckCircle2, ChevronRight, Circle, CreditCard, FolderKanban, GraduationCap, TrendingUp, WalletCards } from "lucide-react";
import type { StudentLmsDashboardResponse, StudentProgramWorkspaceResponse } from "../features/lms/api/lmsTypes";
import "../styles/student-overview.css";

type Props = {
  name: string;
  dashboard: StudentLmsDashboardResponse | null;
  workspace: StudentProgramWorkspaceResponse | null;
  loading: boolean;
  openModule: (module: string) => void;
  continueLearning: (programId: string) => void;
};
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export function StudentOverview({ name, dashboard, workspace, loading, openModule, continueLearning }: Props) {
  const enrollment = workspace?.enrollment ?? dashboard?.enrollment;
  const progress = Math.min(100, Math.max(0, dashboard?.learningProgressPercentage ?? 0));
  const projects = workspace?.projects ?? [];
  const certificates = workspace?.certificates ?? [];
  const notifications = dashboard?.notifications ?? [];
  const lessons = `${dashboard?.completedLessons ?? 0} of ${dashboard?.totalLessons ?? 0} lessons`;
  const metrics = [
    { title: "Program status", value: dashboard?.programStatus ?? "Not enrolled", note: enrollment ? "Keep learning!" : "Find your next program", icon: BookOpen, tone: "purple", module: "My Program" },
    { title: "Learning progress", value: `${progress}%`, note: lessons, icon: TrendingUp, tone: "green", module: "My Program" },
    { title: "Pending projects", value: dashboard?.pendingProjects ?? 0, note: dashboard?.pendingProjects ? "Your next challenge awaits" : "All caught up!", icon: FolderKanban, tone: "orange", module: "Projects" },
    { title: "Balance due", value: money(dashboard?.balanceDue ?? 0), note: dashboard?.balanceDue ? "View your payment details" : "No pending payments", icon: WalletCards, tone: "blue", module: "Payments" }
  ];
  return <section className="student-overview" aria-label="Student dashboard overview" aria-busy={loading}>
    <header className="student-welcome">
      <div><p>Welcome back,</p><h1>{name} <span aria-hidden="true">👋</span></h1><small>Here's an overview of your learning journey. Keep going!</small></div>
      <div className="student-welcome-art" aria-hidden="true"><i>Learn<br />Build<br />Achieve</i><div className="student-book-stack"><GraduationCap /><span /><span /></div><blockquote>“ Education<br />creates<br />opportunities.”</blockquote></div>
    </header>
    <div className="student-overview-metrics">{metrics.map(({ title, value, note, icon: Icon, tone, module }) => <button key={title} className={`student-stat student-tone-${tone}`} onClick={() => openModule(module)}><span className="student-icon"><Icon size={25} /></span><span className="student-stat-label">{title}</span><strong>{loading ? "—" : value}</strong><small>{note}</small><span className="student-round-arrow"><ChevronRight size={20} /></span></button>)}</div>
    <section className="student-course-feature">
      <div><span className="student-accent-label">My Program</span><h2>{enrollment?.programTitle ?? "Your next chapter starts here"}</h2><p>{enrollment?.lockedReason ?? (enrollment ? "Full LMS access is active. Keep building proof through lessons and reviews." : "Choose a program to start learning and building your portfolio.")}</p><button className="student-continue" onClick={() => enrollment?.hasFullAccess ? continueLearning(enrollment.programId) : openModule("My Program")}>{enrollment ? "Continue Learning" : "Explore Programs"}<ArrowRight size={16} /></button></div>
      <div className="student-progress-ring" role="img" aria-label={`${progress}% complete, ${lessons}`}><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="51" /><circle cx="60" cy="60" r="51" strokeDasharray={`${progress * 3.2044} 320.44`} /></svg><div><strong>{progress}%</strong><small>{lessons}<br />complete</small></div></div>
      <ul className="student-course-steps">{[{ title: "Lessons in progress", done: progress > 0 }, { title: "Projects", done: projects.length > 0 && projects.every(project => project.latestSubmission?.status === "Approved") }, { title: "Reviews", done: projects.some(project => project.latestSubmission?.status === "Approved") }, { title: "Certificate", done: certificates.length > 0 }].map(step => <li key={step.title}>{step.done ? <CheckCircle2 size={18} className="is-complete" /> : <Circle size={18} />}{step.title}</li>)}</ul>
    </section>
    <div className="student-overview-panels">
      <section className="student-overview-panel student-access-panel"><span className="student-icon student-tone-green"><CreditCard size={23} /></span><div><small>Payments</small><h3>Access status</h3><span className="student-access-status">{enrollment?.isAccessExpired ? "Expired" : enrollment?.status ?? "Not enrolled"}</span><p>{enrollment ? `Paid ${money(enrollment.paidAmount)} of ${money(enrollment.totalAmount)}` : "Your payment details will appear here."}</p>{enrollment?.accessExpiresAt && <p>Access until {new Date(enrollment.accessExpiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}.</p>}</div><button className="student-round-arrow" aria-label="View payments" onClick={() => openModule("Payments")}><ChevronRight size={20} /></button></section>
      <section className="student-overview-panel"><header><span className="student-icon student-tone-orange"><FolderKanban size={23} /></span><div><small>Projects</small><h3>Portfolio proof</h3></div><button className="student-view-all" onClick={() => openModule("Projects")}>View all <ArrowRight size={13} /></button></header>{projects.length ? <div className="student-preview-list">{projects.slice(0, 2).map(project => <button key={project.id} onClick={() => openModule("Projects")}><span>{project.title}</span><small>{project.latestSubmission?.status ?? "Not submitted"}</small></button>)}</div> : <div className="student-panel-empty"><FolderKanban size={22} /><strong>No projects assigned yet.</strong><p>Your assigned project work will appear here<br />when the admin publishes it to you.</p></div>}</section>
      <section className="student-overview-panel student-credentials-panel"><span className="student-icon student-tone-purple"><Award size={27} /></span><div><small>Certificates</small><h3>Credentials</h3><p>{certificates.length ? `${certificates.length} certificate${certificates.length === 1 ? "" : "s"} earned. View your achievements.` : "Certificates will appear after project completion."}</p></div><button className="student-round-arrow" aria-label="View certificates" onClick={() => openModule("Certificates")}><ChevronRight size={20} /></button></section>
      <section className="student-overview-panel"><header><span className="student-icon student-tone-orange"><Bell size={23} /></span><h3>Latest updates</h3><button className="student-view-all" onClick={() => openModule("Notifications")}>View all <ArrowRight size={13} /></button></header>{notifications.length ? <div className="student-preview-list">{notifications.slice(0, 2).map(notification => <button key={notification.id} onClick={() => openModule("Notifications")}><span>{notification.title}</span><small>{notification.body}</small></button>)}</div> : <div className="student-panel-empty student-panel-empty--inline"><Bell size={25} /><div><strong>No notifications yet.</strong><p>You're all set! We'll notify you here.</p></div></div>}</section>
    </div>
  </section>;
}

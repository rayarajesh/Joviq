import { useMemo, useState } from "react";
import {
  Award,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Layers3,
  Lock,
  PlayCircle,
  Search,
  SlidersHorizontal
} from "lucide-react";
import type {
  CertificateResponse,
  EnrollmentResponse,
  StudentEnrolledProgramResponse
} from "../features/lms/api/lmsTypes";

type CourseFilter = "all" | "in-progress" | "completed";

type StudentMyProgramLibraryProps = {
  programs: StudentEnrolledProgramResponse[];
  onOpenCourse: (programId: string) => void;
  onPay: (enrollment: EnrollmentResponse, mode: 1 | 3) => void;
};

export function StudentMyProgramLibrary({ programs, onOpenCourse, onPay }: StudentMyProgramLibraryProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CourseFilter>("all");

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return programs.filter((item) => {
      const isCompleted = isCourseCompleted(item);
      const matchesFilter = filter === "all" || (filter === "completed" ? isCompleted : !isCompleted);
      const matchesSearch = !normalizedSearch || [item.program.title, item.program.categoryName, item.enrollment.programPlanName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
      return matchesFilter && matchesSearch;
    });
  }, [filter, programs, search]);

  const completedCount = programs.filter(isCourseCompleted).length;
  const inProgressCount = programs.length - completedCount;

  return (
    <section className="my-program-library">
      <header className="my-program-library__intro">
        <div>
          <span className="eyebrow">Your learning library</span>
          <h1>My programs</h1>
          <p>Pick a course, continue where you stopped, and open the full learning workspace.</p>
        </div>
        <div className="my-program-library__count">
          <strong>{programs.length}</strong>
          <span>enrolled {programs.length === 1 ? "course" : "courses"}</span>
        </div>
      </header>

      <div className="my-program-library__toolbar">
        <label className="my-program-library__search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses" />
        </label>
        <label className="my-program-library__filter">
          <SlidersHorizontal size={16} />
          <span>Show</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as CourseFilter)}>
            <option value="all">All courses ({programs.length})</option>
            <option value="in-progress">In progress ({inProgressCount})</option>
            <option value="completed">Completed ({completedCount})</option>
          </select>
        </label>
      </div>

      {filteredPrograms.length ? (
        <div className="my-program-course-grid">
          {filteredPrograms.map((item) => (
            <EnrolledCourseCard key={item.enrollment.id} item={item} onOpenCourse={onOpenCourse} onPay={onPay} />
          ))}
        </div>
      ) : (
        <section className="dashboard-card my-program-empty">
          <Search size={28} />
          <h2>No courses match this filter</h2>
          <p>Try another search or switch the course status filter.</p>
        </section>
      )}
    </section>
  );
}

function EnrolledCourseCard({
  item,
  onOpenCourse,
  onPay
}: {
  item: StudentEnrolledProgramResponse;
  onOpenCourse: (programId: string) => void;
  onPay: (enrollment: EnrollmentResponse, mode: 1 | 3) => void;
}) {
  const { enrollment, program } = item;
  const completed = isCourseCompleted(item);
  const certificate = item.certificates.find((value) => value.status === "Issued") ?? item.certificates[0];
  const paymentMode = enrollment.isAccessExpired || enrollment.paidAmount <= 0 ? 1 : 3;

  return (
    <article className={`my-program-library-card${completed ? " is-completed" : ""}`}>
      <button className="my-program-library-card__open" type="button" onClick={() => onOpenCourse(enrollment.programId)}>
        <div className="my-program-library-card__image">
          <img src={program.thumbnailUrl} alt="" />
          <span><PlayCircle size={16} /> Open course</span>
        </div>
        <div className="my-program-library-card__body">
          <span className="eyebrow">{program.categoryName}</span>
          <h2>{program.title}</h2>
          <p>{program.shortDescription}</p>
          <div className="my-program-library-card__meta">
            <span><Layers3 size={15} /> {program.curriculum.length} sections</span>
            <span><PlayCircle size={15} /> {item.totalLessons} lessons</span>
            <span><Clock3 size={15} /> {formatDuration(program.curriculum.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0), 0))}</span>
          </div>
        </div>
        <div className="my-program-library-card__progress">
          <strong>{item.progressPercentage}%</strong>
          <span>{item.completedLessons} of {item.totalLessons} complete</span>
          <div><i style={{ width: `${item.progressPercentage}%` }} /></div>
          <small className={completed ? "is-complete" : ""}>
            {completed ? <><CheckCircle2 size={14} /> Completed</> : enrollment.isAccessExpired ? <><Lock size={14} /> Access expired</> : enrollment.hasFullAccess ? "Full access" : "Preview access"}
          </small>
        </div>
      </button>
      <footer className="my-program-library-card__actions">
        <span>{enrollment.programPlanName ?? "Program enrollment"}</span>
        <div>
          {completed && certificate ? (
            <button className="secondary-action" type="button" onClick={() => openCertificatePreview(certificate)}>
              <Award size={15} /> View certificate
            </button>
          ) : null}
          {!completed && !enrollment.hasFullAccess ? (
            <button className="secondary-action" type="button" onClick={() => onPay(enrollment, paymentMode)}>
              <CreditCard size={15} /> {paymentMode === 1 ? "Pay initial" : "Unlock course"}
            </button>
          ) : null}
          <button className="primary-action" type="button" onClick={() => onOpenCourse(enrollment.programId)}>
            {completed ? "Review course" : "Continue learning"} <ArrowRight size={15} />
          </button>
        </div>
      </footer>
    </article>
  );
}

function isCourseCompleted(item: StudentEnrolledProgramResponse) {
  return item.progressPercentage >= 100 || item.certificates.some((certificate) => certificate.status === "Issued");
}

function openCertificatePreview(certificate: CertificateResponse) {
  const certificateWindow = window.open("", "_blank", "width=960,height=760");
  if (!certificateWindow) return;
  const issuedDate = certificate.issuedAt ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(certificate.issuedAt)) : "Issued by Joviq Technologies";
  certificateWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(certificate.certificateId)}</title><style>body{margin:0;background:#eef2f8;color:#172948;font-family:Arial,sans-serif;padding:42px}.certificate{max-width:820px;margin:auto;background:#fff;border:12px solid #242d70;outline:1px solid #d9b867;padding:64px;text-align:center;box-shadow:0 25px 70px rgba(23,35,72,.18)}.brand{letter-spacing:.16em;color:#b48732;font-weight:800;text-transform:uppercase}.line{width:110px;height:3px;margin:25px auto;background:#b48732}h1{font-family:Georgia,serif;font-size:44px;font-weight:500;margin:20px 0 10px}h2{font-size:27px;color:#4d4a9c;margin:20px 0}p{color:#65738a;line-height:1.65}.meta{display:flex;justify-content:space-between;margin-top:54px;padding-top:18px;border-top:1px solid #e3e7ef;font-size:13px;color:#65738a}.meta strong{display:block;color:#172948;margin-top:6px}@media print{body{padding:0;background:#fff}.certificate{box-shadow:none}}</style></head><body><main class="certificate"><div class="brand">Joviq Technologies</div><div class="line"></div><p>This certificate is proudly presented to</p><h1>Learning Achievement</h1><h2>${escapeHtml(certificate.programTitle)}</h2><p>For successfully completing the required learning journey and demonstrating commitment to practical skill development.</p><div class="meta"><span>Certificate ID<strong>${escapeHtml(certificate.certificateId)}</strong></span><span>${escapeHtml(issuedDate)}<strong>${escapeHtml(certificate.type)}</strong></span><span>Authorized by<strong>${escapeHtml(certificate.authorizedSignatory ?? "Joviq Technologies")}</strong></span></div></main></body></html>`);
  certificateWindow.document.close();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining} min`;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

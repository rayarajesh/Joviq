import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  Lock,
  PlayCircle
} from "lucide-react";
import { DashboardSidebar } from "./DashboardPage";
import { ToastMessage } from "../components/ToastMessage";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import { savePendingEnrollment } from "../features/lms/checkout";
import type { LessonResponse, StudentEnrolledProgramResponse } from "../features/lms/api/lmsTypes";
import { formatApiError } from "../lib/api/httpClient";

type MessageState = { tone: "success" | "error"; text: string } | null;

export function CoursePlayerPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [course, setCourse] = useState<StudentEnrolledProgramResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<MessageState>(null);
  const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(new Set());
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    void studentLmsApi.getMyPrograms()
      .then((response) => {
        if (!mounted) return;
        const selected = response.data.programs.find((item) => item.enrollment.programId === programId);
        if (!selected) {
          navigate("/dashboard?section=My%20Program", { replace: true });
          return;
        }
        setCourse(selected);
      })
      .catch((error) => {
        if (mounted) setMessage({ tone: "error", text: formatApiError(error) });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [navigate, programId]);

  useEffect(() => {
    if (!course) return;
    const firstModule = course.program.curriculum[0];
    setOpenModuleIds(firstModule ? new Set([firstModule.id]) : new Set());
    setActiveLessonId(course.program.curriculum.flatMap((module) => module.lessons).find((lesson) => !lesson.isLocked)?.id);
  }, [course?.enrollment.id]);

  const activeLesson = useMemo(
    () => course?.program.curriculum.flatMap((module) => module.lessons).find((lesson) => lesson.id === activeLessonId),
    [activeLessonId, course]
  );

  function selectModule(moduleId: string) {
    setOpenModuleIds((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function openPayment() {
    if (!course) return;
    const { enrollment, program } = course;
    const mode = enrollment.isAccessExpired || enrollment.paidAmount <= 0 ? 1 : 3;
    savePendingEnrollment({
      slug: program.slug,
      programId: program.id,
      planId: enrollment.programPlanId,
      planCode: enrollment.programPlanCode ?? "INTERMEDIATE",
      programTitle: program.title,
      paymentMode: mode,
      amount: mode === 3 ? enrollment.balanceAmount : undefined
    });
    navigate("/checkout");
  }

  function navigateFromSidebar(module: string) {
    navigate(module === "Overview" ? "/dashboard" : `/dashboard?section=${encodeURIComponent(module)}`);
  }

  return (
    <main className="dashboard-shell dashboard-shell--student">
      <DashboardSidebar activeModule="My Program" onModuleChange={navigateFromSidebar} role="Student" />
      <section className="dashboard-main course-player-main">
        {isLoading ? <div className="page-loader">Loading course content...</div> : null}
        {!isLoading && course ? (
          <>
            <section className="course-player">
              <header className="course-player__topbar">
                <Link to="/dashboard?section=My%20Program"><ArrowLeft size={17} /> Back to My Programs</Link>
                <span>{auth.user?.fullName ?? "Student"} · {course.program.title}</span>
              </header>
              <aside className="course-player__contents" aria-label="Course contents">
                <header>
                  <div>
                    <span className="eyebrow">Course contents</span>
                    <h1>{course.program.title}</h1>
                  </div>
                  <span className="course-player__close" onClick={() => navigate("/dashboard?section=My%20Program")} aria-label="Close course">×</span>
                </header>
                <div className="course-player__progress">
                  <div><strong>{course.progressPercentage}% complete</strong><span>{course.completedLessons} of {course.totalLessons} lessons</span></div>
                  <div className="course-player__progress-bar"><i style={{ width: `${course.progressPercentage}%` }} /></div>
                </div>
                <div className="course-player__section-list">
                  {course.program.curriculum.map((module, index) => {
                    const isOpen = openModuleIds.has(module.id);
                    const completed = module.lessons.filter((lesson) => lesson.isCompleted).length;
                    return (
                      <section className="course-player__module" key={module.id}>
                        <button className="course-player__module-header" type="button" onClick={() => selectModule(module.id)}>
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span><strong>{index + 1}. {module.title}</strong><small>{completed}/{module.lessons.length} complete</small></span>
                        </button>
                        {isOpen ? module.lessons.map((lesson) => (
                          <button
                            className={`course-player__lesson${lesson.id === activeLessonId ? " is-active" : ""}${lesson.isLocked ? " is-locked" : ""}`}
                            key={lesson.id}
                            type="button"
                            disabled={lesson.isLocked}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <span className="course-player__lesson-icon">{lesson.isLocked ? <Lock size={14} /> : lesson.isCompleted ? <Check size={15} /> : <PlayCircle size={15} />}</span>
                            <span><strong>{lesson.title}</strong><small>{lesson.durationMinutes} min {lesson.isLocked ? "· Locked" : lesson.isCompleted ? "· Completed" : "· Watch"}</small></span>
                          </button>
                        )) : null}
                      </section>
                    );
                  })}
                </div>
              </aside>

              <main className="course-player__viewer">
                {activeLesson ? <LessonMedia lesson={activeLesson} /> : (
                  <div className="course-player__locked-state"><Lock size={32} /><h2>Course content is locked</h2><p>Complete the required payment to access this course.</p><button className="primary-action" type="button" onClick={openPayment}><CreditCard size={16} /> Unlock course</button></div>
                )}
              </main>
            </section>
            {course.enrollment.hasFullAccess ? <div className="course-player__completion-note"><Award size={18} /> Full access includes projects, reviews, and completion certificate.</div> : null}
            <ToastMessage message={message} onDismiss={() => setMessage(null)} />
          </>
        ) : null}
      </section>
    </main>
  );
}

function LessonMedia({ lesson }: { lesson: LessonResponse }) {
  const embedUrl = toVideoEmbedUrl(lesson.videoUrl);
  return (
    <article className="course-player__lesson-viewer">
      <header>
        <div><span className="eyebrow">Now learning</span><h2>{lesson.title}</h2></div>
        <span><Clock3 size={15} /> {lesson.durationMinutes} minutes</span>
      </header>
      {embedUrl ? <div className="course-player__media"><iframe src={embedUrl} title={lesson.title} allowFullScreen /></div> : lesson.videoUrl ? <a className="course-player__media course-player__media--link" href={lesson.videoUrl} target="_blank" rel="noreferrer"><PlayCircle size={30} /> Open lesson video</a> : <div className="course-player__media course-player__media--empty"><PlayCircle size={30} /><span>Lesson media will appear here</span></div>}
      <div className="course-player__lesson-details">
        <div className="course-player__lesson-tabs"><span className="is-active">Overview</span></div>
        <p>{lesson.summary}</p>
      </div>
    </article>
  );
}

function toVideoEmbedUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes("youtube.com") && url.searchParams.get("v")) return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
    if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/embed/")) return value;
    if (url.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean).pop()}`;
  } catch {
    return null;
  }
  return null;
}

import { useEffect, useMemo, useRef, useState } from "react";
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
  FileText,
  Gauge,
  Lock,
  PlayCircle,
  RotateCcw,
  RotateCw
} from "lucide-react";
import { DashboardSidebar } from "./DashboardPage";
import { ToastMessage } from "../components/ToastMessage";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import { savePendingEnrollment } from "../features/lms/checkout";
import type { LessonResponse, StudentEnrolledProgramResponse } from "../features/lms/api/lmsTypes";
import { formatApiError } from "../lib/api/httpClient";
import { env } from "../config/env";

type MessageState = { tone: "success" | "error"; text: string } | null;
const SAMPLE_LESSON_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

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
    const lessons = course.program.curriculum.flatMap((module) => module.lessons);
    setActiveLessonId(lessons.find((lesson, index) => !lesson.isLocked && (index === 0 || lessons[index - 1].isCompleted))?.id);
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

  async function completeLesson(lessonId: string) {
    const lesson = course?.program.curriculum.flatMap((module) => module.lessons).find((item) => item.id === lessonId);
    if (!course || !lesson || lesson.isCompleted) return;

    try {
      const response = await studentLmsApi.completeLesson(lessonId);
      setCourse((current) => {
        if (!current) return current;
        const wasCompleted = current.program.curriculum.some((module) => module.lessons.some((item) => item.id === lessonId && item.isCompleted));
        const curriculum = current.program.curriculum.map((module) => ({
          ...module,
          lessons: module.lessons.map((item) => item.id === lessonId ? response.data : item)
        }));
        const completedLessons = current.completedLessons + (wasCompleted ? 0 : 1);
        return {
          ...current,
          program: { ...current.program, curriculum },
          completedLessons,
          progressPercentage: current.totalLessons ? Math.round(completedLessons / current.totalLessons * 100) : 0
        };
      });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    }
  }

  function isLessonAvailable(lessonId: string) {
    if (!course) return false;
    const lessons = course.program.curriculum.flatMap((module) => module.lessons);
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);
    return index === 0 || (index > 0 && lessons[index - 1].isCompleted);
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
                            disabled={lesson.isLocked || !isLessonAvailable(lesson.id)}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <span className="course-player__lesson-icon">{lesson.isLocked || !isLessonAvailable(lesson.id) ? <Lock size={14} /> : lesson.isCompleted ? <Check size={15} /> : <PlayCircle size={15} />}</span>
                            <span><strong>{lesson.title}</strong><small>{lesson.isLocked || !isLessonAvailable(lesson.id) ? "Complete the previous lesson" : lesson.isCompleted ? `${lesson.durationMinutes} min · Completed` : `${lesson.durationMinutes} min · Watch`}</small></span>
                          </button>
                        )) : null}
                      </section>
                    );
                  })}
                </div>
              </aside>

              <main className="course-player__viewer">
                {activeLesson ? <LessonMedia lesson={activeLesson} onComplete={() => void completeLesson(activeLesson.id)} /> : (
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

function LessonMedia({ lesson, onComplete }: { lesson: LessonResponse; onComplete: () => void }) {
  const embedUrl = toVideoEmbedUrl(lesson.videoUrl);
  const directVideoUrl = getDirectVideoUrl(lesson.videoUrl);
  const inlineVideoUrl = directVideoUrl ?? SAMPLE_LESSON_VIDEO_URL;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackRate, setPlaybackRate] = useState("1");
  const [quality, setQuality] = useState("auto");
  const documentResources = [
    lesson.notesUrl ? { id: "lesson-notes", title: "Lesson notes", url: lesson.notesUrl } : null,
    ...lesson.resources.filter((resource) => !resource.resourceType.toLowerCase().includes("image"))
  ].filter((resource): resource is { id: string; title: string; url: string } => resource !== null && isPreviewableDocumentUrl(resource.url));

  return (
    <article className="course-player__lesson-viewer">
      <header>
        <div><span className="eyebrow">Now learning</span><h2>{lesson.title}</h2></div>
        <span><Clock3 size={15} /> {lesson.durationMinutes} minutes</span>
      </header>
      <div className="course-player__media">
        {embedUrl ? <iframe src={embedUrl} title={lesson.title} allowFullScreen /> : (
          <div className="course-player__video-shell">
            <video
              ref={videoRef}
              className="course-player__video"
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              preload="metadata"
              src={inlineVideoUrl}
              onEnded={onComplete}
              onContextMenu={(event) => event.preventDefault()}
            />
            <div className="course-player__video-controls" aria-label="Video controls">
              <button type="button" onClick={() => seekVideo(videoRef.current, -10)} title="Back 10 seconds"><RotateCcw size={16} /> <span>10s</span></button>
              <button type="button" onClick={() => seekVideo(videoRef.current, 10)} title="Forward 10 seconds"><RotateCw size={16} /> <span>10s</span></button>
              <label><Gauge size={16} /><span>Speed</span><select value={playbackRate} onChange={(event) => { setPlaybackRate(event.target.value); if (videoRef.current) videoRef.current.playbackRate = Number(event.target.value); }}><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label>
              <label><span>Quality</span><select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="auto">Auto</option><option value="1080">1080p</option><option value="720">720p</option><option value="480">480p</option></select></label>
            </div>
          </div>
        )}
      </div>
      {documentResources.length ? (
        <section className="course-player__documents" aria-label="Lesson documents">
          {documentResources.map((resource) => (
            <div className="course-player__document" key={resource.id}>
              <div className="course-player__document-heading"><FileText size={17} /><strong>{resource.title}</strong></div>
              <iframe src={toDocumentPreviewUrl(resource.url)} title={resource.title} />
            </div>
          ))}
        </section>
      ) : null}
      <div className="course-player__lesson-details">
        <div className="course-player__lesson-tabs"><span className="is-active">Overview</span></div>
        <p>{lesson.summary}</p>
      </div>
    </article>
  );
}

function seekVideo(video: HTMLVideoElement | null, seconds: number) {
  if (!video) return;
  video.currentTime = Math.max(0, Math.min(video.duration || Number.MAX_SAFE_INTEGER, video.currentTime + seconds));
}

function toBrowserMediaUrl(value: string) {
  try {
    const url = new URL(value, env.apiBaseUrl);
    if (url.hostname === "localhost" && url.port === "7001") {
      url.hostname = "127.0.0.1";
      url.protocol = "http:";
      url.port = "5001";
    }
    return url.toString();
  } catch {
    return value;
  }
}

function getDirectVideoUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value, env.apiBaseUrl);
    const isVideoFile = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(url.pathname);
    const isApiAsset = url.origin === new URL(env.apiBaseUrl).origin;
    return isVideoFile || isApiAsset ? toBrowserMediaUrl(value) : null;
  } catch {
    return null;
  }
}

function isPreviewableDocumentUrl(value: string) {
  try {
    const url = new URL(value, env.apiBaseUrl);
    if (url.hostname === "learn.joviq.com") return false;
    return /\.(pdf|ppt|pptx|doc|docx|txt)(?:$|[?#])/i.test(url.pathname) || url.origin === new URL(env.apiBaseUrl).origin;
  } catch {
    return false;
  }
}

function toDocumentPreviewUrl(value: string) {
  const url = toBrowserMediaUrl(value);
  return /\.pdf(?:$|[?#])/i.test(url)
    ? `${url}${url.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0`
    : url;
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

import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { useDialogAccessibility } from "./useDialogAccessibility";
import { useEffect, useMemo, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Video,
  X
} from "lucide-react";
import { env } from "../config/env";
import { assetsApi } from "../features/assets/api/assetsApi";
import { assetPurposes, assetTypes, assetVisibilities } from "../features/assets/api/assetsTypes";
import { adminLmsApi } from "../features/lms/api/lmsApi";
import type {
  CreateLessonRequest,
  CreateModuleRequest,
  CurriculumModuleResponse,
  LessonResourceRequest,
  LessonResponse,
  ProgramSummaryResponse
} from "../features/lms/api/lmsTypes";
import { formatApiError } from "../lib/api/httpClient";

type MessageState = { tone: "success" | "error"; text: string } | null;

type CurriculumAdminPanelProps = {
  modules: CurriculumModuleResponse[];
  programs: ProgramSummaryResponse[];
  initialProgramId?: string | null;
  onMessage: (message: MessageState) => void;
  onRefresh: () => Promise<void>;
};

type ModuleDialogState = {
  mode: "create" | "edit";
  programId: string;
  module?: CurriculumModuleResponse;
};

type LessonDialogState = {
  mode: "create" | "edit";
  module: CurriculumModuleResponse;
  lesson?: LessonResponse;
};

type LessonSavePayload = {
  title: string;
  summary: string;
  durationMinutes: number;
  accessLevel: number;
  sortOrder?: number;
  isActive: boolean;
  videoFile?: File;
  imageFiles: File[];
  documentFiles: File[];
  noteFiles: File[];
  removeVideo: boolean;
  removeNotes: boolean;
  removedResourceIds: string[];
};

export function CurriculumAdminPanel({
  modules,
  programs,
  initialProgramId,
  onMessage,
  onRefresh
}: CurriculumAdminPanelProps) {
  const [programSearch, setProgramSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [programSort, setProgramSort] = useState("default");
  const [programFilter, setProgramFilter] = useState(initialProgramId ?? "");
  const [moduleDialog, setModuleDialog] = useState<ModuleDialogState | null>(null);
  const [lessonDialog, setLessonDialog] = useState<LessonDialogState | null>(null);
  const [preview, setPreview] = useState<{ module: CurriculumModuleResponse; lesson: LessonResponse } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialProgramId !== undefined && initialProgramId !== null) {
      setProgramFilter(initialProgramId);
    }
  }, [initialProgramId]);

  useEffect(() => {
    setExpandedModuleIds(new Set());
  }, [programFilter]);

  const visibleModules = useMemo(
    () => modules
      .filter((module) => !programFilter || module.programId === programFilter)
      .sort((a, b) => a.programId.localeCompare(b.programId) || a.sortOrder - b.sortOrder),
    [modules, programFilter]
  );
  const visibleLessons = visibleModules.reduce((total, module) => total + module.lessons.length, 0);
  const activeModules = visibleModules.filter((module) => module.isActive).length;
  const activeLessons = visibleModules.reduce(
    (total, module) => total + module.lessons.filter((lesson) => lesson.isActive).length,
    0
  );

  const groups = programs
    .filter((program) => !programFilter || program.id === programFilter)
    .map((program) => ({
      program,
      modules: visibleModules
        .filter((module) => module.programId === program.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }))
    .filter((group) => group.modules.length > 0 || Boolean(programFilter));

  async function saveModule(payload: CreateModuleRequest & { programId?: string }, module?: CurriculumModuleResponse) {
    if (module) {
      await runAction(`module-${module.id}`, () => adminLmsApi.updateModule(module.id, payload), "Module updated.");
    } else {
      await runAction(`create-module-${payload.title}`, () => adminLmsApi.createModule(payload.programId ?? "", payload), "Module created.");
    }
    setModuleDialog(null);
  }

  async function toggleModule(module: CurriculumModuleResponse) {
    await runAction(
      `module-status-${module.id}`,
      () => adminLmsApi.updateModule(module.id, {
        title: module.title,
        description: module.description,
        sortOrder: module.sortOrder,
        isActive: !module.isActive
      }),
      `Module ${module.isActive ? "deactivated" : "activated"}.`
    );
  }

  async function deleteModule(module: CurriculumModuleResponse) {
    if (!window.confirm(`Delete “${module.title}” and all of its lessons?`)) {
      return;
    }

    await runAction(`delete-module-${module.id}`, () => adminLmsApi.deleteModule(module.id), "Module deleted.");
  }

  async function saveLesson(payload: LessonSavePayload, state: LessonDialogState) {
    const existing = state.lesson;
    const retainedResources = (existing?.resources ?? [])
      .filter((resource) => !payload.removedResourceIds.includes(resource.id))
      .map<LessonResourceRequest>((resource) => ({
        title: resource.title,
        resourceType: resource.resourceType,
        url: resource.url
      }));
    let videoUrl = payload.removeVideo ? undefined : existing?.videoUrl;
    let notesUrl = payload.removeNotes ? undefined : existing?.notesUrl;

    const baseRequest: CreateLessonRequest = {
      title: payload.title,
      summary: payload.summary,
      durationMinutes: payload.durationMinutes,
      accessLevel: payload.accessLevel,
      sortOrder: payload.sortOrder,
      isActive: payload.isActive,
      videoUrl,
      notesUrl,
      resources: retainedResources
    };

    setBusyKey(`lesson-save-${state.lesson?.id ?? "new"}`);
    onMessage(null);
    try {
      const response = existing
        ? await adminLmsApi.updateLesson(existing.id, baseRequest)
        : await adminLmsApi.createLesson(state.module.id, baseRequest);
      const lessonId = response.data.id;
      const uploadedResources: LessonResourceRequest[] = [];

      if (payload.videoFile) {
        videoUrl = await uploadLessonFile(payload.videoFile, state.module.programId, lessonId, "video");
      }

      if (payload.noteFiles.length > 0) {
        const noteUrls = await Promise.all(payload.noteFiles.map((file) =>
          uploadLessonFile(file, state.module.programId, lessonId, "notes")));
        noteUrls.forEach((url, index) => {
          uploadedResources.push({ title: payload.noteFiles[index].name, resourceType: "Notes", url });
        });
        notesUrl = noteUrls[0] ?? notesUrl;
      }

      if (payload.imageFiles.length > 0) {
        const imageUrls = await Promise.all(payload.imageFiles.map((file) =>
          uploadLessonFile(file, state.module.programId, lessonId, "image")));
        imageUrls.forEach((url, index) => {
          uploadedResources.push({ title: payload.imageFiles[index].name, resourceType: "Image", url });
        });
      }

      if (payload.documentFiles.length > 0) {
        const documentUrls = await Promise.all(payload.documentFiles.map((file) =>
          uploadLessonFile(file, state.module.programId, lessonId, "document")));
        documentUrls.forEach((url, index) => {
          uploadedResources.push({ title: payload.documentFiles[index].name, resourceType: "PDF / document", url });
        });
      }

      if (payload.videoFile || uploadedResources.length > 0 || payload.removeVideo || payload.removeNotes || !existing) {
        await adminLmsApi.updateLesson(lessonId, {
          ...baseRequest,
          videoUrl,
          notesUrl,
          resources: [...retainedResources, ...uploadedResources]
        });
      }

      setLessonDialog(null);
      onMessage({ tone: "success", text: existing ? "Lesson updated." : "Lesson created." });
      await onRefresh();
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleLesson(module: CurriculumModuleResponse, lesson: LessonResponse) {
    await runAction(
      `lesson-status-${lesson.id}`,
      () => adminLmsApi.updateLesson(lesson.id, lessonRequest(lesson, { isActive: !lesson.isActive })),
      `Lesson ${lesson.isActive ? "deactivated" : "activated"}.`
    );
  }

  async function deleteLesson(lesson: LessonResponse) {
    if (!window.confirm(`Delete “${lesson.title}”?`)) {
      return;
    }

    await runAction(`delete-lesson-${lesson.id}`, () => adminLmsApi.deleteLesson(lesson.id), "Lesson deleted.");
  }

  async function moveModule(module: CurriculumModuleResponse, direction: -1 | 1) {
    const ordered = modules
      .filter((item) => item.programId === module.programId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === module.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) {
      return;
    }
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await reorderModules(module.programId, ordered);
  }

  async function reorderModules(programId: string, ordered: CurriculumModuleResponse[]) {
    await runAction(
      `reorder-modules-${programId}`,
      () => adminLmsApi.reorderModules(programId, { orderedIds: ordered.map((module) => module.id) }),
      "Module order updated."
    );
  }

  async function moveLesson(module: CurriculumModuleResponse, lesson: LessonResponse, direction: -1 | 1) {
    const ordered = [...module.lessons].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === lesson.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) {
      return;
    }
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await reorderLessons(module.id, ordered);
  }

  async function reorderLessons(moduleId: string, ordered: LessonResponse[]) {
    await runAction(
      `reorder-lessons-${moduleId}`,
      () => adminLmsApi.reorderLessons(moduleId, { orderedIds: ordered.map((lesson) => lesson.id) }),
      "Lesson order updated."
    );
  }

  async function runAction(key: string, action: () => Promise<unknown>, successText: string) {
    setBusyKey(key);
    onMessage(null);
    try {
      await action();
      onMessage({ tone: "success", text: successText });
      await onRefresh();
      return true;
    } catch (error) {
      onMessage({ tone: "error", text: formatApiError(error) });
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  function handleModuleDrop(event: DragEvent<HTMLElement>, target: CurriculumModuleResponse) {
    event.preventDefault();
    const sourceId = draggedModuleId;
    setDraggedModuleId(null);
    if (!sourceId || sourceId === target.id) {
      return;
    }
    const source = modules.find((module) => module.id === sourceId);
    if (!source || source.programId !== target.programId) {
      return;
    }
    const ordered = modules
      .filter((module) => module.programId === target.programId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const sourceIndex = ordered.findIndex((module) => module.id === sourceId);
    const targetIndex = ordered.findIndex((module) => module.id === target.id);
    const [removed] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, removed);
    void reorderModules(target.programId, ordered);
  }

  function handleLessonDrop(event: DragEvent<HTMLElement>, module: CurriculumModuleResponse, target: LessonResponse) {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = draggedLessonId;
    setDraggedLessonId(null);
    if (!sourceId || sourceId === target.id) {
      return;
    }
    const ordered = [...module.lessons].sort((a, b) => a.sortOrder - b.sortOrder);
    const sourceIndex = ordered.findIndex((lesson) => lesson.id === sourceId);
    const targetIndex = ordered.findIndex((lesson) => lesson.id === target.id);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const [removed] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, removed);
    void reorderLessons(module.id, ordered);
  }

  function toggleExpandedModule(moduleId: string) {
    setExpandedModuleIds((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  const programSummaries = programs.map((program) => {
    const programModules = modules.filter((module) => module.programId === program.id);
    return {
      program,
      moduleCount: programModules.length,
      lessonCount: programModules.reduce((total, module) => total + module.lessons.length, 0),
      activeCount: programModules.reduce(
        (total, module) => total + (module.isActive ? 1 : 0) + module.lessons.filter((lesson) => lesson.isActive).length,
        0
      )
    };
  });

  return (
    <section className="curriculum-workspace">
      <div className="curriculum-workspace__hero">
        <div>
          <span className="eyebrow"><Link to="/dashboard">Dashboard</Link> / Curriculum</span>
          <h2>Curriculum</h2>
          <p>Organize your programs with modules and lessons.</p>
        </div>
        <Link className="primary-action admin-curriculum-add" to="/dashboard?section=Programs"><Plus size={17}/>Add Program</Link><div className="curriculum-workspace__stats" aria-label="Curriculum summary">
          <span><strong>{visibleModules.length}</strong><small>Modules</small></span>
          <span><strong>{visibleLessons}</strong><small>Lessons</small></span>
          <span><strong>{activeModules + activeLessons}</strong><small>Published items</small></span>
        </div>
      </div>

      <div className="curriculum-workspace__toolbar">
        {!programFilter && <><input aria-label="Search curriculum programs" placeholder="Search programs..." value={programSearch} onChange={event => setProgramSearch(event.target.value)}/><select aria-label="Curriculum category" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="">All categories</option>{[...new Set(programs.map(p=>p.categoryName).filter(Boolean))].map(name=><option key={name} value={name}>{name}</option>)}</select><select aria-label="Sort curriculum" value={programSort} onChange={event=>setProgramSort(event.target.value)}><option value="default">Sort by</option><option value="az">Name A-Z</option><option value="modules">Most modules</option></select></>}
        <label>
          <span>Program</span>
          <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
            <option value="">All programs</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
          </select>
        </label>
        <span className="curriculum-workspace__hint"><GripVertical size={16} /> Drag cards to change order, or use the arrows.</span>
        {programFilter ? <button type="button" className="secondary-action curriculum-clear-filter" onClick={() => setProgramFilter("")}>All programs</button> : null}
      </div>

      {!programFilter ? (
        <div className="curriculum-program-picker">
          <div className="curriculum-program-picker__intro">
            <div>
              <span className="eyebrow">Choose a workspace</span>
              <h3>Select a program to manage</h3>
              <p>Keep the overview light. Open a program when you want to edit its modules and lessons.</p>
            </div>
            <strong>{programs.length} programs</strong>
          </div>
          <div className="curriculum-program-picker__list">
            {programSearch && !programSummaries.some(({program})=>program.title.toLowerCase().includes(programSearch.toLowerCase()) && (!categoryFilter || program.categoryName===categoryFilter)) && <div className="admin-reference-empty"><h3>No matching programs</h3><p>Try another search or category.</p><button className="secondary-action" onClick={()=>{setProgramSearch("");setCategoryFilter("");}}>Reset filters</button></div>}
            {programSummaries.filter(({program}) => (!categoryFilter || program.categoryName === categoryFilter) && program.title.toLowerCase().includes(programSearch.toLowerCase())).sort((a,b) => programSort === "az" ? a.program.title.localeCompare(b.program.title) : programSort === "modules" ? b.moduleCount-a.moduleCount : 0).map(({ program, moduleCount, lessonCount, activeCount }) => (
              <button type="button" className="curriculum-program-choice" key={program.id} onClick={() => setProgramFilter(program.id)}>
                <span className="admin-curriculum-icon"><FileText size={27}/></span><span className="curriculum-program-choice__main">
                  <span className="curriculum-program-choice__category">{program.categoryName || "Program"}</span>
                  <strong>{program.title}</strong>
                </span>
                <span className="curriculum-program-choice__meta"><span>{moduleCount} modules</span><span>{lessonCount} lessons</span><span>{activeCount} active</span><ChevronDown size={17} /></span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="curriculum-selection-bar">
          <div><span className="eyebrow">Managing program</span><strong>{programs.find((program) => program.id === programFilter)?.title ?? "Selected program"}</strong></div>
          <button type="button" className="primary-action" onClick={() => setModuleDialog({ mode: "create", programId: programFilter })}><Plus size={17} />Add module</button>
        </div>
      )}

      <div className={`curriculum-groups${!programFilter ? " is-hidden" : ""}`}>
        {groups.map(({ program, modules: programModules }) => (
          <section className="curriculum-program-group" key={program.id}>
            <div className="curriculum-program-group__header">
              <div><span>{program.categoryName}</span><h3>{program.title}</h3></div>
              <strong>{programModules.length} module{programModules.length === 1 ? "" : "s"}</strong>
            </div>
            <div className="curriculum-module-list">
              {programModules.map((module) => (
                <article
                  className={`curriculum-module-card${module.isActive ? "" : " is-inactive"}`}
                  draggable
                  key={module.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedModuleId(module.id)}
                  onDragEnd={() => setDraggedModuleId(null)}
                  onDrop={(event) => handleModuleDrop(event, module)}
                >
                  <div className="curriculum-module-card__header">
                    <span className="curriculum-drag-handle" title="Drag to reorder"><GripVertical size={20} /></span>
                    <span className="curriculum-order-badge">{String(module.sortOrder).padStart(2, "0")}</span>
                    <div className="curriculum-module-card__heading"><div><h4>{module.title}</h4><span>{module.isActive ? "Visible on website" : "Hidden from website"}</span></div><StatusPill active={module.isActive} /></div>
                    <div className="curriculum-icon-actions">
                      <IconButton label="Move module up" disabled={module.sortOrder === 1 || busyKey !== null} onClick={() => void moveModule(module, -1)}><ArrowUp size={16} /></IconButton>
                      <IconButton label="Move module down" disabled={module.sortOrder >= programModules.length || busyKey !== null} onClick={() => void moveModule(module, 1)}><ArrowDown size={16} /></IconButton>
                      <IconButton label="Edit module" disabled={busyKey !== null} onClick={() => setModuleDialog({ mode: "edit", programId: module.programId, module })}><Pencil size={16} /></IconButton>
                      <IconButton label={module.isActive ? "Deactivate module" : "Activate module"} disabled={busyKey !== null} onClick={() => void toggleModule(module)}>{module.isActive ? <EyeOff size={16} /> : <Check size={16} />}</IconButton>
                      <IconButton label="Delete module" danger disabled={busyKey !== null} onClick={() => void deleteModule(module)}><Trash2 size={16} /></IconButton>
                    </div>
                  </div>
                  <p className="curriculum-module-card__description">{module.description}</p>
                  <div className="curriculum-module-card__meta"><span>{module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"}</span><span>{module.lessons.filter((lesson) => lesson.isActive).length} active</span><button type="button" className="curriculum-module-toggle" onClick={() => toggleExpandedModule(module.id)}>{expandedModuleIds.has(module.id) ? <><ChevronUp size={15} />Hide lessons</> : <><ChevronDown size={15} />View lessons</>}</button><button type="button" className="curriculum-add-lesson" onClick={() => setLessonDialog({ mode: "create", module })}><Plus size={16} />Add lesson</button></div>

                  {expandedModuleIds.has(module.id) ? <div className="curriculum-lesson-list">
                    {module.lessons.length === 0 ? <div className="curriculum-empty-lessons"><PlayCircle size={18} />No lessons in this module yet. Add the first one.</div> : null}
                    {module.lessons.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((lesson) => (
                      <article
                        className={`curriculum-lesson-row${lesson.isActive ? "" : " is-inactive"}`}
                        draggable
                        key={lesson.id}
                        onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }}
                        onDragStart={(event) => { event.stopPropagation(); setDraggedLessonId(lesson.id); }}
                        onDragEnd={() => setDraggedLessonId(null)}
                        onDrop={(event) => handleLessonDrop(event, module, lesson)}
                      >
                        <span className="curriculum-drag-handle curriculum-drag-handle--lesson" title="Drag to reorder"><GripVertical size={17} /></span>
                        <span className="curriculum-lesson-number">{lesson.sortOrder}</span>
                        <div className="curriculum-lesson-row__body"><strong>{lesson.title}</strong><span>{lesson.summary}</span><small>{lesson.durationMinutes} min · {lesson.accessLevel}{lesson.resources.length ? ` · ${lesson.resources.length} media` : ""}</small></div>
                        <StatusPill active={lesson.isActive} />
                        <div className="curriculum-icon-actions curriculum-icon-actions--lesson">
                          <IconButton label="Preview lesson" disabled={busyKey !== null} onClick={() => setPreview({ module, lesson })}><Eye size={16} /></IconButton>
                          <IconButton label="Move lesson up" disabled={lesson.sortOrder === 1 || busyKey !== null} onClick={() => void moveLesson(module, lesson, -1)}><ArrowUp size={15} /></IconButton>
                          <IconButton label="Move lesson down" disabled={lesson.sortOrder >= module.lessons.length || busyKey !== null} onClick={() => void moveLesson(module, lesson, 1)}><ArrowDown size={15} /></IconButton>
                          <IconButton label="Edit lesson" disabled={busyKey !== null} onClick={() => setLessonDialog({ mode: "edit", module, lesson })}><Pencil size={15} /></IconButton>
                          <IconButton label={lesson.isActive ? "Deactivate lesson" : "Activate lesson"} disabled={busyKey !== null} onClick={() => void toggleLesson(module, lesson)}>{lesson.isActive ? <EyeOff size={15} /> : <Check size={15} />}</IconButton>
                          <IconButton label="Delete lesson" danger disabled={busyKey !== null} onClick={() => void deleteLesson(lesson)}><Trash2 size={15} /></IconButton>
                        </div>
                      </article>
                    ))}
                  </div> : null}
                </article>
              ))}
              {programModules.length === 0 ? <div className="curriculum-empty-state">No modules yet for this program.</div> : null}
            </div>
          </section>
        ))}
        {groups.length === 0 && programs.length > 0 && !programFilter ? <div className="curriculum-empty-state">No curriculum modules yet. Use Add module to build the first program structure.</div> : null}
        {programs.length === 0 ? <div className="curriculum-empty-state">Create a program before adding curriculum modules.</div> : null}
      </div>

      {(moduleDialog || lessonDialog || preview) ? createPortal(<div className="dashboard-shell--admin" style={{ display: "contents" }}>
      {moduleDialog ? (
        <ModuleDialog
          key={`${moduleDialog.mode}-${moduleDialog.module?.id ?? moduleDialog.programId}`}
          dialog={moduleDialog}
          programs={programs}
          busy={busyKey !== null}
          onClose={() => setModuleDialog(null)}
          onSave={(payload) => saveModule(payload, moduleDialog.module)}
        />
      ) : null}
      {lessonDialog ? (
        <LessonDialog
          key={`${lessonDialog.mode}-${lessonDialog.lesson?.id ?? lessonDialog.module.id}`}
          dialog={lessonDialog}
          busy={busyKey !== null}
          onClose={() => setLessonDialog(null)}
          onSave={(payload) => saveLesson(payload, lessonDialog)}
        />
      ) : null}
      {preview ? <LessonPreviewDialog preview={preview} onClose={() => setPreview(null)} /> : null}
      </div>, document.body) : null}
    </section>
  );
}

function ModuleDialog({
  dialog,
  programs,
  busy,
  onClose,
  onSave
}: {
  dialog: ModuleDialogState;
  programs: ProgramSummaryResponse[];
  busy: boolean;
  onClose: () => void;
  onSave: (payload: CreateModuleRequest & { programId?: string }) => Promise<void>;
}) {
  const module = dialog.module;
  useDialogAccessibility(true, ".curriculum-dialog", onClose);
  const program = programs.find((item) => item.id === dialog.programId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSave({
      programId: dialog.programId,
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      sortOrder: positiveNumber(form.get("sortOrder")),
      isActive: String(form.get("isActive")) !== "false"
    });
  }

  return (
    <div className="curriculum-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="curriculum-dialog" role="dialog" aria-modal="true" aria-labelledby="curriculum-module-dialog-title">
        <div className="curriculum-dialog__header"><span className="curriculum-dialog__icon"><FileText size={21} /></span><div><span className="eyebrow">Module</span><h3 id="curriculum-module-dialog-title">{module ? "Edit module" : "Add module"}</h3><p>{program?.title ?? "Choose a program"}</p></div><button type="button" className="curriculum-dialog__close" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        <form className="curriculum-dialog__form" onSubmit={submit}>
          <label><span>Module title</span><input name="title" defaultValue={module?.title ?? ""} minLength={2} maxLength={180} required /></label>
          <label><span>Module description</span><textarea name="description" defaultValue={module?.description ?? ""} minLength={10} maxLength={1200} required /></label>
          <div className="curriculum-form-grid"><label><span>Module order</span><input name="sortOrder" type="number" min="1" defaultValue={module?.sortOrder ?? ""} placeholder="Auto" /></label><label><span>Status</span><select name="isActive" defaultValue={module?.isActive === false ? "false" : "true"}><option value="true">Active · show on website</option><option value="false">Inactive · keep hidden</option></select></label></div>
          <div className="curriculum-dialog__actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={busy}><Save size={17} />{busy ? "Saving…" : "Save module"}</button></div>
        </form>
      </section>
    </div>
  );
}

function LessonDialog({
  dialog,
  busy,
  onClose,
  onSave
}: {
  dialog: LessonDialogState;
  busy: boolean;
  onClose: () => void;
  onSave: (payload: LessonSavePayload) => Promise<void>;
}) {
  const lesson = dialog.lesson;
  useDialogAccessibility(true, ".curriculum-dialog", onClose);
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [removeNotes, setRemoveNotes] = useState(false);
  const [removedResourceIds, setRemovedResourceIds] = useState<string[]>([]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSave({
      title: String(form.get("title") ?? "").trim(),
      summary: String(form.get("summary") ?? "").trim(),
      durationMinutes: Number(form.get("durationMinutes") ?? 45),
      accessLevel: Number(form.get("accessLevel") ?? 3),
      sortOrder: positiveNumber(form.get("sortOrder")),
      isActive: String(form.get("isActive")) !== "false",
      videoFile,
      imageFiles,
      documentFiles,
      noteFiles,
      removeVideo,
      removeNotes,
      removedResourceIds
    });
  }

  return (
    <div className="curriculum-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="curriculum-dialog curriculum-dialog--lesson" role="dialog" aria-modal="true" aria-labelledby="curriculum-lesson-dialog-title">
        <div className="curriculum-dialog__header"><span className="curriculum-dialog__icon"><PlayCircle size={21} /></span><div><span className="eyebrow">{dialog.mode === "edit" ? "Edit lesson" : "New lesson"}</span><h3 id="curriculum-lesson-dialog-title">{lesson ? lesson.title : "Add lesson"}</h3><p>Inside <strong>{dialog.module.title}</strong></p></div><button type="button" className="curriculum-dialog__close" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        <form className="curriculum-dialog__form" onSubmit={submit}>
          <label><span>Lesson title</span><input name="title" defaultValue={lesson?.title ?? ""} minLength={2} maxLength={180} placeholder="e.g. Build your first component" required /></label>
          <label><span>Lesson summary</span><textarea name="summary" defaultValue={lesson?.summary ?? ""} minLength={10} maxLength={1200} placeholder="Explain what learners will cover" required /></label>
          <div className="curriculum-form-grid curriculum-form-grid--three"><label><span>Duration (minutes)</span><input name="durationMinutes" type="number" min="1" defaultValue={lesson?.durationMinutes ?? 45} required /></label><label><span>Lesson order</span><input name="sortOrder" type="number" min="1" defaultValue={lesson?.sortOrder ?? ""} placeholder="Auto" /></label><label><span>Status</span><select name="isActive" defaultValue={lesson?.isActive === false ? "false" : "true"}><option value="true">Active</option><option value="false">Inactive</option></select></label></div>
          <label><span>Access</span><select name="accessLevel" defaultValue={accessLevelValue(lesson?.accessLevel ?? "Full")}><option value="3">Full access</option><option value="1">Preview</option><option value="2">Reserved</option></select></label>

          <div className="curriculum-media-section"><div className="curriculum-media-section__title"><div><strong>Lesson media</strong><span>Upload video, images, PDFs, or notes. Files use the configured local/cloud asset provider.</span></div><UploadCloud size={20} /></div>
            {lesson?.videoUrl && !removeVideo ? <MediaCurrentRow icon={<Video size={16} />} label="Current video" url={lesson.videoUrl} onRemove={() => setRemoveVideo(true)} /> : null}
            <FileUploadField icon={<Video size={17} />} label="Video" hint="MP4, WebM, or MOV · one file" accept="video/mp4,video/webm,video/quicktime" fileNames={videoFile ? [videoFile.name] : []} onChange={(files) => setVideoFile(files[0])} />
            {lesson?.notesUrl && !removeNotes ? <MediaCurrentRow icon={<FileText size={16} />} label="Current notes" url={lesson.notesUrl} onRemove={() => setRemoveNotes(true)} /> : null}
            <FileUploadField icon={<FileText size={17} />} label="Notes" hint="PDF, DOC, TXT, or Markdown · multiple files" accept=".pdf,.doc,.docx,.txt,.md,application/pdf,text/plain,text/markdown" multiple fileNames={noteFiles.map((file) => file.name)} onChange={setNoteFiles} />
            <FileUploadField icon={<ImageIcon size={17} />} label="Images" hint="JPG, PNG, WebP, or GIF · multiple files" accept="image/jpeg,image/png,image/webp,image/gif" multiple fileNames={imageFiles.map((file) => file.name)} onChange={setImageFiles} />
            <FileUploadField icon={<FileText size={17} />} label="PDFs / documents" hint="PDF, DOC, DOCX, PPT, or ZIP · multiple files" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,application/pdf" multiple fileNames={documentFiles.map((file) => file.name)} onChange={setDocumentFiles} />
            {lesson?.resources.filter((resource) => !removedResourceIds.includes(resource.id)).map((resource) => <MediaCurrentRow key={resource.id} icon={resource.resourceType === "Image" ? <ImageIcon size={16} /> : <FileText size={16} />} label={`${resource.resourceType} · ${resource.title}`} url={resource.url} onRemove={() => setRemovedResourceIds((current) => [...current, resource.id])} />)}
          </div>
          <div className="curriculum-dialog__actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={busy}><Save size={17} />{busy ? "Uploading…" : lesson ? "Save lesson" : "Create lesson"}</button></div>
        </form>
      </section>
    </div>
  );
}

function FileUploadField({
  icon,
  label,
  hint,
  accept,
  multiple = false,
  fileNames,
  onChange
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  fileNames: string[];
  onChange: (files: File[]) => void;
}) {
  return <label className="curriculum-file-upload"><span className="curriculum-file-upload__icon">{icon}</span><span className="curriculum-file-upload__copy"><strong>{label}</strong><small>{fileNames.length ? fileNames.join(", ") : hint}</small></span><span className="curriculum-file-upload__button">Choose file{multiple ? "s" : ""}</span><input type="file" accept={accept} multiple={multiple} onChange={(event) => onChange(Array.from(event.target.files ?? []))} /></label>;
}

function MediaCurrentRow({ icon, label, url, onRemove }: { icon: ReactNode; label: string; url: string; onRemove: () => void }) {
  return <div className="curriculum-current-media"><span>{icon}</span><a href={toBrowserMediaUrl(url)} target="_blank" rel="noreferrer">{label}</a><button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><X size={15} /></button></div>;
}

function LessonPreviewDialog({ preview, onClose }: { preview: { module: CurriculumModuleResponse; lesson: LessonResponse }; onClose: () => void }) {
  useDialogAccessibility(true, ".curriculum-dialog", onClose);
  const { lesson, module } = preview;
  const imageResources = lesson.resources.filter((resource) => resource.resourceType === "Image");
  const otherResources = lesson.resources.filter((resource) => resource.resourceType !== "Image");
  return <div className="curriculum-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="curriculum-dialog curriculum-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="curriculum-preview-title"><div className="curriculum-dialog__header"><span className="curriculum-dialog__icon"><Eye size={21} /></span><div><span className="eyebrow">Preview</span><h3 id="curriculum-preview-title">{lesson.title}</h3><p>{module.title} · {lesson.durationMinutes} minutes</p></div><button type="button" className="curriculum-dialog__close" onClick={onClose} aria-label="Close"><X size={19} /></button></div><div className="curriculum-preview__content"><div className="curriculum-preview__meta"><StatusPill active={lesson.isActive} /><span>{lesson.accessLevel} access</span></div><p>{lesson.summary}</p>{lesson.videoUrl ? <video className="curriculum-preview__video" controls src={toBrowserMediaUrl(lesson.videoUrl)} /> : <div className="curriculum-preview__empty"><Video size={22} />No video attached yet.</div>}{imageResources.length ? <div className="curriculum-preview__images">{imageResources.map((resource) => <img key={resource.id} src={toBrowserMediaUrl(resource.url)} alt={resource.title} />)}</div> : null}<div className="curriculum-preview__links">{lesson.notesUrl ? <a href={toBrowserMediaUrl(lesson.notesUrl)} target="_blank" rel="noreferrer"><FileText size={16} />Open notes</a> : null}{otherResources.map((resource) => <a key={resource.id} href={toBrowserMediaUrl(resource.url)} target="_blank" rel="noreferrer"><FileText size={16} />{resource.title}</a>)}</div></div></section></div>;
}

function StatusPill({ active }: { active: boolean }) {
  return <span className={`curriculum-status-pill${active ? " is-active" : ""}`}><span />{active ? "Active" : "Inactive"}</span>;
}

function IconButton({ children, label, disabled, danger = false, onClick }: { children: ReactNode; label: string; disabled?: boolean; danger?: boolean; onClick: () => void }) {
  return <button type="button" className={`curriculum-icon-button${danger ? " is-danger" : ""}`} aria-label={label} title={label} disabled={disabled} onClick={onClick}>{children}</button>;
}

function positiveNumber(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function accessLevelValue(value: string) {
  return value === "Preview" ? 1 : value === "Reserved" ? 2 : 3;
}

function lessonRequest(lesson: LessonResponse, overrides: Partial<CreateLessonRequest> = {}): CreateLessonRequest {
  return {
    title: lesson.title,
    summary: lesson.summary,
    videoUrl: lesson.videoUrl,
    notesUrl: lesson.notesUrl,
    durationMinutes: lesson.durationMinutes,
    accessLevel: accessLevelValue(lesson.accessLevel),
    sortOrder: lesson.sortOrder,
    isActive: lesson.isActive,
    resources: lesson.resources.map((resource) => ({ title: resource.title, resourceType: resource.resourceType, url: resource.url })),
    ...overrides
  };
}

async function uploadLessonFile(file: File, programId: string, lessonId: string, kind: "video" | "image" | "document" | "notes") {
  const isVideo = kind === "video";
  const uploadResponse = await assetsApi.uploadFile(file, {
    type: isVideo ? assetTypes.video : kind === "image" ? assetTypes.image : assetTypes.document,
    purpose: isVideo ? assetPurposes.lessonVideo : assetPurposes.lessonResource,
    visibility: assetVisibilities.public,
    programId,
    lessonId
  });
  const directUrl = uploadResponse.data.deliveryUrl ?? uploadResponse.data.publicUrl;
  if (directUrl) {
    return toBrowserMediaUrl(directUrl);
  }
  const accessResponse = await assetsApi.getAccessUrl(uploadResponse.data.id);
  return toBrowserMediaUrl(accessResponse.data.url);
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

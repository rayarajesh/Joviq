import { useEffect, useRef, useState } from "react";
import { ClipboardList, RefreshCw, Search, X } from "lucide-react";
import { request } from "../lib/api/httpClient";
import "../styles/admin-onboarding.css";

type Submission = {
  userId: string; studentName: string; studentEmail: string; phoneNumber: string | null;
  whatsAppNumber: string | null; collegeName: string | null; currentYearOfStudy: string | null;
  category: string | null; programSlug: string | null; program: string | null;
  preferredStartDate: string | null; executiveName: string | null; submittedAt: string; status: string;
};
type Results = { items: Submission[]; totalCount: number; totalPages: number };
type Filters = { categories: string[]; programs: { slug: string; title: string; category: string }[] };
const statuses = ["Submitted", "In Review", "Approved", "Rejected"];
const endpoint = "/api/v1/admin/onboarding";
const display = (value: string | null) => value || "Not provided";
const month = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Not provided";
const date = (value: string) => new Date(value).toLocaleString("en-IN");
const errorText = (error: unknown) => error instanceof Error ? error.message : "Unable to load onboarding details. Please try again.";

export function AdminStudentOnboarding() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState("");
  const [oldest, setOldest] = useState(false);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState<Filters>({ categories: [], programs: [] });
  const [results, setResults] = useState<Results>({ items: [], totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Submission | null>(null);
  const [detailError, setDetailError] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ page: String(page), pageSize: "20", oldestFirst: String(oldest) });
      if (search.trim()) query.set("search", search.trim());
      if (category) query.set("category", category);
      if (program) query.set("program", program);
      if (status) query.set("status", status);
      void Promise.all([request<Results>(`${endpoint}?${query}`), request<Filters>(`${endpoint}/filters`)])
        .then(([list, choices]) => { if (active) { setResults(list.data); setFilters(choices.data); } })
        .catch(reason => { if (active) setError(errorText(reason)); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, category, program, status, oldest, page, revision]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setDetail(null); setDetailError("");
    dialog.current?.showModal();
    void request<Submission>(`${endpoint}/${selectedId}`).then(response => {
      if (active) { setDetail(response.data); setReviewStatus(response.data.status); }
    }).catch(reason => { if (active) setDetailError(errorText(reason)); });
    return () => { active = false; };
  }, [selectedId]);

  function close() { if (!saving) { dialog.current?.close(); setSelectedId(null); } }
  async function saveStatus() {
    if (!detail) return;
    setSaving(true); setDetailError("");
    try {
      const response = await request<Submission>(`${endpoint}/${detail.userId}/status`, { method: "PUT", body: { status: reviewStatus } });
      setDetail(response.data); setRevision(value => value + 1);
    } catch (reason) { setDetailError(errorText(reason)); }
    finally { setSaving(false); }
  }

  return <section className="admin-onboarding" aria-labelledby="onboarding-title">
    <header className="admin-onboarding__header"><div><h2 id="onboarding-title"><ClipboardList size={25} /> Student Onboarding</h2><p>Review students submitted registration details and manage their review status.</p></div><button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading}><RefreshCw size={16} /> Refresh</button></header>
    <div className="admin-onboarding__filters">
      <label><span><Search size={14} /> Search students</span><input placeholder="Name or email" maxLength={200} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
      <label>Category<select aria-label="Category" value={category} onChange={e => { setCategory(e.target.value); setProgram(""); setPage(1); }}><option value="">All categories</option>{filters.categories.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Program<select aria-label="Program" value={program} onChange={e => { setProgram(e.target.value); setPage(1); }}><option value="">All programs</option>{filters.programs.filter(x => !category || x.category === category).map(x => <option key={`${x.category}-${x.slug}`} value={x.slug}>{x.title}</option>)}</select></label>
      <label>Review status<select aria-label="Review status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Submitted date<select aria-label="Submitted date" value={String(oldest)} onChange={e => { setOldest(e.target.value === "true"); setPage(1); }}><option value="false">Newest first</option><option value="true">Oldest first</option></select></label>
    </div>
    {error && <p className="admin-onboarding__error" role="alert">{error} <button onClick={() => setRevision(value => value + 1)}>Retry</button></p>}
    {loading ? <p role="status">Loading onboarding submissions</p> : !error && <>
      <p role="status">{results.totalCount} submission{results.totalCount === 1 ? "" : "s"}</p>
      {results.items.length === 0 ? <div className="admin-onboarding__empty"><ClipboardList size={30} /><h3>No onboarding submissions found</h3><p>Student details appear here after they save the onboarding form. Try adjusting your filters.</p></div> : <div className="admin-onboarding__table" tabIndex={0} role="region" aria-label="Student onboarding submissions"><table><thead><tr>{["Student Name", "Student Email", "Category", "Program", "Preferred Start Month", "Executive Name", "Submitted Date", "Onboarding Status", "Phone Number", "WhatsApp Number", "Year of Study", "Actions"].map(x => <th key={x} scope="col">{x}</th>)}</tr></thead><tbody>{results.items.map(row => <tr key={row.userId}><td>{row.studentName}</td><td>{row.studentEmail}</td><td>{display(row.category)}</td><td>{display(row.program)}</td><td>{month(row.preferredStartDate)}</td><td>{display(row.executiveName)}</td><td>{date(row.submittedAt)}</td><td><span className="admin-onboarding__status">{row.status}</span></td><td>{display(row.phoneNumber)}</td><td>{display(row.whatsAppNumber)}</td><td>{display(row.currentYearOfStudy)}</td><td><button onClick={() => setSelectedId(row.userId)} aria-label={`View onboarding for ${row.studentName}`}>View details</button></td></tr>)}</tbody></table></div>}
      <footer><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.max(1, results.totalPages)}</span><button disabled={page >= results.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></footer>
    </>}
    <dialog ref={dialog} className="admin-onboarding__dialog" aria-labelledby="onboarding-detail-title" onCancel={e => { e.preventDefault(); close(); }} onClose={() => setSelectedId(null)}>
      <header><h2 id="onboarding-detail-title">Onboarding details</h2><button onClick={close} disabled={saving} aria-label="Close onboarding details"><X size={20} /></button></header>
      {detailError && <p role="alert" className="admin-onboarding__error">{detailError}</p>}
      {!detail && !detailError && <p role="status">Loading student details</p>}
      {detail && <><dl>{Object.entries({ "Student name": detail.studentName, Email: detail.studentEmail, Phone: detail.phoneNumber, WhatsApp: detail.whatsAppNumber, College: detail.collegeName, "Year of study": detail.currentYearOfStudy, Category: detail.category, Program: detail.program, "Preferred start month": month(detail.preferredStartDate), Executive: detail.executiveName, Submitted: date(detail.submittedAt), "Current review status": detail.status }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl><label>Review status<select aria-label="Review status" value={reviewStatus} disabled={saving} onChange={e => setReviewStatus(e.target.value)}>{statuses.map(x => <option key={x}>{x}</option>)}</select></label><p>This review status is separate from account setup, course completion, and certificates.</p><button disabled={saving || reviewStatus === detail.status} onClick={() => void saveStatus()}>{saving ? "Saving" : "Save status"}</button></>}
    </dialog>
  </section>;
}

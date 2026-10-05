import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, X } from "lucide-react";
import { adminLmsApi } from "../features/lms/api/lmsApi";
import { adminUsersApi } from "../features/auth/api/authApi";
import type { EnrollmentResponse, ProgramDetailsResponse, ProgramSummaryResponse } from "../features/lms/api/lmsTypes";
import type { AdminUserResponse } from "../features/auth/api/authTypes";
import { formatApiError } from "../lib/api/httpClient";
import "../styles/admin-enrollment-dialog.css";

export function AdminEnrollmentDialog({ students, programs, enrollment, onClose, onSaved }: {
  students: AdminUserResponse[];
  programs: ProgramSummaryResponse[];
  enrollment?: EnrollmentResponse;
  onClose: () => void;
  onSaved: (result: EnrollmentResponse) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState("existing");
  const [studentId, setStudentId] = useState(enrollment?.studentId ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState(students);
  const [findingStudents, setFindingStudents] = useState(false);
  const [programId, setProgramId] = useState(enrollment?.programId ?? "");
  const [planId, setPlanId] = useState(enrollment?.programPlanId ?? "");
  const [program, setProgram] = useState<ProgramDetailsResponse | null>(null);
  const [settings, setSettings] = useState<{ environment: string; paymentEnvironment: string; paymentsConfigured: boolean } | null>(null);
  const [paid, setPaid] = useState(!!enrollment);
  const [paymentKind, setPaymentKind] = useState<"full" | "token" | "other">(enrollment ? "full" : "token");
  const [otherAmount, setOtherAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "existing" || enrollment) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setFindingStudents(true);
      adminUsersApi.getUsers({ role: "Student", status: "Active", search: studentSearch, page: 1, pageSize: 100 })
        .then(result => { if (active) setStudentOptions(result.data.items); })
        .catch(error => { if (active) setError(formatApiError(error)); })
        .finally(() => { if (active) setFindingStudents(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [mode, studentSearch, enrollment]);

  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    adminLmsApi.getEnrollmentSettings().then(result => { if (active) setSettings(result.data); })
      .catch(error => { if (active) setError(formatApiError(error)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setProgram(null);
    if (!programId) return;
    setLoading(true);
    adminLmsApi.getProgram(programId).then(result => { if (active) setProgram(result.data); })
      .catch(error => { if (active) setError(formatApiError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [programId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || !program) return;
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    setSaving(true);
    setError("");
    try {
      const result = await adminLmsApi.createEnrollment({
        enrollmentId: enrollment?.id,
        studentId: mode === "existing" ? studentId : undefined,
        newStudent: mode === "new" ? {
          fullName: field("fullName"), email: field("email"), phoneNumber: field("phone"),
          temporaryPassword: String(form.get("password") ?? ""), role: "Student",
        } : undefined,
        programId, programPlanId: planId, startDate: field("startDate") || undefined,
        paymentEnvironment: settings.paymentEnvironment,
        paymentKind: paid ? paymentKind : undefined,
        amountPaid: paid ? amountPaid : undefined,
        cashfreeOrderId: paid ? field("orderId") : undefined,
        cashfreePaymentId: paid ? field("paymentId") || undefined : undefined,
        cashfreeLinkId: paid ? field("linkId") || undefined : undefined,
        notes: field("notes") || undefined,
      });
      await onSaved(result.data);
      onClose();
    } catch (error) { setError(formatApiError(error)); }
    finally { setSaving(false); }
  }

  const selectedStudent = studentOptions.find(student => student.id === studentId) ?? students.find(student => student.id === studentId);
  const plan = program?.plans.find(plan => plan.id === planId);
  const outstanding = enrollment?.balanceAmount ?? plan?.offerPrice ?? 0;
  const tokenAmount = plan?.reserveAmount ?? 0;
  const tokenAvailable = (enrollment?.paidAmount ?? 0) === 0 && tokenAmount > 0 && tokenAmount < outstanding;
  const amountPaid = paymentKind === "full" ? outstanding : paymentKind === "token" ? tokenAmount : Number(otherAmount);
  const remainingBalance = Math.max(outstanding - (paid && Number.isFinite(amountPaid) ? amountPaid : 0), 0);
  return <dialog ref={dialog} className="offline-enrollment-dialog" aria-labelledby="offline-enrollment-title"
    onCancel={event => { if (saving) event.preventDefault(); else onClose(); }}>
    <header><h2 id="offline-enrollment-title">{enrollment ? "Record Cashfree payment" : "Add enrollment"}</h2>
      <button type="button" className="icon-action" aria-label="Close enrollment" title="Close" disabled={saving} onClick={onClose}><X size={20} /></button></header>
    <form onSubmit={submit}>
      <div className="offline-enrollment-environment"><span>{settings?.environment ?? "Loading..."}</span>
        <strong>Cashfree {settings?.paymentEnvironment ?? "..."}</strong></div>
      {error && <p role="alert" className="offline-enrollment-error">{error}</p>}
      <fieldset disabled={saving}>
        <legend>Student</legend>
        {!enrollment && <div className="offline-enrollment-modes">
          <label><input type="radio" name="studentMode" checked={mode === "existing"} onChange={() => setMode("existing")} /> Existing student</label>
          <label><input type="radio" name="studentMode" checked={mode === "new"} onChange={() => setMode("new")} /> New student</label>
        </div>}
        {mode === "existing" ? <>
          {!enrollment && <label>Find student<input type="search" value={studentSearch} onChange={event => {
            setStudentSearch(event.target.value); setStudentId("");
          }} /></label>}
          {findingStudents && <p role="status">Loading students...</p>}
          <label>Student<select aria-label="Student" required disabled={!!enrollment} value={studentId} onChange={event => setStudentId(event.target.value)}>
            <option value="">Select student</option>
            {enrollment && !selectedStudent && <option value={enrollment.studentId}>{enrollment.studentName} - {enrollment.studentEmail}</option>}
            {studentOptions.filter(student => student.accountStatus === "Active" && student.roles.includes("Student"))
              .map(student => <option key={student.id} value={student.id}>{student.fullName} - {student.email}</option>)}
          </select></label>
          {selectedStudent && <div className="offline-enrollment-student">{selectedStudent.email}<br />{selectedStudent.phoneNumber}</div>}
        </> : <div className="offline-enrollment-fields">
          <label>Full name<input name="fullName" required maxLength={160} autoComplete="name" /></label>
          <label>Email<input name="email" type="email" required maxLength={256} autoComplete="email" /></label>
          <label>Mobile number<input name="phone" type="tel" required maxLength={16} autoComplete="tel" /></label>
          <label>Temporary password<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
        </div>}
      </fieldset>
      <fieldset disabled={saving}><legend>Program</legend><div className="offline-enrollment-fields">
        <label>Program<select aria-label="Program" required disabled={!!enrollment} value={programId} onChange={event => { setProgramId(event.target.value); setPlanId(""); }}>
          <option value="">Select program</option>
          {programs.filter(program => program.status === "Published" || program.id === enrollment?.programId).map(program =>
            <option key={program.id} value={program.id}>{program.title}</option>)}
        </select></label>
        <label>Plan<select aria-label="Plan" required disabled={!!enrollment || loading} value={planId} onChange={event => setPlanId(event.target.value)}>
          <option value="">{loading ? "Loading plans..." : "Select plan"}</option>
          {program?.plans.filter(plan => plan.isActive || plan.id === enrollment?.programPlanId).map(plan =>
            <option key={plan.id} value={plan.id}>{plan.name} - INR {plan.offerPrice.toLocaleString("en-IN")}</option>)}
        </select></label>
        <label>Start date<input name="startDate" type="date" disabled={!!enrollment} required defaultValue={enrollment?.startDate ?? new Date().toISOString().slice(0, 10)} /></label>
        <div className="offline-enrollment-amount"><span>{enrollment ? "Outstanding" : "Course fee"}</span>
          <strong>INR {(enrollment?.balanceAmount ?? plan?.offerPrice ?? 0).toLocaleString("en-IN")}</strong></div>
      </div></fieldset>
      <fieldset disabled={saving}><legend>Payment</legend>
        <label className="offline-enrollment-checkbox"><input type="checkbox" checked={paid} disabled={!!enrollment || !settings?.paymentsConfigured} onChange={event => setPaid(event.target.checked)} /> Paid through Cashfree</label>
        {!settings?.paymentsConfigured && settings && <p role="status">Cashfree credentials are not configured for this environment.</p>}
        {paid && <div className="offline-enrollment-fields">
          <label>Payment type<select aria-label="Payment type" value={paymentKind} onChange={event => setPaymentKind(event.target.value as "full" | "token" | "other")}>
            <option value="full">Full payment</option>
            <option value="token" disabled={!tokenAvailable}>Token payment</option>
            <option value="other">Other amount</option>
          </select></label>
          <label>Amount paid (INR)<input aria-label="Amount paid (INR)" name="amountPaid" type="number" required min="0.01" max={outstanding} step="0.01"
            readOnly={paymentKind !== "other"} value={paymentKind === "other" ? otherAmount : amountPaid || ""}
            onChange={event => setOtherAmount(event.target.value)} /></label>
          <div className="offline-enrollment-amount"><span>Remaining balance</span><strong>INR {remainingBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
          <div className="offline-enrollment-amount"><span>Course access after verification</span><strong>{remainingBalance === 0 ? "Full access" : "Preview access"}</strong></div>
          <label>Cashfree order ID<input name="orderId" required maxLength={160} /></label>
          <label>Cashfree payment ID<input name="paymentId" maxLength={160} /></label>
          <label>Cashfree link ID<input name="linkId" maxLength={160} /></label>
        </div>}
        <label>Notes<textarea name="notes" maxLength={500} rows={2} /></label>
      </fieldset>
      <footer><button type="button" className="secondary-action" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="primary-action" disabled={saving || loading || !settings || !program || !planId || (paid && (!settings.paymentsConfigured || (paymentKind === "token" && !tokenAvailable)))}>
          <CheckCircle2 size={18} />{saving ? "Saving..." : paid ? "Verify payment and save" : "Save enrollment"}</button></footer>
    </form>
  </dialog>;
}

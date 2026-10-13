import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, X } from "lucide-react";
import { adminLmsApi } from "../features/lms/api/lmsApi";
import { adminUsersApi } from "../features/auth/api/authApi";
import type { EnrollmentResponse, PaymentTransactionResponse, ProgramDetailsResponse, ProgramSummaryResponse } from "../features/lms/api/lmsTypes";
import type { AdminUserResponse } from "../features/auth/api/authTypes";
import { formatApiError } from "../lib/api/httpClient";
import "../styles/admin-enrollment-dialog.css";

export function AdminEnrollmentDialog({ students, programs, payments, enrollment, programOnly = false, onClose, onSaved }: {
  students: AdminUserResponse[];
  programs: ProgramSummaryResponse[];
  payments: PaymentTransactionResponse[];
  enrollment?: EnrollmentResponse;
  programOnly?: boolean;
  onClose: () => void;
  onSaved: (result: EnrollmentResponse) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const latestPayment = payments
    .filter(payment => payment.enrollmentId === enrollment?.id && payment.status === "Verified")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const [mode, setMode] = useState("existing");
  const [studentId, setStudentId] = useState(enrollment?.studentId ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState(students);
  const [findingStudents, setFindingStudents] = useState(false);
  const [programId, setProgramId] = useState(enrollment?.programId ?? "");
  const [planId, setPlanId] = useState(enrollment?.programPlanId ?? "");
  const [program, setProgram] = useState<ProgramDetailsResponse | null>(null);
  const [settings, setSettings] = useState<{ environment: string; paymentEnvironment: string; paymentsConfigured: boolean } | null>(null);
  const [paid, setPaid] = useState(false);
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
    if (programOnly) return () => { active = false; };
    adminLmsApi.getEnrollmentSettings().then(result => { if (active) setSettings(result.data); })
      .catch(error => { if (active) setError(formatApiError(error)); });
    return () => { active = false; };
  }, [programOnly]);

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
    if (!program) return;
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    const orderId = field("orderId") || undefined;
    const paymentId = field("paymentId") || undefined;
    const linkId = field("linkId") || undefined;
    const notes = field("notes") || undefined;
    const paymentFieldsEntered = Boolean(orderId || paymentId || linkId || notes);
    const paymentMetadataChanged = Boolean(
      !programOnly &&
      latestPayment &&
      (orderId !== (latestPayment.gatewayOrderId ?? "") ||
        paymentId !== (latestPayment.gatewayPaymentId ?? "") ||
        linkId !== (latestPayment.gatewayLinkId ?? "") ||
        notes !== (latestPayment.notes ?? "")),
    );
    if (!programOnly && !paid && paymentFieldsEntered && !latestPayment) {
      setError("No verified payment is linked to this enrollment. Record a new payment instead.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (programOnly && enrollment) {
        const result = await adminLmsApi.changeEnrollmentProgram(enrollment.id, {
          programId,
          programPlanId: planId,
          startDate: field("startDate") || undefined,
        });
        await onSaved(result.data);
        onClose();
        return;
      }
      if (!settings) return;
      const result = await adminLmsApi.createEnrollment({
        enrollmentId: enrollment?.id,
        paymentTransactionId: !paid && paymentMetadataChanged ? latestPayment?.id : undefined,
        studentId: mode === "existing" ? studentId : undefined,
        newStudent: mode === "new" ? {
          fullName: field("fullName"), email: field("email"), phoneNumber: field("phone"),
          temporaryPassword: String(form.get("password") ?? ""), role: "Student",
        } : undefined,
        programId, programPlanId: planId, startDate: field("startDate") || undefined,
        paymentEnvironment: settings.paymentEnvironment,
        paymentKind: paid ? paymentKind : undefined,
        amountPaid: paid ? amountPaid : undefined,
        cashfreeOrderId: paid || paymentMetadataChanged ? orderId : undefined,
        cashfreePaymentId: paid || paymentMetadataChanged ? paymentId : undefined,
        cashfreeLinkId: paid || paymentMetadataChanged ? linkId : undefined,
        notes: paid || paymentMetadataChanged ? notes : undefined,
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
    <header><h2 id="offline-enrollment-title">{programOnly ? "Change course / program" : enrollment ? "Edit enrollment" : "Add enrollment"}</h2>
      <button type="button" className="icon-action" aria-label="Close enrollment" title="Close" disabled={saving} onClick={onClose}><X size={20} /></button></header>
    <form onSubmit={submit}>
      {!programOnly && <div className="offline-enrollment-environment"><span>{settings?.environment ?? "Loading..."}</span>
        <strong>Cashfree {settings?.paymentEnvironment ?? "..."}</strong></div>
      }
      {error && <p role="alert" className="offline-enrollment-error">{error}</p>}
      {!programOnly && <fieldset disabled={saving}>
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
      </fieldset>}
      <fieldset disabled={saving}><legend>Program</legend><div className="offline-enrollment-fields">
        <label>Program<select aria-label="Program" required value={programId} onChange={event => { setProgramId(event.target.value); setPlanId(""); }}>
          <option value="">Select program</option>
          {programs.filter(program => program.status === "Published" || program.id === enrollment?.programId).map(program =>
            <option key={program.id} value={program.id}>{program.title}</option>)}
        </select></label>
        <label>Plan<select aria-label="Plan" required disabled={loading} value={planId} onChange={event => setPlanId(event.target.value)}>
          <option value="">{loading ? "Loading plans..." : "Select plan"}</option>
          {program?.plans.filter(plan => plan.isActive || plan.id === enrollment?.programPlanId).map(plan =>
            <option key={plan.id} value={plan.id}>{plan.name} - INR {plan.offerPrice.toLocaleString("en-IN")}</option>)}
        </select></label>
        <label>Start date<input name="startDate" type="date" required defaultValue={enrollment?.startDate ?? new Date().toISOString().slice(0, 10)} /></label>
        <div className="offline-enrollment-amount"><span>{enrollment ? "Outstanding" : "Course fee"}</span>
          <strong>INR {(enrollment?.balanceAmount ?? plan?.offerPrice ?? 0).toLocaleString("en-IN")}</strong></div>
      </div></fieldset>
      {!programOnly && <fieldset disabled={saving}><legend>Payment details (optional)</legend>
        <label className="offline-enrollment-checkbox"><input type="checkbox" checked={paid} onChange={event => setPaid(event.target.checked)} /> Record payment now</label>
        {!settings?.paymentsConfigured && settings && <p role="status">Cashfree credentials are not configured. Leave the order ID blank to save enrollment details without gateway verification.</p>}
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
        </div>}
        <div className="offline-enrollment-fields">
          <label>Cashfree order ID<input name="orderId" maxLength={160} defaultValue={latestPayment?.gatewayOrderId ?? ""} /></label>
          <label>Cashfree payment ID<input name="paymentId" maxLength={160} defaultValue={latestPayment?.gatewayPaymentId ?? ""} /></label>
          <label>Cashfree link ID<input name="linkId" maxLength={160} defaultValue={latestPayment?.gatewayLinkId ?? ""} /></label>
        </div>
        <label>Notes<textarea name="notes" maxLength={500} rows={2} defaultValue={latestPayment?.notes ?? ""} /></label>
      </fieldset>}
      <footer><button type="button" className="secondary-action" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="primary-action" disabled={saving || loading || (!programOnly && !settings) || !program || !planId || (paid && paymentKind === "token" && !tokenAvailable)}>
          <CheckCircle2 size={18} />{saving ? "Saving..." : programOnly ? "Save course change" : paid ? "Record payment and save" : enrollment ? "Save changes" : "Save enrollment"}</button></footer>
    </form>
  </dialog>;
}

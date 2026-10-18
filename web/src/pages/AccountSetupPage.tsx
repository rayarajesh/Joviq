import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import { formatApiError } from "../lib/api/httpClient";

/** Both post-registration sign-in choices finish here before opening the dashboard. */
export function AccountSetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const paymentId = search.get("payment");
  const google = search.get("method") === "google";
  const [step, setStep] = useState<"loading" | "email" | "code" | "username" | "blocked">("loading");
  const [username, setUsername] = useState(auth.user?.fullName ?? "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const working = useRef(false);

  useEffect(() => {
    let active = true;
    setStep("loading");
    setError("");
    studentLmsApi.getPayments().then(({ data }) => {
      if (!active) return;
      if (!paymentId || !data.some((payment) => payment.id === paymentId && payment.status === "Verified")) {
        setStep("blocked");
        setError("Use the same account you used during payment. This account does not have the verified payment for this onboarding.");
        return;
      }
      setStep(google ? "username" : "email");
    }).catch((reason: unknown) => { if (active) { setStep("blocked"); setError(formatApiError(reason)); } });
    return () => { active = false; };
  }, [paymentId, google, auth.user?.id, attempt]);

  async function run(task: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    try { await task(); } catch (reason) { setError(formatApiError(reason)); }
    finally { working.current = false; setBusy(false); }
  }

  function sendCode() {
    void run(async () => {
      await authApi.forgotPassword(auth.user!.email);
      setStep("code");
      setNotice("Enter the code sent to your payment email and create your password.");
    });
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      const newPassword = String(fields.get("newPassword") ?? "");
      const confirmPassword = String(fields.get("confirmPassword") ?? "");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      const email = auth.user!.email;
      const result = await authApi.verifyForgotPassword(email, String(fields.get("otp") ?? ""));
      await authApi.resetPassword({ ...result.data, newPassword, confirmPassword });
      // Password reset can revoke old refresh sessions. Establish the new session explicitly.
      const login = await authApi.login({ email, password: newPassword, rememberMe: true });
      auth.applyAuthResponse(login.data);
      setNotice("Password saved. Choose your username to continue.");
      setStep("username");
    });
  }

  function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const name = username.trim();
      if (name.length < 2 || name.length > 160) throw new Error("Enter a name between 2 and 160 characters.");
      // Username here is the learner's display name, not a new email/login identifier.
      // Preserve profile fields rather than clearing them through a partial PUT.
      const { data: profile } = await authApi.getProfile();
      await authApi.updateProfile({ fullName: name, phoneNumber: profile.phoneNumber, dateOfBirth: profile.dateOfBirth,
        address: profile.address, city: profile.city, state: profile.state });
      await auth.loadMe();
      navigate("/dashboard", { replace: true });
    });
  }

  return (
    <main className="account-setup-page">
      <section className="account-setup-card">
        <span className="eyebrow">Finish your account setup</span>
        <h1>{step === "username" ? "Choose your username" : "Set up your login"}</h1>
        <p>Signed in as {auth.user?.email}</p>
        {step === "loading" ? <p role="status">Checking your verified payment…</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
        {step === "email" ? <>
          <p>Create a password for your payment email. If you already have a password, you can keep using it.</p>
          <button className="primary-action" disabled={busy} onClick={sendCode}>Create password using email OTP</button>
          <button className="secondary-action" disabled={busy} onClick={() => setStep("username")}>I already have a password — continue</button>
        </> : null}
        {step === "code" ? <form onSubmit={savePassword}>
          <label>Email<input type="email" value={auth.user?.email ?? ""} readOnly /></label>
          <label>Email OTP<input name="otp" autoComplete="one-time-code" inputMode="numeric" required /></label>
          <label>Create password<input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <small>Use at least 8 characters with uppercase, lowercase, a number and a symbol.</small>
          <button className="primary-action" disabled={busy}>{busy ? "Saving…" : "Save password and continue"}</button>
          <button className="secondary-action" type="button" disabled={busy} onClick={sendCode}>Resend code</button>
        </form> : null}
        {step === "username" ? <form onSubmit={saveUsername}>
          <label>Username<input autoComplete="nickname" value={username} onChange={(event) => setUsername(event.target.value)} minLength={2} maxLength={160} required /></label>
          <p>This is the name shown on your profile and dashboard. You can use your own name. Your email remains your login.</p>
          <button className="primary-action" disabled={busy}>{busy ? "Saving…" : "Continue to dashboard"}</button>
        </form> : null}
        {error ? <p role="alert">{error}</p> : null}
        {step === "blocked" ? <>
          <button className="secondary-action" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
          <button className="secondary-action" disabled={busy} onClick={() => void run(async () => {
            await auth.logout();
            navigate(`/login?returnUrl=${encodeURIComponent(`/student/account-setup?${search}`)}`, { replace: true });
          })}>Sign in with the payment account</button>
        </> : null}
      </section>
    </main>
  );
}

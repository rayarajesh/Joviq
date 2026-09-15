import { useState, type FormEvent } from "react";
import { authApi } from "../features/auth/api/authApi";
import type { PasswordResetVerificationResponse } from "../features/auth/api/authTypes";
import { formatApiError } from "../lib/api/httpClient";

export function PasswordRecovery({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"send" | "verify" | "reset" | "done">("send");
  const [verification, setVerification] = useState<PasswordResetVerificationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      if (step === "send") {
        await authApi.forgotPassword(email.trim().toLowerCase());
        setStep("verify");
        setMessage("If your account exists, a password reset OTP has been sent. Check your inbox and spam folder.");
      } else if (step === "verify") {
        const response = await authApi.verifyForgotPassword(email.trim().toLowerCase(), String(form.get("otp")));
        setVerification(response.data); setStep("reset");
      } else if (step === "reset" && verification) {
        await authApi.resetPassword({ ...verification, newPassword: String(form.get("password")), confirmPassword: String(form.get("confirmPassword")) });
        setStep("done"); setMessage("Password updated. You can now sign in with your new password.");
      }
    } catch (error) { setMessage(formatApiError(error)); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}>
    <h2>Reset your password</h2>
    {step === "send" && <label>Account email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>}
    {step === "verify" && <label>Email OTP<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4,8}" required /></label>}
    {step === "reset" && <><label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><small>Use uppercase, lowercase, a number, and a symbol.</small><label>Confirm password<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></label></>}
    {message && <p role="status">{message}</p>}
    {step !== "done" && <button type="submit" disabled={busy}>{busy ? "Please wait..." : step === "send" ? "Send reset OTP" : step === "verify" ? "Verify reset OTP" : "Save new password"}</button>}
    {step === "verify" && <button type="button" className="auth-secondary-button" disabled={busy} onClick={() => setStep("send")}>Change email / request another OTP</button>}
    <button type="button" className="auth-secondary-button" onClick={onBack}>Back to login</button>
  </form>;
}

# Local authentication

Frontend: `http://localhost:5173`. API: `http://localhost:5001` (HTTPS: `https://localhost:7001`).

- Student login: `http://localhost:5173/login?role=student`
- Admin login: `http://localhost:5173/login?role=admin`
- Both roles use `http://localhost:5173/dashboard`; the authenticated account's server-assigned role selects the dashboard. Choosing a login tab does not grant a role. Existing student enrollment checks remain in effect.

## Google and email delivery

Set these server configuration keys using .NET user secrets for `src/Joviq.Lms.Api` or environment variables. Do not commit credentials or put them in frontend environment variables.

- `ExternalAuth:Google:ClientId`
- `ExternalAuth:Google:ClientSecret`
- `EmailSettings:SmtpServer`
- `EmailSettings:Port`
- `EmailSettings:SenderEmail`
- `EmailSettings:Username`
- `EmailSettings:Password`

The backend's Google callback path is `/signin-google`; its public origin and the registered provider redirect URI must agree. The frontend completion route is `/auth/google/callback`. Restart the API after changing configuration. `GET /api/v1/auth/providers` reports whether Google is configured, without revealing credentials.

Registration creates a pending account and opens email verification. `verificationEmailSent: false` means the account exists but email delivery failed. Repair the email configuration, then use **Send / resend OTP**. Unverified accounts cannot log in; verification and password reset continue to require valid, unexpired OTPs.

## Older local database compatibility

If registration fails because the legacy `user_consents.RefundPolicyVersion` column has no default, apply `repair-auth-consent-compatibility.sql` to that database. It supplies an empty default for the legacy field only when it exists, preserving records and constraints. An empty value does not represent refund-policy acceptance.

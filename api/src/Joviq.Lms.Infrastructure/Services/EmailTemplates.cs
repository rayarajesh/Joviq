using System.Net;

namespace Joviq.Lms.Infrastructure.Services;

/// <summary>
/// Shared, table-based email templates with inline styles for reliable rendering in Gmail,
/// Outlook, Apple Mail, and mobile clients.
/// </summary>
public static class EmailTemplates
{
    public static string EmailVerification(string recipientName, string otp)
        => Layout(
            preheader: "Your Joviq email verification code is ready.",
            eyebrow: "WELCOME TO JOVIQ",
            title: "Verify your email address",
            intro: $"{Greeting(recipientName)},<br />You are one step away from your Joviq LMS account. Use the secure code below to confirm your email address.",
            content: OtpPanel(otp, "Verification code", "This code expires soon. Never share it with anyone."));

    public static string PasswordResetOtp(string recipientName, string otp)
        => Layout(
            preheader: "Your Joviq password reset code is ready.",
            eyebrow: "ACCOUNT SECURITY",
            title: "Reset your password",
            intro: $"{Greeting(recipientName)},<br />We received a request to set a new password for your Joviq LMS account. Use this one-time code to continue.",
            content: OtpPanel(otp, "Password reset code", "If you did not request this, you can safely ignore this email."));

    public static string AccountDeletionOtp(string recipientName, string otp)
        => Layout(
            preheader: "Confirmation is required to delete your Joviq account.",
            eyebrow: "ACCOUNT SECURITY",
            title: "Confirm account deletion",
            intro: $"{Greeting(recipientName)},<br />A request was made to delete your Joviq LMS account. Enter the code below only if you want to continue.",
            content: OtpPanel(otp, "Deletion confirmation code", "This action is permanent. Never share this code with anyone.", isWarning: true));

    public static string AdminPasswordReset(string recipientName, string token)
        => Layout(
            preheader: "An administrator has prepared a password reset for your Joviq account.",
            eyebrow: "ACCOUNT SECURITY",
            title: "Your password reset is ready",
            intro: $"{Greeting(recipientName)},<br />An administrator has generated a password reset token for your Joviq LMS account. Use it on the password reset screen.",
            content: $"""
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background:#f5f7ff;border:1px solid #dfe5ff;border-radius:16px;">
                  <tr><td align="center" style="padding:22px 18px;">
                    <div style="font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:#65708b;font-weight:700;">Reset token</div>
                    <div style="margin-top:12px;padding:15px 16px;background:#ffffff;border:1px solid #d9e0f5;border-radius:12px;color:#182448;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:21px;word-break:break-all;text-align:left;">{Encode(token)}</div>
                    <p style="margin:14px 0 0;color:#65708b;font-size:12px;line-height:19px;">This token is sensitive. Do not forward this email.</p>
                  </td></tr>
                </table>
                """);

    public static string EnrollmentConfirmation(
        string recipientName,
        string programTitle,
        string planName,
        string amount,
        string invoiceNumber,
        string startDate)
        => Layout(
            preheader: $"Your enrollment for {programTitle} is confirmed.",
            eyebrow: "ENROLLMENT CONFIRMED",
            title: "Your learning journey starts here",
            intro: $"{Greeting(recipientName)},<br />Your enrollment has been confirmed. We are excited to have you learning with Joviq Technologies.",
            content: $"""
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;border:1px solid #e2e7f0;border-radius:16px;overflow:hidden;">
                  <tr><td style="padding:17px 20px;background:#182448;color:#ffffff;font-size:15px;font-weight:700;">{Encode(programTitle)}</td></tr>
                  <tr><td style="padding:18px 20px;background:#fbfcff;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      {DetailRow("Plan", planName)}
                      {DetailRow("Amount received", $"INR {amount}")}
                      {DetailRow("Invoice", invoiceNumber)}
                      {DetailRow("Start date", startDate)}
                    </table>
                  </td></tr>
                </table>
                <p style="margin:0;color:#53617d;font-size:14px;line-height:23px;">Sign in to your Joviq LMS dashboard to view your course, lessons, projects, and learning updates.</p>
                """);

    public static string CertificateIssued(
        string recipientName,
        string programTitle,
        string certificateType,
        string certificateId,
        string? verificationUrl)
    {
        var verificationLink = string.IsNullOrWhiteSpace(verificationUrl)
            ? string.Empty
            : $"""
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto 4px;">
                  <tr><td align="center" style="border-radius:10px;background:#4e5bd9;">
                    <a href="{Encode(verificationUrl)}" style="display:inline-block;padding:13px 22px;border-radius:10px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">View and verify certificate</a>
                  </td></tr>
                </table>
                """;

        return Layout(
            preheader: $"Your {certificateType} certificate for {programTitle} is ready.",
            eyebrow: "ACHIEVEMENT UNLOCKED",
            title: "Your certificate is ready",
            intro: $"{Greeting(recipientName)},<br />Congratulations on completing an important milestone with Joviq Technologies.",
            content: $"""
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;border:1px solid #ead9a6;border-radius:16px;background:#fffdf6;">
                  <tr><td align="center" style="padding:25px 20px 21px;">
                    <div style="width:54px;height:54px;margin:0 auto 13px;border-radius:50%;background:#f3d98b;color:#5f4511;font-size:28px;line-height:54px;font-family:Georgia,serif;">★</div>
                    <div style="font-size:18px;line-height:27px;color:#182448;font-weight:800;">{Encode(programTitle)}</div>
                    <div style="margin-top:6px;color:#856c2b;font-size:13px;line-height:20px;font-weight:700;">{Encode(certificateType)} Certificate</div>
                    <div style="margin-top:18px;padding:10px 14px;border-top:1px solid #f0e5c3;border-bottom:1px solid #f0e5c3;color:#69738b;font-family:Consolas,Monaco,monospace;font-size:12px;">{Encode(certificateId)}</div>
                  </td></tr>
                </table>
                {verificationLink}
                <p style="margin:18px 0 0;color:#53617d;font-size:14px;line-height:23px;">You can also view your certificate anytime from your Joviq LMS dashboard.</p>
                """);
    }

    private static string Layout(string preheader, string eyebrow, string title, string intro, string content)
        => $"""
            <!doctype html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta name="color-scheme" content="light" />
              <title>{Encode(title)}</title>
            </head>
            <body style="margin:0;padding:0;background:#eef3f8;color:#182448;font-family:Arial,Helvetica,sans-serif;">
              <div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;">{Encode(preheader)}</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef3f8;">
                <tr><td align="center" style="padding:30px 12px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;width:100%;">
                    <tr><td style="height:5px;background:#4e5bd9;font-size:0;line-height:0;">&nbsp;</td></tr>
                    <tr><td style="padding:22px 28px;background:#182448;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td valign="middle">
                            <div style="color:#ffffff;font-size:20px;line-height:24px;font-weight:800;letter-spacing:1px;">JOVIQ</div>
                            <div style="margin-top:2px;color:#aeb8d5;font-size:9px;line-height:14px;letter-spacing:2.3px;font-weight:700;">TECHNOLOGIES</div>
                          </td>
                          <td align="right" valign="middle" style="color:#b9c4e3;font-size:10px;line-height:15px;letter-spacing:1.2px;font-weight:700;">LEARN<br />BUILD<br />GROW</td>
                        </tr>
                      </table>
                    </td></tr>
                    <tr><td style="padding:34px 32px 30px;background:#ffffff;">
                      <div style="font-size:11px;line-height:16px;letter-spacing:1.7px;text-transform:uppercase;color:#4e5bd9;font-weight:800;">{Encode(eyebrow)}</div>
                      <h1 style="margin:10px 0 12px;color:#182448;font-size:30px;line-height:38px;letter-spacing:-.4px;font-weight:800;">{Encode(title)}</h1>
                      <p style="margin:0;color:#53617d;font-size:15px;line-height:25px;">{intro}</p>
                      {content}
                    </td></tr>
                    <tr><td style="padding:20px 30px;background:#f7f9fc;border-top:1px solid #e7ebf2;text-align:center;">
                      <p style="margin:0;color:#7b879e;font-size:12px;line-height:19px;">This is an automated message from Joviq Technologies.</p>
                      <p style="margin:5px 0 0;color:#a0a9ba;font-size:11px;line-height:17px;">Please do not reply to this email.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

    private static string OtpPanel(string otp, string label, string note, bool isWarning = false)
    {
        var background = isWarning ? "#fff5f3" : "#f5f7ff";
        var border = isWarning ? "#ffd6cf" : "#dfe5ff";
        var accent = isWarning ? "#c34b3f" : "#4e5bd9";
        return $"""
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background:{background};border:1px solid {border};border-radius:16px;">
              <tr><td align="center" style="padding:22px 18px 20px;">
                <div style="font-size:11px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:{accent};font-weight:800;">{Encode(label)}</div>
                <div style="margin-top:12px;color:#182448;font-size:34px;line-height:42px;letter-spacing:8px;font-weight:800;">{Encode(otp)}</div>
                <p style="margin:11px 0 0;color:#65708b;font-size:12px;line-height:19px;">{Encode(note)}</p>
              </td></tr>
            </table>
            """;
    }

    private static string DetailRow(string label, string value)
        => $"""
            <tr>
              <td style="padding:8px 0;color:#7a869d;font-size:13px;line-height:19px;">{Encode(label)}</td>
              <td align="right" style="padding:8px 0;color:#182448;font-size:13px;line-height:19px;font-weight:700;">{Encode(value)}</td>
            </tr>
            """;

    private static string Greeting(string recipientName)
        => string.IsNullOrWhiteSpace(recipientName) ? "Hi there" : $"Hi {Encode(recipientName)}";

    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}

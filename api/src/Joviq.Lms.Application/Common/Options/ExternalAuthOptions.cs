namespace Joviq.Lms.Application.Common.Options;

public sealed class ExternalAuthOptions
{
    public const string SectionName = "ExternalAuth";

    public OAuthProviderOptions Google { get; init; } = new();

    public string FrontendCallbackUrl { get; init; } = "http://localhost:5173/auth/google/callback";

    public string DefaultPolicyVersion { get; init; } = "2026-08-20";
}

public sealed class OAuthProviderOptions
{
    public string ClientId { get; init; } = string.Empty;

    public string ClientSecret { get; init; } = string.Empty;

    public string CallbackPath { get; init; } = "/signin-google";
}

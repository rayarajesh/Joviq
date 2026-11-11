using DnsClient;
using Joviq.Lms.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

/// <summary>
/// Confirms an email domain can receive mail by looking up its MX records (falling back to an
/// A/AAAA record, which acts as an implicit mail exchanger). A DNS failure must never block a
/// legitimate signup, so transient lookup errors fail open — only a domain that resolves with no
/// mail-capable record is rejected.
/// </summary>
public sealed class DnsEmailDomainVerifier(ILookupClient lookup, ILogger<DnsEmailDomainVerifier> logger)
    : IEmailDomainVerifier
{
    public async Task<bool> HasDeliverableDomainAsync(string email, CancellationToken cancellationToken)
    {
        var at = email.LastIndexOf('@');
        if (at < 0 || at == email.Length - 1)
        {
            return false;
        }

        var domain = email[(at + 1)..].Trim().TrimEnd('.');
        if (domain.Length == 0 || !domain.Contains('.'))
        {
            return false;
        }

        try
        {
            var mx = await lookup.QueryAsync(domain, QueryType.MX, cancellationToken: cancellationToken);
            if (mx.Answers.MxRecords().Any(record => !string.IsNullOrWhiteSpace(record.Exchange?.Value)))
            {
                return true;
            }

            // RFC 5321: a domain with no MX but an address record still accepts mail at that host.
            var a = await lookup.QueryAsync(domain, QueryType.A, cancellationToken: cancellationToken);
            if (a.Answers.ARecords().Any())
            {
                return true;
            }

            var aaaa = await lookup.QueryAsync(domain, QueryType.AAAA, cancellationToken: cancellationToken);
            return aaaa.Answers.AaaaRecords().Any();
        }
        catch (Exception exception)
        {
            // A resolver timeout or network hiccup must not stop a real learner from enrolling.
            logger.LogWarning(exception, "Email domain verification could not reach DNS for {Domain}; allowing signup.", domain);
            return true;
        }
    }
}

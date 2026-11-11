namespace Joviq.Lms.Application.Common.Interfaces;

/// <summary>
/// Verifies that an email address uses a real, reachable domain — one that can actually receive
/// mail (has an MX record, or an A/AAAA record as an implicit mail exchanger). Used during new
/// registration so confirmation and receipt emails are not sent to a non-existent domain.
/// </summary>
public interface IEmailDomainVerifier
{
    Task<bool> HasDeliverableDomainAsync(string email, CancellationToken cancellationToken);
}

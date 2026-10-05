namespace Joviq.Lms.Application.Support;

/// <summary>
/// One WhatsApp-style chat per student, shared by the whole admin team.
/// </summary>
public interface ISupportChatService
{
    Task<IReadOnlyList<SupportMessageResponse>> GetStudentMessagesAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SupportMessageResponse> SendStudentMessageAsync(Guid studentId, SendSupportMessageRequest request, CancellationToken cancellationToken);

    Task<SupportUnreadResponse> GetStudentUnreadAsync(Guid studentId, CancellationToken cancellationToken);

    Task<IReadOnlyList<SupportConversationSummaryResponse>> GetConversationsAsync(string? search, CancellationToken cancellationToken);

    Task<SupportConversationResponse> GetConversationAsync(Guid studentId, CancellationToken cancellationToken);

    Task<SupportMessageResponse> SendAdminMessageAsync(Guid adminId, Guid studentId, SendSupportMessageRequest request, CancellationToken cancellationToken);

    Task<SupportUnreadResponse> GetAdminUnreadAsync(CancellationToken cancellationToken);
}

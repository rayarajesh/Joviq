using System.ComponentModel.DataAnnotations;

namespace Joviq.Lms.Application.Support;

public sealed record SupportMessageResponse(
    Guid Id,
    Guid StudentId,
    bool FromStudent,
    string SenderName,
    string Body,
    Guid? AttachmentAssetId,
    string? AttachmentName,
    string? AttachmentContentType,
    DateTimeOffset SentAt,
    DateTimeOffset? ReadAt);

public sealed record SupportConversationSummaryResponse(
    Guid StudentId,
    string StudentName,
    string StudentEmail,
    string LastMessage,
    bool LastMessageFromStudent,
    DateTimeOffset LastMessageAt,
    int UnreadCount);

public sealed record SupportConversationResponse(
    Guid StudentId,
    string StudentName,
    string StudentEmail,
    string? StudentPhone,
    IReadOnlyList<string> Programs,
    IReadOnlyList<SupportMessageResponse> Messages);

public sealed record SupportUnreadResponse(int UnreadCount);

public sealed class SendSupportMessageRequest
{
    [MaxLength(2000)]
    public string? Body { get; init; }

    public Guid? AttachmentAssetId { get; init; }
}

using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/v1/admin/support")]
public sealed class AdminSupportController(
    ISupportChatService supportChatService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet("conversations")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SupportConversationSummaryResponse>>>> GetConversations(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var result = await supportChatService.GetConversationsAsync(search, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<SupportConversationSummaryResponse>>.Ok(result, "Support chats loaded.", CorrelationId));
    }

    [HttpGet("conversations/{studentId:guid}")]
    public async Task<ActionResult<ApiResponse<SupportConversationResponse>>> GetConversation(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var result = await supportChatService.GetConversationAsync(studentId, cancellationToken);
        return Ok(ApiResponse<SupportConversationResponse>.Ok(result, "Support chat loaded.", CorrelationId));
    }

    [HttpPost("conversations/{studentId:guid}/messages")]
    public async Task<ActionResult<ApiResponse<SupportMessageResponse>>> SendMessage(
        Guid studentId,
        SendSupportMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await supportChatService.SendAdminMessageAsync(RequiredUserId, studentId, request, cancellationToken);
        return Ok(ApiResponse<SupportMessageResponse>.Ok(result, "Reply sent.", CorrelationId));
    }

    [HttpGet("unread")]
    public async Task<ActionResult<ApiResponse<SupportUnreadResponse>>> GetUnread(CancellationToken cancellationToken)
    {
        var result = await supportChatService.GetAdminUnreadAsync(cancellationToken);
        return Ok(ApiResponse<SupportUnreadResponse>.Ok(result, "Unread support messages loaded.", CorrelationId));
    }
}

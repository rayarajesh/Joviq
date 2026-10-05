using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Joviq.Lms.Application.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize(Policy = "StudentOnly")]
[Route("api/v1/student/support")]
public sealed class StudentSupportController(
    ISupportChatService supportChatService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpGet("messages")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SupportMessageResponse>>>> GetMessages(CancellationToken cancellationToken)
    {
        var result = await supportChatService.GetStudentMessagesAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<SupportMessageResponse>>.Ok(result, "Support chat loaded.", CorrelationId));
    }

    [HttpPost("messages")]
    public async Task<ActionResult<ApiResponse<SupportMessageResponse>>> SendMessage(
        SendSupportMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await supportChatService.SendStudentMessageAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<SupportMessageResponse>.Ok(result, "Message sent.", CorrelationId));
    }

    [HttpGet("unread")]
    public async Task<ActionResult<ApiResponse<SupportUnreadResponse>>> GetUnread(CancellationToken cancellationToken)
    {
        var result = await supportChatService.GetStudentUnreadAsync(RequiredUserId, cancellationToken);
        return Ok(ApiResponse<SupportUnreadResponse>.Ok(result, "Unread support messages loaded.", CorrelationId));
    }
}

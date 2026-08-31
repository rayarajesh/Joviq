using Joviq.Lms.Application.Assets;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[Authorize]
[Route("api/v1/assets")]
public sealed class AssetsController(
    IAssetService assetService,
    ICurrentUserService currentUser)
    : ApiControllerBase(currentUser)
{
    [HttpPost("upload-url")]
    public async Task<ActionResult<ApiResponse<AssetUploadUrlResponse>>> CreateUploadUrl(
        CreateAssetUploadRequest request,
        CancellationToken cancellationToken)
    {
        var result = await assetService.CreateUploadAsync(RequiredUserId, request, cancellationToken);
        return Ok(ApiResponse<AssetUploadUrlResponse>.Ok(result, "Asset upload URL created.", CorrelationId));
    }

    [HttpPost("{assetId:guid}/complete")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> CompleteUpload(
        Guid assetId,
        CompleteAssetUploadRequest request,
        CancellationToken cancellationToken)
    {
        var result = await assetService.CompleteUploadAsync(RequiredUserId, assetId, request, cancellationToken);
        return Ok(ApiResponse<AssetResponse>.Ok(result, "Asset upload completed.", CorrelationId));
    }

    [HttpGet("{assetId:guid}")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> GetAsset(
        Guid assetId,
        CancellationToken cancellationToken)
    {
        var result = await assetService.GetAssetAsync(RequiredUserId, assetId, cancellationToken);
        return Ok(ApiResponse<AssetResponse>.Ok(result, "Asset loaded.", CorrelationId));
    }

    [HttpGet("{assetId:guid}/access")]
    public async Task<ActionResult<ApiResponse<AssetAccessResponse>>> GetReadUrl(
        Guid assetId,
        CancellationToken cancellationToken)
    {
        var result = await assetService.GetReadUrlAsync(RequiredUserId, assetId, cancellationToken);
        return Ok(ApiResponse<AssetAccessResponse>.Ok(result, "Asset access URL created.", CorrelationId));
    }

    [AllowAnonymous]
    [HttpPut("local-upload/{assetId:guid}")]
    public async Task<ActionResult<ApiResponse>> UploadLocalAsset(
        Guid assetId,
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        await assetService.UploadLocalAssetAsync(
            assetId,
            token,
            Request.Body,
            Request.ContentLength,
            Request.ContentType,
            cancellationToken);

        return Ok(ApiResponse.Ok("Local asset uploaded.", CorrelationId));
    }

    [AllowAnonymous]
    [HttpGet("local-files/{assetId:guid}")]
    public async Task<IActionResult> OpenLocalAsset(
        Guid assetId,
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        var download = await assetService.OpenLocalAssetAsync(assetId, token, cancellationToken);
        return new FileStreamResult(download.Content, download.ContentType)
        {
            LastModified = download.LastModified,
            EnableRangeProcessing = true
        };
    }
}

using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;
using Joviq.Lms.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Joviq.Lms.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CallbackRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CallbackRequestsController> _logger;

    public CallbackRequestsController(
        ApplicationDbContext context,
        ILogger<CallbackRequestsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Submit a callback request (Public endpoint - no auth required)
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitCallbackRequest([FromBody] CreateCallbackRequestDto dto)
    {
        try
        {
            var request = new CallbackRequest
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.Phone,
                InterestedProgram = dto.ProgramInterest,
                Status = LeadStatus.New,
                Notes = dto.CollegeUniversity
            };

            _context.CallbackRequests.Add(request);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Callback request submitted: {Email}", dto.Email);

            return Ok(new
            {
                success = true,
                message = "Your callback request has been submitted successfully. Our team will contact you soon.",
                requestId = request.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting callback request");
            return StatusCode(500, new { success = false, message = "An error occurred while submitting your request." });
        }
    }

    /// <summary>
    /// Get all callback requests (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCallbackRequests(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortDirection = "desc")
    {
        try
        {
            var query = _context.CallbackRequests.AsQueryable();

            // Filter by status
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                if (Enum.TryParse<LeadStatus>(status, out var leadStatus))
                {
                    query = query.Where(r => r.Status == leadStatus);
                }
            }

            // Search
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(r =>
                    r.FullName.Contains(search) ||
                    r.Email.Contains(search) ||
                    r.PhoneNumber.Contains(search) ||
                    (r.InterestedProgram != null && r.InterestedProgram.Contains(search))
                );
            }

            // Count for pagination
            var totalCount = await query.CountAsync();

            // Sorting
            query = sortBy?.ToLower() switch
            {
                "fullname" => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(r => r.FullName)
                    : query.OrderByDescending(r => r.FullName),
                "email" => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(r => r.Email)
                    : query.OrderByDescending(r => r.Email),
                "status" => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(r => r.Status)
                    : query.OrderByDescending(r => r.Status),
                "createdat" or _ => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(r => r.CreatedAt)
                    : query.OrderByDescending(r => r.CreatedAt)
            };

            // Pagination
            var rawRequests = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.Email,
                    r.PhoneNumber,
                    r.Notes,
                    r.InterestedProgram,
                    r.Status,
                    r.CreatedAt,
                    r.UpdatedAt,
                })
                .ToListAsync();

            var requests = rawRequests.Select(r => new CallbackRequestDto
            {
                Id = r.Id,
                FullName = r.FullName,
                Email = r.Email,
                Phone = r.PhoneNumber,
                CollegeUniversity = r.Notes,
                ProgramInterest = r.InterestedProgram,
                Status = r.Status.ToString(),
                AdminNotes = r.Notes,
                CreatedAt = r.CreatedAt.ToString("o"),
                UpdatedAt = r.UpdatedAt?.ToString("o"),
            }).ToList();

            // Get statistics
            var stats = await GetStatistics();

            return Ok(new
            {
                success = true,
                data = requests,
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                },
                statistics = stats
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching callback requests");
            return StatusCode(500, new { success = false, message = "An error occurred while fetching callback requests." });
        }
    }

    /// <summary>
    /// Get a single callback request by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCallbackRequest(Guid id)
    {
        try
        {
            var raw = await _context.CallbackRequests
                .Where(r => r.Id == id)
                .Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.Email,
                    r.PhoneNumber,
                    r.Notes,
                    r.InterestedProgram,
                    r.Status,
                    r.CreatedAt,
                    r.UpdatedAt,
                })
                .FirstOrDefaultAsync();

            if (raw == null)
                return NotFound(new { success = false, message = "Callback request not found." });

            var request = new CallbackRequestDto
            {
                Id = raw.Id,
                FullName = raw.FullName,
                Email = raw.Email,
                Phone = raw.PhoneNumber,
                CollegeUniversity = raw.Notes,
                ProgramInterest = raw.InterestedProgram,
                Status = raw.Status.ToString(),
                AdminNotes = raw.Notes,
                CreatedAt = raw.CreatedAt.ToString("o"),
                UpdatedAt = raw.UpdatedAt?.ToString("o"),
            };

            return Ok(new { success = true, data = request });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching callback request {Id}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while fetching the callback request." });
        }
    }

    /// <summary>
    /// Update callback request status and notes (Admin only)
    /// </summary>
    [HttpPatch("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCallbackRequest(Guid id, [FromBody] UpdateCallbackRequestDto dto)
    {
        try
        {
            var request = await _context.CallbackRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { success = false, message = "Callback request not found." });
            }

            // Update status
            if (!string.IsNullOrEmpty(dto.Status))
            {
                if (Enum.TryParse<LeadStatus>(dto.Status, out var leadStatus))
                {
                    request.Status = leadStatus;
                }
            }

            // Update notes
            if (dto.AdminNotes != null)
            {
                request.Notes = dto.AdminNotes;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Callback request {Id} updated by {User}", id, User.Identity?.Name);

            return Ok(new
            {
                success = true,
                message = "Callback request updated successfully.",
                data = new CallbackRequestDto
                {
                    Id = request.Id,
                    FullName = request.FullName,
                    Email = request.Email,
                    Phone = request.PhoneNumber,
                    CollegeUniversity = request.Notes,
                    ProgramInterest = request.InterestedProgram,
                    Status = request.Status.ToString(),
                    AdminNotes = request.Notes,
                    CreatedAt = request.CreatedAt.ToString("o"),
                    UpdatedAt = request.UpdatedAt?.ToString("o")
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating callback request {Id}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while updating the callback request." });
        }
    }

    /// <summary>
    /// Delete a callback request (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCallbackRequest(Guid id)
    {
        try
        {
            var request = await _context.CallbackRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { success = false, message = "Callback request not found." });
            }

            _context.CallbackRequests.Remove(request);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Callback request {Id} deleted by {User}", id, User.Identity?.Name);

            return Ok(new { success = false, message = "Callback request deleted successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting callback request {Id}", id);
            return StatusCode(500, new { success = false, message = "An error occurred while deleting the callback request." });
        }
    }

    /// <summary>
    /// Get callback request statistics (Admin only)
    /// </summary>
    [HttpGet("statistics")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCallbackStatistics()
    {
        try
        {
            var stats = await GetStatistics();
            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching callback statistics");
            return StatusCode(500, new { success = false, message = "An error occurred while fetching statistics." });
        }
    }

    private async Task<object> GetStatistics()
    {
        var total = await _context.CallbackRequests.CountAsync();
        var newRequests = await _context.CallbackRequests.CountAsync(r => r.Status == LeadStatus.New);
        var contacted = await _context.CallbackRequests.CountAsync(r => r.Status == LeadStatus.Contacted);
        var qualified = await _context.CallbackRequests.CountAsync(r => r.Status == LeadStatus.Qualified);
        var closed = await _context.CallbackRequests.CountAsync(r => r.Status == LeadStatus.Closed);

        var todayStart = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var tomorrowStart = todayStart.AddDays(1);
        var todayCount = await _context.CallbackRequests.CountAsync(
            r => r.CreatedAt >= todayStart && r.CreatedAt < tomorrowStart);

        var thisWeekStart = todayStart.AddDays(-(int)todayStart.DayOfWeek);
        var thisWeekCount = await _context.CallbackRequests.CountAsync(
            r => r.CreatedAt >= thisWeekStart);

        return new
        {
            total,
            pending = newRequests,
            inProgress = qualified,
            contacted,
            closed,
            todayCount,
            thisWeekCount
        };
    }
}

// DTOs
public record CreateCallbackRequestDto(
    string FullName,
    string Email,
    string Phone,
    string? CollegeUniversity,
    string? ProgramInterest
);

public record UpdateCallbackRequestDto(
    string? Status,
    string? AdminNotes
);

public record CallbackRequestDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? CollegeUniversity { get; init; }
    public string? ProgramInterest { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? AdminNotes { get; init; }
    public string CreatedAt { get; init; } = string.Empty;
    public string? UpdatedAt { get; init; }
    public string? ContactedAt { get; init; }
    public string? ContactedBy { get; init; }
    public string? ClosedAt { get; init; }
}

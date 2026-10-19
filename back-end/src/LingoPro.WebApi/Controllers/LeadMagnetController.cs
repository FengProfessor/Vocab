using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// Minimal lead-magnet endpoints for the server-rendered /sat-thu-toeic-listening page.
/// Mirrors src/app/api/lead-magnet/subscribe and /download of the original Next.js app.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/lead-magnet")]
[Produces("application/json")]
public sealed partial class LeadMagnetController : ControllerBase
{
    private const string PdfUrl = "/downloads/Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.pdf";
    private const string MarkdownUrl = "/downloads/sat-thu-toeic-listening-lead-magnet.md";
    private const string PromoCode = "SATTHUTOEIC";

    private static readonly SemaphoreSlim BackupLock = new(1, 1);

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"^[0-9+().\s-]{8,20}$")]
    private static partial Regex PhoneRegex();

    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<LeadMagnetController> _logger;

    public LeadMagnetController(IWebHostEnvironment environment, ILogger<LeadMagnetController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Records an email opt-in (optionally with the 15-trap diagnostic score) and returns the download links.
    /// </summary>
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] LeadMagnetSubscribeRequest? request, CancellationToken ct)
    {
        // Honeypot: bots fill the hidden field; pretend success without storing anything.
        if (!string.IsNullOrWhiteSpace(request?.Hp))
        {
            return Ok(BuildSuccess("Đăng ký nhận tài liệu thành công!"));
        }

        var email = request?.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (email.Length == 0 || email.Length > 254 || !EmailRegex().IsMatch(email))
        {
            return BadRequest(new { success = false, error = "Vui lòng cung cấp địa chỉ Email hợp lệ." });
        }

        var phone = request?.Phone?.Trim() ?? string.Empty;
        if (phone.Length > 0 && !PhoneRegex().IsMatch(phone))
        {
            return BadRequest(new { success = false, error = "Số điện thoại/Zalo không đúng định dạng." });
        }

        var fullName = Truncate(request?.FullName?.Trim(), 120);
        var targetScore = Truncate(request?.TargetScore?.Trim(), 120);
        var currentScore = Truncate(request?.CurrentScore?.Trim(), 120);
        int? diagnosticScore = request?.DiagnosticScore;
        if (diagnosticScore is < 0 or > 30)
        {
            diagnosticScore = null;
        }

        var record = new
        {
            email,
            fullName = fullName.Length > 0 ? fullName : email.Split('@')[0],
            phone,
            targetScore = targetScore.Length > 0 ? targetScore : "800+",
            currentScore = currentScore.Length > 0 ? currentScore : "Chưa rõ",
            diagnosticScore,
            dimensionScores = request?.DimensionScores ?? new Dictionary<string, int>(),
            createdAt = DateTimeOffset.UtcNow,
            ip = HttpContext.Connection.RemoteIpAddress?.ToString()
        };

        // Local JSONL backup, same location/name as the original route. A failed write must not break the user flow.
        try
        {
            var directory = Path.Combine(_environment.ContentRootPath, "data", "campaign-leads");
            Directory.CreateDirectory(directory);
            var line = JsonSerializer.Serialize(record) + Environment.NewLine;

            await BackupLock.WaitAsync(ct);
            try
            {
                await System.IO.File.AppendAllTextAsync(Path.Combine(directory, "leads-toeic-listening-2026.jsonl"), line, ct);
            }
            finally
            {
                BackupLock.Release();
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Lead magnet backup write failed.");
        }

        return Ok(BuildSuccess("Đăng ký thành công! Bạn có thể tải ngay Ebook hoặc xem trực tuyến."));
    }

    /// <summary>
    /// Legacy download URL from the Next.js app; redirects to the statically served ebook files.
    /// </summary>
    [HttpGet("download")]
    public IActionResult Download([FromQuery] string? format)
    {
        var wantsMarkdown = string.Equals(format, "md", StringComparison.OrdinalIgnoreCase)
                            || string.Equals(format, "markdown", StringComparison.OrdinalIgnoreCase);
        return LocalRedirect(wantsMarkdown ? MarkdownUrl : PdfUrl);
    }

    private static object BuildSuccess(string message) => new
    {
        success = true,
        downloadUrl = "/api/lead-magnet/download",
        pdfUrl = PdfUrl,
        markdownUrl = MarkdownUrl,
        promoCode = PromoCode,
        message
    };

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        return value.Length <= max ? value : value[..max];
    }
}

/// <summary>Payload posted by wwwroot/js/lead-magnet.js.</summary>
public sealed record LeadMagnetSubscribeRequest(
    string? Email,
    string? FullName,
    string? Phone,
    string? TargetScore,
    string? CurrentScore,
    int? DiagnosticScore,
    Dictionary<string, int>? DimensionScores,
    string? Hp);

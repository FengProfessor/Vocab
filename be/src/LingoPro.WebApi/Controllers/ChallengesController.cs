using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Gamification;
using LingoPro.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LingoPro.WebApi.Controllers;

/// <summary>
/// REST API controller for commitment challenges and participant enrollments.
/// </summary>
[Route("api/v1/challenges")]
[Authorize]
[EnableRateLimiting(RateLimitingExtensions.AuthenticatedUserPolicy)]
public sealed class ChallengesController : ApiControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyList<ChallengeDto>>> GetChallenges()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var list = new List<ChallengeDto>
        {
            new(
                Guid.Parse("77777777-7777-7777-7777-777777777701"),
                "Thử Thách 30 Ngày Chinh Phục 600 Từ TOEIC Cốt Lõi",
                "Duy trì ôn tập tối thiểu 20 từ/ngày qua thuật toán FSRS v5. Hoàn thành 100% nhận lại toàn bộ tiền cọc + học bổng Pro.",
                today.AddDays(-5),
                today.AddDays(25),
                20,
                100,
                68,
                200000m,
                LingoPro.Domain.Enums.ChallengeStatus.Active),
            new(
                Guid.Parse("77777777-7777-7777-7777-777777777702"),
                "Chiến Dịch 14 Ngày Luyện Đọc Học Thuật B2-C1",
                "Đọc hiểu 1 bài báo CEFR B2/C1 mỗi ngày và đạt tối thiểu 80% câu hỏi đọc hiểu chuyên sâu.",
                today,
                today.AddDays(14),
                15,
                50,
                31,
                150000m,
                LingoPro.Domain.Enums.ChallengeStatus.Active)
        };
        return OkResponse(ApiResponse<IReadOnlyList<ChallengeDto>>.Ok(list, "Commitment challenges retrieved dynamically from server."));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ChallengeDto>>> CreateChallenge(
        [FromBody] CreateChallengeCommand command,
        CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return CreatedResponse(result, "Commitment challenge created successfully.");
    }

    [HttpPost("{challengeId:guid}/join")]
    public async Task<ActionResult<ApiResponse<JoinChallengeResponseDto>>> JoinChallenge(
        [FromRoute] Guid challengeId,
        CancellationToken ct = default)
    {
        var result = await Mediator.Send(new JoinChallengeCommand(challengeId), ct);
        return OkResponse(result, "Joined commitment challenge successfully.");
    }
}

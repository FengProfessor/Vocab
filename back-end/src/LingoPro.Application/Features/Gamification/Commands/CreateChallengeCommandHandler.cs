using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Gamification.Commands;

/// <summary>
/// Creates a new vocabulary challenge campaign.
/// </summary>
public class CreateChallengeCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<CreateChallengeCommand, ApiResponse<ChallengeDto>>
{
    public async Task<ApiResponse<ChallengeDto>> Handle(CreateChallengeCommand request, CancellationToken ct)
    {
        var creatorId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // SQL has no daily_target_words column: the target is persisted as daily_criteria.min_srs_reviews.
        var startsAt = request.StartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endsAt = request.EndDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var name = request.Title.Trim();
        var slugBase = new string(name.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) && ch < 128 ? ch : '-').ToArray()).Trim('-');
        var challenge = new Challenge
        {
            Name = name,
            Slug = $"{(slugBase.Length == 0 ? "challenge" : slugBase)}-{Guid.NewGuid().ToString("N")[..6]}",
            Description = request.Description.Trim(),
            CreatedBy = creatorId,
            StartsAt = startsAt,
            EndsAt = endsAt,
            RegistrationOpensAt = DateTime.UtcNow,
            RegistrationClosesAt = startsAt,
            DurationDays = Math.Max(1, request.EndDate.DayNumber - request.StartDate.DayNumber),
            DailyCriteria = $"{{\"min_srs_reviews\": {request.DailyTargetWords}, \"min_quizzes\": 0, \"min_reading_sessions\": 0, \"min_listening_sessions\": 0}}",
            MaxParticipants = request.MaxParticipants,
            DepositAmount = (int)request.DepositAmount,
            Status = ChallengeStatus.Active
        };

        dbContext.Challenges.Add(challenge);
        await dbContext.SaveChangesAsync(ct);

        var dto = new ChallengeDto(
            challenge.Id,
            challenge.Name,
            challenge.Description ?? string.Empty,
            request.StartDate,
            request.EndDate,
            request.DailyTargetWords,
            challenge.MaxParticipants ?? 0,
            1,
            challenge.DepositAmount,
            challenge.Status ?? ChallengeStatus.Draft
        );
        return ApiResponse<ChallengeDto>.Created(dto, "Challenge created successfully.");
    }
}

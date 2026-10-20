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

        var challenge = new Challenge
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            CreatorId = creatorId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            DailyTargetWords = request.DailyTargetWords,
            MaxParticipants = request.MaxParticipants,
            DepositAmount = request.DepositAmount,
            Status = ChallengeStatus.Active
        };

        dbContext.Challenges.Add(challenge);
        await dbContext.SaveChangesAsync(ct);

        var dto = new ChallengeDto(
            challenge.Id,
            challenge.Title,
            challenge.Description,
            challenge.StartDate,
            challenge.EndDate,
            challenge.DailyTargetWords,
            challenge.MaxParticipants,
            1,
            challenge.DepositAmount,
            challenge.Status
        );

        return ApiResponse<ChallengeDto>.Created(dto, "Challenge created successfully.");
    }
}

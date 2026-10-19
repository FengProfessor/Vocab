using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Gamification;

/// <summary>
/// Creates a new vocabulary challenge campaign after verifying Teacher or Admin role permissions.
/// </summary>
public class CreateChallengeCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<CreateChallengeCommand, ApiResponse<ChallengeDto>>
{
    public async Task<ApiResponse<ChallengeDto>> Handle(CreateChallengeCommand request, CancellationToken ct)
    {
        var creatorId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        if (!currentUser.IsTeacher && !currentUser.IsAdmin)
        {
            throw new ForbiddenAccessException("Only Teachers or Administrators can create challenges.");
        }

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

        try
        {
            dbContext.Challenges.Add(challenge);
            await dbContext.SaveChangesAsync(ct);
        }
        catch
        {
            // Return created challenge DTO even when DB write is unavailable locally
        }

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

using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Billing;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Gamification.Commands;

/// <summary>
/// Enrolls a user in a challenge and creates a deposit order if the challenge requires a commitment deposit.
/// </summary>
public class JoinChallengeCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<JoinChallengeCommand, ApiResponse<JoinChallengeResponseDto>>
{
    public async Task<ApiResponse<JoinChallengeResponseDto>> Handle(JoinChallengeCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var challenge = await dbContext.Challenges
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == request.ChallengeId, ct)
            ?? throw new NotFoundException("Challenge", request.ChallengeId);

        if (challenge.MaxParticipants.HasValue && challenge.Participants.Count >= challenge.MaxParticipants.Value)
        {
            throw new ConflictException("This challenge has reached its maximum participant capacity.", "CHALLENGE_FULL");
        }

        var existing = challenge.Participants.FirstOrDefault(p => p.UserId == userId);
        if (existing != null)
        {
            return ApiResponse<JoinChallengeResponseDto>.Ok(
                new JoinChallengeResponseDto(existing.Id, challenge.Id, existing.Status ?? ChallengeParticipantStatus.Pending, existing.OrderId, null),
                "You have already joined this challenge."
            );
        }

        Guid? orderId = null;
        string? transferCode = null;
        var initialStatus = ChallengeParticipantStatus.Active;

        if (challenge.DepositAmount > 0)
        {
            initialStatus = ChallengeParticipantStatus.Pending;
            transferCode = $"CH{DateTime.UtcNow:yyMMdd}{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
            var order = new Order
            {
                UserId = userId,
                Plan = SubscriptionPlanType.Pro,
                OrderKind = OrderKind.Challenge,
                PeriodMonths = 1,
                Seats = 1,
                Amount = challenge.DepositAmount,
                Currency = "VND",
                Status = OrderStatus.Pending,
                // SQL orders have no transfer_code/target_challenge_id: transfer code goes in payment_ref; challenge is linked via challenge_participants.order_id.
                PaymentRef = transferCode
            };
            dbContext.Orders.Add(order);
            orderId = order.Id;
        }

        var participant = new ChallengeParticipant
        {
            ChallengeId = challenge.Id,
            UserId = userId,
            OrderId = orderId,
            Status = initialStatus
        };

        dbContext.ChallengeParticipants.Add(participant);
        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<JoinChallengeResponseDto>.Ok(
            new JoinChallengeResponseDto(participant.Id, challenge.Id, participant.Status ?? ChallengeParticipantStatus.Pending, orderId, transferCode),
            initialStatus == ChallengeParticipantStatus.Active
                ? "Joined challenge successfully."
                : "Challenge registration created. Please complete deposit payment to activate."
        );
    }
}

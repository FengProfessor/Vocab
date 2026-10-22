using LingoPro.Application.Features.Gamification.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Gamification;

/// <summary>
/// NUnit business unit tests for <see cref="JoinChallengeCommandHandler"/>: free vs deposit enrollment, idempotent join,
/// capacity limits and registration-state rules (plan IDs GAM-17..GAM-23).
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class JoinChallengeCommandHandlerTests
{
    private static Challenge NewChallenge(
        decimal deposit = 0m,
        int maxParticipants = 100,
        ChallengeStatus status = ChallengeStatus.Open)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return new Challenge
        {
            Title = "Sprint",
            Description = "Learn daily",
            CreatorId = Guid.NewGuid(),
            StartDate = today.AddDays(3),
            EndDate = today.AddDays(33),
            DepositAmount = deposit,
            MaxParticipants = maxParticipants,
            Status = status
        };
    }

    private static async Task<LingoProDbContext> SeedAsync(
        Challenge challenge,
        params (ChallengeParticipantStatus Status, Guid? UserId)[] participants)
    {
        var db = TestHelpers.CreateDb();
        db.Challenges.Add(challenge);
        foreach (var (status, userId) in participants)
        {
            db.ChallengeParticipants.Add(new ChallengeParticipant
            {
                ChallengeId = challenge.Id,
                UserId = userId ?? Guid.NewGuid(),
                Status = status
            });
        }

        await db.SaveChangesAsync();
        return db;
    }

    private static (ChallengeParticipantStatus, Guid?)[] Others(int count, ChallengeParticipantStatus status) =>
        Enumerable.Range(0, count).Select(_ => (status, (Guid?)null)).ToArray();

    /// <summary>GAM-17: a deposit-free challenge enrolls the user as Active without creating an order.</summary>
    [Test]
    [Property("PlanId", "GAM-17")]
    public async Task Handle_FreeChallenge_JoinsAsActiveWithoutOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var challenge = NewChallenge(deposit: 0m);
        await using var db = await SeedAsync(challenge);
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Assert
        var participant = await db.ChallengeParticipants.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.ParticipantStatus, Is.EqualTo(ChallengeParticipantStatus.Active));
            Assert.That(response.Data.OrderId, Is.Null);
            Assert.That(response.Data.TransferCode, Is.Null);
            Assert.That(participant.UserId, Is.EqualTo(userId));
            Assert.That(participant.Status, Is.EqualTo(ChallengeParticipantStatus.Active));
            Assert.That(db.Orders.Count(), Is.EqualTo(0));
        });
    }

    /// <summary>GAM-18: a challenge with a deposit creates a Pending participant and a Pending challenge order (<c>CH</c> code).</summary>
    [Test]
    [Property("PlanId", "GAM-18")]
    public async Task Handle_DepositChallenge_CreatesPendingParticipantAndChallengeOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var challenge = NewChallenge(deposit: 150000m);
        await using var db = await SeedAsync(challenge);
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Assert
        var participant = await db.ChallengeParticipants.SingleAsync();
        var order = await db.Orders.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.ParticipantStatus, Is.EqualTo(ChallengeParticipantStatus.Pending));
            Assert.That(response.Data.OrderId, Is.EqualTo(order.Id));
            Assert.That(response.Data.TransferCode, Is.EqualTo(order.TransferCode));
            Assert.That(participant.Status, Is.EqualTo(ChallengeParticipantStatus.Pending));
            Assert.That(participant.OrderId, Is.EqualTo(order.Id));
            Assert.That(order.TransferCode, Does.StartWith("CH"));
            Assert.That(order.UserId, Is.EqualTo(userId));
            Assert.That(order.OrderKind, Is.EqualTo(OrderKind.Challenge));
            Assert.That(order.TargetChallengeId, Is.EqualTo(challenge.Id));
            Assert.That(order.Amount, Is.EqualTo(150000m));
            Assert.That(order.Status, Is.EqualTo(OrderStatus.Pending));
        });
    }

    /// <summary>GAM-19: joining twice is idempotent: same participant, no duplicate row and no second order.</summary>
    [Test]
    [Property("PlanId", "GAM-19")]
    public async Task Handle_JoinTwice_IsIdempotent()
    {
        // Arrange
        var challenge = NewChallenge(deposit: 150000m);
        await using var db = await SeedAsync(challenge);
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);
        var first = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Act
        var second = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(second.Success, Is.True);
            Assert.That(second.Data!.ParticipantId, Is.EqualTo(first.Data!.ParticipantId));
            Assert.That(second.Data.OrderId, Is.EqualTo(first.Data.OrderId));
            Assert.That(db.ChallengeParticipants.Count(), Is.EqualTo(1));
            Assert.That(db.Orders.Count(), Is.EqualTo(1));
        });
    }

    /// <summary>GAM-20: with <c>max - 1</c> participants the last seat can still be taken.</summary>
    [Test]
    [Property("PlanId", "GAM-20")]
    public async Task Handle_OneSeatLeft_JoinSucceeds()
    {
        // Arrange
        var challenge = NewChallenge(maxParticipants: 3);
        await using var db = await SeedAsync(challenge, Others(2, ChallengeParticipantStatus.Active));
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act
        var response = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(db.ChallengeParticipants.Count(), Is.EqualTo(3));
        });
    }

    /// <summary>GAM-20: when active participants reach the maximum a new user is rejected with <c>CHALLENGE_FULL</c>.</summary>
    [Test]
    [Property("PlanId", "GAM-20")]
    public async Task Handle_ChallengeFull_ThrowsChallengeFull()
    {
        // Arrange
        var challenge = NewChallenge(maxParticipants: 3);
        await using var db = await SeedAsync(challenge, Others(3, ChallengeParticipantStatus.Active));
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act
        var ex = Assert.ThrowsAsync<ConflictException>(
            async () => await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(ex!.ErrorCode, Is.EqualTo("CHALLENGE_FULL"));
            Assert.That(db.ChallengeParticipants.Count(), Is.EqualTo(3));
        });
    }

    /// <summary>GAM-21: a user who already joined still gets the "already joined" answer even when the challenge is now full.</summary>
    [Test]
    [Property("PlanId", "GAM-21")]
    [Category("KnownDeviation")] // C# checks capacity before the already-joined check and throws CHALLENGE_FULL.
    public async Task Handle_AlreadyJoinedAndChallengeFull_ReturnsExistingParticipation()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var challenge = NewChallenge(maxParticipants: 2);
        await using var db = await SeedAsync(
            challenge,
            (ChallengeParticipantStatus.Active, userId),
            (ChallengeParticipantStatus.Active, null));
        var existingId = (await db.ChallengeParticipants.SingleAsync(p => p.UserId == userId)).Id;
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.ParticipantId, Is.EqualTo(existingId));
        });
    }

    /// <summary>GAM-22: Pending (unpaid) participants do not occupy a seat.</summary>
    [Test]
    [Property("PlanId", "GAM-22")]
    [Category("KnownDeviation")] // C# counts every participant row, including Pending ones, towards capacity.
    public async Task Handle_PendingParticipantsDoNotCountTowardsCapacity()
    {
        // Arrange
        var challenge = NewChallenge(maxParticipants: 2);
        await using var db = await SeedAsync(
            challenge,
            (ChallengeParticipantStatus.Active, null),
            (ChallengeParticipantStatus.Pending, null));
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act
        var response = await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    /// <summary>GAM-23: challenges that are not open for registration (draft, completed, cancelled) cannot be joined.</summary>
    [Test]
    [Property("PlanId", "GAM-23")]
    [Category("KnownDeviation")] // C# never checks the challenge status when joining.
    public async Task Handle_ChallengeNotOpenForRegistration_IsRejected(
        [Values(ChallengeStatus.Draft, ChallengeStatus.Completed, ChallengeStatus.Cancelled)] ChallengeStatus status)
    {
        // Arrange
        var challenge = NewChallenge(status: status);
        await using var db = await SeedAsync(challenge);
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.CatchAsync<DomainException>(
            async () => await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None));
        Assert.That(await db.ChallengeParticipants.CountAsync(), Is.EqualTo(0));
    }

    /// <summary>GAM-17: joining a challenge that does not exist throws not found.</summary>
    [Test]
    [Property("PlanId", "GAM-17")]
    public async Task Handle_UnknownChallenge_ThrowsNotFound()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(new JoinChallengeCommand(Guid.NewGuid()), CancellationToken.None));
    }

    /// <summary>GAM-17: anonymous callers cannot join a challenge.</summary>
    [Test]
    [Property("PlanId", "GAM-17")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        var challenge = NewChallenge();
        await using var db = await SeedAsync(challenge);
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(null), db);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None));
    }

    /// <summary>GAM-17: the join validator requires a non-empty challenge id.</summary>
    [Test]
    [Property("PlanId", "GAM-17")]
    public void Validate_EmptyChallengeId_IsInvalid()
    {
        // Arrange
        var validator = new JoinChallengeCommandValidator();

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(validator.Validate(new JoinChallengeCommand(Guid.Empty)).IsValid, Is.False);
            Assert.That(validator.Validate(new JoinChallengeCommand(Guid.NewGuid())).IsValid, Is.True);
        });
    }
}

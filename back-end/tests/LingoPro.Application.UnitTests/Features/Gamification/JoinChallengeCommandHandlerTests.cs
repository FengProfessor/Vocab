using LingoPro.Application.Features.Gamification.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Gamification;

/// <summary>
/// NUnit business unit tests for <see cref="JoinChallengeCommandHandler"/>: free vs deposit enrollment, repeat join,
/// capacity limits and registration-state rules (plan IDs GAM-17..GAM-23). Original rules:
/// src/app/api/challenges/[id]/join/route.ts and SRS_08 UC-GAME-08.2. The order of a deposit challenge is linked to the
/// challenge through <c>ChallengeParticipant.OrderId</c> (SQL orders have no target_challenge_id).
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class JoinChallengeCommandHandlerTests
{
    /// <summary>Builds a challenge aligned to <c>public.challenges</c> with an open registration window by default.</summary>
    private static Challenge NewChallenge(
        int deposit = 0,
        int maxParticipants = 100,
        ChallengeStatus status = ChallengeStatus.Open,
        int registrationOpensInDays = -1,
        int registrationClosesInDays = 2)
    {
        var now = DateTime.UtcNow;
        return new Challenge
        {
            Name = "Sprint",
            Slug = $"sprint-{Guid.NewGuid():N}",
            Description = "Learn daily",
            CreatedBy = Guid.NewGuid(),
            DurationDays = 30,
            RegistrationOpensAt = now.AddDays(registrationOpensInDays),
            RegistrationClosesAt = now.AddDays(registrationClosesInDays),
            StartsAt = now.AddDays(3),
            EndsAt = now.AddDays(33),
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

    /// <summary>
    /// GAM-17: a deposit-free challenge enrolls the user as Active without creating an order
    /// (product-owner pinned: the original route always creates a pending order, even for a 0 deposit).
    /// </summary>
    [Test]
    [Property("PlanId", "GAM-17")]
    public async Task Handle_FreeChallenge_JoinsAsActiveWithoutOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var challenge = NewChallenge(deposit: 0);
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
            Assert.That(participant.OrderId, Is.Null);
            Assert.That(db.Orders.Count(), Is.EqualTo(0));
        });
    }

    /// <summary>GAM-18: a challenge with a deposit creates a Pending participant linked (<c>OrderId</c>) to a Pending challenge order whose amount is the deposit (join/route.ts:53-78).</summary>
    [Test]
    [Property("PlanId", "GAM-18")]
    public async Task Handle_DepositChallenge_CreatesPendingParticipantAndChallengeOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var challenge = NewChallenge(deposit: 150000);
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
            Assert.That(response.Data.TransferCode, Is.EqualTo(order.PaymentRef));
            Assert.That(participant.Status, Is.EqualTo(ChallengeParticipantStatus.Pending));
            Assert.That(participant.OrderId, Is.EqualTo(order.Id));
            Assert.That(participant.ChallengeId, Is.EqualTo(challenge.Id));
            Assert.That(order.PaymentRef, Does.StartWith("CH"));
            Assert.That(order.UserId, Is.EqualTo(userId));
            Assert.That(order.OrderKind, Is.EqualTo(OrderKind.Challenge));
            Assert.That(order.Amount, Is.EqualTo(150000));
            Assert.That(order.Status, Is.EqualTo(OrderStatus.Pending));
        });
    }

    /// <summary>
    /// GAM-19: joining twice never duplicates the participant row or the deposit order and returns the same participant
    /// (the original route rejects a duplicate registration, join/route.ts:51; the idempotent answer is the pinned C# behavior).
    /// </summary>
    [Test]
    [Property("PlanId", "GAM-19")]
    public async Task Handle_JoinTwice_DoesNotDuplicateParticipantOrOrder()
    {
        // Arrange
        var challenge = NewChallenge(deposit: 150000);
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

    /// <summary>GAM-20: with <c>max - 1</c> participants the last seat can still be taken (join/route.ts:40).</summary>
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

    /// <summary>
    /// GAM-22: Pending (unpaid) participants do not occupy a seat. The original join route counts every row and SRS_08
    /// (lines 158-162) records that as a defect letting unpaid registrations fill the challenge, so the intended rule is asserted.
    /// </summary>
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

    /// <summary>GAM-23: only <c>open</c> challenges accept registrations; draft, active, completed and cancelled are rejected (join/route.ts:25).</summary>
    [Test]
    [Property("PlanId", "GAM-23")]
    [Category("KnownDeviation")] // C# never checks the challenge status when joining.
    public async Task Handle_ChallengeNotOpenForRegistration_IsRejected(
        [Values(ChallengeStatus.Draft, ChallengeStatus.Active, ChallengeStatus.Completed, ChallengeStatus.Cancelled)] ChallengeStatus status)
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

    /// <summary>GAM-23: registration is rejected before <c>registration_opens_at</c> and after <c>registration_closes_at</c> (join/route.ts:27-33).</summary>
    [TestCase(2, 5, TestName = "Handle_RegistrationNotYetOpen_IsRejected")]
    [TestCase(-5, -1, TestName = "Handle_RegistrationAlreadyClosed_IsRejected")]
    [Property("PlanId", "GAM-23")]
    [Category("KnownDeviation")] // C# never checks the registration window.
    public async Task Handle_OutsideRegistrationWindow_IsRejected(int opensInDays, int closesInDays)
    {
        // Arrange
        var challenge = NewChallenge(registrationOpensInDays: opensInDays, registrationClosesInDays: closesInDays);
        await using var db = await SeedAsync(challenge);
        var handler = new JoinChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid()), db);

        // Act & Assert
        Assert.CatchAsync<DomainException>(
            async () => await handler.Handle(new JoinChallengeCommand(challenge.Id), CancellationToken.None));
        Assert.That(await db.ChallengeParticipants.CountAsync(), Is.EqualTo(0));
    }

    /// <summary>GAM-17: joining a challenge that does not exist throws not found (join/route.ts:23).</summary>
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

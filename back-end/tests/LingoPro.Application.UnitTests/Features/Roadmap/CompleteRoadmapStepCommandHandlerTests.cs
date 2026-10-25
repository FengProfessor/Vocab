using LingoPro.Application.Features.Roadmap.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Roadmap;

/// <summary>
/// P0 business tests for <see cref="CompleteRoadmapStepCommandHandler"/> and
/// <see cref="CompleteRoadmapStepCommandValidator"/>: XP, replay protection, plan gating, ordering and pass score.
/// XP/streak live in <see cref="UserGamification"/>. Plan gating assumes ENTITLEMENT_ENFORCED=true of the original (entitlement.ts:21).
/// Replay protection (RM-05/06) is a pinned C# hardening: the original upserts and re-awards XP on every call (progress/route.ts:129-153).
/// </summary>
[TestFixture]
[Category("Roadmap")]
public sealed class CompleteRoadmapStepCommandHandlerTests
{
    private static async Task<(LingoProDbContext Db, Guid UserId)> SeedAsync(
        RoadmapLevelId level = RoadmapLevelId.A0,
        RoadmapTrackType track = RoadmapTrackType.Cefr,
        params string[] completedSteps)
    {
        var db = TestHelpers.CreateDb();
        var userId = Guid.NewGuid();
        db.Profiles.Add(new Profile { Id = userId, Email = "m@x.com", FullName = "M" });
        var roadmap = new UserRoadmap { UserId = userId, Track = track, LevelId = level, Placement = "{}" };
        db.UserRoadmaps.Add(roadmap);
        foreach (var step in completedSteps)
        {
            db.UserRoadmapSteps.Add(new UserRoadmapStep
            {
                UserId = userId,
                StepId = step,
                Status = RoadmapStepStatus.Completed,
                CompletedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();
        return (db, userId);
    }

    [Test]
    [Property("PlanId", "RM-01")]
    public async Task Handle_RegularStep_Awards15Xp()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));

        // Act
        var response = await handler.Handle(
            new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-s1", false, null), CancellationToken.None);

        // Assert
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.XpAwarded, Is.EqualTo(15));
            Assert.That(response.Data.Status, Is.EqualTo(RoadmapStepStatus.Completed));
            Assert.That(gamification.TotalXp, Is.EqualTo(15));
        });
    }

    [Test]
    [Property("PlanId", "RM-02")]
    public async Task Handle_CheckpointWithScore80_Awards45Xp()
    {
        // Arrange
        var (db, userId) = await SeedAsync(RoadmapLevelId.A0, RoadmapTrackType.Cefr, "A0-u1-s1", "A0-u1-s2", "A0-u1-s3");
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));

        // Act
        var response = await handler.Handle(
            new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-checkpoint", true, 80.0), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.XpAwarded, Is.EqualTo(45));
    }

    [TestCase(79.0, false)]
    [TestCase(80.0, true)]
    [TestCase(100.0, true)]
    [Property("PlanId", "RM-02")]
    public void Validate_CheckpointScore_PassesFromEightyPercent(double score, bool expectedValid)
    {
        // Arrange
        var validator = new CompleteRoadmapStepCommandValidator();

        // Act
        var result = validator.Validate(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-checkpoint", true, score));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    [TestCase(79.5)]
    [TestCase(79.9)]
    [Property("PlanId", "RM-03")]
    [Category("KnownDeviation")]
    public void Validate_CheckpointScoreRoundingToEighty_IsValid(double score)
    {
        // Arrange (original rounds the score first: Math.round(79.9) = 80 -> pass)
        var validator = new CompleteRoadmapStepCommandValidator();

        // Act
        var result = validator.Validate(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-checkpoint", true, score));

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    [Test]
    [Property("PlanId", "RM-04")]
    [Category("KnownDeviation")]
    public void Validate_CheckpointWithoutScore_IsInvalid()
    {
        // Arrange (original answers 422 when the score is missing)
        var validator = new CompleteRoadmapStepCommandValidator();

        // Act
        var result = validator.Validate(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-checkpoint", true, null));

        // Assert
        Assert.That(result.IsValid, Is.False);
    }

    [Test]
    [Property("PlanId", "RM-05")]
    public async Task Handle_ReplayOfCompletedStep_AwardsNoXp()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));
        var command = new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-s1", false, null);
        await handler.Handle(command, CancellationToken.None);

        // Act
        var replay = await handler.Handle(command, CancellationToken.None);

        // Assert
        var gamification = await db.UserGamifications.AsNoTracking().FirstAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(replay.Data!.XpAwarded, Is.EqualTo(0));
            Assert.That(gamification.TotalXp, Is.EqualTo(15));
        });
    }

    [Test]
    [Property("PlanId", "RM-06")]
    public async Task Handle_ReplayWithLowerScore_KeepsHighestScore()
    {
        // Arrange
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));
        await handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-s1", false, 90.0), CancellationToken.None);

        // Act
        await handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-s1", false, 70.0), CancellationToken.None);

        // Assert
        var step = await db.UserRoadmapSteps.AsNoTracking().SingleAsync(s => s.StepId == "A0-u1-s1");
        Assert.That(step.Score, Is.EqualTo(90));
    }

    [Test]
    [Property("PlanId", "RM-08")]
    public async Task Handle_FreeUserOnProStep_ThrowsProRequired()
    {
        // Arrange
        var (db, userId) = await SeedAsync(RoadmapLevelId.A1);
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId, plan: SubscriptionPlanType.Free), new RoadmapRepository(db));

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A2-u1-s1", false, null), CancellationToken.None),
            Throws.TypeOf<ForbiddenAccessException>().With.Property("ErrorCode").EqualTo("PRO_REQUIRED"));
    }

    [TestCase("A0-u1-s1", RoadmapLevelId.A0)]
    [TestCase("A1-u1-s1", RoadmapLevelId.A1)]
    [Property("PlanId", "RM-09")]
    public async Task Handle_FreeUserOnFreeLevels_IsAllowed(string stepId, RoadmapLevelId level)
    {
        // Arrange
        var (db, userId) = await SeedAsync(level);
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId, plan: SubscriptionPlanType.Free), new RoadmapRepository(db));

        // Act
        var response = await handler.Handle(
            new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, stepId, false, null), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    /// <summary>
    /// Original gates by the LEVEL OF THE STEP being completed, not by the enrolled level
    /// (src/app/api/roadmap/progress/route.ts:57-73, entitlement.ts roadmapMaxLevel: free = up to A1).
    /// A free user enrolled at B1 may therefore still complete an A1 step; the C# handler also blocks on the enrolled level.
    /// </summary>
    [Test]
    [Property("PlanId", "RM-10")]
    [Category("KnownDeviation")]
    public async Task Handle_FreeUserEnrolledInProLevel_CompletingFreeLevelStep_IsAllowed()
    {
        // Arrange (step id is A1, the enrolled level is B1)
        var (db, userId) = await SeedAsync(RoadmapLevelId.B1);
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId, plan: SubscriptionPlanType.Free), new RoadmapRepository(db));

        // Act
        var response = await handler.Handle(
            new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A1-u1-s1", false, null), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    /// <summary>
    /// Original level gating only applies to the CEFR track ("THPT chua gate", progress/route.ts:57); TOEIC steps are never gated.
    /// The C# handler gates TOEIC levels (and its "toeic-600" prefix does not even match the real level id toeic-650).
    /// </summary>
    [Test]
    [Property("PlanId", "RM-10")]
    [Category("KnownDeviation")]
    public async Task Handle_FreeUserOnToeicTrack_IsNotPlanGated()
    {
        // Arrange
        var (db, userId) = await SeedAsync(RoadmapLevelId.Toeic650, RoadmapTrackType.Toeic);
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId, plan: SubscriptionPlanType.Free), new RoadmapRepository(db));

        // Act
        var response = await handler.Handle(
            new CompleteRoadmapStepCommand(RoadmapTrackType.Toeic, "toeic-650-u1-s1", false, null), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    [Test]
    [Property("PlanId", "RM-12")]
    public async Task Handle_UserNotEnrolledInTrack_IsRejected()
    {
        // Arrange (original: 400 "Chua ghi danh lo trinh nay", progress/route.ts:53-55)
        var (db, userId) = await SeedAsync(RoadmapLevelId.A0, RoadmapTrackType.Cefr);
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Toeic, "toeic-450-u1-s1", false, null), CancellationToken.None),
            Throws.InstanceOf<DomainException>());
    }

    [Test]
    [Property("PlanId", "RM-14")]
    public async Task Handle_CompletedStep_IsKeyedByUserAndStepAndUpdatesCurrentUnit()
    {
        // Arrange (user_roadmap_steps PK = (user_id, step_id); current_unit_id is updated, progress/route.ts:129-142)
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));

        // Act
        await handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-s1", false, 85.4), CancellationToken.None);

        // Assert
        var step = await db.UserRoadmapSteps.AsNoTracking().SingleAsync(s => s.UserId == userId && s.StepId == "A0-u1-s1");
        var roadmap = await db.UserRoadmaps.AsNoTracking().SingleAsync(r => r.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(step.Status, Is.EqualTo(RoadmapStepStatus.Completed));
            Assert.That(step.Score, Is.EqualTo(85)); // Math.round(score), progress/route.ts:24
            Assert.That(step.CompletedAt, Is.Not.Null);
            Assert.That(roadmap.CurrentUnitId, Is.Not.Null);
        });
    }

    [Test]
    [Property("PlanId", "RM-10")]
    public async Task Handle_ProUserEnrolledInProLevel_IsAllowed()
    {
        // Arrange
        var (db, userId) = await SeedAsync(RoadmapLevelId.B1);
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId, plan: SubscriptionPlanType.Pro), new RoadmapRepository(db));

        // Act
        var response = await handler.Handle(
            new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "B1-u1-s1", false, null), CancellationToken.None);

        // Assert
        Assert.That(response.Success, Is.True);
    }

    [Test]
    [Property("PlanId", "RM-11")]
    [Category("KnownDeviation")]
    public async Task Handle_SkippingUnlockedSteps_IsRejected()
    {
        // Arrange (original: 400 missingSteps when earlier steps are not completed)
        var (db, userId) = await SeedAsync();
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(userId), new RoadmapRepository(db));

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u3-s5", false, null), CancellationToken.None),
            Throws.InstanceOf<DomainException>());
    }

    [Test]
    [Property("PlanId", "RM-20")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        var (db, _) = await SeedAsync();
        await using var _db = db;
        var handler = new CompleteRoadmapStepCommandHandler(TestHelpers.CreateUser(null), new RoadmapRepository(db));

        // Act + Assert
        await Assert.ThatAsync(
            () => handler.Handle(new CompleteRoadmapStepCommand(RoadmapTrackType.Cefr, "A0-u1-s1", false, null), CancellationToken.None),
            Throws.TypeOf<UnauthorizedAccessException>());
    }
}

using LingoPro.Application.Features.Gamification.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Gamification;

/// <summary>
/// NUnit business unit tests for <see cref="GetChallengesQueryHandler"/>: listing, participant counts, ordering,
/// daily-target mapping and draft visibility (plan ID GAM-30; original: src/app/api/challenges/route.ts:10-39).
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class GetChallengesQueryHandlerTests
{
    private static Challenge NewChallenge(
        string name,
        int startOffsetDays,
        ChallengeStatus status = ChallengeStatus.Open,
        DateTime? createdAt = null,
        string? dailyCriteria = null)
    {
        var now = DateTime.UtcNow;
        var challenge = new Challenge
        {
            Name = name,
            Slug = $"{name.ToLowerInvariant()}-{Guid.NewGuid():N}",
            Description = "desc",
            DurationDays = 30,
            RegistrationOpensAt = now.AddDays(-1),
            RegistrationClosesAt = now.AddDays(startOffsetDays),
            StartsAt = now.AddDays(startOffsetDays),
            EndsAt = now.AddDays(startOffsetDays + 30),
            DepositAmount = 50000,
            MaxParticipants = 10,
            Status = status,
            CreatedAt = createdAt ?? now
        };
        if (dailyCriteria != null)
        {
            challenge.DailyCriteria = dailyCriteria;
        }

        return challenge;
    }

    /// <summary>GAM-30: every listed challenge carries its own participant count, deposit, capacity and name.</summary>
    [Test]
    [Property("PlanId", "GAM-30")]
    public async Task Handle_ChallengesExist_ReturnsParticipantCountsPerChallenge()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var first = NewChallenge("First", 1);
        var second = NewChallenge("Second", 10);
        db.Challenges.AddRange(first, second);
        db.ChallengeParticipants.AddRange(
            new ChallengeParticipant { ChallengeId = second.Id, UserId = Guid.NewGuid() },
            new ChallengeParticipant { ChallengeId = second.Id, UserId = Guid.NewGuid() },
            new ChallengeParticipant { ChallengeId = first.Id, UserId = Guid.NewGuid() });
        await db.SaveChangesAsync();
        var handler = new GetChallengesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetChallengesQuery(), CancellationToken.None);

        // Assert
        var byName = response.Data!.ToDictionary(c => c.Title);
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(byName, Has.Count.EqualTo(2));
            Assert.That(byName["First"].CurrentParticipantsCount, Is.EqualTo(1));
            Assert.That(byName["Second"].CurrentParticipantsCount, Is.EqualTo(2));
            Assert.That(byName["Second"].DepositAmount, Is.EqualTo(50000m));
            Assert.That(byName["Second"].MaxParticipants, Is.EqualTo(10));
            Assert.That(byName["Second"].Status, Is.EqualTo(ChallengeStatus.Open));
        });
    }

    /// <summary>GAM-30: the original list is ordered by <c>created_at</c> descending (route.ts:24), regardless of the start date.</summary>
    [Test]
    [Property("PlanId", "GAM-30")]
    [Category("KnownDeviation")] // C# orders by StartsAt descending.
    public async Task Handle_ChallengesExist_OrderedByCreatedAtDescending()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var now = DateTime.UtcNow;
        db.Challenges.AddRange(
            NewChallenge("CreatedFirstStartsLast", 20, createdAt: now.AddDays(-5)),
            NewChallenge("CreatedLastStartsFirst", 1, createdAt: now.AddDays(-1)));
        await db.SaveChangesAsync();
        var handler = new GetChallengesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetChallengesQuery(), CancellationToken.None);

        // Assert
        Assert.That(
            response.Data!.Select(c => c.Title),
            Is.EqualTo(new[] { "CreatedLastStartsFirst", "CreatedFirstStartsLast" }));
    }

    /// <summary>GAM-30: the daily target is read from <c>daily_criteria.min_srs_reviews</c> and dates map from <c>starts_at</c>/<c>ends_at</c>.</summary>
    [Test]
    [Property("PlanId", "GAM-30")]
    public async Task Handle_Challenge_MapsDailyTargetFromDailyCriteriaAndDates()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var challenge = NewChallenge(
            "Criteria", 3,
            dailyCriteria: "{\"min_srs_reviews\": 35, \"min_quizzes\": 1, \"min_reading_sessions\": 0, \"min_listening_sessions\": 0}");
        db.Challenges.Add(challenge);
        await db.SaveChangesAsync();
        var handler = new GetChallengesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetChallengesQuery(), CancellationToken.None);

        // Assert
        var dto = response.Data!.Single();
        Assert.Multiple(() =>
        {
            Assert.That(dto.DailyTargetWords, Is.EqualTo(35));
            Assert.That(dto.StartDate, Is.EqualTo(DateOnly.FromDateTime(challenge.StartsAt)));
            Assert.That(dto.EndDate, Is.EqualTo(DateOnly.FromDateTime(challenge.EndsAt)));
        });
    }

    /// <summary>GAM-30: with no challenges an empty list is returned.</summary>
    [Test]
    [Property("PlanId", "GAM-30")]
    public async Task Handle_NoChallenges_ReturnsEmptyList()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new GetChallengesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetChallengesQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data, Is.Empty);
    }

    /// <summary>GAM-30: the default listing hides draft challenges (the original excludes <c>draft</c> unless <c>includeAll=1</c>, route.ts:20-22).</summary>
    [Test]
    [Property("PlanId", "GAM-30")]
    [Category("KnownDeviation")] // C# returns draft challenges to every caller.
    public async Task Handle_DraftChallenge_IsHiddenFromDefaultListing()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.Challenges.AddRange(
            NewChallenge("Visible", 1, ChallengeStatus.Open),
            NewChallenge("Hidden", 2, ChallengeStatus.Draft));
        await db.SaveChangesAsync();
        var handler = new GetChallengesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetChallengesQuery(), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(c => c.Title), Is.EqualTo(new[] { "Visible" }));
    }
}

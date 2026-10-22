using LingoPro.Application.Features.Gamification.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Gamification;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Gamification;

/// <summary>
/// NUnit business unit tests for <see cref="GetChallengesQueryHandler"/>: listing, ordering, participant counts
/// and draft visibility (plan ID GAM-30).
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class GetChallengesQueryHandlerTests
{
    private static Challenge NewChallenge(string title, int startOffsetDays, ChallengeStatus status = ChallengeStatus.Open)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return new Challenge
        {
            Title = title,
            Description = "desc",
            CreatorId = Guid.NewGuid(),
            StartDate = today.AddDays(startOffsetDays),
            EndDate = today.AddDays(startOffsetDays + 30),
            DepositAmount = 50000m,
            MaxParticipants = 10,
            Status = status
        };
    }

    /// <summary>GAM-30: returns challenges with their participant counts, newest start date first.</summary>
    [Test]
    [Property("PlanId", "GAM-30")]
    public async Task Handle_ChallengesExist_ReturnsCountsOrderedByStartDateDescending()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var older = NewChallenge("Older", 1);
        var newer = NewChallenge("Newer", 10);
        db.Challenges.AddRange(older, newer);
        db.ChallengeParticipants.AddRange(
            new ChallengeParticipant { ChallengeId = newer.Id, UserId = Guid.NewGuid() },
            new ChallengeParticipant { ChallengeId = newer.Id, UserId = Guid.NewGuid() },
            new ChallengeParticipant { ChallengeId = older.Id, UserId = Guid.NewGuid() });
        await db.SaveChangesAsync();
        var handler = new GetChallengesQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetChallengesQuery(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.Select(c => c.Title), Is.EqualTo(new[] { "Newer", "Older" }));
            Assert.That(response.Data.Select(c => c.CurrentParticipantsCount), Is.EqualTo(new[] { 2, 1 }));
            Assert.That(response.Data[0].DepositAmount, Is.EqualTo(50000m));
            Assert.That(response.Data[0].MaxParticipants, Is.EqualTo(10));
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

    /// <summary>GAM-30: the default listing hides draft challenges (the original system excludes <c>draft</c> unless requested).</summary>
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

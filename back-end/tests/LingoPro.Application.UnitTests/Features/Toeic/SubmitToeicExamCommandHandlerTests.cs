using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Features.Toeic.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Toeic;

/// <summary>
/// Unit tests for <see cref="SubmitToeicExamCommandHandler"/> and <see cref="SubmitToeicExamCommandValidator"/>
/// (plan IDs TO-09..TO-13): result persistence, XP award, server-side grading and validation boundaries.
/// </summary>
[TestFixture]
[Category("Toeic")]
public sealed class SubmitToeicExamCommandHandlerTests
{
    private static Profile SeedProfile(Guid id) => new()
    {
        Id = id,
        Email = "toeic@test.local",
        FullName = "Toeic Tester"
    };

    private static SubmitToeicExamCommand Cmd(int listening, int reading, Dictionary<string, string>? answers = null) =>
        new("ets_2024_01", listening, reading, 7200, answers ?? new Dictionary<string, string> { ["q1"] = "A" });

    /// <summary>TO-09: submit persists the result row and awards XP.</summary>
    [Test]
    [Property("PlanId", "TO-09")]
    public async Task Handle_ValidSubmission_PersistsResultAndAwardsXp()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.Profiles.Add(SeedProfile(userId));
        await db.SaveChangesAsync();
        var handler = new SubmitToeicExamCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(Cmd(100, 100), CancellationToken.None);

        // Assert
        var saved = await db.ToeicTestResults.SingleAsync();
        var profile = await db.Profiles.SingleAsync(p => p.Id == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.TotalScaledScore, Is.EqualTo(990));
            Assert.That(response.Data.XpAwarded, Is.EqualTo(50));
            Assert.That(saved.UserId, Is.EqualTo(userId));
            Assert.That(saved.TestId, Is.EqualTo("ets_2024_01"));
            Assert.That(saved.ExamType, Is.EqualTo(ExamType.Toeic));
            Assert.That(saved.TotalScore, Is.EqualTo(990));
            Assert.That(saved.DurationSeconds, Is.EqualTo(7200));
            Assert.That(profile.TotalXp, Is.EqualTo(50));
        });
    }

    /// <summary>TO-09: anonymous caller is rejected.</summary>
    [Test]
    [Property("PlanId", "TO-09")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new SubmitToeicExamCommandHandler(TestHelpers.CreateUser(null), db);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(Cmd(10, 10), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>
    /// TO-10: the original system grades on the server from the answer key; a client claiming 100/100 correct
    /// with no answers must not receive 990. C# trusts the client counts.
    /// </summary>
    [Test]
    [Property("PlanId", "TO-10")]
    [Category("KnownDeviation")]
    public async Task Handle_ClientClaimsPerfectScoreWithoutAnswers_ServerDoesNotTrustClaim()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.Profiles.Add(SeedProfile(userId));
        await db.SaveChangesAsync();
        var handler = new SubmitToeicExamCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(
            Cmd(100, 100, new Dictionary<string, string>()), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.ListeningCorrect, Is.EqualTo(0));
            Assert.That(response.Data.ReadingCorrect, Is.EqualTo(0));
            Assert.That(response.Data.TotalScaledScore, Is.EqualTo(10));
        });
    }

    /// <summary>TO-12: resubmitting the same test must not farm XP repeatedly (only once).</summary>
    [Test]
    [Property("PlanId", "TO-12")]
    [Category("KnownDeviation")]
    public async Task Handle_SameTestSubmittedTwice_AwardsXpOnlyOnce()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.Profiles.Add(SeedProfile(userId));
        await db.SaveChangesAsync();
        var handler = new SubmitToeicExamCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        await handler.Handle(Cmd(50, 50), CancellationToken.None);
        await handler.Handle(Cmd(50, 50), CancellationToken.None);

        // Assert
        var profile = await db.Profiles.SingleAsync(p => p.Id == userId);
        Assert.That(profile.TotalXp, Is.EqualTo(50));
    }

    /// <summary>TO-11: scoring goes through the ETS engine (0/0 -> 10, A1).</summary>
    [Test]
    [Property("PlanId", "TO-11")]
    public async Task Handle_ZeroCorrect_ReturnsMinimumScoreAndA1()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        db.Profiles.Add(SeedProfile(userId));
        await db.SaveChangesAsync();
        var handler = new SubmitToeicExamCommandHandler(TestHelpers.CreateUser(userId), db);

        // Act
        var response = await handler.Handle(Cmd(0, 0), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Data!.TotalScaledScore, Is.EqualTo(10));
            Assert.That(response.Data.CertLevel, Is.EqualTo(CertLevel.A1));
        });
    }

    /// <summary>TO-13: validator boundaries.</summary>
    [TestCase("t1", 0, 0, 0, true)]
    [TestCase("t1", 100, 100, 3600, true)]
    [TestCase("t1", 101, 0, 0, false)]
    [TestCase("t1", 0, 101, 0, false)]
    [TestCase("t1", -1, 0, 0, false)]
    [TestCase("t1", 0, -1, 0, false)]
    [TestCase("t1", 0, 0, -1, false)]
    [TestCase("", 0, 0, 0, false)]
    [Property("PlanId", "TO-13")]
    public void Validator_Boundaries_ReturnsExpectedValidity(string testId, int l, int r, int duration, bool expected)
    {
        // Arrange
        var validator = new SubmitToeicExamCommandValidator();
        var command = new SubmitToeicExamCommand(testId, l, r, duration, new Dictionary<string, string>());

        // Act
        var result = validator.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }
}

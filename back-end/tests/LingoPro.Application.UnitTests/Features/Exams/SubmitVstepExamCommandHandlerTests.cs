using LingoPro.Application.Features.Exams.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Exams;

/// <summary>
/// Unit tests for <see cref="SubmitVstepExamCommandHandler"/> and <see cref="SubmitVstepExamCommandValidator"/>
/// (plan IDs VS-01..VS-05, VS-03/04): CEFR boundaries, 0.5 rounding, persistence (score x10) and validation.
/// </summary>
[TestFixture]
[Category("Exams")]
public sealed class SubmitVstepExamCommandHandlerTests
{
    private static async Task<(SubmitVstepExamCommandHandler Handler, LingoPro.Infrastructure.Persistence.LingoProDbContext Db, Guid UserId)> ArrangeAsync()
    {
        var userId = Guid.NewGuid();
        var db = TestHelpers.CreateDb();
        db.Profiles.Add(new Profile { Id = userId, Email = "vstep@test.local", FullName = "Vstep Tester" });
        await db.SaveChangesAsync();
        return (new SubmitVstepExamCommandHandler(TestHelpers.CreateUser(userId), db), db, userId);
    }

    private static SubmitVstepExamCommand Uniform(double score, ExamType type = ExamType.Vstep) =>
        new(type, "vstep_01", score, score, score, score);

    /// <summary>VS-01: CEFR boundaries on the 10-point scale (original: src/lib/vstep-scoring.ts:56-59 and roundVstepScore :16-26).</summary>
    [TestCase(3.5, CertLevel.A2)]
    [TestCase(4.0, CertLevel.B1)]
    [TestCase(5.5, CertLevel.B1)]
    [TestCase(6.0, CertLevel.B2)]
    [TestCase(8.0, CertLevel.B2)]
    [TestCase(8.5, CertLevel.C1)]
    [Property("PlanId", "VS-01")]
    public async Task Handle_UniformScore_MapsToExpectedCefr(double score, CertLevel expected)
    {
        // Arrange
        var (handler, db, _) = await ArrangeAsync();
        await using var _db = db;

        // Act
        var response = await handler.Handle(Uniform(score), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.CertLevel, Is.EqualTo(expected));
    }

    /// <summary>VS-02: overall score rounds to the nearest 0.5 (.25 -> .5, .75 -> next integer).</summary>
    [TestCase(5.24, 5.0)]
    [TestCase(5.25, 5.5)]
    [TestCase(5.74, 5.5)]
    [TestCase(5.75, 6.0)]
    [Property("PlanId", "VS-02")]
    public async Task Handle_UniformScore_RoundsOverallToHalfPoint(double score, double expectedOverall)
    {
        // Arrange
        var (handler, db, _) = await ArrangeAsync();
        await using var _db = db;

        // Act
        var response = await handler.Handle(Uniform(score), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.OverallScore, Is.EqualTo(expectedOverall).Within(1e-9));
    }

    /// <summary>VS-04: an overall score below 4.0 (after 0.5 rounding, so 3.7 -> 3.5) is not B1 or higher.</summary>
    [Test]
    [Property("PlanId", "VS-04")]
    public async Task Handle_OverallBelowFour_IsBelowB1()
    {
        // Arrange
        var (handler, db, _) = await ArrangeAsync();
        await using var _db = db;

        // Act
        var response = await handler.Handle(Uniform(3.7), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.CertLevel, Is.LessThan(CertLevel.B1));
    }

    /// <summary>VS-05: persists scores multiplied by 10, ExamType, and awards XP.</summary>
    [Test]
    [Property("PlanId", "VS-05")]
    public async Task Handle_ValidSubmission_PersistsScoresTimesTenAndExamType()
    {
        // Arrange
        var (handler, db, userId) = await ArrangeAsync();
        await using var _db = db;
        var command = new SubmitVstepExamCommand(ExamType.VnuBac3, "vnu_01", 7.0, 6.5, 6.0, 5.5);

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        var saved = await db.ToeicTestResults.SingleAsync();
        var gamification = await db.UserGamifications.SingleAsync(g => g.UserId == userId);
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.OverallScore, Is.EqualTo(6.5));
            Assert.That(saved.ExamType, Is.EqualTo(ExamType.VnuBac3));
            Assert.That(saved.TestId, Is.EqualTo("vnu_01"));
            Assert.That(saved.ListeningScaledScore, Is.EqualTo(70));
            Assert.That(saved.ReadingScaledScore, Is.EqualTo(65));
            Assert.That(saved.TotalScore, Is.EqualTo(65));
            Assert.That(gamification.TotalXp, Is.EqualTo(50));
        });
    }

    /// <summary>VS-03: scores outside 0..10 are rejected by the validator.</summary>
    [TestCase(-0.1, false)]
    [TestCase(0.0, true)]
    [TestCase(10.0, true)]
    [TestCase(10.1, false)]
    [Property("PlanId", "VS-03")]
    public void Validator_ScoreBoundaries_ReturnsExpectedValidity(double score, bool expected)
    {
        // Arrange
        var validator = new SubmitVstepExamCommandValidator();

        // Act
        var result = validator.Validate(Uniform(score));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>VS-03: missing TestId / invalid ExamType rejected.</summary>
    [Test]
    [Property("PlanId", "VS-03")]
    public void Validator_EmptyTestIdOrInvalidExamType_IsInvalid()
    {
        // Arrange
        var validator = new SubmitVstepExamCommandValidator();

        // Act
        var emptyTest = validator.Validate(new SubmitVstepExamCommand(ExamType.Vstep, "", 5, 5, 5, 5));
        var badType = validator.Validate(new SubmitVstepExamCommand((ExamType)99, "t", 5, 5, 5, 5));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(emptyTest.IsValid, Is.False);
            Assert.That(badType.IsValid, Is.False);
        });
    }
}

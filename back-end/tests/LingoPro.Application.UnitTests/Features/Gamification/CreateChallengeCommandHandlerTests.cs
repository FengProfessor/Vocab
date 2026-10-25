using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Gamification.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using LingoPro.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Gamification;

/// <summary>
/// NUnit business unit tests for <see cref="CreateChallengeCommandHandler"/>, <see cref="CreateChallengeCommandValidator"/>
/// and the authorization of <see cref="CreateChallengeCommand"/> (plan IDs GAM-25..GAM-27).
/// The challenge is aligned to <c>public.challenges</c>: <c>Name</c>/<c>Slug</c>, <c>StartsAt</c>/<c>EndsAt</c>,
/// <c>DurationDays</c>, <c>DepositAmount</c> (int), <c>DailyCriteria</c> jsonb, <c>CreatedBy</c>.
/// </summary>
[TestFixture]
[Category("Gamification")]
public sealed class CreateChallengeCommandHandlerTests
{
    private static readonly DateOnly Start = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(7);

    private static CreateChallengeCommand NewCommand(
        string title = "  30-day vocab sprint ",
        string description = "  Learn 20 words per day ",
        DateOnly? start = null,
        DateOnly? end = null,
        int dailyWords = 20,
        int maxParticipants = 100,
        decimal deposit = 100000m) => new(
        title,
        description,
        start ?? Start,
        end ?? Start.AddDays(30),
        dailyWords,
        maxParticipants,
        deposit);

    /// <summary>GAM-25: a teacher creates a challenge; the creator, trimmed texts, schedule, targets and deposit are persisted.</summary>
    [Test]
    [Property("PlanId", "GAM-25")]
    public async Task Handle_TeacherCreatesChallenge_PersistsChallengeAndReturns201()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(teacherId, UserRole.Teacher);
        var handler = new CreateChallengeCommandHandler(user, new GamificationRepository(db));
        var command = NewCommand();

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        var challenge = await db.Challenges.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(response.Data!.Id, Is.EqualTo(challenge.Id));
            Assert.That(challenge.CreatedBy, Is.EqualTo(teacherId));
            Assert.That(challenge.Name, Is.EqualTo("30-day vocab sprint"));
            Assert.That(challenge.Slug, Does.StartWith("30-day-vocab-sprint"), "slug derives from the name (src/lib/challenge.ts:370-381).");
            Assert.That(challenge.Description, Is.EqualTo("Learn 20 words per day"));
            Assert.That(DateOnly.FromDateTime(challenge.StartsAt), Is.EqualTo(command.StartDate));
            Assert.That(DateOnly.FromDateTime(challenge.EndsAt), Is.EqualTo(command.EndDate));
            Assert.That(challenge.DurationDays, Is.EqualTo(30));
            Assert.That(challenge.MaxParticipants, Is.EqualTo(100));
            Assert.That(challenge.DepositAmount, Is.EqualTo(100000));
            Assert.That(challenge.RegistrationOpensAt, Is.LessThan(challenge.RegistrationClosesAt), "schema constraint chk_registration_window");
        });
    }

    /// <summary>
    /// GAM-25: the SQL schema has no <c>daily_target_words</c> column; the daily target is stored as
    /// <c>daily_criteria.min_srs_reviews</c> (schema.sql challenges.daily_criteria; src/lib/challenge.ts:74-92).
    /// </summary>
    [Test]
    [Property("PlanId", "GAM-25")]
    public async Task Handle_DailyTargetWords_IsStoredAsMinSrsReviewsInDailyCriteria()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Teacher), new GamificationRepository(db));

        // Act
        await handler.Handle(NewCommand(dailyWords: 25), CancellationToken.None);

        // Assert
        var challenge = await db.Challenges.SingleAsync();
        using var criteria = System.Text.Json.JsonDocument.Parse(challenge.DailyCriteria);
        Assert.That(criteria.RootElement.GetProperty("min_srs_reviews").GetInt32(), Is.EqualTo(25));
    }

    /// <summary>
    /// GAM-25: a freshly created challenge is a draft (schema default <c>status = 'draft'</c>) and only becomes joinable once
    /// <c>open</c> (join/route.ts:25), so creation must not make it Active.
    /// </summary>
    [Test]
    [Property("PlanId", "GAM-25")]
    [Category("KnownDeviation")] // C# creates the challenge directly as Active, which the original join rule rejects (not 'open').
    public async Task Handle_NewChallenge_StartsAsDraft()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateChallengeCommandHandler(TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Teacher), new GamificationRepository(db));

        // Act
        var response = await handler.Handle(NewCommand(), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(db.Challenges.Single().Status, Is.EqualTo(ChallengeStatus.Draft));
            Assert.That(response.Data!.Status, Is.EqualTo(ChallengeStatus.Draft));
        });
    }

    /// <summary>GAM-25: anonymous callers cannot create challenges.</summary>
    [Test]
    [Property("PlanId", "GAM-25")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateChallengeCommandHandler(TestHelpers.CreateUser(null), new GamificationRepository(db));

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(NewCommand(), CancellationToken.None));
    }

    /// <summary>GAM-27: a student is rejected by the authorization pipeline before the handler runs (challenges/route.ts:54-56).</summary>
    [Test]
    [Property("PlanId", "GAM-27")]
    public async Task Handle_CallerIsStudent_ThrowsForbiddenViaAuthorizationBehavior()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Student);
        var behavior = new AuthorizationBehavior<CreateChallengeCommand, ApiResponse<ChallengeDto>>(user);
        var handler = new CreateChallengeCommandHandler(user, new GamificationRepository(db));
        var command = NewCommand();

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(async () => await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None));
        Assert.That(await db.Challenges.CountAsync(), Is.EqualTo(0));
    }

    /// <summary>GAM-26: a teacher passes the authorization pipeline and the challenge is created.</summary>
    [Test]
    [Property("PlanId", "GAM-26")]
    public async Task Handle_CallerIsTeacher_PassesAuthorizationBehavior()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Teacher);
        var behavior = new AuthorizationBehavior<CreateChallengeCommand, ApiResponse<ChallengeDto>>(user);
        var handler = new CreateChallengeCommandHandler(user, new GamificationRepository(db));
        var command = NewCommand();

        // Act
        var response = await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(db.Challenges.Count(), Is.EqualTo(1));
        });
    }

    /// <summary>GAM-27: the original create route allows only <c>role = 'teacher'</c>; an admin gets 403 (src/app/api/challenges/route.ts:54-56) and no admin-specific challenge route exists.</summary>
    [Test]
    [Property("PlanId", "GAM-27")]
    [Category("KnownDeviation")] // C# [Authorize(Teacher, Admin)] lets admins create challenges.
    public async Task Handle_CallerIsAdmin_ThrowsForbiddenViaAuthorizationBehavior()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Admin);
        var behavior = new AuthorizationBehavior<CreateChallengeCommand, ApiResponse<ChallengeDto>>(user);
        var handler = new CreateChallengeCommandHandler(user, new GamificationRepository(db));
        var command = NewCommand();

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(async () => await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None));
        Assert.That(await db.Challenges.CountAsync(), Is.EqualTo(0));
    }

    /// <summary>GAM-26: validator accepts a well-formed command and a free (0 deposit) challenge (schema: deposit_amount &gt;= 0).</summary>
    [Test]
    [Property("PlanId", "GAM-26")]
    public void Validate_WellFormedCommand_IsValid()
    {
        // Arrange
        var validator = new CreateChallengeCommandValidator();

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(validator.Validate(NewCommand()).IsValid, Is.True);
            Assert.That(validator.Validate(NewCommand(deposit: 0m)).IsValid, Is.True);
        });
    }

    /// <summary>GAM-26: the end date must be strictly after the start date.</summary>
    [TestCase(1, true, TestName = "Validate_EndDateOneDayAfterStart_IsValid")]
    [TestCase(0, false, TestName = "Validate_EndDateEqualsStart_IsInvalid")]
    [TestCase(-1, false, TestName = "Validate_EndDateBeforeStart_IsInvalid")]
    [Property("PlanId", "GAM-26")]
    public void Validate_EndDate_MustBeAfterStartDate(int offsetDays, bool expectedValid)
    {
        // Arrange
        var validator = new CreateChallengeCommandValidator();
        var command = NewCommand(end: Start.AddDays(offsetDays));

        // Act
        var result = validator.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    /// <summary>GAM-26: daily target (min SRS reviews) must be between 5 and 200.</summary>
    [TestCase(4, false)]
    [TestCase(5, true)]
    [TestCase(200, true)]
    [TestCase(201, false)]
    [Property("PlanId", "GAM-26")]
    public void Validate_DailyTargetWords_BetweenFiveAndTwoHundred(int words, bool expectedValid)
    {
        // Arrange
        var validator = new CreateChallengeCommandValidator();

        // Act
        var result = validator.Validate(NewCommand(dailyWords: words));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    /// <summary>GAM-26: max participants must be between 2 and 5000.</summary>
    [TestCase(1, false)]
    [TestCase(2, true)]
    [TestCase(5000, true)]
    [TestCase(5001, false)]
    [Property("PlanId", "GAM-26")]
    public void Validate_MaxParticipants_BetweenTwoAndFiveThousand(int max, bool expectedValid)
    {
        // Arrange
        var validator = new CreateChallengeCommandValidator();

        // Act
        var result = validator.Validate(NewCommand(maxParticipants: max));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    /// <summary>GAM-26: deposit cannot be negative (schema CHECK deposit_amount &gt;= 0).</summary>
    [TestCase(-1, false)]
    [TestCase(0, true)]
    [TestCase(500000, true)]
    [Property("PlanId", "GAM-26")]
    public void Validate_DepositAmount_CannotBeNegative(int deposit, bool expectedValid)
    {
        // Arrange
        var validator = new CreateChallengeCommandValidator();

        // Act
        var result = validator.Validate(NewCommand(deposit: deposit));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expectedValid));
    }

    /// <summary>GAM-26: title and description are required and the title is limited to 150 characters.</summary>
    [Test]
    [Property("PlanId", "GAM-26")]
    public void Validate_TitleAndDescription_AreRequiredAndTitleMax150()
    {
        // Arrange
        var validator = new CreateChallengeCommandValidator();

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(validator.Validate(NewCommand(title: "")).IsValid, Is.False);
            Assert.That(validator.Validate(NewCommand(description: "")).IsValid, Is.False);
            Assert.That(validator.Validate(NewCommand(title: new string('a', 150))).IsValid, Is.True);
            Assert.That(validator.Validate(NewCommand(title: new string('a', 151))).IsValid, Is.False);
        });
    }
}

using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Gamification.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Gamification;

/// <summary>
/// NUnit business unit tests for <see cref="CreateChallengeCommandHandler"/>, <see cref="CreateChallengeCommandValidator"/>
/// and the teacher/admin-only authorization of <see cref="CreateChallengeCommand"/> (plan IDs GAM-25..GAM-27).
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

    /// <summary>GAM-25: a teacher creates a challenge; the creator, trimmed texts, targets and deposit are persisted.</summary>
    [Test]
    [Property("PlanId", "GAM-25")]
    public async Task Handle_TeacherCreatesChallenge_PersistsChallengeAndReturns201()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(teacherId, UserRole.Teacher);
        var handler = new CreateChallengeCommandHandler(user, db);
        var command = NewCommand();

        // Act
        var response = await handler.Handle(command, CancellationToken.None);

        // Assert
        var challenge = await db.Challenges.SingleAsync();
        Assert.Multiple(() =>
        {
            Assert.That(response.StatusCode, Is.EqualTo(201));
            Assert.That(response.Data!.Id, Is.EqualTo(challenge.Id));
            Assert.That(challenge.CreatorId, Is.EqualTo(teacherId));
            Assert.That(challenge.Title, Is.EqualTo("30-day vocab sprint"));
            Assert.That(challenge.Description, Is.EqualTo("Learn 20 words per day"));
            Assert.That(challenge.StartDate, Is.EqualTo(command.StartDate));
            Assert.That(challenge.EndDate, Is.EqualTo(command.EndDate));
            Assert.That(challenge.DailyTargetWords, Is.EqualTo(20));
            Assert.That(challenge.MaxParticipants, Is.EqualTo(100));
            Assert.That(challenge.DepositAmount, Is.EqualTo(100000m));
        });
    }

    /// <summary>GAM-25: anonymous callers cannot create challenges.</summary>
    [Test]
    [Property("PlanId", "GAM-25")]
    public async Task Handle_AnonymousCaller_ThrowsUnauthorized()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new CreateChallengeCommandHandler(TestHelpers.CreateUser(null), db);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(NewCommand(), CancellationToken.None));
    }

    /// <summary>GAM-27: a student is rejected by the authorization pipeline before the handler runs.</summary>
    [Test]
    [Property("PlanId", "GAM-27")]
    public async Task Handle_CallerIsStudent_ThrowsForbiddenViaAuthorizationBehavior()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Student);
        var behavior = new AuthorizationBehavior<CreateChallengeCommand, ApiResponse<ChallengeDto>>(user);
        var handler = new CreateChallengeCommandHandler(user, db);
        var command = NewCommand();

        // Act & Assert
        Assert.ThrowsAsync<ForbiddenAccessException>(async () => await behavior.Handle(
            command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None));
        Assert.That(await db.Challenges.CountAsync(), Is.EqualTo(0));
    }

    /// <summary>GAM-26: teachers and admins pass the authorization pipeline and the challenge is created.</summary>
    [TestCase(UserRole.Teacher, TestName = "Handle_CallerIsTeacher_PassesAuthorizationBehavior")]
    [TestCase(UserRole.Admin, TestName = "Handle_CallerIsAdmin_PassesAuthorizationBehavior")]
    [Property("PlanId", "GAM-26")]
    public async Task Handle_TeacherOrAdmin_PassesAuthorizationBehaviorAndCreatesChallenge(UserRole role)
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var user = TestHelpers.CreateUser(Guid.NewGuid(), role);
        var behavior = new AuthorizationBehavior<CreateChallengeCommand, ApiResponse<ChallengeDto>>(user);
        var handler = new CreateChallengeCommandHandler(user, db);
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

    /// <summary>GAM-26: validator accepts a well-formed command and a free (0 deposit) challenge.</summary>
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

    /// <summary>GAM-26: daily target words must be between 5 and 200.</summary>
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

    /// <summary>GAM-26: deposit cannot be negative.</summary>
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

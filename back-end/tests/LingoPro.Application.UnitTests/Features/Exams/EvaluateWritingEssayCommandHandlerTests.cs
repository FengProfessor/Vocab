using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Exams.Commands;
using LingoPro.Domain.Enums;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Exams;

/// <summary>
/// Unit tests for <see cref="EvaluateWritingEssayCommandHandler"/> (router delegation, VS-09) and
/// <see cref="EvaluateWritingEssayCommandValidator"/> (essay length, VS-10).
/// </summary>
[TestFixture]
[Category("Exams")]
public sealed class EvaluateWritingEssayCommandHandlerTests
{
    /// <summary>VS-09: the essay is graded through the AI router and its result returned unchanged.</summary>
    [Test]
    [Property("PlanId", "VS-09")]
    public async Task Handle_ValidEssay_DelegatesToAiRouter()
    {
        // Arrange
        var router = Substitute.For<IAiRouterService>();
        var expected = new AiWritingEvaluationDto(6, 6.5, 7, 5.5, 6.5, "ok", "sample");
        router.EvaluateEssayAsync(ExamType.Vstep, "prompt", "essay body", Arg.Any<CancellationToken>())
            .Returns(expected);
        var handler = new EvaluateWritingEssayCommandHandler(router);

        // Act
        var response = await handler.Handle(
            new EvaluateWritingEssayCommand(ExamType.Vstep, "prompt", "essay body"), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.EqualTo(expected));
        });
        await router.Received(1).EvaluateEssayAsync(ExamType.Vstep, "prompt", "essay body", Arg.Any<CancellationToken>());
    }

    /// <summary>VS-10: essay length boundaries 29/30 and 10000/10001.</summary>
    [TestCase(29, false)]
    [TestCase(30, true)]
    [TestCase(10000, true)]
    [TestCase(10001, false)]
    [Property("PlanId", "VS-10")]
    public void Validator_EssayLength_Boundaries(int length, bool expected)
    {
        // Arrange
        var validator = new EvaluateWritingEssayCommandValidator();
        var command = new EvaluateWritingEssayCommand(ExamType.Vstep, "prompt", new string('a', length));

        // Act
        var result = validator.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>VS-11: empty prompt, empty essay or invalid ExamType are rejected.</summary>
    [Test]
    [Property("PlanId", "VS-11")]
    public void Validator_EmptyPromptEmptyEssayOrBadExamType_IsInvalid()
    {
        // Arrange
        var validator = new EvaluateWritingEssayCommandValidator();
        var essay = new string('a', 40);

        // Act
        var noPrompt = validator.Validate(new EvaluateWritingEssayCommand(ExamType.Vstep, "", essay));
        var noEssay = validator.Validate(new EvaluateWritingEssayCommand(ExamType.Vstep, "p", ""));
        var badType = validator.Validate(new EvaluateWritingEssayCommand((ExamType)99, "p", essay));

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(noPrompt.IsValid, Is.False);
            Assert.That(noEssay.IsValid, Is.False);
            Assert.That(badType.IsValid, Is.False);
        });
    }
}

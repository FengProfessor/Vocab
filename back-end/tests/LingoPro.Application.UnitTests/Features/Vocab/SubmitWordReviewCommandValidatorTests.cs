using LingoPro.Application.Features.Vocab.Commands;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Vocab;

/// <summary>
/// Validation tests for <see cref="SubmitWordReviewCommandValidator"/> (quality scale of the original system).
/// </summary>
[TestFixture]
[Category("Vocab")]
public sealed class SubmitWordReviewCommandValidatorTests
{
    private readonly SubmitWordReviewCommandValidator _validator = new();

    [TestCase(0)]
    [TestCase(3)]
    [TestCase(4)]
    [TestCase(5)]
    [Property("PlanId", "VOC-02")]
    public void Validate_AllowedQuality_IsValid(int quality)
    {
        // Arrange
        var command = new SubmitWordReviewCommand(Guid.NewGuid(), quality, Guid.NewGuid().ToString());

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    [TestCase(1)]
    [TestCase(2)]
    [TestCase(6)]
    [TestCase(-1)]
    [Property("PlanId", "VOC-02")]
    [Category("KnownDeviation")]
    public void Validate_QualityOutsideZeroThreeFourFive_IsInvalid(int quality)
    {
        // Arrange (original accepts only quality in {0,3,4,5}; C# accepts 0..5)
        var command = new SubmitWordReviewCommand(Guid.NewGuid(), quality, Guid.NewGuid().ToString());

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.False);
    }

    /// <summary>
    /// Original requires reviewId to be a UUID (src/app/api/words/srs/route.ts:183-188); the validator only checks non-empty.
    /// </summary>
    [TestCase("not-a-uuid")]
    [TestCase("rev-1")]
    [Property("PlanId", "VOC-03")]
    [Category("KnownDeviation")]
    public void Validate_ReviewIdNotUuid_IsInvalid(string reviewId)
    {
        // Arrange
        var command = new SubmitWordReviewCommand(Guid.NewGuid(), 4, reviewId);

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.That(result.IsValid, Is.False);
    }

    [Test]
    [Property("PlanId", "VOC-03")]
    public void Validate_EmptyReviewIdOrWordId_IsInvalid()
    {
        // Arrange
        var noReview = new SubmitWordReviewCommand(Guid.NewGuid(), 4, "");
        var noWord = new SubmitWordReviewCommand(Guid.Empty, 4, Guid.NewGuid().ToString());

        // Act + Assert
        Assert.Multiple(() =>
        {
            Assert.That(_validator.Validate(noReview).IsValid, Is.False);
            Assert.That(_validator.Validate(noWord).IsValid, Is.False);
        });
    }
}
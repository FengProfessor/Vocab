using LingoPro.Application.Common.Behaviors;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.AiCoaching.Commands;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.AiCoaching;

/// <summary>
/// Unit tests for <see cref="AnalyzeSentenceCommandHandler"/> and <see cref="AnalyzeSentenceCommandValidator"/>
/// (plan IDs AI-01..AI-04): router delegation with a mocked <see cref="IAiRouterService"/>, Pro gate and input rules.
/// </summary>
[TestFixture]
[Category("AiCoaching")]
public sealed class AnalyzeSentenceCommandHandlerTests
{
    private static AiSentenceAnalysisDto Analysis() =>
        new("main", ["sub"], new { s = "I" }, ["L1"], [new { t = "chunk" }], "router");

    /// <summary>AI-01: the sentence and context are forwarded to the router and its analysis returned.</summary>
    [Test]
    [Property("PlanId", "AI-01")]
    public async Task Handle_ValidSentence_DelegatesToRouter()
    {
        // Arrange
        var router = Substitute.For<IAiRouterService>();
        var analysis = Analysis();
        router.AnalyzeSentenceStructureAsync("I like tea.", "ctx", Arg.Any<CancellationToken>()).Returns(analysis);
        var handler = new AnalyzeSentenceCommandHandler(router);

        // Act
        var response = await handler.Handle(new AnalyzeSentenceCommand("I like tea.", "ctx"), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.SameAs(analysis));
        });
        await router.Received(1).AnalyzeSentenceStructureAsync("I like tea.", "ctx", Arg.Any<CancellationToken>());
    }

    /// <summary>Builds a multi-word sentence of exactly <paramref name="length"/> characters.</summary>
    private static string Sentence(int length) => length < 6 ? new string('a', length) : "aaaa " + new string('a', length - 5);

    /// <summary>AI-02: sentence length boundaries that both systems agree on (empty rejected, 400 characters accepted).</summary>
    [TestCase(0, false)]
    [TestCase(10, true)]
    [TestCase(400, true)]
    [Property("PlanId", "AI-02")]
    public void Validator_SentenceLength_Boundaries(int length, bool expected)
    {
        // Arrange
        var validator = new AnalyzeSentenceCommandValidator();

        // Act
        var result = validator.Validate(new AnalyzeSentenceCommand(Sentence(length)));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>
    /// AI-02: the original rejects sentences over 400 characters (src/app/api/dictionary/ai-sentence/route.ts:392-394,
    /// "sentence too long (max 400)"); the validator allows up to 1500.
    /// </summary>
    [TestCase(401)]
    [TestCase(1500)]
    [TestCase(1501)]
    [Property("PlanId", "AI-02")]
    [Category("KnownDeviation")]
    public void Validator_SentenceOver400Characters_IsInvalid(int length)
    {
        // Arrange
        var validator = new AnalyzeSentenceCommandValidator();

        // Act
        var result = validator.Validate(new AnalyzeSentenceCommand(Sentence(length)));

        // Assert
        Assert.That(result.IsValid, Is.False);
    }

    /// <summary>
    /// AI-02: a single short word is rejected with USE_WORD_LOOKUP - the sentence must have at least two words or
    /// more than 40 characters (ai-sentence/route.ts:55-61, 398-404); the validator only requires 4 characters.
    /// </summary>
    [TestCase("Hello")]
    [TestCase("Tea.")]
    [Property("PlanId", "AI-02")]
    [Category("KnownDeviation")]
    public void Validator_SingleShortWord_IsInvalid(string sentence)
    {
        // Arrange
        var validator = new AnalyzeSentenceCommandValidator();

        // Act
        var result = validator.Validate(new AnalyzeSentenceCommand(sentence));

        // Assert
        Assert.That(result.IsValid, Is.False);
    }
    /// <summary>AI-03: sentence analysis is a Pro feature - a free user is rejected with PRO_REQUIRED, a Pro user passes.</summary>
    [TestCase(SubscriptionPlanType.Free, false)]
    [TestCase(SubscriptionPlanType.Pro, true)]
    [TestCase(SubscriptionPlanType.Premium, true)]
    [Property("PlanId", "AI-03")]
    public async Task Pipeline_ProGate_EnforcedForSentenceAnalysis(SubscriptionPlanType plan, bool allowed)
    {
        // Arrange
        var router = Substitute.For<IAiRouterService>();
        router.AnalyzeSentenceStructureAsync(Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>())
            .Returns(Analysis());
        var user = TestHelpers.CreateUser(Guid.NewGuid(), UserRole.Student, plan);
        var behavior = new AuthorizationBehavior<AnalyzeSentenceCommand, ApiResponse<AiSentenceAnalysisDto>>(user);
        var handler = new AnalyzeSentenceCommandHandler(router);
        var command = new AnalyzeSentenceCommand("I like tea.");

        // Act
        Task<ApiResponse<AiSentenceAnalysisDto>> Run() =>
            behavior.Handle(command, () => handler.Handle(command, CancellationToken.None), CancellationToken.None);

        // Assert
        if (allowed)
        {
            Assert.That((await Run()).Success, Is.True);
        }
        else
        {
            var ex = Assert.ThrowsAsync<ForbiddenAccessException>(async () => await Run());
            Assert.That(ex!.ErrorCode, Is.EqualTo("PRO_REQUIRED"));
            await router.DidNotReceive().AnalyzeSentenceStructureAsync(
                Arg.Any<string>(), Arg.Any<string?>(), Arg.Any<CancellationToken>());
        }
    }
}

/// <summary>
/// Unit tests for <see cref="EvaluateSpeakingDialogueCommandHandler"/> and its validator
/// (plan IDs AI-06, AI-13, AI-14): router delegation and transcript/topic validation.
/// </summary>
[TestFixture]
[Category("AiCoaching")]
public sealed class EvaluateSpeakingDialogueCommandHandlerTests
{
    /// <summary>AI-06: topic, transcript and history are passed to the router; feedback returned unchanged.</summary>
    [Test]
    [Property("PlanId", "AI-06")]
    public async Task Handle_ValidDialogue_DelegatesToRouter()
    {
        // Arrange
        var router = Substitute.For<IAiRouterService>();
        var history = new List<string> { "Hi", "Hello" };
        var feedback = new AiSpeakingFeedbackDto("resp", "fb", "suggest");
        router.EvaluateSpeakingDialogueAsync("Travel", "I go to Hanoi", history, Arg.Any<CancellationToken>())
            .Returns(feedback);
        var handler = new EvaluateSpeakingDialogueCommandHandler(router);

        // Act
        var response = await handler.Handle(
            new EvaluateSpeakingDialogueCommand("Travel", "I go to Hanoi", history), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.EqualTo(feedback));
        });
    }

    /// <summary>AI-13: topic required, max 200.</summary>
    [TestCase(0, false)]
    [TestCase(1, true)]
    [TestCase(200, true)]
    [TestCase(201, false)]
    [Property("PlanId", "AI-13")]
    public void Validator_TopicLength_Boundaries(int length, bool expected)
    {
        // Arrange
        var validator = new EvaluateSpeakingDialogueCommandValidator();

        // Act
        var result = validator.Validate(new EvaluateSpeakingDialogueCommand(new string('t', length), "hello", []));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>AI-14: transcript required, max 2000.</summary>
    [TestCase(0, false)]
    [TestCase(1, true)]
    [TestCase(2000, true)]
    [TestCase(2001, false)]
    [Property("PlanId", "AI-14")]
    public void Validator_TranscriptLength_Boundaries(int length, bool expected)
    {
        // Arrange
        var validator = new EvaluateSpeakingDialogueCommandValidator();

        // Act
        var result = validator.Validate(new EvaluateSpeakingDialogueCommand("topic", new string('x', length), []));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }
}

/// <summary>
/// Unit tests for <see cref="UploadSpeakingAudioCommandHandler"/> and <see cref="UploadSpeakingAudioCommandValidator"/>
/// (plan IDs AI-09..AI-12): empty upload, 10 MB boundary, MIME whitelist, storage delegation (mocked storage).
/// </summary>
[TestFixture]
[Category("AiCoaching")]
public sealed class UploadSpeakingAudioCommandHandlerTests
{
    private const long TenMb = 10 * 1024 * 1024;

    private static UploadSpeakingAudioCommand Upload(long size, string mime = "audio/webm") =>
        new(new MemoryStream(new byte[] { 1, 2, 3 }), "rec.webm", mime, size, 12.5);

    /// <summary>AI-09: empty file (0 bytes) is rejected; 1 byte is accepted.</summary>
    [TestCase(0L, false)]
    [TestCase(-1L, false)]
    [TestCase(1L, true)]
    [Property("PlanId", "AI-09")]
    public void Validator_EmptyFile_Rejected(long size, bool expected)
    {
        // Arrange
        var validator = new UploadSpeakingAudioCommandValidator();

        // Act
        var result = validator.Validate(Upload(size));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>AI-10: size boundary at exactly 10 MB and 10 MB + 1 byte (original: upload-audio/route.ts:11, 79-90).</summary>
    [TestCase(TenMb - 1, true)]
    [TestCase(TenMb, true)]
    [TestCase(TenMb + 1, false)]
    [Property("PlanId", "AI-10")]
    public void Validator_SizeBoundary_TenMegabytes(long size, bool expected)
    {
        // Arrange
        var validator = new UploadSpeakingAudioCommandValidator();

        // Act
        var result = validator.Validate(Upload(size));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>
    /// AI-11: MIME types accepted by both systems (original normalizes to lowercase without parameters, then matches
    /// the whitelist: src/app/api/speaking/upload-audio/route.ts:14-21, 101-103) and clearly rejected types.
    /// </summary>
    [TestCase("audio/webm", true)]
    [TestCase("audio/webm;codecs=opus", true)]
    [TestCase("AUDIO/MP4", true)]
    [TestCase("audio/wav", true)]
    [TestCase("audio/aac", true)]
    [TestCase("audio/ogg", true)]
    [TestCase("video/mp4", false)]
    [TestCase("image/png", false)]
    [TestCase("application/octet-stream", false)]
    [TestCase("", false)]
    [Property("PlanId", "AI-11")]
    public void Validator_MimeType_Whitelist(string mime, bool expected)
    {
        // Arrange
        var validator = new UploadSpeakingAudioCommandValidator();

        // Act
        var result = validator.Validate(Upload(1024, mime));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>AI-11: the original whitelist contains audio/x-m4a (route.ts:20); the validator lists audio/m4a instead.</summary>
    [Test]
    [Property("PlanId", "AI-11")]
    [Category("KnownDeviation")]
    public void Validator_XM4aMime_IsAccepted()
    {
        // Arrange
        var validator = new UploadSpeakingAudioCommandValidator();

        // Act
        var result = validator.Validate(Upload(1024, "audio/x-m4a"));

        // Assert
        Assert.That(result.IsValid, Is.True);
    }

    /// <summary>
    /// AI-11: audio types outside the original whitelist (route.ts:14-21) must be rejected: mpeg/mp3/x-wav/m4a are
    /// accepted by the validator, and so is any suffix of an allowed prefix because it uses StartsWith.
    /// </summary>
    [TestCase("audio/mpeg")]
    [TestCase("audio/mp3")]
    [TestCase("audio/x-wav")]
    [TestCase("audio/m4a")]
    [TestCase("audio/webm-evil")]
    [Property("PlanId", "AI-11")]
    [Category("KnownDeviation")]
    public void Validator_MimeOutsideOriginalWhitelist_IsRejected(string mime)
    {
        // Arrange
        var validator = new UploadSpeakingAudioCommandValidator();

        // Act
        var result = validator.Validate(Upload(1024, mime));

        // Assert
        Assert.That(result.IsValid, Is.False);
    }
    /// <summary>AI-12: the handler uploads through the storage service for the caller and returns URL, path and duration.</summary>
    [Test]
    [Property("PlanId", "AI-12")]
    public async Task Handle_ValidUpload_UsesStorageServiceAndReturnsResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var storage = Substitute.For<ISupabaseStorageService>();
        storage.UploadAudioRecordingAsync(
                userId, Arg.Any<Stream>(), "rec.webm", "audio/webm", Arg.Any<CancellationToken>())
            .Returns(("https://cdn/x.webm", "speaking/u/x.webm"));
        var handler = new UploadSpeakingAudioCommandHandler(TestHelpers.CreateUser(userId), storage);

        // Act
        var response = await handler.Handle(Upload(1024), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.AudioUrl, Is.EqualTo("https://cdn/x.webm"));
            Assert.That(response.Data.StoragePath, Is.EqualTo("speaking/u/x.webm"));
            Assert.That(response.Data.DurationSeconds, Is.EqualTo(12.5));
        });
    }

    /// <summary>AI-12: an anonymous caller is rejected and nothing is uploaded.</summary>
    [Test]
    [Property("PlanId", "AI-12")]
    public async Task Handle_AnonymousUser_ThrowsUnauthorizedAndDoesNotUpload()
    {
        // Arrange
        var storage = Substitute.For<ISupabaseStorageService>();
        var handler = new UploadSpeakingAudioCommandHandler(TestHelpers.CreateUser(null), storage);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await handler.Handle(Upload(1024), CancellationToken.None));
        await storage.DidNotReceive().UploadAudioRecordingAsync(
            Arg.Any<Guid>(), Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}

using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Features.Dictionary.Commands;
using LingoPro.Application.Features.Dictionary.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Exceptions;
using NSubstitute;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.Dictionary;

/// <summary>
/// Unit tests for <see cref="SmartLookupQueryHandler"/>, <see cref="SmartLookupQuery"/> and
/// <see cref="SmartLookupQueryValidator"/> (plan IDs DC-01..DC-05): lookup normalization, not found,
/// contextual sense selection through a mocked <see cref="IAiRouterService"/>, cache metadata and validation.
/// </summary>
[TestFixture]
[Category("Dictionary")]
public sealed class SmartLookupQueryHandlerTests
{
    private static GlobalDictionary Entry(string term = "stem") => new()
    {
        Term = term,
        Ipa = "/stem/",
        PartOfSpeech = "noun",
        DefinitionsJson = "[\"a\",\"b\"]",
        CollocationsJson = "[\"c\"]",
        SynonymsJson = "[\"s\"]",
        AntonymsJson = "[\"n\"]"
    };

    /// <summary>DC-01: lookup is case/space-insensitive and returns the entry without calling the AI when no context is given.</summary>
    [Test]
    [Property("PlanId", "DC-01")]
    public async Task Handle_TermWithoutContext_ReturnsEntryAndSkipsAi()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var entry = Entry();
        db.GlobalDictionaries.Add(entry);
        await db.SaveChangesAsync();
        var router = Substitute.For<IAiRouterService>();
        var handler = new SmartLookupQueryHandler(db, router);

        // Act
        var response = await handler.Handle(new SmartLookupQuery("  STEM "), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data!.Id, Is.EqualTo(entry.Id));
            Assert.That(response.Data.Term, Is.EqualTo("stem"));
            Assert.That(response.Data.Ipa, Is.EqualTo("/stem/"));
            Assert.That(response.Data.PartOfSpeech, Is.EqualTo("noun"));
            Assert.That(response.Data.DefinitionsJson, Is.EqualTo("[\"a\",\"b\"]"));
            Assert.That(response.Data.BestContextualSenseIndex, Is.Null);
        });
        await router.DidNotReceiveWithAnyArgs().SelectSmartSenseIndexAsync(default!, default!, default!, default);
    }

    /// <summary>DC-02: unknown term yields NotFound.</summary>
    [Test]
    [Property("PlanId", "DC-02")]
    public async Task Handle_UnknownTerm_ThrowsNotFound()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        var handler = new SmartLookupQueryHandler(db, Substitute.For<IAiRouterService>());

        // Act & Assert
        Assert.ThrowsAsync<NotFoundException>(
            async () => await handler.Handle(new SmartLookupQuery("zzzz"), CancellationToken.None));
        await Task.CompletedTask;
    }

    /// <summary>DC-03: with a context sentence the AI router picks the best sense index.</summary>
    [Test]
    [Property("PlanId", "DC-03")]
    public async Task Handle_TermWithContext_UsesAiSelectedSenseIndex()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GlobalDictionaries.Add(Entry());
        await db.SaveChangesAsync();
        var router = Substitute.For<IAiRouterService>();
        router.SelectSmartSenseIndexAsync("stem", "stemmed the flow", Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>())
            .Returns(1);
        var handler = new SmartLookupQueryHandler(db, router);

        // Act
        var response = await handler.Handle(new SmartLookupQuery("Stem", "stemmed the flow"), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.BestContextualSenseIndex, Is.EqualTo(1));
        await router.Received(1).SelectSmartSenseIndexAsync(
            "stem", "stemmed the flow", Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>());
    }

    /// <summary>DC-04: a whitespace-only context is treated as no context (AI not called).</summary>
    [Test]
    [Property("PlanId", "DC-04")]
    public async Task Handle_WhitespaceContext_SkipsAi()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.GlobalDictionaries.Add(Entry());
        await db.SaveChangesAsync();
        var router = Substitute.For<IAiRouterService>();
        var handler = new SmartLookupQueryHandler(db, router);

        // Act
        var response = await handler.Handle(new SmartLookupQuery("stem", "   "), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.BestContextualSenseIndex, Is.Null);
        await router.DidNotReceiveWithAnyArgs().SelectSmartSenseIndexAsync(default!, default!, default!, default);
    }

    /// <summary>DC-05: cache key is normalized and the cache is bypassed only when a context is supplied.</summary>
    [Test]
    [Property("PlanId", "DC-05")]
    public void Query_CacheMetadata_NormalizedKeyAndContextBypass()
    {
        // Arrange
        var plain = new SmartLookupQuery("  StEm ");
        var withContext = new SmartLookupQuery("stem", "some sentence");

        // Act & Assert
        Assert.Multiple(() =>
        {
            Assert.That(plain.CacheKey, Is.EqualTo("dict:term:stem"));
            Assert.That(plain.BypassCache, Is.False);
            Assert.That(withContext.BypassCache, Is.True);
        });
    }

    /// <summary>DC-07: validator - term required, max 100.</summary>
    [TestCase(0, false)]
    [TestCase(1, true)]
    [TestCase(100, true)]
    [TestCase(101, false)]
    [Property("PlanId", "DC-07")]
    public void Validator_TermLength_Boundaries(int length, bool expected)
    {
        // Arrange
        var validator = new SmartLookupQueryValidator();

        // Act
        var result = validator.Validate(new SmartLookupQuery(new string('a', length)));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }
}

/// <summary>
/// Unit tests for <see cref="ExtractOcrWordsCommandHandler"/> and <see cref="ExtractOcrWordsCommandValidator"/>
/// (plan IDs DC-08..DC-11): OCR delegation to the mocked AI router and payload validation.
/// </summary>
[TestFixture]
[Category("Dictionary")]
public sealed class ExtractOcrWordsCommandHandlerTests
{
    /// <summary>DC-08: the image payload and MIME type are forwarded to the router and extracted words returned.</summary>
    [Test]
    [Property("PlanId", "DC-08")]
    public async Task Handle_ValidImage_ReturnsWordsFromRouter()
    {
        // Arrange
        var router = Substitute.For<IAiRouterService>();
        IReadOnlyList<string> words = ["apple", "banana"];
        router.ExtractWordsFromOcrImageAsync("QUJD", "image/png", Arg.Any<CancellationToken>()).Returns(words);
        var handler = new ExtractOcrWordsCommandHandler(router);

        // Act
        var response = await handler.Handle(new ExtractOcrWordsCommand("QUJD", "image/png"), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.EqualTo(new[] { "apple", "banana" }));
        });
    }

    /// <summary>DC-09: an image with no recognizable words yields an empty list (not an error).</summary>
    [Test]
    [Property("PlanId", "DC-09")]
    public async Task Handle_NoWordsDetected_ReturnsEmptyList()
    {
        // Arrange
        var router = Substitute.For<IAiRouterService>();
        router.ExtractWordsFromOcrImageAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new List<string>());
        var handler = new ExtractOcrWordsCommandHandler(router);

        // Act
        var response = await handler.Handle(new ExtractOcrWordsCommand("QUJD", "image/jpeg"), CancellationToken.None);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(response.Success, Is.True);
            Assert.That(response.Data, Is.Empty);
        });
    }

    /// <summary>DC-10: validator requires a non-empty base64 payload.</summary>
    [TestCase("", false)]
    [TestCase("QUJD", true)]
    [Property("PlanId", "DC-10")]
    public void Validator_Base64Required(string base64, bool expected)
    {
        // Arrange
        var validator = new ExtractOcrWordsCommandValidator();

        // Act
        var result = validator.Validate(new ExtractOcrWordsCommand(base64, "image/png"));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }

    /// <summary>DC-11: validator only accepts image/* MIME types (case-insensitive).</summary>
    [TestCase("image/jpeg", true)]
    [TestCase("image/png", true)]
    [TestCase("image/webp", true)]
    [TestCase("IMAGE/PNG", true)]
    [TestCase("application/pdf", false)]
    [TestCase("text/plain", false)]
    [TestCase("audio/webm", false)]
    [TestCase("", false)]
    [Property("PlanId", "DC-11")]
    public void Validator_MimeType_ImageOnly(string mime, bool expected)
    {
        // Arrange
        var validator = new ExtractOcrWordsCommandValidator();

        // Act
        var result = validator.Validate(new ExtractOcrWordsCommand("QUJD", mime));

        // Assert
        Assert.That(result.IsValid, Is.EqualTo(expected));
    }
}

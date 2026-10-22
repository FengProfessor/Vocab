using LingoPro.Application.Features.SpeakingFoundation.Queries;
using LingoPro.Application.UnitTests.Common;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using NUnit.Framework;

namespace LingoPro.Application.UnitTests.Features.SpeakingFoundation;

/// <summary>
/// Unit tests for <see cref="GetNextDiagnosticProbeQueryHandler"/> (plan IDs SF-13/SF-14):
/// probe selection order, level filter and the probe cap.
/// </summary>
[TestFixture]
[Category("SpeakingFoundation")]
public sealed class GetNextDiagnosticProbeQueryHandlerTests
{
    private static FoundationLexicalConcept Concept(string code, int band, CertLevel level = CertLevel.A1) => new()
    {
        ConceptCode = code,
        Headword = code,
        Ipa = "/x/",
        MeaningVi = "nghia",
        FrequencyBand = band,
        CertLevel = level
    };

    /// <summary>SF-13: probes are ordered by frequency band then concept code and filtered by target level.</summary>
    [Test]
    [Property("PlanId", "SF-13")]
    public async Task Handle_TargetLevel_FiltersAndOrdersByBandThenCode()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        db.FoundationLexicalConcepts.AddRange(
            Concept("b", 2), Concept("a", 2), Concept("z", 1), Concept("x", 1, CertLevel.B1));
        await db.SaveChangesAsync();
        var handler = new GetNextDiagnosticProbeQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetNextDiagnosticProbeQuery(CertLevel.A1), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Select(p => p.ConceptCode), Is.EqualTo(new[] { "z", "a", "b" }));
    }

    /// <summary>SF-13: MaxProbes limits the result count.</summary>
    [Test]
    [Property("PlanId", "SF-13")]
    public async Task Handle_MaxProbes_LimitsResultCount()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        for (var i = 0; i < 10; i++)
        {
            db.FoundationLexicalConcepts.Add(Concept($"c{i:00}", 1));
        }

        await db.SaveChangesAsync();
        var handler = new GetNextDiagnosticProbeQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetNextDiagnosticProbeQuery(null, 3), CancellationToken.None);

        // Assert
        Assert.That(response.Data, Has.Count.EqualTo(3));
    }

    /// <summary>SF-14: the original diagnostic session never serves more than 16 probes.</summary>
    [Test]
    [Property("PlanId", "SF-14")]
    [Category("KnownDeviation")]
    public async Task Handle_MaxProbesAbove16_CappedAtSixteen()
    {
        // Arrange
        await using var db = TestHelpers.CreateDb();
        for (var i = 0; i < 30; i++)
        {
            db.FoundationLexicalConcepts.Add(Concept($"c{i:00}", 1));
        }

        await db.SaveChangesAsync();
        var handler = new GetNextDiagnosticProbeQueryHandler(db);

        // Act
        var response = await handler.Handle(new GetNextDiagnosticProbeQuery(null, 50), CancellationToken.None);

        // Assert
        Assert.That(response.Data!.Count, Is.LessThanOrEqualTo(16));
    }
}

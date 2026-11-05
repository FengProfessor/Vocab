using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.SpeakingFoundation.Queries;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing speaking foundation diagnostic probe queries, learner lexical evidence persistence, and 6-dimension gap maps.
/// </summary>
public sealed class SpeakingFoundationRepository(IApplicationDbContext dbContext) : ISpeakingFoundationRepository
{
    public void AddLexicalEvidence(LearnerLexicalEvidence evidence)
        => dbContext.LearnerLexicalEvidences.Add(evidence);

    public Task<LearnerLexicalState?> GetLexicalStateAsync(Guid learnerId, string conceptId, CancellationToken ct = default)
        => dbContext.LearnerLexicalStates.FirstOrDefaultAsync(
            s => s.LearnerId == learnerId && s.ConceptId == conceptId,
            ct);

    public void AddLexicalState(LearnerLexicalState state)
        => dbContext.LearnerLexicalStates.Add(state);

    public async Task<IReadOnlyList<DiagnosticProbeDto>> GetDiagnosticProbesAsync(int limit, CancellationToken ct = default)
    {
        return await dbContext.FoundationLexicalConcepts
            .AsNoTracking()
            .OrderBy(c => c.Stage)
            .ThenBy(c => c.Id)
            .Take(limit)
            .Select(c => new DiagnosticProbeDto(
                c.Id,
                c.Id,
                c.Lemma,
                c.Ipa,
                c.MeaningVi,
                c.Stage,
                null))
            .ToListAsync(ct);
    }

    public async Task<LearnerVocabularyMapDto> GetLearnerVocabularyMapAsync(Guid learnerId, CancellationToken ct = default)
    {
        var concepts = await dbContext.FoundationLexicalConcepts
            .AsNoTracking()
            .Include(c => c.Representations)
            .OrderBy(c => c.Stage)
            .ThenByDescending(c => c.GenerativePower)
            .ThenBy(c => c.Id)
            .ToListAsync(ct);

        var states = await dbContext.LearnerLexicalStates
            .AsNoTracking()
            .Where(s => s.LearnerId == learnerId)
            .ToDictionaryAsync(s => s.ConceptId, StringComparer.OrdinalIgnoreCase, ct);

        int stableCount = 0;
        int fragileCount = 0;
        int missingCount = 0;
        int uncertainCount = 0;
        var gapBreakdown = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var rows = new List<LearnerConceptStateDto>(concepts.Count);

        foreach (var c in concepts)
        {
            states.TryGetValue(c.Id, out var state);

            string bucket = state?.StatusBucket switch
            {
                LexicalStatusBucket.Solid => "STABLE",
                LexicalStatusBucket.Partial or LexicalStatusBucket.Recheck => "FRAGILE",
                LexicalStatusBucket.Unknown => "MISSING",
                _ => "UNCERTAIN"
            };

            switch (bucket)
            {
                case "STABLE":
                    stableCount++;
                    break;
                case "FRAGILE":
                    fragileCount++;
                    break;
                case "MISSING":
                    missingCount++;
                    break;
                default:
                    uncertainCount++;
                    break;
            }

            string activeGap = !string.IsNullOrWhiteSpace(state?.ActiveGap)
                ? state.ActiveGap
                : (bucket == "STABLE" ? "NO_GAP" : "UNKNOWN_CONCEPT_OR_FORM");

            if (activeGap != "NO_GAP")
            {
                gapBreakdown[activeGap] = gapBreakdown.GetValueOrDefault(activeGap) + 1;
            }

            string? audioUrl = c.Representations
                .FirstOrDefault(r => r.Modality == FoundationModalityType.Audio)?.ContentPayload;
            string? imageUrl = c.Representations
                .FirstOrDefault(r => r.Modality == FoundationModalityType.Visual)?.ContentPayload;

            var targetChunks = ParseStringListJson(c.TargetChunks);

            rows.Add(new LearnerConceptStateDto(
                c.Id,
                c.Lemma,
                c.MeaningVi,
                c.Cluster,
                c.Stage,
                c.GenerativePower,
                bucket,
                activeGap,
                state?.SoundRecognition ?? false,
                state?.TextRecognition ?? false,
                state?.MeaningRecall ?? false,
                state?.FormRecall ?? false,
                state?.ChunkUse ?? false,
                state?.GenerativeUse ?? false,
                state?.UncertaintyScore ?? 1.00m,
                state?.ConsecutiveIndependentPasses ?? 0,
                state?.LastProbedAt,
                audioUrl,
                imageUrl,
                targetChunks));
        }

        var remediationQueue = rows
            .Where(r => r.StatusBucket != "STABLE")
            .OrderBy(r => r.StatusBucket == "MISSING" ? 0 : r.StatusBucket == "FRAGILE" ? 1 : 2)
            .ThenBy(r => r.Stage)
            .ThenByDescending(r => r.GenerativePower)
            .Take(6)
            .ToList();

        return new LearnerVocabularyMapDto(
            learnerId,
            rows.Count,
            new VocabularyBucketCountsDto(stableCount, fragileCount, missingCount, uncertainCount),
            gapBreakdown,
            remediationQueue,
            rows);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);

    private static IReadOnlyList<string> ParseStringListJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}

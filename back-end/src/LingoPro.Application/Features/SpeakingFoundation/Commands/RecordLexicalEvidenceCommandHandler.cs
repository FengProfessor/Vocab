using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Handles recording a learner's lexical evidence event and updating their derived <see cref="LearnerLexicalState"/> in the database.
/// </summary>
public sealed class RecordLexicalEvidenceCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<RecordLexicalEvidenceCommand, ApiResponse<LexicalStatusBucket>>
{
    public async Task<ApiResponse<LexicalStatusBucket>> Handle(
        RecordLexicalEvidenceCommand request,
        CancellationToken ct)
    {
        var learnerId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var evidence = new LearnerLexicalEvidence
        {
            LearnerId = learnerId,
            ConceptId = request.ConceptId,
            EvidenceSource = request.EvidenceSource,
            SupportLevel = request.SupportLevel,
            ProbeType = request.ProbeType.Trim(),
            IsSuccessful = request.IsSuccessful,
            ResponseLatencyMs = request.ResponseLatencyMs,
            ObservedAt = DateTime.UtcNow
        };

        dbContext.LearnerLexicalEvidences.Add(evidence);

        var state = await dbContext.LearnerLexicalStates
            .FirstOrDefaultAsync(s => s.LearnerId == learnerId && s.ConceptId == request.ConceptId, ct);

        if (state == null)
        {
            state = new LearnerLexicalState
            {
                LearnerId = learnerId,
                ConceptId = request.ConceptId,
                EvidenceCount = 0,
                ConfidenceScore = 0.0,
                StatusBucket = LexicalStatusBucket.Unknown
            };
            dbContext.LearnerLexicalStates.Add(state);
        }

        state.EvidenceCount += 1;
        state.ConfidenceScore = request.IsSuccessful
            ? Math.Min(1.0, state.ConfidenceScore + 0.35)
            : Math.Max(0.0, state.ConfidenceScore - 0.25);

        state.StatusBucket = state.ConfidenceScore switch
        {
            >= 0.75 => LexicalStatusBucket.Solid,
            >= 0.40 => LexicalStatusBucket.Partial,
            _ => LexicalStatusBucket.Uncertain
        };
        state.MasteryState = state.StatusBucket.ToString().ToLowerInvariant();
        state.LastUpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<LexicalStatusBucket>.Ok(
            state.StatusBucket,
            "Lexical speaking evidence recorded and mastery state updated successfully.");
    }
}

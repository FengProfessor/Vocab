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
            ActorUserId = learnerId,
            LearnerId = learnerId,
            ConceptId = request.ConceptId,
            EvidenceSource = request.EvidenceSource,
            SupportLevel = request.SupportLevel,
            // SQL has probe_mode/target_dimension instead of probe_type; the single ProbeType value fills both.
            ProbeMode = request.ProbeType.Trim(),
            TargetDimension = request.ProbeType.Trim(),
            IsCorrect = request.IsSuccessful,
            ResponseLatencyMs = request.ResponseLatencyMs,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.LearnerLexicalEvidences.Add(evidence);

        var state = await dbContext.LearnerLexicalStates
            .FirstOrDefaultAsync(s => s.LearnerId == learnerId && s.ConceptId == request.ConceptId, ct);

        if (state == null)
        {
            state = LexicalStateUpdater.CreateInitial(learnerId, request.ConceptId);
            dbContext.LearnerLexicalStates.Add(state);
        }

        LexicalStateUpdater.Apply(state, request.IsSuccessful, 0.35m, request.SupportLevel, request.ResponseLatencyMs, LexicalStatusBucket.Uncertain);
        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<LexicalStatusBucket>.Ok(
            state.StatusBucket,
            "Lexical speaking evidence recorded and mastery state updated successfully.");
    }
}

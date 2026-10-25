using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Handles recording a learner's lexical evidence event and updating their derived <see cref="LearnerLexicalState"/> via the speaking foundation repository.
/// </summary>
public sealed class RecordLexicalEvidenceCommandHandler(
    ICurrentUserService currentUser,
    ISpeakingFoundationRepository speakingFoundationRepository) : IRequestHandler<RecordLexicalEvidenceCommand, ApiResponse<LexicalStatusBucket>>
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

        speakingFoundationRepository.AddLexicalEvidence(evidence);

        var state = await speakingFoundationRepository.GetLexicalStateAsync(learnerId, request.ConceptId, ct);

        if (state == null)
        {
            state = LexicalStateUpdater.CreateInitial(learnerId, request.ConceptId);
            speakingFoundationRepository.AddLexicalState(state);
        }

        LexicalStateUpdater.Apply(state, request.IsSuccessful, 0.35m, request.SupportLevel, request.ResponseLatencyMs, LexicalStatusBucket.Uncertain);
        await speakingFoundationRepository.SaveChangesAsync(ct);

        return ApiResponse<LexicalStatusBucket>.Ok(
            state.StatusBucket,
            "Lexical speaking evidence recorded and mastery state updated successfully.");
    }
}

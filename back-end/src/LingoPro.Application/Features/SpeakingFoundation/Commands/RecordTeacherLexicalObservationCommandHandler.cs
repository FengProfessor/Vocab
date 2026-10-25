using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Handles teacher-evaluated lexical observations for a student via the speaking foundation repository.
/// </summary>
public sealed class RecordTeacherLexicalObservationCommandHandler(
    ICurrentUserService currentUser,
    ISpeakingFoundationRepository speakingFoundationRepository) : IRequestHandler<RecordTeacherLexicalObservationCommand, ApiResponse<LexicalStatusBucket>>
{
    public async Task<ApiResponse<LexicalStatusBucket>> Handle(
        RecordTeacherLexicalObservationCommand request,
        CancellationToken ct)
    {
        var actorId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var evidence = new LearnerLexicalEvidence
        {
            ActorUserId = actorId,
            LearnerId = request.StudentUserId,
            ConceptId = request.ConceptId,
            EvidenceSource = LexicalEvidenceSource.Teacher,
            SupportLevel = request.SupportLevel,
            // SQL has probe_mode/target_dimension instead of probe_type; the fixed observation type fills both.
            ProbeMode = "teacher_classroom_observation",
            TargetDimension = "teacher_classroom_observation",
            IsCorrect = request.IsSuccessful,
            ResponseLatencyMs = request.ResponseLatencyMs,
            CreatedAt = DateTime.UtcNow
        };

        speakingFoundationRepository.AddLexicalEvidence(evidence);

        var state = await speakingFoundationRepository.GetLexicalStateAsync(request.StudentUserId, request.ConceptId, ct);

        if (state == null)
        {
            state = LexicalStateUpdater.CreateInitial(request.StudentUserId, request.ConceptId);
            speakingFoundationRepository.AddLexicalState(state);
        }

        LexicalStateUpdater.Apply(state, request.IsSuccessful, 0.45m, request.SupportLevel, request.ResponseLatencyMs, LexicalStatusBucket.Recheck);
        await speakingFoundationRepository.SaveChangesAsync(ct);

        return ApiResponse<LexicalStatusBucket>.Ok(
            state.StatusBucket,
            "Teacher classroom lexical observation recorded successfully.");
    }
}

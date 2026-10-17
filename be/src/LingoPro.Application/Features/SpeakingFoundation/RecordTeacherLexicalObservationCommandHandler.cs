using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Speaking;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.SpeakingFoundation;

/// <summary>
/// Handles teacher-evaluated lexical observations for a student, enforcing Teacher or Admin role permissions.
/// </summary>
public sealed class RecordTeacherLexicalObservationCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<RecordTeacherLexicalObservationCommand, ApiResponse<LexicalStatusBucket>>
{
    public async Task<ApiResponse<LexicalStatusBucket>> Handle(
        RecordTeacherLexicalObservationCommand request,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }

        if (!currentUser.IsTeacher)
        {
            throw new ForbiddenAccessException("Only teachers or administrators can record classroom lexical observations.");
        }

        var evidence = new LearnerLexicalEvidence
        {
            LearnerId = request.StudentUserId,
            ConceptId = request.ConceptId,
            EvidenceSource = LexicalEvidenceSource.Teacher,
            SupportLevel = request.SupportLevel,
            ProbeType = "teacher_classroom_observation",
            IsSuccessful = request.IsSuccessful,
            ResponseLatencyMs = request.ResponseLatencyMs,
            ObservedAt = DateTime.UtcNow
        };

        dbContext.LearnerLexicalEvidences.Add(evidence);

        var state = await dbContext.LearnerLexicalStates
            .FirstOrDefaultAsync(s => s.LearnerId == request.StudentUserId && s.ConceptId == request.ConceptId, ct);

        if (state == null)
        {
            state = new LearnerLexicalState
            {
                LearnerId = request.StudentUserId,
                ConceptId = request.ConceptId,
                EvidenceCount = 0,
                ConfidenceScore = 0.0,
                StatusBucket = LexicalStatusBucket.Unknown
            };
            dbContext.LearnerLexicalStates.Add(state);
        }

        state.EvidenceCount += 1;
        state.ConfidenceScore = request.IsSuccessful
            ? Math.Min(1.0, state.ConfidenceScore + 0.45)
            : Math.Max(0.0, state.ConfidenceScore - 0.25);

        state.StatusBucket = state.ConfidenceScore switch
        {
            >= 0.75 => LexicalStatusBucket.Solid,
            >= 0.40 => LexicalStatusBucket.Partial,
            _ => LexicalStatusBucket.Recheck
        };
        state.MasteryState = state.StatusBucket.ToString().ToLowerInvariant();
        state.LastUpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        return ApiResponse<LexicalStatusBucket>.Ok(
            state.StatusBucket,
            "Teacher classroom lexical observation recorded successfully.");
    }
}

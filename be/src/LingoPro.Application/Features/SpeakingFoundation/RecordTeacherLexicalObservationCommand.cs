using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation;

/// <summary>
/// Teacher-only command to record a classroom lexical speaking observation for a student.
/// </summary>
public sealed record RecordTeacherLexicalObservationCommand(
    Guid StudentUserId,
    Guid ConceptId,
    LexicalSupportLevel SupportLevel,
    bool IsSuccessful,
    int ResponseLatencyMs = 800) : IRequest<ApiResponse<LexicalStatusBucket>>;

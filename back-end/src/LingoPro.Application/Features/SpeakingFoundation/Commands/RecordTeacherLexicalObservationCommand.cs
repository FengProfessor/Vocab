using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Teacher-only command to record a classroom lexical speaking observation for a student.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public sealed record RecordTeacherLexicalObservationCommand(
    Guid StudentUserId,
    Guid ConceptId,
    LexicalSupportLevel SupportLevel,
    bool IsSuccessful,
    int ResponseLatencyMs = 800) : IRequest<ApiResponse<LexicalStatusBucket>>;

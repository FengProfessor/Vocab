using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation;

/// <summary>
/// Command to record a learner's lexical speaking or recognition evidence event.
/// </summary>
public sealed record RecordLexicalEvidenceCommand(
    Guid ConceptId,
    LexicalEvidenceSource EvidenceSource,
    LexicalSupportLevel SupportLevel,
    string ProbeType,
    bool IsSuccessful,
    int ResponseLatencyMs) : IRequest<ApiResponse<LexicalStatusBucket>>;

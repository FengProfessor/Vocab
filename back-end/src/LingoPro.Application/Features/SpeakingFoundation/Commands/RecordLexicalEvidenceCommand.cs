using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Command to record a learner's lexical speaking or recognition evidence event.
/// </summary>
[Authorize]
public sealed record RecordLexicalEvidenceCommand(
    Guid ConceptId,
    LexicalEvidenceSource EvidenceSource,
    LexicalSupportLevel SupportLevel,
    string ProbeType,
    bool IsSuccessful,
    int ResponseLatencyMs) : IRequest<ApiResponse<LexicalStatusBucket>>;

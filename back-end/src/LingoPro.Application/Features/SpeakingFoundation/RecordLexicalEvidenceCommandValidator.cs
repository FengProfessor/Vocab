using FluentValidation;

namespace LingoPro.Application.Features.SpeakingFoundation;

/// <summary>
/// Validates <see cref="RecordLexicalEvidenceCommand"/> parameters.
/// </summary>
public sealed class RecordLexicalEvidenceCommandValidator : AbstractValidator<RecordLexicalEvidenceCommand>
{
    public RecordLexicalEvidenceCommandValidator()
    {
        RuleFor(x => x.ConceptId).NotEmpty();
        RuleFor(x => x.EvidenceSource).IsInEnum();
        RuleFor(x => x.SupportLevel).IsInEnum();
        RuleFor(x => x.ProbeType).NotEmpty().MaximumLength(64);
        RuleFor(x => x.ResponseLatencyMs).GreaterThanOrEqualTo(0);
    }
}

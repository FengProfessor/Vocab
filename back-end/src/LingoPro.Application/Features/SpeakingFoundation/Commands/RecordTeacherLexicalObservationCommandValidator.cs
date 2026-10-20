using FluentValidation;

namespace LingoPro.Application.Features.SpeakingFoundation.Commands;

/// <summary>
/// Validates <see cref="RecordTeacherLexicalObservationCommand"/> parameters.
/// </summary>
public sealed class RecordTeacherLexicalObservationCommandValidator
    : AbstractValidator<RecordTeacherLexicalObservationCommand>
{
    public RecordTeacherLexicalObservationCommandValidator()
    {
        RuleFor(x => x.StudentUserId).NotEmpty();
        RuleFor(x => x.ConceptId).NotEmpty();
        RuleFor(x => x.SupportLevel).IsInEnum();
        RuleFor(x => x.ResponseLatencyMs).GreaterThanOrEqualTo(0);
    }
}

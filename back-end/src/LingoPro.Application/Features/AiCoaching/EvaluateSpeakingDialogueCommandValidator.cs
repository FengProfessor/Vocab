using FluentValidation;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Validates <see cref="EvaluateSpeakingDialogueCommand"/> inputs.
/// </summary>
public class EvaluateSpeakingDialogueCommandValidator : AbstractValidator<EvaluateSpeakingDialogueCommand>
{
    public EvaluateSpeakingDialogueCommandValidator()
    {
        RuleFor(x => x.Topic).NotEmpty().WithMessage("Conversation topic is required.").MaximumLength(200);
        RuleFor(x => x.LastTranscript).NotEmpty().WithMessage("Spoken transcript is required.").MaximumLength(2000);
    }
}

using FluentValidation;

namespace LingoPro.Application.Features.Vocab;

/// <summary>
/// Validates <see cref="SubmitWordReviewCommand"/> inputs.
/// </summary>
public class SubmitWordReviewCommandValidator : AbstractValidator<SubmitWordReviewCommand>
{
    public SubmitWordReviewCommandValidator()
    {
        RuleFor(x => x.WordId)
            .NotEmpty().WithMessage("WordId must not be empty.");

        RuleFor(x => x.Quality)
            .InclusiveBetween(0, 5)
            .WithMessage("Quality rating must be between 0 (Again) and 5 (Easy).");

        RuleFor(x => x.ReviewId)
            .NotEmpty().WithMessage("ReviewId is required for idempotency.")
            .MaximumLength(128).WithMessage("ReviewId must not exceed 128 characters.");
    }
}

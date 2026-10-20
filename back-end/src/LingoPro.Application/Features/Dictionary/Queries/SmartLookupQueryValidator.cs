using FluentValidation;

namespace LingoPro.Application.Features.Dictionary.Queries;

/// <summary>
/// Validates <see cref="SmartLookupQuery"/> inputs.
/// </summary>
public class SmartLookupQueryValidator : AbstractValidator<SmartLookupQuery>
{
    public SmartLookupQueryValidator()
    {
        RuleFor(x => x.Term)
            .NotEmpty().WithMessage("Search term is required.")
            .MaximumLength(100).WithMessage("Search term must not exceed 100 characters.");
    }
}

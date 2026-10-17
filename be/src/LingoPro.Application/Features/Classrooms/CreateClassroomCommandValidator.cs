using FluentValidation;

namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Validates <see cref="CreateClassroomCommand"/> inputs and forbids reserved personal workspace names.
/// </summary>
public class CreateClassroomCommandValidator : AbstractValidator<CreateClassroomCommand>
{
    public CreateClassroomCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Classroom name is required.")
            .MaximumLength(120).WithMessage("Classroom name must not exceed 120 characters.")
            .Must(name => !string.Equals(name.Trim(), "__personal__", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Reserved classroom name '__personal__' is not allowed.");
    }
}

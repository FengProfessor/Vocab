using FluentValidation;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Validates <see cref="AssignDrillCommand"/> inputs.
/// </summary>
public class AssignDrillCommandValidator : AbstractValidator<AssignDrillCommand>
{
    public AssignDrillCommandValidator()
    {
        RuleFor(x => x.ClassroomId).NotEmpty().WithMessage("ClassroomId is required.");
        RuleFor(x => x.StudentId).NotEmpty().WithMessage("StudentId is required.");
    }
}

using FluentValidation;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Validates <see cref="DeleteClassroomCommand"/> inputs.
/// </summary>
public class DeleteClassroomCommandValidator : AbstractValidator<DeleteClassroomCommand>
{
    public DeleteClassroomCommandValidator()
    {
        RuleFor(x => x.ClassroomId)
            .NotEmpty().WithMessage("Classroom ID is required.");
    }
}

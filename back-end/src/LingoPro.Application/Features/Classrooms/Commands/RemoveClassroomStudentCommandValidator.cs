using FluentValidation;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Validates <see cref="RemoveClassroomStudentCommand"/> input parameters.
/// </summary>
public sealed class RemoveClassroomStudentCommandValidator : AbstractValidator<RemoveClassroomStudentCommand>
{
    public RemoveClassroomStudentCommandValidator()
    {
        RuleFor(x => x.ClassroomId).NotEmpty();
        RuleFor(x => x.StudentId).NotEmpty();
    }
}

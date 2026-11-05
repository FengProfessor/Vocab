using FluentValidation;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Validates <see cref="AddClassroomStudentCommand"/> input parameters.
/// </summary>
public sealed class AddClassroomStudentCommandValidator : AbstractValidator<AddClassroomStudentCommand>
{
    public AddClassroomStudentCommandValidator()
    {
        RuleFor(x => x.ClassroomId).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
    }
}

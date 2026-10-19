using FluentValidation;

namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Validates <see cref="JoinClassroomCommand"/> inputs.
/// </summary>
public class JoinClassroomCommandValidator : AbstractValidator<JoinClassroomCommand>
{
    public JoinClassroomCommandValidator()
    {
        RuleFor(x => x.InviteCode)
            .NotEmpty().WithMessage("Invite code is required.")
            .Length(4, 20).WithMessage("Invite code must be between 4 and 20 characters.");
    }
}

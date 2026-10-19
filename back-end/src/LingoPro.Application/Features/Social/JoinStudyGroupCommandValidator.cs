using FluentValidation;

namespace LingoPro.Application.Features.Social;

/// <summary>
/// Validates <see cref="JoinStudyGroupCommand"/> parameters.
/// </summary>
public sealed class JoinStudyGroupCommandValidator : AbstractValidator<JoinStudyGroupCommand>
{
    public JoinStudyGroupCommandValidator()
    {
        RuleFor(x => x.InviteCode).NotEmpty().MaximumLength(32);
    }
}

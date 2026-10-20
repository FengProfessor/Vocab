using FluentValidation;

namespace LingoPro.Application.Features.AdminCrm.Commands;

/// <summary>
/// Validates <see cref="SubscribePilotLeadCommand"/> parameters.
/// </summary>
public sealed class SubscribePilotLeadCommandValidator : AbstractValidator<SubscribePilotLeadCommand>
{
    public SubscribePilotLeadCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.SourceCampaign).NotEmpty().MaximumLength(64);
    }
}

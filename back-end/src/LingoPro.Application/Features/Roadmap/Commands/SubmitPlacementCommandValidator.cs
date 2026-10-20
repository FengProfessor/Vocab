using LingoPro.Application.Features.Roadmap.Queries;
using FluentValidation;

namespace LingoPro.Application.Features.Roadmap.Commands;

/// <summary>
/// Validates <see cref="SubmitPlacementCommand"/> inputs.
/// </summary>
public class SubmitPlacementCommandValidator : AbstractValidator<SubmitPlacementCommand>
{
    public SubmitPlacementCommandValidator()
    {
        RuleFor(x => x.Track).IsInEnum().WithMessage("A valid RoadmapTrackType is required.");

        RuleFor(x => x.SelfSelectLevelId)
            .IsInEnum()
            .When(x => x.SelfSelectLevelId.HasValue)
            .WithMessage("A valid RoadmapLevelId is required when self-selecting a level.");

        RuleFor(x => x)
            .Must(x => x.SelfSelectLevelId.HasValue || (x.Answers != null && x.Answers.Count > 0))
            .WithMessage("Either SelfSelectLevelId or placement Answers must be provided.");
    }
}

using FluentValidation;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Validates <see cref="GetRoadmapQuery"/> inputs.
/// </summary>
public class GetRoadmapQueryValidator : AbstractValidator<GetRoadmapQuery>
{
    public GetRoadmapQueryValidator()
    {
        RuleFor(x => x.Track)
            .IsInEnum()
            .WithMessage("A valid RoadmapTrackType must be specified.");
    }
}

using FluentValidation;

namespace LingoPro.Application.Features.Roadmap;

/// <summary>
/// Validates <see cref="CompleteRoadmapStepCommand"/> inputs.
/// </summary>
public class CompleteRoadmapStepCommandValidator : AbstractValidator<CompleteRoadmapStepCommand>
{
    public CompleteRoadmapStepCommandValidator()
    {
        RuleFor(x => x.Track).IsInEnum().WithMessage("A valid RoadmapTrackType is required.");
        RuleFor(x => x.StepId).NotEmpty().WithMessage("StepId is required.");
        RuleFor(x => x.Score)
            .GreaterThanOrEqualTo(80.0)
            .When(x => x.IsCheckpointOrExam)
            .WithMessage("Checkpoint or Exam requires a minimum score of 80% to pass.");
    }
}

using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab;

/// <summary>
/// Command to submit a vocabulary flashcard review and update its FSRS v5 schedule idempotently.
/// </summary>
public record SubmitWordReviewCommand(
    Guid WordId,
    int Quality,
    string ReviewId) : IRequest<ApiResponse<SrsReviewResponseDto>>;

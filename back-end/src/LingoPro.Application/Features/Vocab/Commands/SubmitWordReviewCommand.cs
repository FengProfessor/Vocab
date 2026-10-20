using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Command to submit a vocabulary flashcard review and update its FSRS v5 schedule idempotently.
/// </summary>
[Authorize]
public record SubmitWordReviewCommand(
    Guid WordId,
    int Quality,
    string ReviewId) : IRequest<ApiResponse<SrsReviewResponseDto>>;

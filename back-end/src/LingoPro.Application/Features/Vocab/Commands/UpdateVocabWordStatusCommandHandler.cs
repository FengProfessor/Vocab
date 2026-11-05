using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Approves or rejects a student-contributed classroom vocabulary word after verifying classroom ownership.
/// </summary>
public sealed class UpdateVocabWordStatusCommandHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository)
    : IRequestHandler<UpdateVocabWordStatusCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        UpdateVocabWordStatusCommand request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        await vocabRepository.UpdateVocabWordStatusAsync(userId, request.WordId, request.Status, currentUser.IsAdmin, ct);
        return ApiResponse<bool>.Ok(true, "Vocabulary word status updated successfully.");
    }
}

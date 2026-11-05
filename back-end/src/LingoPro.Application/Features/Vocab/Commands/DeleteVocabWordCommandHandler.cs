using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Deletes a vocabulary word after verifying that the caller is its creator, the classroom teacher, or an administrator.
/// </summary>
public sealed class DeleteVocabWordCommandHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository)
    : IRequestHandler<DeleteVocabWordCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        DeleteVocabWordCommand request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        await vocabRepository.DeleteVocabWordAsync(userId, request.WordId, currentUser.IsAdmin, ct);
        return ApiResponse<bool>.Ok(true, "Vocabulary word deleted successfully.");
    }
}

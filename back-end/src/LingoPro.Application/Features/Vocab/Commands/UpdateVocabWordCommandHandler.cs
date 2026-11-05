using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Vocab.Queries;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Updates a vocabulary word after verifying that the caller is its creator, the classroom teacher, or an administrator.
/// </summary>
public sealed class UpdateVocabWordCommandHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository)
    : IRequestHandler<UpdateVocabWordCommand, ApiResponse<VocabWordItemDto>>
{
    public async Task<ApiResponse<VocabWordItemDto>> Handle(
        UpdateVocabWordCommand request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var updated = await vocabRepository.UpdateVocabWordAsync(userId, request, currentUser.IsAdmin, ct);
        return ApiResponse<VocabWordItemDto>.Ok(updated, "Vocabulary word updated successfully.");
    }
}

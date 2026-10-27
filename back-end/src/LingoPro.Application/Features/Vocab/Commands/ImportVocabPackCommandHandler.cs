using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Handles <see cref="ImportVocabPackCommand"/> by resolving or creating the user's personal classroom,
/// enriching words from the global dictionary when available, inserting missing words, and recording pack progress.
/// </summary>
public sealed class ImportVocabPackCommandHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository) : IRequestHandler<ImportVocabPackCommand, ApiResponse<ImportVocabPackResultDto>>
{
    public async Task<ApiResponse<ImportVocabPackResultDto>> Handle(ImportVocabPackCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var result = await vocabRepository.ImportVocabPackAsync(userId, request, ct);

        return ApiResponse<ImportVocabPackResultDto>.Ok(
            result,
            "Vocabulary pack imported into personal classroom successfully.");
    }
}

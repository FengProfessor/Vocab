using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Commands;

/// <summary>
/// Command to import a curated vocabulary micro-pack into the authenticated user's personal classroom
/// and record pack tracking in <c>user_vocab_packs</c> and <c>user_vocab_pack_words</c>.
/// </summary>
[Authorize]
public sealed record ImportVocabPackCommand(
    string PackId,
    string? TopicId = null,
    string? TopicTitle = null,
    int PackIndex = 1,
    string? CatalogVersion = "v1",
    IReadOnlyList<ImportVocabPackWordInputDto>? Words = null
) : IRequest<ApiResponse<ImportVocabPackResultDto>>;

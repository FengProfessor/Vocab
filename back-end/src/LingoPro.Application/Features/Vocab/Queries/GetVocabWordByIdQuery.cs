using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Query to retrieve a single vocabulary word by ID together with the current user's FSRS progress.
/// </summary>
[Authorize]
public record GetVocabWordByIdQuery(Guid WordId) : IRequest<ApiResponse<VocabWordDetailDto>>;

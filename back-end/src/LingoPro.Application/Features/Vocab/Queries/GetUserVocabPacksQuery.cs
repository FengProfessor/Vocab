using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Query to retrieve all vocabulary micro-packs imported by the current user along with live FSRS review progress.
/// </summary>
[Authorize]
public sealed record GetUserVocabPacksQuery : IRequest<ApiResponse<IReadOnlyList<UserVocabPackDto>>>;

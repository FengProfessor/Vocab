using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Reading;

/// <summary>
/// Query to retrieve or generate the authenticated user's personalized daily reading exercise.
/// Note: Intentionally does NOT implement ICacheableQuery because it includes per-user daily completion state.
/// </summary>
public record GetDailyReadingQuery : IRequest<ApiResponse<DailyReadingDto>>;

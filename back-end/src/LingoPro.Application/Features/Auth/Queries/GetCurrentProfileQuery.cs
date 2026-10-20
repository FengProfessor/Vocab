using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Queries;

/// <summary>
/// Query to retrieve the authenticated user's profile directly from the database (never cached).
/// </summary>
[Authorize]
public record GetCurrentProfileQuery : IRequest<ApiResponse<ProfileDto>>;

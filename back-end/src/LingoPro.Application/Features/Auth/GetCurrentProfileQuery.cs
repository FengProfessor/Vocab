using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Query to retrieve the authenticated user's profile directly from the database (never cached).
/// </summary>
public record GetCurrentProfileQuery : IRequest<ApiResponse<ProfileDto>>;

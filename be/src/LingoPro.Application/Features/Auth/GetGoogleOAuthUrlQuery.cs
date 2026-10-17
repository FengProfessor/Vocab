using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Query to generate a Google OAuth SSO authorization URL.
/// </summary>
public record GetGoogleOAuthUrlQuery(string RedirectUri) : IRequest<ApiResponse<OAuthUrlDto>>;

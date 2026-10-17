using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to generate a Google identity linking URL for an authenticated user.
/// </summary>
public record LinkGoogleAccountCommand(string UserAccessToken, string RedirectUri) : IRequest<ApiResponse<OAuthUrlDto>>;

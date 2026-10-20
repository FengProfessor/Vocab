using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to generate a Google identity linking URL for an authenticated user.
/// </summary>
[Authorize]
public record LinkGoogleAccountCommand(string UserAccessToken, string RedirectUri) : IRequest<ApiResponse<OAuthUrlDto>>;

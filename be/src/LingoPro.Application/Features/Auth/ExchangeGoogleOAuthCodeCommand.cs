using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to exchange a Google OAuth PKCE authorization code for a 15m Access Token + 30d Refresh Token.
/// </summary>
public record ExchangeGoogleOAuthCodeCommand(string Code) : IRequest<ApiResponse<AuthTokensDto>>;

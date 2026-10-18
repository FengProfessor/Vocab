using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to exchange a Google OAuth PKCE authorization code for a 15m Access Token + 30d Refresh Token.
/// </summary>
/// <param name="Code">Authorization code returned by Supabase on the callback.</param>
/// <param name="CodeVerifier">The random PKCE verifier generated when the flow started.</param>
/// <param name="Role">Role requested at sign-up (teacher or student).</param>
public record ExchangeGoogleOAuthCodeCommand(
    string Code,
    string CodeVerifier,
    UserRole Role = UserRole.Student) : IRequest<ApiResponse<AuthTokensDto>>;

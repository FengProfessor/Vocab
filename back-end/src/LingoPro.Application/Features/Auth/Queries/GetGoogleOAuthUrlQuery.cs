using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Queries;

/// <summary>
/// Query to generate a Google OAuth (PKCE) authorization URL via Supabase Auth.
/// </summary>
/// <param name="RedirectUri">Absolute callback URL Supabase redirects to after Google consent.</param>
/// <param name="CodeChallenge">Base64url S256 challenge derived from the caller-held code verifier.</param>
public record GetGoogleOAuthUrlQuery(string RedirectUri, string CodeChallenge) : IRequest<ApiResponse<OAuthUrlDto>>;

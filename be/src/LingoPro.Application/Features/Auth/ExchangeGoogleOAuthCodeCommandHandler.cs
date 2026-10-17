using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Exchanges a Google OAuth code via Supabase Auth and issues a 15-minute Access Token and 30-day Refresh Token.
/// </summary>
public class ExchangeGoogleOAuthCodeCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService) : IRequestHandler<ExchangeGoogleOAuthCodeCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(ExchangeGoogleOAuthCodeCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.ExchangeOAuthCodeAsync(request.Code, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var tokenPair = jwtTokenService.GenerateTokenPair(profile);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, tokenPair);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Google SSO authentication completed successfully.");
    }
}

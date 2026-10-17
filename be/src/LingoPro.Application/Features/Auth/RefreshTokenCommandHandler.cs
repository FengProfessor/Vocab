using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Refreshes an active user session and rotates the 15-minute Access Token and 30-day Refresh Token.
/// </summary>
public class RefreshTokenCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService) : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.RefreshSessionAsync(request.RefreshToken, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var tokenPair = jwtTokenService.GenerateTokenPair(profile);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, tokenPair);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Session refreshed successfully.");
    }
}

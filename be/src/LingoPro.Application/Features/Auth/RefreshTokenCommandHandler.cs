using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Rotates a user session: validates the signed 30-day Refresh Token locally (no Supabase round-trip),
/// reloads the profile, and mints a new 15-minute Access Token and 30-day Refresh Token.
/// </summary>
public class RefreshTokenCommandHandler(
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService) : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var claims = jwtTokenService.ValidateRefreshToken(request.RefreshToken)
            ?? throw new UnauthorizedAccessException("Refresh token is expired or invalid.");

        // The refresh token only proves identity; the authoritative profile (role, plan) is reloaded from the database.
        var identity = new SupabaseAuthResult(claims.UserId, claims.Email, null, null, string.Empty, string.Empty, 0);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, identity, ct, claims.Role);
        var tokenPair = jwtTokenService.GenerateTokenPair(profile);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, tokenPair);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Session refreshed successfully.");
    }
}

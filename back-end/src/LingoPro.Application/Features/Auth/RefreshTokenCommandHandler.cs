using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Rotates a session through Supabase Auth: the refresh token is sent to Supabase, which validates it,
/// rotates it, and issues a new access/refresh token pair. Supabase stays the single source of truth.
/// </summary>
public class RefreshTokenCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext) : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new UnauthorizedAccessException("Refresh token is required.");
        }

        var authResult = await supabaseAuth.RefreshSessionAsync(request.RefreshToken, ct);

        // Role and plan are never trusted from the token; the profile row is the authority.
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Session refreshed successfully.");
    }
}

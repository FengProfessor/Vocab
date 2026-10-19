using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Handles user sign-in via Supabase Auth and mints a 15-minute Access Token and 30-day Refresh Token.
/// </summary>
public class LoginCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService) : IRequestHandler<LoginCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.SignInWithPasswordAsync(request.Email, request.Password, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var tokenPair = jwtTokenService.GenerateTokenPair(profile);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, tokenPair);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Signed in successfully.");
    }
}

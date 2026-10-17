using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Handles new account registration and issues a 15-minute Access Token and 30-day Refresh Token.
/// </summary>
public class RegisterCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService) : IRequestHandler<RegisterCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.SignUpWithPasswordAsync(request.Email, request.Password, request.FullName, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var tokenPair = jwtTokenService.GenerateTokenPair(profile);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, tokenPair);

        return ApiResponse<AuthTokensDto>.Created(dto, "Account registered successfully.");
    }
}

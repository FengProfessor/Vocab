using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Exchanges a Google OAuth code via Supabase Auth and returns the Supabase-issued access and refresh tokens as-is.
/// </summary>
public class ExchangeGoogleOAuthCodeCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext) : IRequestHandler<ExchangeGoogleOAuthCodeCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(ExchangeGoogleOAuthCodeCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.ExchangeOAuthCodeAsync(request.Code, request.CodeVerifier, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct, request.Role);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Google SSO authentication completed successfully.");
    }
}

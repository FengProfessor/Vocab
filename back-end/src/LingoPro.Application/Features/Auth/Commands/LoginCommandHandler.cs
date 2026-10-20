using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles user sign-in via Supabase Auth and returns the Supabase-issued access and refresh tokens as-is.
/// </summary>
public class LoginCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext) : IRequestHandler<LoginCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.SignInWithPasswordAsync(request.Email, request.Password, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Signed in successfully.");
    }
}

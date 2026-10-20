using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Auth.Queries;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles user sign-in via Supabase Auth using unique email and password credentials.
/// </summary>
public class LoginCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext) : IRequestHandler<LoginCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var authResult = await supabaseAuth.SignInWithPasswordAsync(normalizedEmail, request.Password, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        return ApiResponse<AuthTokensDto>.Ok(dto, "Signed in successfully.");
    }
}

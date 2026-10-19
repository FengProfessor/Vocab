using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Handles new account registration through Supabase Auth.
/// When Supabase requires email confirmation it returns no session, so the returned tokens are empty
/// and the caller must ask the user to confirm the email before signing in.
/// </summary>
public class RegisterCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext) : IRequestHandler<RegisterCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var authResult = await supabaseAuth.SignUpWithPasswordAsync(request.Email, request.Password, request.FullName, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct, request.Role);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        var message = string.IsNullOrWhiteSpace(authResult.AccessToken)
            ? "Account registered. Please check your email and click the confirmation link before signing in."
            : "Account registered successfully.";

        return ApiResponse<AuthTokensDto>.Created(dto, message);
    }
}

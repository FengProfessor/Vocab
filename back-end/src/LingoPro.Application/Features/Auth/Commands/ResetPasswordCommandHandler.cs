using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Resets the user's password via Supabase Auth using the recovery token and revokes the recovery session.
/// </summary>
public class ResetPasswordCommandHandler(
    ISupabaseAuthService supabaseAuth) : IRequestHandler<ResetPasswordCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        await supabaseAuth.ResetPasswordAsync(request.AccessToken, request.TokenHash, request.NewPassword, ct);

        return ApiResponse<bool>.Ok(
            true,
            "Password has been reset successfully. Please sign in with your new password.");
    }
}

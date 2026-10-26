using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles password recovery email requests via Supabase Auth without leaking account existence.
/// </summary>
public class ForgotPasswordCommandHandler(
    ISupabaseAuthService supabaseAuth) : IRequestHandler<ForgotPasswordCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        await supabaseAuth.RequestPasswordRecoveryAsync(normalizedEmail, request.RedirectUri, ct);

        return ApiResponse<bool>.Ok(
            true,
            "If an account exists for that email address, password recovery instructions have been sent.");
    }
}

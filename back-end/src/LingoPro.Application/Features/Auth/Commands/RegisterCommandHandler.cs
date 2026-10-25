using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles new account registration through Supabase Auth.
/// Ensures each email can only be registered once and delegates credential creation to Supabase Auth.
/// </summary>
public class RegisterCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IAuthRepository authRepository) : IRequestHandler<RegisterCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        bool emailExists = await authRepository.EmailExistsAsync(normalizedEmail, ct);

        if (emailExists)
        {
            throw new ConflictException("An account with this email address already exists.");
        }

        var authResult = await supabaseAuth.SignUpWithPasswordAsync(normalizedEmail, request.Password, request.FullName, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(authRepository, authResult, ct, request.Role);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        var message = string.IsNullOrWhiteSpace(authResult.AccessToken)
            ? "Account registered. Please check your email and click the confirmation link before signing in."
            : "Account registered successfully.";

        return ApiResponse<AuthTokensDto>.Created(dto, message);
    }
}

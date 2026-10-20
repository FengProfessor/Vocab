using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles new account registration through Supabase Auth.
/// Ensures each email can only be registered once and delegates credential creation to Supabase Auth.
/// </summary>
public class RegisterCommandHandler(
    ISupabaseAuthService supabaseAuth,
    IApplicationDbContext dbContext) : IRequestHandler<RegisterCommand, ApiResponse<AuthTokensDto>>
{
    public async Task<ApiResponse<AuthTokensDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        bool emailExists = await dbContext.Profiles
            .AsNoTracking()
            .AnyAsync(p => p.Email.ToLower() == normalizedEmail, ct);

        if (emailExists)
        {
            throw new ConflictException("An account with this email address already exists.");
        }

        var authResult = await supabaseAuth.SignUpWithPasswordAsync(normalizedEmail, request.Password, request.FullName, ct);
        var profile = await ProfileSyncHelper.EnsureUserProfileAsync(dbContext, authResult, ct, request.Role);
        var dto = ProfileSyncHelper.MapToAuthTokensDto(profile, authResult);

        var message = string.IsNullOrWhiteSpace(authResult.AccessToken)
            ? "Account registered. Please check your email and click the confirmation link before signing in."
            : "Account registered successfully.";

        return ApiResponse<AuthTokensDto>.Created(dto, message);
    }
}

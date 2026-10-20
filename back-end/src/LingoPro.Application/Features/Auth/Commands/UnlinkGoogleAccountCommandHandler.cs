using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles unlinking a Google identity from an authenticated user account.
/// </summary>
public class UnlinkGoogleAccountCommandHandler(ISupabaseAuthService supabaseAuth)
    : IRequestHandler<UnlinkGoogleAccountCommand, ApiResponse<object?>>
{
    public async Task<ApiResponse<object?>> Handle(UnlinkGoogleAccountCommand request, CancellationToken ct)
    {
        await supabaseAuth.UnlinkGoogleIdentityAsync(request.UserAccessToken, request.IdentityId, ct);
        return ApiResponse<object?>.Ok(null, "Google account unlinked successfully.");
    }
}

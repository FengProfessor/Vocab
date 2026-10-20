using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Revokes the Supabase session. Logout is best effort: a missing, expired, or unreachable
/// session must never block the caller from clearing local cookies.
/// </summary>
public class LogoutCommandHandler(ISupabaseAuthService supabaseAuth)
    : IRequestHandler<LogoutCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(LogoutCommand request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            try
            {
                await supabaseAuth.SignOutAsync(request.AccessToken, ct);
            }
            catch (HttpRequestException)
            {
                // Supabase unreachable: the short-lived access token expires on its own.
            }
        }

        return ApiResponse<bool>.Ok(true, "Logged out successfully.");
    }
}

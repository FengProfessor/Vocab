using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Handles generation of the Google OAuth SSO authorization redirect URL.
/// </summary>
public class GetGoogleOAuthUrlQueryHandler(ISupabaseAuthService supabaseAuth)
    : IRequestHandler<GetGoogleOAuthUrlQuery, ApiResponse<OAuthUrlDto>>
{
    public async Task<ApiResponse<OAuthUrlDto>> Handle(GetGoogleOAuthUrlQuery request, CancellationToken ct)
    {
        var url = await supabaseAuth.GetGoogleOAuthUrlAsync(request.RedirectUri, ct);
        return ApiResponse<OAuthUrlDto>.Ok(new OAuthUrlDto(url), "Google OAuth authorization URL generated successfully.");
    }
}

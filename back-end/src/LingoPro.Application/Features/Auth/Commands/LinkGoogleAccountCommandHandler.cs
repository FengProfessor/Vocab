using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Handles initiation of Google identity linking via Supabase Auth.
/// </summary>
public class LinkGoogleAccountCommandHandler(ISupabaseAuthService supabaseAuth)
    : IRequestHandler<LinkGoogleAccountCommand, ApiResponse<OAuthUrlDto>>
{
    public async Task<ApiResponse<OAuthUrlDto>> Handle(LinkGoogleAccountCommand request, CancellationToken ct)
    {
        var linkUrl = await supabaseAuth.GetGoogleLinkIdentityUrlAsync(request.UserAccessToken, request.RedirectUri, ct);
        return ApiResponse<OAuthUrlDto>.Ok(new OAuthUrlDto(linkUrl), "Google identity linking URL generated successfully.");
    }
}

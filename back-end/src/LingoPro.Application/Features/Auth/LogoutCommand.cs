using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to revoke the current Supabase session using the caller's access token.
/// </summary>
public record LogoutCommand(string AccessToken) : IRequest<ApiResponse<bool>>;

using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to reset a user's password using a one-time Supabase recovery access token or token hash.
/// Does not establish an active browser session cookie.
/// </summary>
public record ResetPasswordCommand(
    string NewPassword,
    string? AccessToken = null,
    string? TokenHash = null) : IRequest<ApiResponse<bool>>;

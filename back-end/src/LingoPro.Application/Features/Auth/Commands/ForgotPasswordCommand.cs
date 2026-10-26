using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to request a password recovery email link via Supabase Auth.
/// Always succeeds with 200 OK to prevent email enumeration.
/// </summary>
public record ForgotPasswordCommand(
    string Email,
    string? RedirectUri = null) : IRequest<ApiResponse<bool>>;

using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth;

/// <summary>
/// Command to unlink a Google OAuth identity from an authenticated user account.
/// </summary>
public record UnlinkGoogleAccountCommand(string UserAccessToken, string IdentityId) : IRequest<ApiResponse<object?>>;

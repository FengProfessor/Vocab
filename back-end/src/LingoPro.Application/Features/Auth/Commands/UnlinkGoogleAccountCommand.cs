using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Auth.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to unlink a Google OAuth identity from an authenticated user account.
/// </summary>
[Authorize]
public record UnlinkGoogleAccountCommand(string UserAccessToken, string IdentityId) : IRequest<ApiResponse<object?>>;

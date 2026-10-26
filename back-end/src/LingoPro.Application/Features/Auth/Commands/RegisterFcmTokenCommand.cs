using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Command to register or clear a Firebase Cloud Messaging (FCM) device token for the current user.
/// </summary>
[Authorize]
public record RegisterFcmTokenCommand(string? FcmToken) : IRequest<ApiResponse<bool>>;

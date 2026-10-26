using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Auth.Commands;

/// <summary>
/// Registers or clears the Firebase Cloud Messaging (FCM) push notification token on the authenticated user's profile,
/// ensuring exclusive device token ownership across profiles.
/// </summary>
public class RegisterFcmTokenCommandHandler(
    ICurrentUserService currentUser,
    IAuthRepository authRepository) : IRequestHandler<RegisterFcmTokenCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(RegisterFcmTokenCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var profile = await authRepository.GetProfileByIdAsync(userId, ct)
            ?? throw new NotFoundException("Profile", userId);

        if (string.IsNullOrWhiteSpace(request.FcmToken))
        {
            profile.FcmToken = null;
            await authRepository.SaveChangesAsync(ct);
            return ApiResponse<bool>.Ok(true, "FCM token cleared successfully.");
        }

        var normalizedToken = request.FcmToken.Trim();
        await authRepository.ClearDuplicateFcmTokenAsync(userId, normalizedToken, ct);
        profile.FcmToken = normalizedToken;
        await authRepository.SaveChangesAsync(ct);

        return ApiResponse<bool>.Ok(true, "FCM token registered successfully.");
    }
}

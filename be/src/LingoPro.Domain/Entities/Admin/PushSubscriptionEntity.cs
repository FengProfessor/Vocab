using LingoPro.Domain.Common;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Represents a user's Web Push / FCM notification token subscription (public.fcm_tokens).
/// </summary>
public class PushSubscriptionEntity : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string FcmToken { get; set; } = string.Empty;
    public string? DevicePlatform { get; set; } = "web";
    public bool IsActive { get; set; } = true;
}

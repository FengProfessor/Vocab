using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Auth;

namespace LingoPro.Domain.Entities.Admin;

/// <summary>
/// Represents a user's Web Push / FCM notification token subscription (public.fcm_tokens).
/// </summary>
public class PushSubscriptionEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? DeviceLabel { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; } = DateTime.UtcNow;

    public virtual Profile User { get; set; } = null!;
}

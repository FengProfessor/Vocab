using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Admin;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Auth;

/// <summary>
/// Represents a user profile synchronized with Supabase Auth (public.profiles).
/// </summary>
public class Profile : BaseAuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public SubscriptionPlanType? Plan { get; set; } = SubscriptionPlanType.Free;
    public DateTime? PlanExpiresAt { get; set; }
    public string? GeminiApiKey { get; set; }
    public string? FcmToken { get; set; }
    public int? DailyGoal { get; set; } = 10;
    public int? NotificationHour { get; set; } = 20;
    public string? LastDuePushSlot { get; set; }
    public DateTime? ProMilestoneEnrolledAt { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }

    public virtual UserGamification? Gamification { get; set; }
    public virtual ReferralLink? ReferralLink { get; set; }
    public virtual StudyRoomPresence? RoomPresence { get; set; }
    public virtual ICollection<SrsProgress> SrsProgresses { get; set; } = new List<SrsProgress>();
    public virtual ICollection<UserRoadmap> Roadmaps { get; set; } = new List<UserRoadmap>();
    public virtual ICollection<PushSubscriptionEntity> PushSubscriptions { get; set; } = new List<PushSubscriptionEntity>();

    /// <summary>
    /// Grants or extends a subscription plan entitlement without downgrading an active higher tier.
    /// </summary>
    public void GrantSubscriptionEntitlement(SubscriptionPlanType targetPlan, DateTime newExpiresAtUtc)
    {
        bool isCurrentPremium = Plan == SubscriptionPlanType.Premium && PlanExpiresAt > DateTime.UtcNow;
        if (!isCurrentPremium || targetPlan == SubscriptionPlanType.Premium)
        {
            Plan = targetPlan;
        }

        if (PlanExpiresAt == null || PlanExpiresAt.Value < newExpiresAtUtc)
        {
            PlanExpiresAt = newExpiresAtUtc;
        }
    }
}

using LingoPro.Domain.Common;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Entities.Auth;

/// <summary>
/// Represents a user profile synchronized with Supabase Auth (public.profiles).
/// </summary>
public class Profile : BaseAuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public SubscriptionPlanType Plan { get; set; } = SubscriptionPlanType.Free;
    public DateTime? PlanExpiresAt { get; set; }
    public int TotalXp { get; set; }
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateOnly? LastActiveDate { get; set; }
    public DateTime? LastDueEmailAt { get; set; }
    public string? LearningGoal { get; set; }
    public int DailyTargetMins { get; set; } = 15;
    public bool OnboardingCompleted { get; set; }

    public virtual ICollection<SrsProgress> SrsProgresses { get; set; } = new List<SrsProgress>();
    public virtual ICollection<UserRoadmap> Roadmaps { get; set; } = new List<UserRoadmap>();

    /// <summary>
    /// Awards experience points and updates the user's daily streak based on local date progression.
    /// </summary>
    public void AwardXpAndUpdateStreak(int xp, DateOnly todayLocal)
    {
        if (xp > 0)
        {
            TotalXp += xp;
        }

        if (LastActiveDate == null)
        {
            CurrentStreak = 1;
        }
        else if (LastActiveDate.Value == todayLocal.AddDays(-1))
        {
            CurrentStreak += 1;
        }
        else if (LastActiveDate.Value < todayLocal.AddDays(-1))
        {
            CurrentStreak = 1;
        }

        if (CurrentStreak > LongestStreak)
        {
            LongestStreak = CurrentStreak;
        }

        LastActiveDate = todayLocal;
        UpdatedAt = DateTime.UtcNow;
    }

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

        UpdatedAt = DateTime.UtcNow;
    }
}

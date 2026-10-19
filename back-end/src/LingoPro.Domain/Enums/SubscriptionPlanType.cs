using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines subscription tier plans mapped from profiles.plan ('free', 'pro', 'premium', 'school').
/// </summary>
public enum SubscriptionPlanType
{
    [Display(Name = "Free")]
    Free,
    [Display(Name = "Pro")]
    Pro,
    [Display(Name = "Premium")]
    Premium,
    [Display(Name = "School")]
    School,
}

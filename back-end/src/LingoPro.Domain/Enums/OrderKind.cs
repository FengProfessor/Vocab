using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines the purchase category of a billing order ('individual', 'group', 'challenge').
/// </summary>
public enum OrderKind
{
    [Display(Name = "Individual")]
    Individual,
    [Display(Name = "Group")]
    Group,
    [Display(Name = "Challenge")]
    Challenge,
}

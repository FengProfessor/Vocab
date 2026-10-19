using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines visual clarity ratings ('V0', 'V1', 'V2', 'V3') for foundation curriculum representations.
/// </summary>
public enum FoundationClarityRating
{
    [Display(Name = "V0")]
    V0,
    [Display(Name = "V1")]
    V1,
    [Display(Name = "V2")]
    V2,
    [Display(Name = "V3")]
    V3,
}

using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines spaced repetition algorithm versions ('sm2' vs 'ts-fsrs').
/// </summary>
public enum SrsAlgorithmVersion
{
    [Display(Name = "Sm2")]
    Sm2,
    [Display(Name = "TsFsrs")]
    TsFsrs,
}

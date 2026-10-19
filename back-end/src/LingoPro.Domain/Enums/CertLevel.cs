using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Represents standardized certification proficiency levels (CEFR A0-C2) mapped from database migrations.
/// </summary>
public enum CertLevel
{
    [Display(Name = "A0")]
    A0,
    [Display(Name = "A1")]
    A1,
    [Display(Name = "A2")]
    A2,
    [Display(Name = "B1")]
    B1,
    [Display(Name = "B2")]
    B2,
    [Display(Name = "C1")]
    C1,
    [Display(Name = "C2")]
    C2,
}

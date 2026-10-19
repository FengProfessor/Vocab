using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines standardized exam types ('toeic', 'vstep', 'vnu-bac-3', 'thpt').
/// </summary>
public enum ExamType
{
    [Display(Name = "Toeic")]
    Toeic,
    [Display(Name = "Vstep")]
    Vstep,
    [Display(Name = "VnuBac3")]
    VnuBac3,
    [Display(Name = "Thpt")]
    Thpt,
}

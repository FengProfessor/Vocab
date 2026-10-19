using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines the 7 standardized parts of the ETS TOEIC Listening and Reading exam.
/// </summary>
public enum ToeicPart
{
    [Display(Name = "Part1")]
    Part1,
    [Display(Name = "Part2")]
    Part2,
    [Display(Name = "Part3")]
    Part3,
    [Display(Name = "Part4")]
    Part4,
    [Display(Name = "Part5")]
    Part5,
    [Display(Name = "Part6")]
    Part6,
    [Display(Name = "Part7")]
    Part7,
}

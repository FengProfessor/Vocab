using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines learning roadmap tracks mapped from user_roadmap.track.
/// </summary>
public enum RoadmapTrackType
{
    [Display(Name = "Cefr")]
    Cefr,
    [Display(Name = "Thpt")]
    Thpt,
    [Display(Name = "Toeic")]
    Toeic,
    [Display(Name = "Vstep")]
    Vstep,
    [Display(Name = "VnuBac3")]
    VnuBac3,
}

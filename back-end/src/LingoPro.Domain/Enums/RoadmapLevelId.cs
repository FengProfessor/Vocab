using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines roadmap curriculum level identifiers mapped from user_roadmap.level_id.
/// </summary>
public enum RoadmapLevelId
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
    [Display(Name = "Lop10")]
    Lop10,
    [Display(Name = "Lop11")]
    Lop11,
    [Display(Name = "Lop12")]
    Lop12,
    [Display(Name = "Toeic450")]
    Toeic450,
    [Display(Name = "Toeic650")]
    Toeic650,
    [Display(Name = "Toeic800")]
    Toeic800,
    [Display(Name = "C1")]
    C1,
    [Display(Name = "C2")]
    C2,
}

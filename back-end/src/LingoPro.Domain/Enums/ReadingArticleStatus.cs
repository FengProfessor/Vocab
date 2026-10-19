using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines publication statuses for reading library articles ('draft', 'published', 'archived').
/// </summary>
public enum ReadingArticleStatus
{
    [Display(Name = "Draft")]
    Draft,
    [Display(Name = "Published")]
    Published,
    [Display(Name = "Archived")]
    Archived,
}

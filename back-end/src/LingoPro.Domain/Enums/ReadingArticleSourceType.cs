using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines corpus sources for reading library articles ('vstep', 'toeic', 'voa', 'race', 'openstax', 'custom').
/// </summary>
public enum ReadingArticleSourceType
{
    [Display(Name = "Vstep")]
    Vstep,
    [Display(Name = "Toeic")]
    Toeic,
    [Display(Name = "Voa")]
    Voa,
    [Display(Name = "Race")]
    Race,
    [Display(Name = "OpenStax")]
    OpenStax,
    [Display(Name = "Custom")]
    Custom,
}

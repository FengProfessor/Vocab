using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines authoring sources for canonical grammar lessons ('mai_lan_huong_pdf', 'web_scrape', 'ai').
/// </summary>
public enum GrammarLessonSource
{
    [Display(Name = "MaiLanHuongPdf")]
    MaiLanHuongPdf,
    [Display(Name = "WebScrape")]
    WebScrape,
    [Display(Name = "Ai")]
    Ai,
}

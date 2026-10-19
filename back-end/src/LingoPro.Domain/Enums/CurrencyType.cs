using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines supported billing currency types ('VND', 'USD').
/// </summary>
public enum CurrencyType
{
    [Display(Name = "Vnd")]
    Vnd,
    [Display(Name = "Usd")]
    Usd,
}

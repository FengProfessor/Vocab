using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines scaffolding support levels during lexical production ('INDEPENDENT', 'MODELLED', 'PROMPTED', 'NOT_YET').
/// </summary>
public enum LexicalSupportLevel
{
    [Display(Name = "Independent")]
    Independent,
    [Display(Name = "Modelled")]
    Modelled,
    [Display(Name = "Prompted")]
    Prompted,
    [Display(Name = "NotYet")]
    NotYet,
}

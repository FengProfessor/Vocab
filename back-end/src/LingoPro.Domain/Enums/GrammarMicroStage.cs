using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines micro-lesson progression stages ('A0', 'A1') mapped from grammar_micro_progress.stage.
/// </summary>
public enum GrammarMicroStage
{
    [Display(Name = "A0")]
    A0,
    [Display(Name = "A1")]
    A1,
}

using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines representation modalities for foundation curriculum concepts ('TEXT', 'AUDIO', 'VISUAL', 'SYNTACTIC_FRAME').
/// </summary>
public enum FoundationModalityType
{
    [Display(Name = "Text")]
    Text,
    [Display(Name = "Audio")]
    Audio,
    [Display(Name = "Visual")]
    Visual,
    [Display(Name = "SyntacticFrame")]
    SyntacticFrame,
}

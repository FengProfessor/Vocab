using System.ComponentModel.DataAnnotations;

namespace LingoPro.Domain.Enums;

/// <summary>
/// Defines observation sources for lexical evidence ('LEARNER', 'TEACHER', 'SYSTEM').
/// </summary>
public enum LexicalEvidenceSource
{
    [Display(Name = "Learner")]
    Learner,
    [Display(Name = "Teacher")]
    Teacher,
    [Display(Name = "System")]
    System,
}
